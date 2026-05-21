import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let tableReady = false
async function ensureTable(client: import('pg').PoolClient) {
  if (tableReady) return
  await client.query(`
    CREATE TABLE IF NOT EXISTS lfg_posts (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      my_build JSONB DEFAULT '{}',
      looking_for TEXT[] DEFAULT '{}',
      game_mode TEXT DEFAULT 'Park',
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  tableReady = true
}

// GET — public, no auth needed
export async function GET(req: NextRequest) {
  const client = await pool.connect()
  try {
    await ensureTable(client)
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode') || ''
    const query = mode && mode !== 'All'
      ? `SELECT l.id::text, l.user_id, l.title, l.my_build, l.looking_for, l.game_mode,
                l.description, l.is_active, l.created_at,
                u.name as user_name, u.username as user_username, u.image as user_image
         FROM lfg_posts l
         LEFT JOIN users u ON u.id::text = l.user_id
         WHERE l.is_active = true AND l.game_mode = $1
         ORDER BY l.created_at DESC LIMIT 30`
      : `SELECT l.id::text, l.user_id, l.title, l.my_build, l.looking_for, l.game_mode,
                l.description, l.is_active, l.created_at,
                u.name as user_name, u.username as user_username, u.image as user_image
         FROM lfg_posts l
         LEFT JOIN users u ON u.id::text = l.user_id
         WHERE l.is_active = true
         ORDER BY l.created_at DESC LIMIT 30`

    const { rows } = mode && mode !== 'All'
      ? await client.query(query, [mode])
      : await client.query(query)

    const posts = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      myBuild: r.my_build,
      lookingFor: r.looking_for,
      gameMode: r.game_mode,
      description: r.description,
      isActive: r.is_active,
      createdAt: r.created_at,
      userName: r.user_name,
      userUsername: r.user_username,
      userImage: r.user_image,
    }))

    return NextResponse.json({ posts })
  } catch (err) {
    console.error('GET /api/lfg error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}

// POST — requires auth
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await pool.connect()
  try {
    await ensureTable(client)
    const { title, myBuild, lookingFor, gameMode, description } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const { rows } = await client.query(
      `INSERT INTO lfg_posts (user_id, title, my_build, looking_for, game_mode, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id::text`,
      [session.user.id, title, JSON.stringify(myBuild || {}), lookingFor || [], gameMode || 'Park', description || null]
    )
    return NextResponse.json({ post: rows[0] }, { status: 201 })
  } catch (err) {
    console.error('POST /api/lfg error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}

// DELETE — requires auth + ownership
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Post ID required' }, { status: 400 })

  const client = await pool.connect()
  try {
    await client.query(
      `UPDATE lfg_posts SET is_active = false WHERE id::text = $1 AND user_id = $2`,
      [id, session.user.id]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/lfg error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}
