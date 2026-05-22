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
  const tier = searchParams.get('tier')

  const client = await pool.connect()
  try {
    const whereClause = tier ? `WHERE tier = $1` : ''
    const params = tier ? [tier.toUpperCase()] : []

    const { rows } = await client.query(
      `SELECT name, category, tier, usage_rate, trend, description
       FROM meta_trends
       ${whereClause}
       ORDER BY CASE tier WHEN 'S' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 3 WHEN 'C' THEN 4 ELSE 5 END,
                usage_rate DESC
       LIMIT 50`,
      params
    )

    const byTier: Record<string, typeof rows> = {}
    for (const row of rows) {
      if (!byTier[row.tier]) byTier[row.tier] = []
      byTier[row.tier].push(row)
    }

    return NextResponse.json({
      data: rows,
      by_tier: byTier,
      meta: {
        count: rows.length,
        season: 5,
        game: 'NBA 2K26',
        updated: new Date().toISOString(),
      },
    }, { headers: corsHeaders() })
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    )
  } finally {
    client.release()
  }
}
