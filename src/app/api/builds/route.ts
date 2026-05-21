import { NextRequest, NextResponse } from 'next/server'
import { getScrapedBuilds } from '@/lib/builds-scraper'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 45

export async function GET(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 503 })
  }
  const force = req.nextUrl.searchParams.get('refresh') === '1'
  try {
    const builds = await getScrapedBuilds(force)
    return NextResponse.json({ success: true, builds })
  } catch (err) {
    console.error('Builds API error:', err)
    return NextResponse.json({ error: 'Failed to fetch builds' }, { status: 500 })
  }
}
