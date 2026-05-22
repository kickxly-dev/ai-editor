import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { MODELS } from '@/lib/groq'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { position, height, buildName, attributes, badges } = await req.json()

  if (!position) return NextResponse.json({ error: 'position required' }, { status: 400 })

  const attrLines = Object.entries(attributes || {})
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
    .join(', ')

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

  const prompt = `You are a savage NBA 2K26 build roaster. Your job is to mercilessly roast this player's build in a funny, over-the-top way. Be brutal but comedic — think locker room banter, not personal attacks.

BUILD:
Name: ${buildName || `${position} Build`}
Position: ${position}
Height: ${height}
Attributes: ${attrLines}
Badges: ${(badges || []).join(', ') || 'None'}

Return ONLY this exact JSON (no markdown):
{
  "nickname": "a funny roast nickname for this build (2-4 words, creative)",
  "roast": "a savage but funny 2-3 sentence roast of this build. Reference specific attribute weaknesses and badge choices. Be creative and use 2K slang. End with a comedic gut punch.",
  "verdict": "one brutal sentence verdict on whether this build is trash or secretly decent",
  "rating": "letter grade from S to F (be harsh)",
  "fire_level": 4
}

Rules:
- fire_level 1-5 based on how bad the build is (5 = absolutely cooked)
- Reference real weaknesses (e.g. low 3-point, no defense, etc.)
- Use 2K slang: brick, cooked, park trash, hooper, glass cleaner, etc.
- Be funny, not mean-spirited — imagine a friend roasting you
- Never be racist, sexist, or personally offensive
- Keep it about the BUILD, not the person`

  const response = await groq.chat.completions.create({
    model: MODELS.fast,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    max_tokens: 400,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')
  return NextResponse.json(result)
}
