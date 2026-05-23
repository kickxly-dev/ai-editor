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

    // ── Weakness Scanner: find every exploit on any build ─────────────────────
    if (mode === 'weakness') {
      const { build_description = '' } = body
      if (!build_description.trim()) return NextResponse.json({ error: 'Build description required.' }, { status: 400 })

      const res = await getGroq().chat.completions.create({
        model: MODELS.fast,
        messages: [
          {
            role: 'system',
            content: `You are the world's most elite NBA 2K26 exploitation specialist. Given any build description, identify every weakness and produce an actionable exploit guide. Respond ONLY with this JSON:
{
  "build_summary": "1-sentence description of what this build is",
  "core_weaknesses": [
    { "area": "e.g. Interior Defense", "description": "specific exploitation technique", "severity": <1-10> }
  ],
  "best_counters": [
    { "build_type": "string", "why": "why it hard-counters this build", "key_stats": "e.g. 90+ Perimeter D, 85+ Speed" }
  ],
  "badge_punishments": ["Badge that hard-counters this build", "...2-3 total"],
  "kill_sequence": "Step by step: exactly how to destroy this build in 2-3 sentences. Be brutally specific.",
  "defensive_scheme": "How to guard this specific build type",
  "one_liner": "The brutal one-liner truth about why this build type loses to a smart player"
}
Include 3-5 weaknesses and 2-3 counters. Be specific to NBA 2K26 Season 7 mechanics.`,
          },
          {
            role: 'user',
            content: `BUILD TO EXPLOIT:\n${build_description}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      })

      const raw = res.choices[0].message.content || '{}'
      const report = await parseVisionJSON(raw, {
        build_summary: 'Unknown build type.',
        core_weaknesses: [{ area: 'Unknown', description: 'Add more detail to your build description.', severity: 5 }],
        best_counters: [{ build_type: 'Athletic Finisher', why: 'Versatile counter to most builds', key_stats: '85+ Speed, 88+ Driving Dunk' }],
        badge_punishments: ['Clamp Breaker'],
        kill_sequence: 'Be more specific about the build to get a precise kill sequence.',
        defensive_scheme: 'Play fundamentally sound defense.',
        one_liner: 'Every build has a weakness — describe it better to find it.',
      })

      return NextResponse.json({ success: true, report })
    }

    // ── Meta Pulse: real-time meta intelligence report ─────────────────────────
    if (mode === 'meta') {
      const { platform = 'All' } = body

      const searchQuery = `NBA 2K26 Season 7 best builds meta tier list ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
      const results = await searchForCoach(searchQuery)
      const searchContext = formatSearchContext(results)

      const res = await getGroq().chat.completions.create({
        model: MODELS.fast,
        messages: [
          {
            role: 'system',
            content: `You are the NBA 2K26 meta analyst. Generate the definitive Season 7 meta intelligence report based on community data. Respond ONLY with this JSON:
{
  "tier_s": [
    { "name": "Build archetype name", "why": "Why it's S tier — be specific to Season 7 mechanics", "threat": "Elite" }
  ],
  "tier_a": [
    { "name": "Build archetype name", "why": "Why it's solid A tier" }
  ],
  "trending_up": ["Build/playstyle trending up this week", "...3 total"],
  "trending_down": ["Build/archetype being phased out", "...3 total"],
  "most_abused_badges": ["Badge1", "Badge2", "Badge3", "Badge4"],
  "current_meta_summary": "2-sentence summary of current Season 7 meta state.",
  "biggest_threat": "The single most oppressive build archetype dominating lobbies right now",
  "analyst_note": "2-sentence coaching note on how to navigate and win in the current meta"
}
Include 2-3 S tier entries, 3-4 A tier. Base on Season 7 (May 2026) NBA 2K26 data. Platform: ${platform}.`,
          },
          {
            role: 'user',
            content: `PLATFORM: ${platform}\nCOMMUNITY DATA:\n${searchContext || 'No real-time data available — generate based on Season 7 meta knowledge.'}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 1300,
        response_format: { type: 'json_object' },
      })

      const raw = res.choices[0].message.content || '{}'
      const report = await parseVisionJSON(raw, {
        tier_s: [{ name: 'Playmaking Shot Creator', why: 'Unmatched offensive versatility in Season 7', threat: 'Elite' }],
        tier_a: [{ name: 'Two-Way Slasher', why: 'Solid all-around build with minimal weaknesses' }],
        trending_up: ['Interior Dominators', 'Two-Way Wings', 'Spot-Up Shooters'],
        trending_down: ['Pure Lockdowns', 'Stretch Fours', 'Old-school Pure Points'],
        most_abused_badges: ['Deadeye', 'Clamps', 'Posterizer', 'Ankle Breaker'],
        current_meta_summary: 'Season 7 meta heavily favors versatile two-way builds with high speed and shooting. Pure specialists are struggling.',
        biggest_threat: 'Playmaking Shot Creator at 6\'4"–6\'6" with max Speed Boost',
        analyst_note: 'Prioritize Perimeter Defense and Speed to stay competitive. Two-way builds dominate — pure offense will get exploited.',
      })

      return NextResponse.json({ success: true, report, searched: searchQuery })
    }

    // ── Conversational Coach: user asks a question, AI sees screen + answers ────
    if (mode === 'chat') {
      const { image, question, history = [], buildContext } = body
      if (!image)    return NextResponse.json({ error: 'No image provided.' }, { status: 400 })
      if (!question) return NextResponse.json({ error: 'No question provided.' }, { status: 400 })

      const base64 = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`

      const sysPrompt = `You are CourtIQ, an elite NBA 2K26 coach having a live conversation with a skilled player while they play. They are pointing their phone camera at their TV — the image may be blurry. Read what's actually on screen (menu, lobby, in-game, what's happening) and answer their question directly based on what you see.

Rules:
- The player is experienced — NEVER explain controls or basics
- Answer in 1-3 sentences max, conversational tone, no bullet lists
- Be specific to what's on the screen right now ("you're facing a Stretch Big with a Glass Cleaner help defender — drive baseline")
- If you can't see something they're asking about, say so briefly ("can't make out the scoreboard — angle your phone better")
- If they ask about meta/builds/badges and you can't see the relevant info, answer from your NBA 2K26 Season 7 knowledge
- Output plain text only, no JSON, no markdown${buildContext ? `\n\nPlayer's build: ${buildContext}` : ''}`

      const messages: any[] = [{ role: 'system', content: sysPrompt }]

      // Last few turns of conversation for context
      for (const m of history.slice(-6)) {
        if (m.role === 'user' || m.role === 'assistant') {
          messages.push({ role: m.role, content: m.content })
        }
      }

      messages.push({
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: base64, detail: 'auto' } },
          { type: 'text', text: question },
        ],
      })

      const res = await getGroq().chat.completions.create({
        model: MODELS.vision,
        messages,
        temperature: 0.5,
        max_tokens: 250,
      })

      const answer = res.choices[0].message.content?.trim() || "I'm not sure — try asking again."
      return NextResponse.json({ answer })
    }

    // ── Camera Coach: real-time coaching from phone camera pointed at screen ────
    if (mode === 'camera') {
      const { image, buildContext, gameMode } = body

      if (!image) return NextResponse.json({ error: 'No image provided.' }, { status: 400 })

      const base64 = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`

      const contextNote = [
        buildContext && `Player build: ${buildContext}`,
        gameMode && `Mode: ${gameMode}`,
      ].filter(Boolean).join(' | ')

      const res = await getGroq().chat.completions.create({
        model: MODELS.vision,
        messages: [
          {
            role: 'system',
            content: `You are CourtIQ, an elite NBA 2K26 real-time coach for experienced players. First determine if actual gameplay is on screen (live game, active possession, defense situation). If you see a lobby, main menu, MyCareer hub, squad screen, loading screen, halftime, celebration cutscene, or anything that is NOT live in-game action — output {"skip":true}. Only coach during live gameplay. When in a live game: give ONE advanced, high-level read in under 20 words. Player is skilled — NEVER explain controls or basics. Focus on: defensive rotations, shot selection, spacing reads, when to kick vs attack, badge timing windows, matchup exploits, takeover usage. The image is from a phone pointed at a TV, may be blurry — read context clues (scoreboard, court, players in action). ONLY output valid JSON: {"skip":false,"tip":"...","category":"offense|defense|timing|positioning|takeover","priority":"critical|tip|nice"} OR {"skip":true}. priority: critical=active mistake costing points, tip=smart improvement, nice=reinforce good play.`,
          },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: base64, detail: 'auto' } },
              { type: 'text', text: `Analyze this NBA 2K26 screenshot and give real-time coaching.${contextNote ? ` Context — ${contextNote}` : ''}` },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      })

      const raw = res.choices[0].message.content || '{}'
      const parsed = await parseVisionJSON(raw, { skip: false, tip: 'Stay locked in.', category: 'tip', priority: 'tip' })

      if (parsed.skip) return NextResponse.json({ skip: true })

      return NextResponse.json({
        skip: false,
        tip: parsed.tip,
        category: parsed.category,
        priority: parsed.priority,
      })
    }

    return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 })
  } catch (err) {
    console.error('Vision error:', err)
    return NextResponse.json({ error: 'Vision system offline. Try again.' }, { status: 500 })
  }
}
