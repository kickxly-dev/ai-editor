import { NextRequest, NextResponse } from 'next/server'
import { getScrapedMeta } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scrape-secret')
  if (secret !== process.env.SCRAPE_SECRET && process.env.SCRAPE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 503 })
  }

  try {
    const meta = await getScrapedMeta(true)
    return NextResponse.json({
      success: true,
      scrapedAt: meta.scrapedAt,
      sources: meta.sources,
      counts: {
        builds: meta.builds.length,
        badges: meta.badges.length,
        animations: meta.animations.length,
        takeovers: meta.takeovers.length,
      },
    })
  } catch (err) {
    console.error('Scrape trigger error:', err)
    return NextResponse.json({ error: 'Scrape failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
