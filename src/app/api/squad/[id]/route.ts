import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import Groq from 'groq-sdk'
import { MODELS } from '@/lib/groq'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const client = await pool.connect()
  try {
    const { rows: squadRows } = await client.query(
      `SELECT * FROM squads WHERE id = $1 LIMIT 1`, [id]
    )
    if (!squadRows.length) return NextResponse.json({ error: 'Squad not found' }, { status: 404 })

    const { rows: members } = await client.query(
      `SELECT sm.user_id, sm.build, sm.role, sm.joined_at,
              u.name, u.username, u.image, u.email
       FROM squad_members sm
       LEFT JOIN users u ON u.id::text = sm.user_id
       WHERE sm.squad_id = $1`,
      [id]
    )
    return NextResponse.json({ squad: squadRows[0], members })
  } catch (err) {
    console.error('GET /api/squad/[id] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { action, build, inviteCode } = body

  const client = await pool.connect()
  try {
    const { rows: squadRows } = await client.query(`SELECT * FROM squads WHERE id = $1 LIMIT 1`, [id])
    if (!squadRows.length) return NextResponse.json({ error: 'Squad not found' }, { status: 404 })
    const squad = squadRows[0]

    if (action === 'join') {
      const { rows: existing } = await client.query(
        `SELECT 1 FROM squad_members WHERE squad_id = $1 AND user_id = $2 LIMIT 1`,
        [id, session.user.id]
      )
      if (existing.length) return NextResponse.json({ error: 'Already a member' }, { status: 409 })

      const { rows: countRows } = await client.query(
        `SELECT COUNT(*)::int as cnt FROM squad_members WHERE squad_id = $1`, [id]
      )
      if (countRows[0].cnt >= (squad.max_members || 5)) {
        return NextResponse.json({ error: 'Squad is full' }, { status: 400 })
      }

      if (!squad.is_open) {
        if (!inviteCode || inviteCode.toUpperCase() !== squad.invite_code) {
          return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 })
        }
      }

      await client.query(
        `INSERT INTO squad_members (squad_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
        [id, session.user.id]
      )
      return NextResponse.json({ success: true })
    }

    if (action === 'leave') {
      if (squad.owner_id === session.user.id) {
        const { rows: countRows } = await client.query(
          `SELECT COUNT(*)::int as cnt FROM squad_members WHERE squad_id = $1`, [id]
        )
        if (countRows[0].cnt > 1) {
          return NextResponse.json({ error: 'Transfer ownership before leaving' }, { status: 400 })
        }
        await client.query(`DELETE FROM squad_members WHERE squad_id = $1`, [id])
        await client.query(`DELETE FROM squads WHERE id = $1`, [id])
        return NextResponse.json({ success: true, deleted: true })
      }
      await client.query(
        `DELETE FROM squad_members WHERE squad_id = $1 AND user_id = $2`, [id, session.user.id]
      )
      return NextResponse.json({ success: true })
    }

    if (action === 'updateBuild') {
      const { rows: memberRows } = await client.query(
        `SELECT 1 FROM squad_members WHERE squad_id = $1 AND user_id = $2 LIMIT 1`,
        [id, session.user.id]
      )
      if (!memberRows.length) return NextResponse.json({ error: 'Not a member' }, { status: 403 })
      await client.query(
        `UPDATE squad_members SET build = $1 WHERE squad_id = $2 AND user_id = $3`,
        [JSON.stringify(build), id, session.user.id]
      )
      return NextResponse.json({ success: true })
    }

    if (action === 'analyze') {
      const { rows: memberRows } = await client.query(
        `SELECT sm.user_id, sm.build, sm.role, u.name, u.username
         FROM squad_members sm LEFT JOIN users u ON u.id::text = sm.user_id
         WHERE sm.squad_id = $1`,
        [id]
      )
      if (!memberRows.find((m: { user_id: string }) => m.user_id === session.user?.id)) {
        return NextResponse.json({ error: 'Not a member' }, { status: 403 })
      }

      const memberDescriptions = memberRows.map((m: {
        username: string; name: string; role: string;
        build: { position?: string; height?: string; archetype?: string; badges?: string[] } | null
      }) => {
        const b = m.build
        return `- ${m.username || m.name || 'Unknown'} (${m.role}): ${
          b ? `Position: ${b.position || 'N/A'}, Height: ${b.height || 'N/A'}, Archetype: ${b.archetype || 'N/A'}, Badges: ${(b.badges || []).join(', ') || 'None'}` : 'No build set'
        }`
      }).join('\n')

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
      const response = await groq.chat.completions.create({
        model: MODELS.fast,
        messages: [
          { role: 'system', content: 'You are a NBA 2K26 squad analyst. Respond only in valid JSON.' },
          { role: 'user', content: `Analyze this NBA 2K26 squad:\nSQUAD: ${squad.name} (${squad.game_mode})\nMEMBERS:\n${memberDescriptions}\n\nReturn JSON: {"chemistry_score":78,"roles_covered":["Playmaker"],"gaps":["No defender"],"strengths":["Elite scoring"],"weaknesses":["No rim protection"],"game_plan":"Run pick and roll...","verdict":"Good scoring squad..."}` },
        ],
        temperature: 0.4,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      })

      const aiAnalysis = JSON.parse(response.choices[0].message.content || '{}')
      await client.query(`UPDATE squads SET ai_analysis = $1 WHERE id = $2`, [JSON.stringify(aiAnalysis), id])
      return NextResponse.json({ success: true, aiAnalysis })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('POST /api/squad/[id] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}
