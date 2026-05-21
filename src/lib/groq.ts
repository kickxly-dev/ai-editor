import Groq from 'groq-sdk'
import { BuildAttributes, Badge, AIAnalysis } from '@/types'

let _groq: Groq | null = null

function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
  }
  return _groq
}

export const MODELS = {
  fast: 'llama-3.3-70b-versatile',
  vision: 'meta-llama/llama-4-scout-17b-16e-instruct',
  reasoning: 'llama-3.3-70b-versatile',
} as const

const NBA2K26_KNOWLEDGE = `
NBA 2K26 KNOWLEDGE BASE (released September 2025, current patch May 2026):

JUMPSHOTS — 2K26 ONLY (do NOT recommend outdated bases from prior games like Base 98 which is 2K24):
- Guards under 6'5": Base 6 (Steph Curry base), Trae Young base, Base 38 (Kevin Durant release), custom fast-release combos
- Wings 6'5"–6'9": Base 8, Luka Doncic base, KD base with mid-speed upper release
- Bigs 6'10"+: Kevin Durant standing base, Dirk Nowitzki base, hook-heavy post shooting

BADGES — Full 2K26 badge list:
Finishing: Acrobat, Aerial Wizard, Backdown Punisher, Contact Finisher, Deep Hooks, Dream Shake, Drop Stepper, Fast Twitch, Giant Slayer, Hook Specialist, Post Spin Technician, Posterizer, Pro Touch, Rise Up, Slithery, Tear Dropper
Shooting: Catch & Shoot, Clutch Shooter, Corner Specialist, Deadeye, Green Machine, Guard Up, Hot Zone Hunter, Limitless Range, Mismatch Expert, Pull-Up Precision, Slippery Off Ball, Space Creator, Volume Shooter, Sniper, Off-Ball Pest
Playmaking: Bail Out, Break Starter, Bullet Passer, Clamp Breaker, Dimer, Floor General, Handles For Days, Hyperdrive, Killer Combos, Lob City Passer, Needle Threader, Quick Chain, Unpluckable, Work Horse
Defense/Rebounding: Anchor, Box, Brick Wall, Chase Down Artist, Clamps, Heart Crusher, Intimidator, Menace, Pogo Stick, Post Lock Down, Rebound Chaser, Worm

CURRENT 2K26 META:
S-Tier badges: Limitless Range, Quick First Step, Clamps, Posterizer, Green Machine
A-Tier badges: Catch & Shoot, Deadeye, Space Creator, Unpluckable, Contact Finisher, Intimidator
S-Tier builds: Shot Creator Guard (6'4"–6'5"), Glass Cleaner Center, Two-Way Slashing Wing
A-Tier builds: Playmaking Shot Creator PG, Stretch Big, Two-Way Lockdown SG
Takeovers: Limitless Shooter (S), Rim Protector (A), Playmaker (A), Slasher (B), Lockdown Defender (B)
`

const BUILD_ANALYSIS_SYSTEM = `You are CourtIQ's elite NBA 2K26 AI analyst. NBA 2K26 was released September 2025.
You have deep knowledge of:
- Every 2K26 build archetype and their strengths/weaknesses in the current patch
- 2K26 badge synergies and tier rankings
- Current meta trends and patch notes
- Animation recommendations — ONLY recommend 2K26-valid jumpshots, never outdated ones from 2K24 or prior
- Takeover ability effectiveness by build type
- Competitive vs casual play optimization

${NBA2K26_KNOWLEDGE}

Analyze builds with the precision of a professional 2K coach. Be specific, contextual, and actionable.
Always respond in valid JSON matching the exact schema requested.`

