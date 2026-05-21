import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { squads, squadMembers, users } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const mine = searchParams.get('mine') === '1'

    if (mine) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const mySquads = await db
        .select({
          id: squads.id,
          name: squads.name,
          gameMode: squads.gameMode,
          description: squads.description,
          inviteCode: squads.inviteCode,
          isOpen: squads.isOpen,
          maxMembers: squads.maxMembers,
          aiAnalysis: squads.aiAnalysis,
          createdAt: squads.createdAt,
          ownerId: squads.ownerId,
          memberCount: sql<number>`(select count(*) from squad_members where squad_id = ${squads.id})`,
        })
        .from(squads)
        .innerJoin(squadMembers, eq(squadMembers.squadId, squads.id))
        .where(eq(squadMembers.userId, session.user.id))

      return NextResponse.json({ squads: mySquads })
    }

    // List all squads with member count
    const allSquads = await db
      .select({
        id: squads.id,
        name: squads.name,
        gameMode: squads.gameMode,
        description: squads.description,
        inviteCode: squads.inviteCode,
        isOpen: squads.isOpen,
        maxMembers: squads.maxMembers,
        createdAt: squads.createdAt,
        ownerId: squads.ownerId,
        memberCount: sql<number>`(select count(*) from squad_members where squad_id = ${squads.id})`,
      })
      .from(squads)

    return NextResponse.json({ squads: allSquads })
  } catch (err) {
    console.error('GET /api/squad error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, gameMode, description, maxMembers } = body

    if (!name) {
      return NextResponse.json({ error: 'Squad name is required.' }, { status: 400 })
    }

    const [squad] = await db
      .insert(squads)
      .values({
        name,
        ownerId: session.user.id,
        gameMode: gameMode || 'Park',
        description: description || null,
        maxMembers: maxMembers || 5,
      })
      .returning()

    // Auto-add creator as owner member
    await db.insert(squadMembers).values({
      squadId: squad.id,
      userId: session.user.id,
      role: 'owner',
    })

    return NextResponse.json({ squad }, { status: 201 })
  } catch (err) {
    console.error('POST /api/squad error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
