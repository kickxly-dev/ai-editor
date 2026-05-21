import { NextRequest, NextResponse } from 'next/server'
import { getTutorials } from '@/lib/youtube-scraper'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get('refresh') === '1'
  try {
    const tutorials = await getTutorials(force)
    return NextResponse.json({ success: true, tutorials })
  } catch (err) {
    console.error('Tutorials API error:', err)
    return NextResponse.json({ error: 'Failed to fetch tutorials' }, { status: 500 })
  }
}