const COACH_SYSTEM = `You are CourtIQ's elite NBA 2K26 AI coach. NBA 2K26 was released September 2025.
You are:
- A veteran 2K26 player with deep mechanical knowledge of the CURRENT game
- An expert in 2K26 build optimization and badge selection
- Knowledgeable about current 2K26 meta trends and patches
- Able to give personalized advice based on player builds
- Concise but thorough — always give actionable tips
- Encouraging but honest about build limitations
- NEVER recommend jumpshots, badges, or builds from prior 2K titles (2K24, 2K25, etc.)

CRITICAL — 2K SLANG / ATTRIBUTE GLOSSARY (read carefully, never confuse these):
- "three ball" / "three" / "shooting" / "shot" → three_point shooting attribute
- "handles" / "handle" / "ball handle" / "HB" → ball_handle attribute (NOT three_point)
- "dunk" / "dunk rating" → driving_dunk
- "layup" → driving_layup
- "mid" / "mid range" → mid_range
- "free throw" / "FT" → free_throw
- "passing" / "pass" / "IQ" → pass_accuracy
- "speed with ball" / "SWB" → speed_with_ball
- "perimeter D" / "perimeter defense" / "on-ball D" → perimeter_defense
- "interior D" / "paint D" → interior_defense
- "block" / "blocks" → block attribute
- "steal" / "steals" → steal attribute
- "speed" / "lateral quickness" → speed attribute
- "acceleration" / "quickness" → acceleration
- "strength" / "weight" → strength
- "vert" / "vertical" → vertical
- "stamina" → stamina

IMPORTANT: When a user mentions a specific attribute value (e.g. "I have a 90 three ball"), always reflect it back using the CORRECT attribute name. Never confuse "three ball" with "ball handle" or any other attribute.

${NBA2K26_KNOWLEDGE}

Speak like a knowledgeable friend who plays 2K26 at a high level. Keep responses focused and practical.
Reference specific 2K26 attributes, badges, and mechanics when relevant.`

export async function analyzeBuildText(
  attributes: Partial<BuildAttributes>,
  badges: Badge[],
  position: string,
  height: string,
  wingspan: string,
  takeover: string,
  buildName: string
): Promise<AIAnalysis> {
  const attributesList = Object.entries(attributes)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
    .join('\n')

  const badgesList = badges
    .map((b) => `${b.name} (${b.level}) - ${b.category}`)
    .join('\n')

  const prompt = `Analyze this NBA 2K26 build and return a JSON object:

BUILD NAME: ${buildName}
POSITION: ${position}
HEIGHT: ${height}
WINGSPAN: ${wingspan}
TAKEOVER: ${takeover}

ATTRIBUTES:
${attributesList}

BADGES:
${badgesList || 'None specified'}

Return ONLY this JSON structure (no markdown, no explanation):
{
  "archetype": "specific archetype name",
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "skill_ceiling": 85,
  "competitiveness": 78,
  "playstyle_summary": "2-3 sentence playstyle description referencing specific attributes",
  "offensive_role": "specific offensive role description",
  "defensive_role": "specific defensive role description",
  "upgrade_recommendations": ["specific upgrade with reason", "upgrade 2", "upgrade 3"],
  "badge_recommendations": ["Badge Name (HOF) - reason", "badge 2", "badge 3", "badge 4"],
  "animation_recommendations": ["animation type: specific recommendation", "animation 2", "animation 3"],
  "takeover_recommendation": "takeover name and why it fits",
  "overall_rating": 82,
  "meta_viability": "A"
}`

  const response = await getGroq().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: 'system', content: BUILD_ANALYSIS_SYSTEM },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content || '{}'
  return JSON.parse(content) as AIAnalysis
}

export async function analyzeBuildImage(imageBase64: string, mimeType: string): Promise<string> {
  const response = await getGroq().chat.completions.create({
    model: MODELS.vision,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
          {
            type: 'text',
            text: `You are analyzing an NBA 2K26 build screenshot. Extract ALL visible information:
1. Player attributes/ratings (all numbers visible)
2. Badge names and levels
3. Position, height, weight, wingspan if visible
4. Takeover ability if visible
5. Build name if visible

Return a detailed JSON with everything you can see. Be precise with numbers.
Format: { "position": "", "height": "", "wingspan": "", "attributes": {}, "badges": [], "takeover": "", "build_name": "", "notes": "" }`,
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
  })

  return response.choices[0].message.content || '{}'
}

export async function chatWithCoach(
  messages: { role: 'user' | 'assistant'; content: string }[],
  buildContext?: string
): Promise<string> {
  const systemContent = buildContext
    ? `${COACH_SYSTEM}\n\nCURRENT PLAYER BUILD CONTEXT:\n${buildContext}`
    : COACH_SYSTEM

  const response = await getGroq().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: 'system', content: systemContent },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 800,
  })

  return response.choices[0].message.content || 'Unable to generate response.'
}

