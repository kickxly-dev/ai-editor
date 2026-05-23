import { NextRequest, NextResponse } from 'next/server'
import { getGroq } from '@/lib/groq'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured.' }, { status: 503 })
  }

  try {
    const form = await req.formData()
    const file = form.get('audio') as File | null
    if (!file) return NextResponse.json({ error: 'No audio provided.' }, { status: 400 })

    const res = await getGroq().audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      language: 'en',
      response_format: 'json',
      temperature: 0,
      prompt: 'NBA 2K26 build, badges, jumpshot, dribble, takeover, MyCareer, REC, Park, Pro-Am, shot creator, lockdown, glass cleaner, perimeter defense, ankle breaker, deadeye, clamps.',
    } as any)

    const text = (res as any).text?.trim() || ''
    return NextResponse.json({ text })
  } catch (err) {
    console.error('Transcribe error:', err)
    return NextResponse.json({ error: 'Transcription failed.' }, { status: 500 })
  }
}
