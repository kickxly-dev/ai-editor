import { NextRequest, NextResponse } from 'next/server'
import { chatWithCoach } from '@/lib/groq'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, buildContext } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const validMessages = messages.filter(
      (m: { role: string; content: string }) =>
        (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )

    if (validMessages.length === 0) {
      return NextResponse.json({ error: 'No valid messages provided' }, { status: 400 })
    }

    const lastMessages = validMessages.slice(-10)
    const response = await chatWithCoach(lastMessages, buildContext)

    return NextResponse.json({ success: true, message: response })
  } catch (err) {
    console.error('Coach chat error:', err)
    return NextResponse.json({ error: 'Coach is unavailable. Please try again.' }, { status: 500 })
  }
}