export async function analyzeGameplayFrames(frameDescriptions: string[]): Promise<string> {
  const prompt = `Analyze these NBA 2K26 gameplay frames and provide coaching feedback:

FRAMES ANALYZED: ${frameDescriptions.length}
FRAME DATA:
${frameDescriptions.slice(0, 10).join('\n')}

Provide a coaching analysis covering:
1. Spacing and positioning issues
2. Defensive mistakes observed
3. Shot selection quality
4. Ball movement efficiency
5. Transition play
6. 3 specific actionable improvements

Return JSON:
{
  "overall_rating": 75,
  "spacing_score": 70,
  "defense_score": 65,
  "shot_selection_score": 80,
  "playmaking_score": 72,
  "issues": ["issue 1", "issue 2", "issue 3"],
  "strengths": ["strength 1", "strength 2"],
  "coaching_notes": ["actionable tip 1", "actionable tip 2", "actionable tip 3"],
  "summary": "2-3 sentence overall assessment"
}`

  const response = await getGroq().chat.completions.create({
    model: MODELS.reasoning,
    messages: [
      { role: 'system', content: BUILD_ANALYSIS_SYSTEM },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  })

  return response.choices[0].message.content || '{}'
}

export async function generateBuildDescription(
  buildName: string,
  archetype: string,
  position: string,
  attributes: Partial<BuildAttributes>
): Promise<string> {
  const topStats = Object.entries(attributes)
    .sort(([, a], [, b]) => (b || 0) - (a || 0))
    .slice(0, 5)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
    .join(', ')

  const response = await getGroq().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: 'system', content: BUILD_ANALYSIS_SYSTEM },
      {
        role: 'user',
        content: `Write a 2-sentence build description for sharing in the community. Build: ${buildName}, Archetype: ${archetype}, Position: ${position}, Top stats: ${topStats}. Be hype and specific.`,
      },
    ],
    temperature: 0.8,
    max_tokens: 150,
  })

  return response.choices[0].message.content || ''
}

export interface OptimizedBuild {
  name: string
  position: string
  height: string
  weight: number
  wingspan: string
  takeover: string
  archetype: string
  playstyle_summary: string
  why_this_build: string
  attributes: Partial<import('@/types').BuildAttributes>
  badges: Array<{ name: string; level: string; category: string }>
  animations: Array<{ type: string; pick: string }>
  strengths: string[]
  weaknesses: string[]
  overall_rating: number
  meta_viability: string
  best_game_modes: string[]
}

export interface MatchupResult {
  winner: string
  win_probability_1: number
  win_probability_2: number
  key_edges: Array<{ category: string; advantage: string; reason: string }>
  build1_strategy: string[]
  build2_strategy: string[]
  matchup_summary: string
  verdict: string
}

export interface ScoutReport {
  threat_level: 'Low' | 'Medium' | 'High' | 'Elite'
  primary_threats: string[]
  exploit_weaknesses: string[]
  badges_to_equip: string[]
  defensive_keys: string[]
  how_to_win: string[]
  summary: string
}

export async function optimizeBuild(
  description: string,
  position?: string,
  heightRange?: string,
  gameMode?: string
): Promise<OptimizedBuild> {
  const filters = [
    position && position !== 'All' ? `Position: ${position}` : null,
    heightRange && heightRange !== 'Any' ? `Height Range: ${heightRange}` : null,
    gameMode && gameMode !== 'Any' ? `Game Mode: ${gameMode}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `Generate a complete optimized NBA 2K26 build from this player description:

"${description}"
${filters ? `\nCONSTRAINTS:\n${filters}` : ''}

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "name": "catchy build name",
  "position": "PG",
  "height": "6'4\\"",
  "weight": 185,
  "wingspan": "Normal",
  "takeover": "Limitless Shooter",
  "archetype": "Shot Creator Guard",
  "playstyle_summary": "2-3 sentence description of how this build plays",
  "why_this_build": "2-3 sentences explaining why these choices fit the description",
  "attributes": {
    "close_shot": 60,
    "driving_layup": 78,
    "driving_dunk": 80,
    "standing_dunk": 25,
    "post_control": 30,
    "mid_range": 75,
    "three_point": 87,
    "free_throw": 78,
    "pass_accuracy": 80,
    "ball_handle": 92,
    "speed_with_ball": 85,
    "interior_defense": 40,
    "perimeter_defense": 72,
    "steal": 58,
    "block": 30,
    "offensive_rebound": 30,
    "defensive_rebound": 42,
    "speed": 85,
    "acceleration": 87,
    "strength": 55,
    "vertical": 78,
    "stamina": 88
  },
  "badges": [
    { "name": "Limitless Range", "level": "Hall of Fame", "category": "Shooting" },
    { "name": "Quick Chain", "level": "Gold", "category": "Playmaking" }
  ],
  "animations": [
    { "type": "Jumpshot Base", "pick": "Base 6 (Steph Curry)" },
    { "type": "Dribble Style", "pick": "Pro 3" }
  ],
  "strengths": ["Elite three-point shooting", "Ankle-breaking handles", "Good park defender"],
  "weaknesses": ["Limited post game", "Below average finishing through contact"],
  "overall_rating": 86,
  "meta_viability": "A",
  "best_game_modes": ["Park", "Rec"]
}`

  const response = await getGroq().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: 'system', content: BUILD_ANALYSIS_SYSTEM + '\n' + NBA2K26_KNOWLEDGE },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content || '{}'
  return JSON.parse(content) as OptimizedBuild
}

type BuildInput = {
  name: string
  position: string
  height: string
  attributes: Record<string, number>
  badges: string[]
}

export async function simulateMatchup(
  build1: BuildInput,
  build2: BuildInput
): Promise<MatchupResult> {
  const formatBuild = (b: BuildInput) =>
    `Name: ${b.name}\nPosition: ${b.position}\nHeight: ${b.height}\nKey Attributes: ${Object.entries(b.attributes).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', ')}\nBadges: ${b.badges.join(', ')}`

  const prompt = `Simulate a 1v1 NBA 2K26 matchup between these two builds:

