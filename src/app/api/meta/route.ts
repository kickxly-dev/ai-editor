import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('meta_trends')
      .select('*')
      .order('usage_rate', { ascending: false })

    if (category) query = query.eq('category', category)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ trends: data || [] })
  } catch (err) {
    console.error('Meta trends error:', err)
    return NextResponse.json({ error: 'Failed to fetch meta data' }, { status: 500 })
  }
}
