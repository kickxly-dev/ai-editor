import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { squads, squadMembers, users } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import Groq from 'groq-sdk'
import { MODELS } from '@/lib/groq'

const SQUAD_ANALYSIS_SYSTEM = `You are CourtIQ's elite NBA 2K26 AI analyst. Analyze squad chemistry and team composition with precision. Always respond in valid JSON matching the exact schema requested.`

export const runtime = 'nodejs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const [squad] = await db.select().from(squads).where(eq(squads.id, id)).limit(1)
    if (!squad) return NextResponse.json({ error: 'Squad not found' }, { status: 404 })

    const members = await db
      .select({
        userId: squadMembers.userId,
        build: squadMembers.build,
        role: squadMembers.role,
        joinedAt: squadMembers.joinedAt,
        name: users.name,
        username: users.username,
        image: users.image,
        email: users.email,
      })
      .from(squadMembers)
      .innerJoin(users, eq(users.id, squadMembers.userId))
      .where(eq(squadMembers.squadId, id))

    return NextResponse.json({ squad, members })
  } catch (err) {
    console.error('GET /api/squad/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { action, build } = body

    const [squad] = await db.select().from(squads).where(eq(squads.id, id)).limit(1)
    if (!squad) return NextResponse.json({ error: 'Squad not found' }, { status: 404 })

    if (action === 'join') {
      // Check if already a member
      const [existing] = await db
        .select()
        .from(squadMembers)
        .where(and(eq(squadMembers.squadId, id), eq(squadMembers.userId, session.user.id)))
        .limit(1)

      if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 409 })

      // Count current members
      const members = await db.select().from(squadMembers).where(eq(squadMembers.squadId, id))
      if (members.length >= (squad.maxMembers ?? 5)) {
        return NextResponse.json({ error: 'Squad is full' }, { status: 400 })
      }

      if (!squad.isOpen) {
        const { inviteCode } = body
        if (!inviteCode || inviteCode.toUpperCase() !== squad.inviteCode) {
          return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 })
        }
      }

      await db.insert(squadMembers).values({
        squadId: id,
        userId: session.user.id,
        role: 'member',
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'leave') {
      // Owner cannot leave if there are other members
      if (squad.ownerId === session.user.id) {
        const members = await db.select().from(squadMembers).where(eq(squadMembers.squadId, id))
        if (members.length > 1) {
          return NextResponse.json({ error: 'Transfer ownership before leaving' }, { status: 400 })
        }
        // If only member, delete the squad
        await db.delete(squads).where(eq(squads.id, id))
        return NextResponse.json({ success: true, deleted: true })
      }

      await db
        .delete(squadMembers)
        .where(and(eq(squadMembers.squadId, id), eq(squadMembers.userId, session.user.id)))
      return NextResponse.json({ success: true })
    }

    if (action === 'updateBuild') {
      const [member] = await db
        .select()
        .from(squadMembers)
        .where(and(eq(squadMembers.squadId, id), eq(squadMembers.userId, session.user.id)))
        .limit(1)
      if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

      await db
        .update(squadMembers)
        .set({ build })
        .where(and(eq(squadMembers.squadId, id), eq(squadMembers.userId, session.user.id)))
      return NextResponse.json({ success: true })
    }

    if (action === 'analyze') {
      // Only members can trigger analysis
      const [member] = await db
        .select()
        .from(squadMembers)
        .where(and(eq(squadMembers.squadId, id), eq(squadMembers.userId, session.user.id)))
        .limit(1)
      if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

      // Get members with their builds
      const members = await db
        .select({
          userId: squadMembers.userId,
          build: squadMembers.build,
          role: squadMembers.role,
          name: users.name,
          username: users.username,
        })
        .from(squadMembers)
        .innerJoin(users, eq(users.id, squadMembers.userId))
        .where(eq(squadMembers.squadId, id))

      const memberDescriptions = members
        .map((m) => {
          const b = m.build as { position?: string; height?: string; archetype?: string; badges?: string[] } | null
          return `- ${m.username || m.name || 'Unknown'} (${m.role}): ${
            b
              ? `Position: ${b.position || 'N/A'}, Height: ${b.height || 'N/A'}, Archetype: ${b.archetype || 'N/A'}, Badges: ${(b.badges || []).join(', ') || 'None'}`
              : 'No build set'
          }`
        })
        .join('\n')

      const prompt = `Analyze this NBA 2K26 squad for chemistry and team composition:

SQUAD: ${squad.name} (${squad.gameMode} mode)
MEMBERS:
${memberDescriptions}

Return ONLY valid JSON with this exact structure:
{
  "chemistry_score": 78,
  "roles_covered": ["Playmaker", "Scorer", "Rim Protector"],
  "gaps": ["No floor general", "Weak perimeter defense"],
  "strengths": ["Elite scoring", "Good ball movement"],
  "weaknesses": ["Interior defense gap", "No dedicated rebounder"],
  "game_plan": "2-3 sentence recommended game plan for this squad",
  "verdict": "1-2 sentence overall squad assessment"
}`

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
      const response = await groq.chat.completions.create({
        model: MODELS.fast,
        messages: [
          { role: 'system', content: SQUAD_ANALYSIS_SYSTEM },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      })

      const aiAnalysis = JSON.parse(response.choices[0].message.content || '{}')

      // Save to squad
      await db.update(squads).set({ aiAnalysis }).where(eq(squads.id, id))

      return NextResponse.json({ success: true, aiAnalysis })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('POST /api/squad/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
