import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let tableReady = false
async function ensureTables(client: import('pg').PoolClient) {
  if (tableReady) return
  await client.query(`
    CREATE TABLE IF NOT EXISTS squads (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      game_mode TEXT DEFAULT 'Park',
      description TEXT,
      invite_code TEXT,
      is_open BOOLEAN DEFAULT TRUE,
      max_members INTEGER DEFAULT 5,
      ai_analysis JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS squad_members (
      id SERIAL PRIMARY KEY,
      squad_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      build JSONB,
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(squad_id, user_id)
    )
  `)
  tableReady = true
}

export async function GET(req: NextRequest) {
  const client = await pool.connect()
  try {
    await ensureTables(client)
    const session = await auth()
    const mine = new URL(req.url).searchParams.get('mine') === '1'

    if (mine) {
      if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { rows } = await client.query(
        `SELECT s.id, s.name, s.game_mode, s.description, s.invite_code, s.is_open,
                s.max_members, s.ai_analysis, s.created_at, s.owner_id,
                (SELECT COUNT(*) FROM squad_members WHERE squad_id = s.id)::int AS member_count
         FROM squads s
         INNER JOIN squad_members sm ON sm.squad_id = s.id
         WHERE sm.user_id = $1`,
        [session.user.id]
      )
      return NextResponse.json({ squads: rows })
    }

    const { rows } = await client.query(
      `SELECT s.id, s.name, s.game_mode, s.description, s.is_open, s.max_members, s.created_at, s.owner_id,
              (SELECT COUNT(*) FROM squad_members WHERE squad_id = s.id)::int AS member_count
       FROM squads s ORDER BY s.created_at DESC LIMIT 20`
    )
    return NextResponse.json({ squads: rows })
  } catch (err) {
    console.error('GET /api/squad error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, gameMode, description, maxMembers } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Squad name is required' }, { status: 400 })

  const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase()
  const client = await pool.connect()
  try {
    await ensureTables(client)
    const { rows } = await client.query(
      `INSERT INTO squads (name, owner_id, game_mode, description, invite_code, max_members)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name.trim(), session.user.id, gameMode || 'Park', description || null, inviteCode, maxMembers || 5]
    )
    const squad = rows[0]
    await client.query(
      `INSERT INTO squad_members (squad_id, user_id, role) VALUES ($1, $2, 'owner') ON CONFLICT DO NOTHING`,
      [squad.id, session.user.id]
    )
    return NextResponse.json({ squad }, { status: 201 })
  } catch (err) {
    console.error('POST /api/squad error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}
