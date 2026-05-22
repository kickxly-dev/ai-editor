import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { MODELS } from '@/lib/groq'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const JUMPSHOT_KNOWLEDGE = `
SEASON 5 VERIFIED JUMPSHOT GUIDE (May 2026 — only recommend these):

Guards 5'7"–6'0":
  Top bases: Patty Mills (S-tier), AJ Green, Quinton Grimes
  Upper 1+2: Luka Doncic, Brandon Ingram, Klay Thompson
  Speed: MAX or near-max (85–100%). These heights get fastest speed caps.

Guards 6'1"–6'4":
  Top bases: Patty Mills (S-tier — best green window), Quinton Grimes (A-tier)
  Upper 1+2: Luka Doncic + Brandon Ingram is the meta combo
  Speed: 75–90% for most players. Full speed if 3PT is 85+.

Wings 6'5"–6'8":
  Top bases: Patty Mills, Quinton Grimes, Paul George
  Upper 1+2: Luka Doncic, Klay Thompson
  Speed: 65–80%. Wings generally need slightly slower speed for consistency.

Bigs 6'9"–7'0":
  Top bases: Kevin Durant (versatile), Damian Lillard (for stretch bigs)
  Upper 1+2: Any that match height constraints
  Speed: 55–70%. Bigger green window at slower speeds for bigs.

Bigs 7'1"+:
  Top bases: Dirk Nowitzki (standing), Kevin Durant
  Upper 1+2: height-limited pool
  Speed: 45–60%

GENERAL RULES:
- Blending: 60/40 favoring upper release 1 is the most common meta split
- For pure catch-and-shoot: full speed is fine regardless of height
- For pull-up/off-dribble: slightly slower speed (5–10% below max) gives more consistency
- Three-point 93+: can run near-max speed safely
- Three-point 75–84: go 5–10% slower for better consistency
- NEVER recommend jumpshots from 2K24 or 2K25
`

export async function POST(req: NextRequest) {
  const { position, heightRange, playstyle, threeRange } = await req.json()

  if (!position || !heightRange) {
    return NextResponse.json({ error: 'position and heightRange required' }, { status: 400 })
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

  const prompt = `${JUMPSHOT_KNOWLEDGE}

Based on the above Season 5 knowledge, recommend the best jumpshot for:
- Position: ${position}
- Height: ${heightRange}
- Playstyle: ${playstyle || 'balanced'}
- Three-Point Rating: ${threeRange || '75-84'}

Return ONLY valid JSON (no markdown):
{
  "base": "Patty Mills",
  "upper_release_1": "Luka Doncic",
  "upper_release_2": "Brandon Ingram",
  "release_speed": "85%",
  "blending": "60/40 (Upper 1 / Upper 2)",
  "why": "2-3 sentence explanation of why this specific combo fits this build",
  "alternatives": [
    { "name": "Quinton Grimes", "reason": "Alternative base if Patty Mills feels too fast" },
    { "name": "AJ Green", "reason": "Slightly larger green window at the cost of some speed" }
  ],
  "green_window_rating": "Large / Medium / Small",
  "difficulty": "Easy / Medium / Hard",
  "tips": [
    "Set release cue to 'early jump' for better timing consistency",
    "Practice in 2KU before using in Park",
    "If missing early, slow down release speed by 5%"
  ],
  "meta_rating": "S"
}`

  const response = await groq.chat.completions.create({
    model: MODELS.fast,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 700,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')
  return NextResponse.json(result)
}
