import { NextRequest, NextResponse } from 'next/server'
import { getScrapedMeta } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 45

export async function GET(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 503 })
  }

  const force = req.nextUrl.searchParams.get('refresh') === '1'

  try {
    const meta = await getScrapedMeta(force)
    return NextResponse.json({ success: true, ...meta })
  } catch (err) {
    console.error('Meta API error:', err)
    return NextResponse.json({ error: 'Failed to fetch meta data' }, { status: 500 })
  }
}
