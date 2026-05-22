import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `SELECT
         b.id, b.name, b.position, b.height, b.wingspan, b.weight,
         b.archetype, b.overall_rating, b.meta_viability,
         b.attributes, b.badges, b.takeover, b.category,
         b.likes, b.views, b.is_public, b.ai_analysis,
         b.user_id, b.created_at,
         (SELECT username FROM users WHERE id::text = b.user_id LIMIT 1) AS author
       FROM builds b
       WHERE b.id = $1`,
      [id]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const build = rows[0]
    if (!build.is_public) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await client.query(
      `UPDATE builds SET views = COALESCE(views, 0) + 1 WHERE id = $1`,
      [id]
    )

    return NextResponse.json({ build: { ...build, views: (build.views ?? 0) + 1 } })
  } catch (err) {
    console.error('GET /api/build/[id] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}
