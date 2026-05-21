import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const position = searchParams.get('position')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'likes'
    const search = searchParams.get('search')
    const tier = searchParams.get('tier')

    const offset = (page - 1) * limit

    let query = supabase
      .from('builds')
      .select('*, profiles(username, avatar_url, is_verified)', { count: 'exact' })
      .eq('is_public', true)

    if (position) query = query.eq('position', position)
    if (category) query = query.eq('category', category)
    if (search) query = query.textSearch('name', search, { type: 'websearch' })
    if (tier) query = query.eq('ai_analysis->meta_viability', tier)

    const validSorts: Record<string, { column: string; ascending: boolean }> = {
      likes: { column: 'likes', ascending: false },
      newest: { column: 'created_at', ascending: false },
      views: { column: 'views', ascending: false },
      saves: { column: 'saves', ascending: false },
    }

    const sortConfig = validSorts[sort] || validSorts.likes
    query = query.order(sortConfig.column, { ascending: sortConfig.ascending })
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      builds: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
    })
  } catch (err) {
    console.error('Builds fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch builds' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name, position, archetype, height, weight, wingspan,
      takeover, attributes, badges, description, tags, category, is_public
    } = body

    if (!name || !position || !attributes) {
      return NextResponse.json({ error: 'Name, position, and attributes are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('builds')
      .insert({
        user_id: user.id,
        name,
        position,
        archetype,
        height,
        weight,
        wingspan,
        takeover,
        attributes,
        badges: badges || [],
        description,
        tags: tags || [],
        category: category || 'Park',
        is_public: is_public !== false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, build: data }, { status: 201 })
  } catch (err) {
    console.error('Build creation error:', err)
    return NextResponse.json({ error: 'Failed to create build' }, { status: 500 })
  }
}
