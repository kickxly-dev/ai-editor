import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const { rowCount } = await client.query(
      `UPDATE builds SET likes = COALESCE(likes, 0) + 1
       WHERE id = $1 AND is_public = true`,
      [id]
    )
    if (!rowCount) return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}
