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
NBA 2K26 KNOWLEDGE BASE (released September 2025, current patch Season 5 — May 2026):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JUMPSHOTS (Season 5 — verified current)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEVER recommend Base 98, Base 8, or any 2K24/2K25 bases — they do not exist in 2K26.
2K26 has 5 badge levels: Bronze → Silver → Gold → Hall of Fame → LEGEND (new in 2K26).

Guards 5'7"–6'4":
  Best base: Patty Mills (S-tier Season 5), Quinton Grimes (A-tier), AJ Green
  Upper releases: Luka Doncic, Brandon Ingram (set to full speed + cue)

Wings 6'5"–6'9":
  Best base: Patty Mills, Quinton Grimes, custom mid-speed combos
  Upper releases: balanced speed, high green-window options

Bigs 6'10"–7'4":
  Best base: Dirk Nowitzki standing base, Kevin Durant base
  Prioritize bigger green windows over speed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALL NBA 2K26 SEASON 5 BADGES (verified from TierMaker — real badges only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FINISHING BADGES:
  Aerial Wizard (B-tier) — alley-oops and put-back finishes
  Float Game (B-tier) — floaters and runners; essential for guards attacking the paint
  High-Flying Denier (A-tier) — explosive dunk attempts over/around defenders in the paint
  Hook Specialist (C-tier) — hook shots from the post
  Layup Mixmaster (B-tier) — varied layup packages; off-balance and leaning finishes
  Lightning Launch (S-tier) — explosive first step out of triple threat and off dribble; top finishing badge
  Paint Prodigy (D-tier) — paint finishing; weakest tier
  Physical Finisher (C-tier) — contact layups and dunks through physical defenders
  Post Fade Phenom (B-tier) — post fade-away shots
  Post Powerhouse (B-tier) — power post moves and drop steps
  Post Prodigy (C-tier) — general post game effectiveness
  Post Up Poet (B-tier) — post up scoring and faking from the block
  Posterizer (A-tier) — dunk over/through defenders; expands dunk green window at Legend
  Rise Up (A-tier) — standing dunks and posterizing attempts in the paint
  Slippery Off-Ball (C-tier) — off-ball movement and getting open cuts

SHOOTING BADGES:
  Deadeye (S-tier) — reduces shot contest penalty; MUST-HAVE for all shooters
  Limitless Range (A-tier) — extends 3PT range beyond the arc; essential for shooting builds
  Mini Marksman (A-tier) — shooting boost for shorter/smaller builds; A-tier for undersized guards
  Set Shot Specialist (S-tier) — standstill/catch-and-shoot jumpers; S-tier for spot-up shooters
  Shifty Shooter (S-tier) — off-the-dribble difficult shots, fading, pull-ups; S-tier for guards

PLAYMAKING BADGES:
  Ankle Assassin (B-tier) — ankle-breaking dribble moves; good for combo guards
  Bail Out (B-tier) — passing out of the air / skip passes
  Break Starter (A-tier) — outlet passes in transition; A-tier for PGs
  Dimer (S-tier) — passing boosts to open shooters; S-tier for pass-first PGs
  Handles for Days (A-tier) — reduces stamina drain on dribble moves; must-have for handles builds
  Pick Dodger (A-tier) — navigating through screens on offense
  Strong Handle (A-tier) — tight ball control under defensive pressure; replaces old ball-handling badge
  Unpluckable (B-tier) — reduces steal success against you when dribbling
  Versatile Visionary (A-tier) — playmaking vision; boosts passing in multiple situations

DEFENSE / REBOUNDING BADGES:
  Boxout Beast (A-tier) — boxing out opponents on rebounds
  Brick Wall (A-tier) — setting physical screens; harder to move through on defense
  Challenger (S-tier) — improved shot contest quality and timing; S-tier for perimeter defenders
  Glove (B-tier) — stealing the ball from ball-handlers
  Immovable Enforcer (A-tier) — interior defense; hard to back down or move in the post
  Interceptor (S-tier) — pass deflections and interceptions in passing lanes; S-tier for locks
  Off-Ball Pest (A-tier) — bothering off-ball offensive players and denying passes
  On-Ball Menace (A-tier) — on-ball defensive pressure; reduces opponent attributes
  Paint Patroller (A-tier) — protecting the paint; shot contests inside
  Pogo Stick (S-tier) — quick successive jumps for blocks and rebounds; top big-man badge
  Post Lockdown (B-tier) — defending in the post against post scorers
  Rebound Chaser (S-tier) — tracking and chasing down missed shots; S-tier for rebounders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEASON 5 BADGE TIER LIST (from verified TierMaker)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
S-tier: Set Shot Specialist, Deadeye, Pogo Stick, Lightning Launch, Dimer, Shifty Shooter, Rebound Chaser, Interceptor, Challenger
A-tier: Strong Handle, Immovable Enforcer, Versatile Visionary, Boxout Beast, Break Starter, Mini Marksman, On-Ball Menace, Posterizer, Limitless Range, High-Flying Denier, Rise Up, Paint Patroller, Handles for Days, Brick Wall, Pick Dodger, Off-Ball Pest
B-tier: Bail Out, Ankle Assassin, Float Game, Unpluckable, Layup Mixmaster, Post Lockdown, Glove, Aerial Wizard, Post Fade Phenom, Post Powerhouse, Post Up Poet
C-tier: Physical Finisher, Slippery Off-Ball, Post Prodigy, Hook Specialist
D-tier: Paint Prodigy

IMPORTANT: These are the ONLY real Season 5 badges. Do NOT invent or use any other badge names.
Do NOT recommend: Clamps, Quick Chain, Hyperdrive, Killer Combos, Acrobat, Contact Finisher, Green Machine, Guard Up, Hot Zone Hunter, Anchor, Box, Chase Down Artist, Intimidator, Menace, Floor General, Catch & Shoot, Corner Specialist, Volume Shooter, Giant Slayer, Slithery, Tear Dropper, Bullet Passer, or any other badge not in the verified list above.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT META (Season 5, May 2026)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEST BADGES BY POSITION:
  PG (scoring): Shifty Shooter, Deadeye, Dimer, Lightning Launch, Handles for Days, Strong Handle
  PG (pass-first): Dimer, Set Shot Specialist, Break Starter, Versatile Visionary, Handles for Days
  SG: Deadeye, Set Shot Specialist, Limitless Range, Shifty Shooter, Ankle Assassin
  SF: Deadeye, Posterizer, Limitless Range, On-Ball Menace, Challenger
  PF: Posterizer, Rise Up, Rebound Chaser, Pogo Stick, Immovable Enforcer
  C: Pogo Stick, Rebound Chaser, Paint Patroller, Immovable Enforcer, Boxout Beast, Interceptor

BEST BUILDS BY POSITION:
  PG 6'2"–6'4": Shot Creator Guard — 90+ ball_handle, 85+ three_point, strong speed_with_ball
  SG 6'5"–6'6": Two-Way Shooting Guard — 90+ three_point, 75+ perimeter_defense, athletic
  SF 6'7"–6'9": Versatile Two-Way Wing — blend of three_point + driving_dunk + defense
  PF 6'10"–6'11": Mid-Post Point Forward — three_point + driving_dunk + interior_defense
  C  7'0"–7'3": Playmaking Cleaner Center — deep shooting, standing_dunk, strong rebounding + block

POSITION ATTRIBUTE PRIORITIES (what actually matters):
  PG: ball_handle > three_point > speed_with_ball > pass_accuracy > perimeter_defense
  SG: three_point > ball_handle > driving_dunk > perimeter_defense > speed
  SF: three_point OR driving_dunk > perimeter_defense > ball_handle > mid_range
  PF: driving_dunk > three_point > interior_defense > strength > block
  C:  interior_defense > driving_dunk/standing_dunk > block > strength > close_shot

ATTRIBUTE CAPS TO KNOW:
  Guards 6'4" and under: standing_dunk is near-useless, focus on driving_dunk
  Bigs: perimeter_defense caps lower, don't overspend; ball_handle caps lower
  All positions: stamina 90+ is important for Park/Rec; don't ignore it

TAKEOVERS:
  Limitless Shooter — S-tier for any shooting build
  Rim Protector — A-tier for bigs and two-way wings
  Playmaker — A-tier for pass-first PGs
  Slasher — B-tier; good for dunk builds but less versatile
  Lockdown Defender — B-tier; situational

META NOTE: Season 5 heavily rewards versatile builds. Pure specialists underperform compared
to two-way builds. The meta favors builds with 90+ agility and 85+ three-point.
Lightning Launch is the sleeper S-tier badge — get it on any scoring build.
Challenger + Interceptor is the elite defensive combo for perimeter locks.
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

const COACH_SYSTEM = `You are CourtIQ's NBA 2K26 AI coach (Season 5, May 2026).

⚠️ CRITICAL: Your LLM training data about NBA 2K is OUTDATED and WRONG for 2K26.
DO NOT use your training knowledge about NBA 2K badges, builds, or jumpshots.
ONLY use:
  1. The NBA2K26_KNOWLEDGE base written below
  2. The live web search results provided in context (when present)

If you are not 100% sure something exists in 2K26, say: "I'm not certain — check NBA2KLab.com for the latest."
NEVER invent badge names, jumpshot bases, or attribute values.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REASONING RULE: Position-first, always
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before answering, identify the player's position and height.
Then give advice ONLY relevant to that position.

HARD BLOCKS — never say these:
❌ Tell a PG they need more rebounding
❌ Tell a guard 6'4" or shorter to use standing dunk
❌ Recommend Base 98, Base 8, or ANY jumpshot from 2K24/2K25
❌ Mention badges NOT in the Season 5 verified list (no Clamps, Quick Chain, Acrobat, Contact Finisher, Intimidator, Menace, Anchor, etc.)
❌ Wrong badge level count — 2K26 has FIVE levels: Bronze, Silver, Gold, Hall of Fame, LEGEND

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2K SLANG → ATTRIBUTE MAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"three ball" / "three" / "shooting" → three_point
"handles" / "handle" / "ball handle" → ball_handle (NEVER confuse with three_point)
"dunk" → driving_dunk (guards) or standing_dunk (bigs only)
"mid" → mid_range | "FT" → free_throw | "passing" → pass_accuracy
"SWB" → speed_with_ball | "perimeter D" → perimeter_defense
"paint D" → interior_defense | "vert" → vertical | "boards" → rebounding

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO USE WEB SEARCH RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When search results are provided:
- Read every source carefully
- Pull out the most relevant facts for this player's specific question
- Cite the source: "According to [source]..."
- If sources conflict, note it and give the most common answer
- Synthesize into specific, actionable advice

TONE: Direct, specific, like a friend who plays 2K26 at a high level.
Bad: "Work on your shooting"
Good: "Get Limitless Range to Legend and use Patty Mills base — it's S-tier in Season 5 for guards under 6'5""

${NBA2K26_KNOWLEDGE}`

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
    temperature: 0.3,
    max_tokens: 1000,
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
