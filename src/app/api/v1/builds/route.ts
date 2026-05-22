import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-CourtIQ-API': 'v1',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const position = searchParams.get('position')
  const tier = searchParams.get('tier')
  const sort = searchParams.get('sort') || 'likes'

  const client = await pool.connect()
  try {
    const sortCol = sort === 'views' ? 'views' : sort === 'created' ? 'created_at' : sort === 'rating' ? 'overall_rating' : 'likes'
    const conditions: string[] = ['is_public = true']
    const params: (string | number)[] = []
    if (position) { params.push(position); conditions.push(`position = $${params.length}`) }
    if (tier) { params.push(tier.toUpperCase()); conditions.push(`meta_viability = $${params.length}`) }
    params.push(limit)
    const whereClause = `WHERE ${conditions.join(' AND ')}`

    const { rows } = await client.query(
      `SELECT id, name, position, height, archetype, overall_rating,
              meta_viability, likes, views, created_at,
              (SELECT username FROM users WHERE id::text = builds.user_id LIMIT 1) as author
       FROM builds
       ${whereClause}
       ORDER BY ${sortCol} DESC
       LIMIT $${params.length}`,
      params
    )

    return NextResponse.json({
      data: rows.map(r => ({
        id: r.id,
        name: r.name,
        position: r.position,
        height: r.height,
        archetype: r.archetype,
        overall_rating: r.overall_rating,
        meta_viability: r.meta_viability,
        likes: r.likes,
        views: r.views,
        author: r.author,
        created_at: r.created_at,
      })),
      meta: {
        count: rows.length,
        limit,
        filters: { position: position || null, tier: tier || null, sort },
      },
    }, { headers: corsHeaders() })
  } catch (err) {
    const msg = String(err)
    if (msg.includes('relation') && msg.includes('does not exist')) {
      return NextResponse.json(
        { data: [], meta: { count: 0, limit, filters: { position: position || null, tier: tier || null, sort } } },
        { headers: corsHeaders() }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    )
  } finally {
    client.release()
  }
}
