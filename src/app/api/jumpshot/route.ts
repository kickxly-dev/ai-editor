import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { MODELS } from '@/lib/groq'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const JUMPSHOT_KNOWLEDGE = `
NBA 2K26 SEASON 7 VERIFIED JUMPSHOT GUIDE

HEIGHT RANGES & TOP BASES:

Guards 5'9"–6'4":
  Top bases: Patty Mills (S-tier — best green window for this height), Quinton Grimes (A-tier), AJ Green (A-tier)
  Upper 1+2: Luka Doncic + Brandon Ingram is the meta combo · Klay Thompson also solid
  Speed: 85–100% (these builds can run near-max without sacrificing consistency)
  3PT 75–80: go 80–85%, don't push full speed yet
  3PT 81–83: 85–90% recommended
  3PT 84–86: 90–95%, push toward full speed
  3PT 87–90: 95–100%, full speed is fine
  3PT 91–92: MAX speed, any base works — green window is large

Wings 6'5"–6'9":
  Top bases: Patty Mills (still viable), Quinton Grimes (recommended at this range), Paul George
  Upper 1+2: Luka Doncic, Klay Thompson, Damian Lillard
  Speed: 65–85% range · wings need slightly slower for timing consistency
  3PT 75–80: 65–70%, prioritize consistency over speed
  3PT 81–83: 70–75%
  3PT 84–86: 75–80%
  3PT 87–90: 80–85%
  3PT 91–92: 85–90% — can push higher with practice

Bigs 6'10"+:
  Top bases: Kevin Durant (versatile), Dirk Nowitzki standing base (best for pure bigs), Damian Lillard (stretch bigs)
  Upper 1+2: Height-limited pool — Luka Doncic if available, otherwise match to available heights
  Speed: 45–65% · bigs benefit most from slower speeds and larger green windows
  3PT 75–80: 45–55%, focus purely on green window
  3PT 81–83: 55–60%
  3PT 84–86: 60–65%
  3PT 87–90: 65%
  3PT 91–92: 65–70% max — big bodies still need slower release

PLAYSTYLE ADJUSTMENTS:
  Catch & Shoot: add 5–10% to recommended speed — less movement means more timing windows
  Pull-Up / Off Dribble: subtract 5–10% from recommended speed — momentum affects timing
  Mid-Range: speed matters less, prioritize large green window releases
  Post Fade: use big man bases regardless of height, speed 40–55%
  Balanced: use the base range as-is

GENERAL RULES:
  Blending: 60/40 favoring upper release 1 is the most proven meta split
  NEVER recommend any base from 2K24, 2K25, or that doesn't exist in 2K26
  Difficulty: Patty Mills = Easy, Quinton Grimes = Easy-Medium, most others = Medium–Hard
`

export async function POST(req: NextRequest) {
  const { position, heightRange, playstyle, threeRange } = await req.json()

  if (!position || !heightRange) {
    return NextResponse.json({ error: 'position and heightRange required' }, { status: 400 })
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

  const prompt = `${JUMPSHOT_KNOWLEDGE}

Based on the above Season 7 knowledge, recommend the best jumpshot for:
- Position: ${position}
- Height Range: ${heightRange}
- Playstyle: ${playstyle || 'balanced'}
- Three-Point Rating: ${threeRange || '84–86'}

Return ONLY valid JSON (no markdown):
{
  "base": "Patty Mills",
  "upper_release_1": "Luka Doncic",
  "upper_release_2": "Brandon Ingram",
  "release_speed": "90%",
  "blending": "60/40 (Upper 1 / Upper 2)",
  "why": "2-3 sentence explanation of why this specific combo is optimal for this exact height and 3PT range",
  "alternatives": [
    { "name": "Quinton Grimes", "reason": "Slightly more forgiving timing if Patty Mills feels too snappy" },
    { "name": "AJ Green", "reason": "Larger green window at the cost of some speed" }
  ],
  "green_window_rating": "Large",
  "difficulty": "Easy",
  "tips": [
    "Specific tip for this jumpshot at this height",
    "What to do if you're consistently early",
    "What to do if you're consistently late"
  ],
  "meta_rating": "S"
}`

  const response = await groq.chat.completions.create({
    model: MODELS.fast,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')
  return NextResponse.json(result)
}
