import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { MODELS } from '@/lib/groq'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DRIBBLE_KNOWLEDGE = `
NBA 2K26 SEASON 7 DRIBBLE ANIMATION GUIDE

Ball Handle is the gating attribute for dribble packages. Higher ball handle = access to more elite packages.

HEIGHT RANGES & PACKAGE ACCESS:

Guards 5'9"–6'4":
  These builds have access to the full guard dribble package library.
  65+:  Basic/Fundamental packages only — limited combos, no size-up variety
  70+:  Pro 1, Pro 2 available — basic guard packages with some crossover options
  75+:  Pro 3 unlocked — S-tier package for this height, tightest animations in the game
  80+:  Pro 3 (preferred), Pro 5, Steph Curry package starting to unlock
  85+:  Elite territory — Curry Package (S-tier), Kyrie Irving package, LeBron James package accessible
  90+:  Maximum tier — all packages available, full combo chains, Pro 5 + Curry Package optimal

Wings 6'5"–6'9":
  Wing-height animations are slightly slower but longer — different meta than guards.
  65+:  Basic wing packages — limited variety
  70+:  Intermediate wing packages — some crossover access
  75+:  Wing Pro packages — solid foundation, Luka Doncic style unlocking
  80+:  Elite wing packages — KD (Kevin Durant) package tier, long fluid animations
  85+:  Top tier — KD package, Kawhi Leonard package, optimal combo chains
  90+:  All wing packages — maximum flexibility, full elite access

Bigs 6'10"+:
  Big man dribble animations — limited but impactful.
  65+:  Basic big man moves only
  70+:  Standard big packages, some basic post dribbles
  75+:  Improved big man packages — better post-up move chains
  80+:  Elite big packages — playmaking center territory, KD-style if height allows
  85+:  Full playmaking big — all center/PF animations accessible
  90+:  Rare — maximum big man animation access, near-guard level flexibility

SPECIFIC ANIMATION RECOMMENDATIONS:

Guards (5'9"–6'4") 75+:
  Dribble Style: Pro 3 (S-tier — tightest crossover chains in Season 7)
  Size Up Package: S-tier size-up that chains with Pro 3
  Moving Crossover: Quick first step chain — most meta combo
  Moving Behind Back: Pro style behind-the-back

Guards (5'9"–6'4") 85+:
  Dribble Style: Curry Package (S-tier) or Pro 3
  Full elite combo access — Curry + Quick First Step chain is the meta

Wings (6'5"–6'9") 80+:
  Dribble Style: KD Package (optimal for length)
  Size Up: Wing-specific elite package

COMBO CHAIN RULES:
  Pro 3 chains: Crossover → Behind Back → Spin = most effective guard combo in Season 7
  Curry Package chains: Hesitation → Crossover → Pullback = elite for off-dribble shooters
  KD Package: Behind Back → Hesitation → Step-back = wing scoring combo

NOTE: Recommend packages available in 2K26 Season 7 only. Do not recommend deprecated animations.
`

export async function POST(req: NextRequest) {
  const { position, heightRange, ballHandleRange } = await req.json()

  if (!position || !heightRange || !ballHandleRange) {
    return NextResponse.json({ error: 'position, heightRange, and ballHandleRange required' }, { status: 400 })
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

  const prompt = `${DRIBBLE_KNOWLEDGE}

Based on the above Season 7 knowledge, recommend the best dribble animations for:
- Position: ${position}
- Height Range: ${heightRange}
- Ball Handle Rating: ${ballHandleRange}

Return ONLY valid JSON (no markdown):
{
  "primary_package": "Pro 3",
  "size_up": "S-tier size-up name",
  "moving_crossover": "animation name",
  "moving_behind_back": "animation name",
  "moving_spin": "animation name",
  "why": "2-3 sentences explaining why this package is optimal for this exact height and ball handle range in Season 7",
  "alternatives": [
    { "name": "Pro 5", "reason": "Slightly more variety if Pro 3 feels too tight" },
    { "name": "Curry Package", "reason": "If ball handle reaches 85+ — elite step-back chains" }
  ],
  "tips": [
    "Specific combo chain to master with this package",
    "How to maximize these animations in Park/Rec",
    "What attribute to push next to unlock better animations"
  ],
  "meta_rating": "S"
}`

  const response = await groq.chat.completions.create({
    model: MODELS.fast,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.25,
    max_tokens: 700,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')
  return NextResponse.json(result)
}
