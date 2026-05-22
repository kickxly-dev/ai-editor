import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await pool.connect()
  try {
    const [userRow, buildsRow] = await Promise.all([
      client.query(
        `SELECT id::text, username, name, email, image, bio,
                is_premium, is_verified, is_admin, created_at, total_builds
         FROM users WHERE id::text = $1 LIMIT 1`,
        [session.user.id]
      ),
      client.query(
        `SELECT id, name, position, height, archetype, overall_rating,
                meta_viability, likes, views, is_public, created_at
         FROM builds WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 20`,
        [session.user.id]
      ),
    ])

    const user = userRow.rows[0] || {}
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
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
    console.error('GET /api/profile error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, bio } = await req.json()

  const client = await pool.connect()
  try {
    if (username) {
      const { rows: existing } = await client.query(
        `SELECT 1 FROM users WHERE username = $1 AND id::text != $2 LIMIT 1`,
        [username.trim(), session.user.id]
      )
      if (existing.length) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      }
    }

    await client.query(
      `UPDATE users SET
        username = COALESCE($1, username),
        bio = COALESCE($2, bio)
       WHERE id::text = $3`,
      [username?.trim() || null, bio?.trim() || null, session.user.id]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/profile error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}
