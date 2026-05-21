import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'

async function requireAdmin() {
  const session = await auth()
  if (!(session?.user as { isAdmin?: boolean })?.isAdmin) return null
  return session
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || 'stats'

  const client = await pool.connect()
  try {
    if (action === 'stats') {
      const [users, builds, coaches, msgs, lfg, squads] = await Promise.all([
        client.query('SELECT COUNT(*) FROM users'),
        client.query('SELECT COUNT(*) FROM builds'),
        client.query('SELECT COUNT(*) FROM coach_sessions').catch(() => ({ rows: [{ count: 0 }] })),
        client.query('SELECT COUNT(*) FROM messages').catch(() => ({ rows: [{ count: 0 }] })),
        client.query('SELECT COUNT(*) FROM lfg_posts').catch(() => ({ rows: [{ count: 0 }] })),
        client.query('SELECT COUNT(*) FROM squads').catch(() => ({ rows: [{ count: 0 }] })),
      ])
      return NextResponse.json({
        users: parseInt(users.rows[0].count),
        builds: parseInt(builds.rows[0].count),
        coachSessions: parseInt(coaches.rows[0].count),
        messages: parseInt(msgs.rows[0].count),
        lfgPosts: parseInt(lfg.rows[0].count),
        squads: parseInt(squads.rows[0].count),
      })
    }

    if (action === 'users') {
      const page = parseInt(searchParams.get('page') || '1')
      const search = searchParams.get('q') || ''
      const offset = (page - 1) * 25
      const { rows } = await client.query(
        `SELECT id::text, email, name, username, is_admin, is_premium, is_verified,
                total_builds, created_at
         FROM users
         WHERE ($1 = '' OR email ILIKE $1 OR name ILIKE $1 OR username ILIKE $1)
         ORDER BY created_at DESC LIMIT 25 OFFSET $2`,
        [search ? `%${search}%` : '', offset]
      )
      const { rows: count } = await client.query(
        `SELECT COUNT(*) FROM users WHERE ($1 = '' OR email ILIKE $1 OR name ILIKE $1)`,
        [search ? `%${search}%` : '']
      )
      return NextResponse.json({ users: rows, total: parseInt(count[0].count) })
    }

    if (action === 'builds') {
      const { rows } = await client.query(
        `SELECT b.id, b.name, b.position, b.category, b.likes, b.views, b.is_public,
                b.created_at, u.email as user_email, u.username as user_name
         FROM builds b LEFT JOIN users u ON b.user_id = u.id::text
         ORDER BY b.created_at DESC LIMIT 50`
      )
      return NextResponse.json({ builds: rows })
    }

    if (action === 'recent_users') {
      const { rows } = await client.query(
        `SELECT id::text, email, name, username, is_admin, created_at
         FROM users ORDER BY created_at DESC LIMIT 10`
      )
      return NextResponse.json({ users: rows })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } finally {
    client.release()
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { action, userId, buildId, value } = body
  const client = await pool.connect()
  try {
    if (action === 'toggle_admin') {
      await client.query('UPDATE users SET is_admin = $1 WHERE id::text = $2', [value, userId])
      return NextResponse.json({ success: true })
    }
    if (action === 'toggle_premium') {
      await client.query('UPDATE users SET is_premium = $1 WHERE id::text = $2', [value, userId])
      return NextResponse.json({ success: true })
    }
    if (action === 'toggle_verified') {
      await client.query('UPDATE users SET is_verified = $1 WHERE id::text = $2', [value, userId])
      return NextResponse.json({ success: true })
    }
    if (action === 'delete_user') {
      await client.query('DELETE FROM users WHERE id::text = $1', [userId])
      return NextResponse.json({ success: true })
    }
    if (action === 'delete_build') {
      await client.query('DELETE FROM builds WHERE id = $1', [buildId])
      return NextResponse.json({ success: true })
    }
    if (action === 'toggle_build_public') {
      await client.query('UPDATE builds SET is_public = $1 WHERE id = $2', [value, buildId])
      return NextResponse.json({ success: true })
    }
    if (action === 'seed_meta') {
      const metaData = [
        { category: 'Build', name: 'Shot Creator Guard', tier: 'S', usage_rate: 34, win_rate: 62, trend: 'up', description: '6\'4" PG with elite handles and shooting — dominant in Park and Rec' },
        { category: 'Build', name: 'Two-Way Wing', tier: 'S', usage_rate: 28, win_rate: 59, trend: 'stable', description: '6\'7"-6\'9" SF with balanced offense and lockdown defense' },
        { category: 'Build', name: 'Playmaking Center', tier: 'A', usage_rate: 18, win_rate: 55, trend: 'up', description: '7\'1" C with shooting, passing, and rim protection' },
        { category: 'Build', name: 'Stretch Big', tier: 'A', usage_rate: 15, win_rate: 53, trend: 'stable', description: 'PF/C with elite shooting from 3 and interior presence' },
        { category: 'Build', name: 'Pure Lockdown', tier: 'B', usage_rate: 9, win_rate: 48, trend: 'down', description: 'Defensive specialist — great for Rec, limited offensive ceiling' },
        { category: 'Badge', name: 'Limitless Range', tier: 'S', usage_rate: 78, win_rate: 64, trend: 'up', description: 'Extends 3PT range beyond the arc — must-have for all shooters' },
        { category: 'Badge', name: 'Deadeye', tier: 'S', usage_rate: 71, win_rate: 62, trend: 'stable', description: 'Reduces contest penalty on jumpers' },
        { category: 'Badge', name: 'Clamps', tier: 'S', usage_rate: 65, win_rate: 60, trend: 'up', description: 'Best perimeter defense badge in the game' },
        { category: 'Badge', name: 'Shifty Shooter', tier: 'S', usage_rate: 60, win_rate: 61, trend: 'up', description: 'Off-dribble shooting — S-tier for guards' },
        { category: 'Badge', name: 'Posterizer', tier: 'A', usage_rate: 52, win_rate: 58, trend: 'stable', description: 'Dunk on defenders — expands green window at Legend' },
        { category: 'Jumpshot', name: 'Patty Mills Base', tier: 'S', usage_rate: 45, win_rate: 63, trend: 'up', description: 'Best base for guards under 6\'5" in Season 5' },
        { category: 'Jumpshot', name: 'Quinton Grimes Base', tier: 'A', usage_rate: 32, win_rate: 59, trend: 'stable', description: 'Reliable A-tier base for all guard heights' },
        { category: 'Jumpshot', name: 'Dirk Nowitzki Base', tier: 'A', usage_rate: 22, win_rate: 57, trend: 'stable', description: 'Top choice for bigs 6\'10"+" with big green windows' },
      ]
      await client.query('DELETE FROM meta_trends')
      for (const m of metaData) {
        await client.query(
          `INSERT INTO meta_trends (category, name, tier, usage_rate, win_rate, trend, description)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [m.category, m.name, m.tier, m.usage_rate, m.win_rate, m.trend, m.description]
        )
      }
      return NextResponse.json({ success: true, seeded: metaData.length })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } finally {
    client.release()
  }
}
