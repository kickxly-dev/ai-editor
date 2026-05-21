import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await pool.connect()
  try {
    const [userRow, communityBuilds, metaTrends] = await Promise.all([
      client.query(
        `SELECT total_builds, is_premium, is_verified, is_admin, created_at, username
         FROM users WHERE id::text = $1 LIMIT 1`,
        [session.user.id]
      ).catch(() => ({ rows: [] })),

      client.query(
        `SELECT name, position, likes, views, created_at
         FROM builds WHERE is_public = true
         ORDER BY likes DESC LIMIT 6`
      ).catch(() => ({ rows: [] })),

      client.query(
        `SELECT name, category, tier, usage_rate, trend, description
         FROM meta_trends WHERE tier IN ('S', 'A')
         ORDER BY CASE tier WHEN 'S' THEN 1 WHEN 'A' THEN 2 ELSE 3 END, usage_rate DESC
         LIMIT 5`
      ).catch(() => ({ rows: [] })),
    ])

    const user = userRow.rows[0] || {}
    const joinedAt = user.created_at ? new Date(user.created_at) : new Date()
    const daysActive = Math.max(1, Math.floor((Date.now() - joinedAt.getTime()) / 86400000))

    return NextResponse.json({
      profile: {
        username: user.username || null,
        totalBuilds: parseInt(user.total_builds) || 0,
        isPremium: user.is_premium || false,
        isVerified: user.is_verified || false,
        isAdmin: user.is_admin || false,
        daysActive,
        joinedAt: joinedAt.toISOString(),
      },
      communityBuilds: communityBuilds.rows,
      metaTrends: metaTrends.rows,
    })
  } finally {
    client.release()
  }
}
