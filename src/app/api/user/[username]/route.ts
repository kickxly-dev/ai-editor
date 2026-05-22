import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

  const client = await pool.connect()
  try {
    const userRow = await client.query(
      `SELECT id::text, username, name, bio, is_premium, is_verified, is_admin,
              created_at, total_builds
       FROM users
       WHERE username = $1 LIMIT 1`,
      [username]
    )
    if (!userRow.rows[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const user = userRow.rows[0]

    const buildsRow = await client.query(
      `SELECT id, name, position, height, archetype, overall_rating,
              meta_viability, likes, views, created_at
       FROM builds
       WHERE user_id = $1 AND is_public = true
       ORDER BY likes DESC, created_at DESC
       LIMIT 20`,
      [user.id]
    ).catch(() => ({ rows: [] }))

    return NextResponse.json({
      user: {
        username: user.username,
        name: user.name,
        bio: user.bio || null,
        isPremium: user.is_premium || false,
        isVerified: user.is_verified || false,
        isAdmin: user.is_admin || false,
        totalBuilds: parseInt(user.total_builds) || 0,
        joinedAt: user.created_at,
      },
      builds: buildsRow.rows,
    })
  } catch (err) {
    console.error('GET /api/user/[username] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}