BUILD 1:
${formatBuild(build1)}

BUILD 2:
${formatBuild(build2)}

Analyze the matchup deeply — consider attribute matchups, badge synergies, height/position advantages, and current 2K26 meta. Return ONLY valid JSON:
{
  "winner": "${build1.name} or ${build2.name} or Toss-Up",
  "win_probability_1": 55,
  "win_probability_2": 45,
  "key_edges": [
    { "category": "Shooting", "advantage": "${build1.name}", "reason": "15-point three-point advantage plus Limitless Range HoF" },
    { "category": "Defense", "advantage": "${build2.name}", "reason": "Higher perimeter defense and Clamps badge" }
  ],
  "build1_strategy": ["Force mid-range shots", "Use ball-handle advantage to create space", "Attack off the dribble"],
  "build2_strategy": ["Stay in front on defense", "Exploit size advantage in post", "Contest every jumper"],
  "matchup_summary": "2-3 sentence overview of the matchup dynamics",
  "verdict": "1-2 sentence final verdict on the winner and why"
}`

  const response = await getGroq().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: 'system', content: BUILD_ANALYSIS_SYSTEM + '\n' + NBA2K26_KNOWLEDGE },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content || '{}'
  return JSON.parse(content) as MatchupResult
}

type OpponentInput = {
  position: string
  height: string
  attributes: Record<string, number>
  badges: string[]
  notes?: string
}

export async function scoutOpponent(opponent: OpponentInput): Promise<ScoutReport> {
  const attrsList = Object.entries(opponent.attributes)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
    .join(', ')

  const prompt = `Scout this NBA 2K26 opponent and give a defensive scouting report:

Position: ${opponent.position}
Height: ${opponent.height}
Key Attributes: ${attrsList}
Badges: ${opponent.badges.join(', ')}
${opponent.notes ? `Additional Notes: ${opponent.notes}` : ''}

Return ONLY valid JSON:
{
  "threat_level": "High",
  "primary_threats": ["Elite three-point shooting with Limitless Range HoF", "Explosive first step with Quick Chain"],
  "exploit_weaknesses": ["Force them left — weak off-hand", "Attack them on defense, low perimeter D", "Body up in post to reduce driving lanes"],
  "badges_to_equip": ["Clamps", "Intimidator", "Menace"],
  "defensive_keys": ["Stay in front, no blow-bys", "Contest every shot with a hand up", "Force them into mid-range"],
  "how_to_win": ["Attack their perimeter defense early", "Make them work on defense", "Force turnovers with ball pressure"],
  "summary": "2-3 sentence scouting summary"
}`

  const response = await getGroq().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: 'system', content: BUILD_ANALYSIS_SYSTEM + '\n' + NBA2K26_KNOWLEDGE },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content || '{}'
  return JSON.parse(content) as ScoutReport
}

export { getGroq }
