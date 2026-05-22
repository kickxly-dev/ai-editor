import { NextRequest, NextResponse } from 'next/server'
import { getGroq, MODELS } from '@/lib/groq'
import { searchForCoach, formatSearchContext } from '@/lib/web-search'

export const runtime = 'nodejs'
export const maxDuration = 45

async function parseVisionJSON<T>(raw: string, fallback: T): Promise<T> {
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') throw new Error()
    return parsed as T
  } catch {
    try {
      const fix = await getGroq().chat.completions.create({
        model: MODELS.reasoning,
        messages: [
          { role: 'system', content: 'Fix JSON syntax errors. Output ONLY valid raw JSON, no markdown.' },
          { role: 'user', content: raw },
        ],
        temperature: 0, max_tokens: 1500, response_format: { type: 'json_object' },
      })
      return JSON.parse(fix.choices[0].message.content || '{}') as T
    } catch { return fallback }
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured.' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { mode } = body

    // ── Pre-game recon: search gamertag + generate intel report ────────────────
    if (mode === 'recon') {
      const { gamertag, platform = 'Unknown' } = body
      if (!gamertag?.trim()) return NextResponse.json({ error: 'Gamertag required.' }, { status: 400 })

      const searchQuery = `"${gamertag}" NBA 2K26`
      const results = await searchForCoach(searchQuery)
      const searchContext = formatSearchContext(results)

      const res = await getGroq().chat.completions.create({
        model: MODELS.fast,
        messages: [
          {
            role: 'system',
            content: `You are an elite NBA 2K26 intelligence analyst. Generate a classified pre-game intel report on the given gamertag. Respond with ONLY this JSON schema:
{
  "threat_level": "Low|Medium|High|Elite",
  "estimated_build": {
    "archetype": "string",
    "position": "PG|SG|SF|PF|C",
    "height_range": "string e.g. 6'4\"–6'6\"",
    "likely_attributes": {
      "three_point": <25-99>,
      "speed": <25-99>,
      "ball_handle": <25-99>,
      "perimeter_defense": <25-99>,
      "interior_defense": <25-99>,
      "driving_dunk": <25-99>
    },
    "confidence": <0-100>
  },
  "known_intel": ["string","string","string"],
  "primary_threats": ["string","string"],
  "exploit_weaknesses": ["string","string"],
  "kill_shot": "Single most important tactical instruction to win this matchup",
  "pre_game_mindset": "2-3 sentence coaching note for mental preparation"
}
If no specific intel exists, estimate from Season 7 meta averages. Lower confidence to 25-45 if no data found. Be direct, actionable, and specific.`,
          },
          {
            role: 'user',
            content: `TARGET GAMERTAG: "${gamertag}" | PLATFORM: ${platform}\n\nINTEL GATHERED:\n${searchContext || 'No community intel found. Estimate from meta averages.'}`,
          },
        ],
        temperature: 0.35,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      })

      const raw = res.choices[0].message.content || '{}'
      const report = await parseVisionJSON(raw, {
        threat_level: 'Medium',
        estimated_build: { archetype: 'Unknown', position: 'PG', height_range: '6\'4"–6\'6"', likely_attributes: { three_point: 75, speed: 80, ball_handle: 78, perimeter_defense: 65, interior_defense: 45, driving_dunk: 72 }, confidence: 30 },
        known_intel: ['No community data found for this gamertag.'],
        primary_threats: ['Unknown — stay locked in defensively.'],
        exploit_weaknesses: ['Force them to play outside their comfort zone.'],
        kill_shot: 'Play fundamentally sound defense and force them to beat you with their weakest attribute.',
        pre_game_mindset: 'Stay disciplined. No intel means no tendencies to exploit — but also no prep advantage for them.',
      })

      return NextResponse.json({ success: true, report, searched: searchQuery })
    }

    // ── In-game X-Ray: reverse-engineer build from observations ────────────────
    if (mode === 'xray') {
      const { observations = [] } = body
      if (!observations.length) return NextResponse.json({ error: 'No observations provided.' }, { status: 400 })

      const res = await getGroq().chat.completions.create({
        model: MODELS.fast,
        messages: [
          {
            role: 'system',
            content: `You are the world's best NBA 2K26 build reverse-engineer. Based on observed in-game behaviors, decode the opponent's build with maximum precision and confidence ratings. Respond ONLY with this JSON:
{
  "archetype": "string",
  "position": "PG|SG|SF|PF|C",
  "height_estimate": "string e.g. 6'3\"–6'5\"",
  "confidence_overall": <0-100>,
  "deduced_attributes": [
    { "stat": "Speed", "estimated_range": "82-88", "confidence": <0-100>, "evidence": "why you deduced this" },
    { "stat": "3-Point", "estimated_range": "78-85", "confidence": <0-100>, "evidence": "..." },
    { "stat": "Ball Handle", "estimated_range": "80-87", "confidence": <0-100>, "evidence": "..." },
    { "stat": "Driving Dunk", "estimated_range": "70-80", "confidence": <0-100>, "evidence": "..." },
    { "stat": "Perimeter D", "estimated_range": "55-70", "confidence": <0-100>, "evidence": "..." },
    { "stat": "Acceleration", "estimated_range": "80-88", "confidence": <0-100>, "evidence": "..." }
  ],
  "likely_badges": ["badge1","badge2","badge3","badge4"],
  "identified_tendencies": ["string","string","string"],
  "kill_shot": "The single most specific, actionable exploit right now",
  "counter_moves": ["Exact counter 1","Exact counter 2","Exact counter 3"],
  "updated_profile": "2-sentence live assessment of who you're facing"
}
Be as specific as possible. Reference the actual observations. Higher observations = higher confidence.`,
          },
          {
            role: 'user',
            content: `LIVE OBSERVATIONS (${observations.length} signals):\n${observations.map((o: string, i: number) => `SIGNAL ${i + 1}: "${o}"`).join('\n')}\n\nDecode this build now.`,
          },
        ],
        temperature: 0.25,
        max_tokens: 1400,
        response_format: { type: 'json_object' },
      })

      const raw = res.choices[0].message.content || '{}'
      const profile = await parseVisionJSON(raw, {
        archetype: 'Unknown',
        position: 'PG',
        height_estimate: '6\'3"–6\'6"',
        confidence_overall: 20,
        deduced_attributes: [],
        likely_badges: [],
        identified_tendencies: ['Not enough data yet'],
        kill_shot: 'Add more observations to get a precise kill shot.',
        counter_moves: ['Keep watching for patterns'],
        updated_profile: 'Profile incomplete — add more observations.',
      })

      return NextResponse.json({ success: true, profile })
    }

    return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 })
  } catch (err) {
    console.error('Vision error:', err)
    return NextResponse.json({ error: 'Vision system offline. Try again.' }, { status: 500 })
  }
}
