import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page     = parseInt(searchParams.get('page')  || '1')
    const limit    = parseInt(searchParams.get('limit') || '12')
    const position = searchParams.get('position') || ''
    const category = searchParams.get('category') || ''
    const tier     = searchParams.get('tier')     || ''

    // When DATABASE_URL is available, query Render PostgreSQL via drizzle
    // For now return demo data as graceful fallback
    const builds: unknown[] = []

    return NextResponse.json({ builds, page, limit, total: 0, hasMore: false })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch builds' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, position, attributes } = body
    if (!name || !position || !attributes) {
      return NextResponse.json({ error: 'name, position, and attributes are required' }, { status: 400 })
    }
    // Insert into db when DATABASE_URL is set
    return NextResponse.json({ success: true, build: { id: crypto.randomUUID(), ...body } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create build' }, { status: 500 })
  }
}
