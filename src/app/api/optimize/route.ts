import { NextRequest, NextResponse } from 'next/server'
import { optimizeBuild } from '@/lib/groq'

export const runtime = 'nodejs'
export const maxDuration = 45

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI service is not configured.' }, { status: 503 })
    }

    const body = await req.json()
    const { description, position, heightRange, gameMode, capBreakers } = body

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'A build description is required.' }, { status: 400 })
    }

    const build = await optimizeBuild(description.trim(), position, heightRange, gameMode, Number(capBreakers || 0))

    return NextResponse.json({ success: true, build })
  } catch (err) {
    console.error('Optimize error:', err)
    return NextResponse.json({ error: 'Failed to generate build. Please try again.' }, { status: 500 })
  }
}
