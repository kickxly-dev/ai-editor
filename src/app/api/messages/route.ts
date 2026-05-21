import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let tableReady = false
async function ensureTable(client: import('pg').PoolClient) {
  if (tableReady) return
  await client.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      content TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  tableReady = true
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const withUserId = new URL(req.url).searchParams.get('with')
  if (!withUserId) return NextResponse.json({ error: 'with parameter required' }, { status: 400 })

  const client = await pool.connect()
  try {
    await ensureTable(client)
    const { rows } = await client.query(
      `SELECT m.id::text, m.sender_id, m.receiver_id, m.content, m.read, m.created_at,
              u.name as sender_name, u.username as sender_username, u.image as sender_image
       FROM messages m
       LEFT JOIN users u ON u.id::text = m.sender_id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC LIMIT 100`,
      [session.user.id, withUserId]
    )
    return NextResponse.json({
      messages: rows.map(r => ({
        id: r.id,
        senderId: r.sender_id,
        receiverId: r.receiver_id,
        content: r.content,
        read: r.read,
        createdAt: r.created_at,
        senderName: r.sender_name,
        senderUsername: r.sender_username,
        senderImage: r.sender_image,
      }))
    })
  } catch (err) {
    console.error('GET /api/messages error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { receiverId, content } = await req.json()
  if (!receiverId || !content?.trim()) return NextResponse.json({ error: 'receiverId and content required' }, { status: 400 })
  if (receiverId === session.user.id) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })

  const client = await pool.connect()
  try {
    await ensureTable(client)
    const { rows } = await client.query(
      `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING id::text`,
      [session.user.id, receiverId, content.trim()]
    )
    return NextResponse.json({ message: rows[0] }, { status: 201 })
  } catch (err) {
    console.error('POST /api/messages error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fromUserId = new URL(req.url).searchParams.get('from')
  if (!fromUserId) return NextResponse.json({ error: 'from parameter required' }, { status: 400 })

  const client = await pool.connect()
  try {
    await ensureTable(client)
    await client.query(
      `UPDATE messages SET read = true WHERE sender_id = $1 AND receiver_id = $2 AND read = false`,
      [fromUserId, session.user.id]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/messages error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}
