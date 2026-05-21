import { NextRequest, NextResponse } from 'next/server'
import { simulateMatchup, scoutOpponent } from '@/lib/groq'

export const runtime = 'nodejs'
export const maxDuration = 45

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI service is not configured.' }, { status: 503 })
    }

    const body = await req.json()
    const { mode, build1, build2, opponent } = body

    if (mode === 'simulate') {
      if (!build1 || !build2) {
        return NextResponse.json({ error: 'Both build1 and build2 are required for simulation.' }, { status: 400 })
      }
      const result = await simulateMatchup(build1, build2)
      return NextResponse.json({ success: true, result })
    }

    if (mode === 'scout') {
      if (!opponent) {
        return NextResponse.json({ error: 'Opponent data is required for scouting.' }, { status: 400 })
      }
      const report = await scoutOpponent(opponent)
      return NextResponse.json({ success: true, report })
    }

    return NextResponse.json({ error: 'mode must be "simulate" or "scout".' }, { status: 400 })
  } catch (err) {
    console.error('Matchup error:', err)
    return NextResponse.json({ error: 'Failed to process request. Please try again.' }, { status: 500 })
  }
}
