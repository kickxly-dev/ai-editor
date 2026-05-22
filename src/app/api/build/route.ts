import { NextRequest, NextResponse } from 'next/server'
import { PoolClient } from 'pg'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ensureSchema(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS builds (
      id            SERIAL PRIMARY KEY,
      user_id       TEXT NOT NULL,
      name          TEXT,
      position      TEXT,
      height        TEXT,
      wingspan      TEXT,
      weight        INTEGER,
      archetype     TEXT,
      overall_rating INTEGER DEFAULT 0,
      meta_viability TEXT,
      attributes    JSONB,
      badges        JSONB,
      takeover      TEXT,
      category      TEXT,
      description   TEXT,
      tags          TEXT[] DEFAULT '{}',
      likes         INTEGER DEFAULT 0,
      views         INTEGER DEFAULT 0,
      saves         INTEGER DEFAULT 0,
      is_public     BOOLEAN DEFAULT FALSE,
      ai_analysis   JSONB,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS builds_user_id_idx ON builds(user_id)
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS builds_public_idx ON builds(is_public, created_at DESC)
  `)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    name, position, height, wingspan, weight, takeover, category,
    attributes, badges, analysis, isPublic = false,
  } = body

  if (!position) return NextResponse.json({ error: 'Position is required' }, { status: 400 })

  const client = await pool.connect()
  try {
    await ensureSchema(client)

    const { rows } = await client.query(
      `INSERT INTO builds
         (user_id, name, position, height, wingspan, weight, takeover, category,
          attributes, badges, archetype, overall_rating, meta_viability, ai_analysis, is_public)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id, created_at`,
      [
        session.user.id,
        name || 'My Build',
        position,
        height || null,
        wingspan || null,
        weight || null,
        takeover || null,
        category || 'Park',
        JSON.stringify(attributes || {}),
        JSON.stringify(badges || []),
        analysis?.archetype || null,
        analysis?.overall_rating || 0,
        analysis?.meta_viability || null,
        JSON.stringify(analysis || {}),
        isPublic,
      ]
    )

    await client.query(
      `UPDATE users SET total_builds = COALESCE(total_builds, 0) + 1 WHERE id::text = $1`,
      [session.user.id]
    )

    return NextResponse.json({ success: true, id: rows[0].id, created_at: rows[0].created_at })
  } catch (err) {
    console.error('POST /api/build error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Build ID required' }, { status: 400 })

  const client = await pool.connect()
  try {
    const { rowCount } = await client.query(
      `DELETE FROM builds WHERE id = $1 AND user_id = $2`,
      [id, session.user.id]
    )
    if (!rowCount) return NextResponse.json({ error: 'Build not found' }, { status: 404 })

    await client.query(
      `UPDATE users SET total_builds = GREATEST(COALESCE(total_builds, 1) - 1, 0) WHERE id::text = $1`,
      [session.user.id]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/build error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}
