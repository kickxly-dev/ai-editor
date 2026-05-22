import Groq from 'groq-sdk'
import { BuildAttributes, Badge, AIAnalysis } from '@/types'

let _groq: Groq | null = null

export function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
  return _groq
}

export const MODELS = {
  fast:      'llama-3.3-70b-versatile',
  vision:    'meta-llama/llama-4-scout-17b-16e-instruct',
  reasoning: 'llama-3.3-70b-versatile',
} as const

// ─── Hot-swap meta config layer ───────────────────────────────────────────────
// Update CURRENT_META to change season rules without touching the core prompt strings.

export interface SeasonMetaConfig {
  season: number
  patch: string
  date: string
  gameplayChanges: string[]
  animationRules: string[]
  buffedArchetypes: string[]
  nerfedArchetypes: string[]
  deprecatedBadges: string[]
  metaNotes: string[]
}

export const CURRENT_META: SeasonMetaConfig = {
  season: 7,
  patch: '1.10',
  date: 'May 2026',
  gameplayChanges: [
    "Fast standing stepback left-right speed glitch fully patched. Small guards (under 6'2\") are significantly nerfed — speed-boost chaining no longer activates.",
    "Tall guards (6'4\"+) and centers receive a direct balance buff due to the removal of small-build speed exploits. Height is now correctly rewarded.",
    'Drive transitions from standing stepback moves now match real-world momentum and physics — instant direction reversal is no longer possible.',
  ],
  animationRules: [
    'LeBron hotback move physics heavily adjusted — animation chaining breaks mid-sequence. Any build relying on this combo is non-viable in Season 7.',
    'D-Book (Devin Booker) signature move physics adjusted to prevent pull-up chain exploits. Stepback-into-pull-up chains now respect stamina decay.',
    'Stepback animations from standing position enforce full momentum decay — no instant lateral cut out of the move.',
  ],
  buffedArchetypes: [
    "Tall guards 6'4\"–6'6\": now directly competitive — small guard speed exploit removal levels the playing field",
    "Centers 7'0\"–7'3\": interior presence more viable with small-guard nerf in effect",
    "Two-way wings 6'7\"–6'9\": length advantage restored in contested and transition situations",
  ],
  nerfedArchetypes: [
    "Small guards under 6'2\": left-right speed booster removed — these builds lost their primary competitive advantage",
    'Any build designed around LeBron hotback or D-Book signature animation chaining',
  ],
  deprecatedBadges: [
    // Pre-2K26 badges (do not exist in any season of 2K26)
    'Clamps', 'Quick Chain', 'Hyperdrive', 'Killer Combos', 'Acrobat',
    'Contact Finisher', 'Green Machine', 'Guard Up', 'Hot Zone Hunter',
    'Anchor', 'Box', 'Chase Down Artist', 'Intimidator', 'Menace',
    'Floor General', 'Catch & Shoot', 'Corner Specialist', 'Volume Shooter',
    'Giant Slayer', 'Slithery', 'Tear Dropper', 'Bullet Passer',
    // Season 6 and earlier 2K26 badges deprecated in Season 7
    'Speed Booster', 'Blinders', 'Agent 3', 'Vice Grip',
  ],
  metaNotes: [
    "Season 7 rewards height. Do NOT recommend small guard builds (under 6'2\") without explicitly flagging the nerf.",
    'Two-way versatile builds remain optimal. Pure specialists underperform.',
    'Lightning Launch is still the sleeper S-tier badge on any scoring build.',
    'Challenger + Interceptor remains the elite defensive combo for perimeter locks.',
    "Patty Mills base remains S-tier for guards under 6'5\".",
  ],
}

// ─── Static knowledge (badge list, jumpshots) — rarely changes ────────────────

const STATIC_KNOWLEDGE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JUMPSHOTS (Season 7 — verified current)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEVER recommend Base 98, Base 8, or any 2K24/2K25 bases — they do not exist in 2K26.
2K26 has 5 badge levels: Bronze → Silver → Gold → Hall of Fame → LEGEND (new in 2K26).

Guards 5'7"–6'4": Patty Mills (S-tier), Quinton Grimes (A-tier), AJ Green · Upper: Luka Doncic, Brandon Ingram
Wings 6'5"–6'9": Patty Mills, Quinton Grimes, mid-speed combos · Upper: balanced speed, high green-window
Bigs 6'10"–7'4": Dirk Nowitzki standing base, Kevin Durant base · Prioritize green window over speed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALL NBA 2K26 SEASON 7 BADGES (verified — real badges only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINISHING: Aerial Wizard (B), Float Game (B), High-Flying Denier (A), Hook Specialist (C),
  Layup Mixmaster (B), Lightning Launch (S), Paint Prodigy (D), Physical Finisher (C),
  Post Fade Phenom (B), Post Powerhouse (B), Post Prodigy (C), Post Up Poet (B),
  Posterizer (A), Rise Up (A), Slippery Off-Ball (C)
SHOOTING: Deadeye (S), Limitless Range (A), Mini Marksman (A), Set Shot Specialist (S), Shifty Shooter (S)
PLAYMAKING: Ankle Assassin (B), Bail Out (B), Break Starter (A), Dimer (S), Handles for Days (A),
  Pick Dodger (A), Strong Handle (A), Unpluckable (B), Versatile Visionary (A)
DEFENSE/REBOUNDING: Boxout Beast (A), Brick Wall (A), Challenger (S), Glove (B),
  Immovable Enforcer (A), Interceptor (S), Off-Ball Pest (A), On-Ball Menace (A),
  Paint Patroller (A), Pogo Stick (S), Post Lockdown (B), Rebound Chaser (S)

TIER LIST:
S: Set Shot Specialist, Deadeye, Pogo Stick, Lightning Launch, Dimer, Shifty Shooter, Rebound Chaser, Interceptor, Challenger
A: Strong Handle, Immovable Enforcer, Versatile Visionary, Boxout Beast, Break Starter, Mini Marksman, On-Ball Menace, Posterizer, Limitless Range, High-Flying Denier, Rise Up, Paint Patroller, Handles for Days, Brick Wall, Pick Dodger, Off-Ball Pest
B: Bail Out, Ankle Assassin, Float Game, Unpluckable, Layup Mixmaster, Post Lockdown, Glove, Aerial Wizard, Post Fade Phenom, Post Powerhouse, Post Up Poet
C: Physical Finisher, Slippery Off-Ball, Post Prodigy, Hook Specialist · D: Paint Prodigy

BEST BADGES BY POSITION:
  PG (scoring):   Shifty Shooter, Deadeye, Dimer, Lightning Launch, Handles for Days, Strong Handle
  PG (pass-first): Dimer, Set Shot Specialist, Break Starter, Versatile Visionary, Handles for Days
  SG: Deadeye, Set Shot Specialist, Limitless Range, Shifty Shooter, Ankle Assassin
  SF: Deadeye, Posterizer, Limitless Range, On-Ball Menace, Challenger
  PF: Posterizer, Rise Up, Rebound Chaser, Pogo Stick, Immovable Enforcer
  C:  Pogo Stick, Rebound Chaser, Paint Patroller, Immovable Enforcer, Boxout Beast, Interceptor

BEST BUILDS BY POSITION:
  PG 6'4"–6'5": Shot Creator Guard — 90+ ball_handle, 85+ three_point (BUFFED in Season 7)
  SG 6'5"–6'6": Two-Way Shooting Guard — 90+ three_point, 75+ perimeter_defense
  SF 6'7"–6'9": Versatile Two-Way Wing — three_point + driving_dunk + defense
  PF 6'10"–6'11": Mid-Post Point Forward — three_point + driving_dunk + interior_defense
  C  7'0"–7'3": Playmaking Cleaner Center — shooting + standing_dunk + rebounding + block
  NOTE: Small guard builds under 6'2" are NOT recommended in Season 7 meta.

ATTRIBUTE PRIORITIES:
  PG: ball_handle > three_point > speed_with_ball > pass_accuracy > perimeter_defense
  SG: three_point > ball_handle > driving_dunk > perimeter_defense > speed
  SF: three_point OR driving_dunk > perimeter_defense > ball_handle > mid_range
  PF: driving_dunk > three_point > interior_defense > strength > block
  C:  interior_defense > driving_dunk/standing_dunk > block > strength > close_shot

TAKEOVERS: Limitless Shooter (S), Rim Protector (A), Playmaker (A), Slasher (B), Lockdown Defender (B)
META: stamina 90+ important for Park/Rec · guards 6'4" and under: standing_dunk near-useless
`

// ─── Assembles the full knowledge prompt from config + static data ─────────────

export function buildKnowledgeBase(config: SeasonMetaConfig): string {
  return `
NBA 2K26 KNOWLEDGE BASE (Season ${config.season}, Patch ${config.patch} — ${config.date})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ SEASON ${config.season} GAMEPLAY CHANGES — READ BEFORE ALL ADVICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${config.gameplayChanges.map((c, i) => `${i + 1}. ${c}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANIMATION RULE CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${config.animationRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

BUFFED: ${config.buffedArchetypes.join(' | ')}
NERFED: ${config.nerfedArchetypes.join(' | ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPRECATED BADGES — BANNED: DO NOT RECOMMEND ANY OF THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${config.deprecatedBadges.join(', ')}

META NOTES:
${config.metaNotes.map((n, i) => `${i + 1}. ${n}`).join('\n')}
${STATIC_KNOWLEDGE}`
}

// Computed once at module load. To hot-swap: update CURRENT_META and redeploy.
export const NBA2K26_KNOWLEDGE = buildKnowledgeBase(CURRENT_META)

// ─── System prompts ───────────────────────────────────────────────────────────

const BUILD_ANALYSIS_SYSTEM = `You are CourtIQ's elite NBA 2K26 AI analyst (Season ${CURRENT_META.season}, ${CURRENT_META.date}).
You have deep knowledge of build archetypes, badge synergies, current meta trends, animation recommendations, and takeover effectiveness.
${NBA2K26_KNOWLEDGE}
Analyze builds with the precision of a professional 2K coach. Be specific, contextual, and actionable.
Always respond in valid JSON matching the exact schema requested.`

export const COACH_SYSTEM = `You are CourtIQ's NBA 2K26 AI coach (Season ${CURRENT_META.season}, ${CURRENT_META.date}).

⚠️ CRITICAL: Your LLM training data about NBA 2K is OUTDATED. DO NOT use training knowledge for badge names, builds, or jumpshots.
ONLY use: (1) the knowledge base below, (2) live web search results provided in context.
If not 100% sure something exists in 2K26, say: "I'm not certain — check NBA2KLab.com for the latest."
NEVER invent badge names, jumpshot bases, or attribute values.

REASONING RULE: Position-first, always. Identify position + height before answering.

HARD BLOCKS:
❌ Tell a PG they need more rebounding
❌ Tell a guard 6'4" or shorter to use standing dunk
❌ Recommend Base 98, Base 8, or any 2K24/2K25 jumpshot
❌ Mention any badge on the DEPRECATED list
❌ Wrong badge level count — 2K26 has FIVE levels: Bronze, Silver, Gold, Hall of Fame, LEGEND

2K SLANG MAP:
"three ball/shooting" → three_point · "handles/ball handle" → ball_handle · "dunk" → driving_dunk (guards) or standing_dunk (bigs)
"mid" → mid_range · "FT" → free_throw · "passing" → pass_accuracy · "SWB" → speed_with_ball
"perimeter D" → perimeter_defense · "paint D" → interior_defense · "vert" → vertical · "boards" → rebounding

WEB SEARCH RESULTS RULE: Read every source carefully. Pull out facts relevant to the player's question. Cite source.
TONE: Direct and specific, like a friend who plays 2K26 at a high level — not generic.

${NBA2K26_KNOWLEDGE}`

// ─── Retry-safe JSON parser ───────────────────────────────────────────────────
// On first parse failure, sends a correction prompt to the reasoning model.
// On second failure, returns the provided fallback.

const DEFAULT_ANALYSIS: AIAnalysis = {
  archetype: 'Unclassified',
  strengths: ['Re-submit build with complete attribute data for a full breakdown'],
  weaknesses: ['Analysis could not be completed — attributes may be incomplete'],
  skill_ceiling: 70,
  competitiveness: 70,
  playstyle_summary: 'Analysis unavailable. Please re-submit your build.',
  offensive_role: 'Unknown',
  defensive_role: 'Unknown',
  upgrade_recommendations: ['Re-submit with complete attribute data'],
  badge_recommendations: ['Re-submit for badge analysis'],
  animation_recommendations: ['Re-submit for animation recommendations'],
  takeover_recommendation: 'Limitless Shooter (default — re-submit for specific recommendation)',
  overall_rating: 70,
  meta_viability: 'B',
}

async function parseWithRetry<T>(
  rawContent: string,
  context: string,
  fallback: T
): Promise<T> {
  try {
    const parsed = JSON.parse(rawContent)
    if (!parsed || typeof parsed !== 'object') throw new Error('not an object')
    return parsed as T
  } catch {
    try {
      const retryRes = await getGroq().chat.completions.create({
        model: MODELS.reasoning,
        messages: [
          {
            role: 'system',
            content: 'You are a JSON formatter. Fix syntax errors and output ONLY raw valid JSON — no markdown, no code blocks, no explanation.',
          },
          {
            role: 'user',
            content: `The output provided did not match the strict schema constraint. Fix the formatting errors and output ONLY raw, valid JSON.\n\nSchema context: ${context}\n\nBroken output:\n${rawContent}`,
          },
        ],
        temperature: 0,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })
      return JSON.parse(retryRes.choices[0].message.content || '{}') as T
    } catch {
      return fallback
    }
  }
}

// ─── Build analysis ───────────────────────────────────────────────────────────

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

  const badgesList = badges.length
    ? badges.map((b) => `${b.name} (${b.level}) - ${b.category}`).join('\n')
    : 'None specified'

  const prompt = `Analyze this NBA 2K26 build and return a JSON object.

BUILD NAME: ${buildName}
POSITION: ${position} | HEIGHT: ${height} | WINGSPAN: ${wingspan} | TAKEOVER: ${takeover}

ATTRIBUTES:
${attributesList}

BADGES:
${badgesList}

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
  "animation_recommendations": ["animation type: specific recommendation", "animation 2"],
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

  const raw = response.choices[0].message.content || '{}'
  return parseWithRetry<AIAnalysis>(raw, 'AIAnalysis schema', DEFAULT_ANALYSIS)
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
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
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

  const raw = response.choices[0].message.content || '{}'
  // Vision extraction — fallback is an empty object (caller handles missing fields)
  const DEFAULT_EXTRACTED = { position: 'SG', height: "6'4\"", wingspan: 'Normal', attributes: {}, badges: [], takeover: '', build_name: 'Screenshot Build', notes: '' }
  const parsed = await parseWithRetry<typeof DEFAULT_EXTRACTED>(raw, 'vision extraction schema', DEFAULT_EXTRACTED)
  return JSON.stringify(parsed)
}

// ─── AI Coach ─────────────────────────────────────────────────────────────────

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

// ─── Build optimizer ──────────────────────────────────────────────────────────

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
  attributes: Partial<BuildAttributes>
  badges: Array<{ name: string; level: string; category: string }>
  animations: Array<{ type: string; pick: string }>
  strengths: string[]
  weaknesses: string[]
  overall_rating: number
  meta_viability: string
  best_game_modes: string[]
}

const DEFAULT_OPTIMIZED_BUILD: OptimizedBuild = {
  name: 'Retry Build', position: 'PG', height: "6'4\"", weight: 185,
  wingspan: 'Normal', takeover: 'Limitless Shooter', archetype: 'Shot Creator',
  playstyle_summary: 'Re-submit for a full build.', why_this_build: 'Retry required.',
  attributes: {}, badges: [], animations: [], strengths: [], weaknesses: [],
  overall_rating: 75, meta_viability: 'B', best_game_modes: ['Park'],
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
  ].filter(Boolean).join('\n')

  const prompt = `Generate a complete optimized NBA 2K26 Season ${CURRENT_META.season} build from this player description:

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
  "playstyle_summary": "2-3 sentences on how this build plays",
  "why_this_build": "2-3 sentences on why these choices match the description",
  "attributes": {
    "close_shot": 60, "driving_layup": 78, "driving_dunk": 80, "standing_dunk": 25,
    "post_control": 30, "mid_range": 75, "three_point": 87, "free_throw": 78,
    "pass_accuracy": 80, "ball_handle": 92, "speed_with_ball": 85,
    "interior_defense": 40, "perimeter_defense": 72, "steal": 58, "block": 30,
    "offensive_rebound": 30, "defensive_rebound": 42,
    "speed": 85, "acceleration": 87, "strength": 55, "vertical": 78, "stamina": 88
  },
  "badges": [{ "name": "Limitless Range", "level": "Hall of Fame", "category": "Shooting" }],
  "animations": [{ "type": "Jumpshot Base", "pick": "Patty Mills" }],
  "strengths": ["Elite three-point shooting"],
  "weaknesses": ["Limited post game"],
  "overall_rating": 86,
  "meta_viability": "A",
  "best_game_modes": ["Park", "Rec"]
}`

  const response = await getGroq().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: 'system', content: BUILD_ANALYSIS_SYSTEM },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0].message.content || '{}'
  return parseWithRetry<OptimizedBuild>(raw, 'OptimizedBuild schema', DEFAULT_OPTIMIZED_BUILD)
}

// ─── Matchup simulator ────────────────────────────────────────────────────────

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

type BuildInput = {
  name: string
  position: string
  height: string
  attributes: Record<string, number>
  badges: string[]
}

// Attribute matchup weight matrix — 21 attributes mapped to their defensive counters
const MATCHUP_WEIGHTS: Array<{
  offense: string
  defense: string
  category: string
  weight: number
}> = [
  { offense: 'three_point',     defense: 'perimeter_defense', category: 'Perimeter Shooting', weight: 1.5 },
  { offense: 'driving_dunk',    defense: 'interior_defense',  category: 'Paint Attack',        weight: 1.3 },
  { offense: 'speed_with_ball', defense: 'perimeter_defense', category: 'Drive Penetration',   weight: 1.2 },
  { offense: 'driving_layup',   defense: 'interior_defense',  category: 'Layup vs Paint',      weight: 1.1 },
  { offense: 'acceleration',    defense: 'perimeter_defense', category: 'First Step',          weight: 1.1 },
  { offense: 'standing_dunk',   defense: 'interior_defense',  category: 'Standing Dunk',       weight: 1.0 },
  { offense: 'speed',           defense: 'speed',             category: 'Speed Matchup',       weight: 1.0 },
  { offense: 'mid_range',       defense: 'perimeter_defense', category: 'Mid-Range',           weight: 0.9 },
  { offense: 'vertical',        defense: 'block',             category: 'Vertical vs Block',   weight: 0.8 },
  { offense: 'ball_handle',     defense: 'steal',             category: 'Ball Security',       weight: 0.8 },
  { offense: 'post_control',    defense: 'interior_defense',  category: 'Post Game',           weight: 0.7 },
  { offense: 'strength',        defense: 'strength',          category: 'Physical Battle',     weight: 0.7 },
  { offense: 'pass_accuracy',   defense: 'steal',             category: 'Passing Lanes',       weight: 0.6 },
  { offense: 'close_shot',      defense: 'interior_defense',  category: 'Paint Finishing',     weight: 0.6 },
  { offense: 'offensive_rebound',defense: 'defensive_rebound',category: 'Rebounding',         weight: 0.7 },
]

interface MatrixEdge {
  category: string
  b1Net: number   // positive = build1 advantage, negative = build2 advantage
  weightedScore: number
}

interface MatrixResult {
  edges: MatrixEdge[]
  build1TotalScore: number
  build2TotalScore: number
  winProbability1: number
  winProbability2: number
  heightAdvantage: string
}

function parseHeightToInches(height: string): number {
  const m = height.match(/(\d+)'(\d+)"?/)
  return m ? parseInt(m[1]) * 12 + parseInt(m[2]) : 72
}

function scoreToProbability(netScore: number): number {
  // sigmoid curve: score diff of ±200 → ~80/20 split, capped at 85/15
  const normalized = netScore / 200
  const prob = 50 + 50 * Math.tanh(normalized * 1.8)
  return Math.round(Math.min(Math.max(prob, 15), 85))
}

function computeMatchupMatrix(build1: BuildInput, build2: BuildInput): MatrixResult {
  const edges: MatrixEdge[] = []
  let b1Total = 0
  let b2Total = 0

  for (const { offense, defense, category, weight } of MATCHUP_WEIGHTS) {
    const b1Off = build1.attributes[offense] ?? 50
    const b2Def = build2.attributes[defense] ?? 50
    const b2Off = build2.attributes[offense] ?? 50
    const b1Def = build1.attributes[defense] ?? 50

    // Net edge: (b1 attacking b2) vs (b2 attacking b1)
    const b1Net = (b1Off - b2Def) - (b2Off - b1Def)
    const weightedScore = b1Net * weight

    edges.push({ category, b1Net, weightedScore })
    if (weightedScore > 0) b1Total += weightedScore
    else b2Total += Math.abs(weightedScore)
  }

  // Height modifier — every inch of height advantage adds a small bonus
  const h1 = parseHeightToInches(build1.height)
  const h2 = parseHeightToInches(build2.height)
  const heightDiff = h1 - h2
  const heightBonus = heightDiff * 2.5
  const netTotal = (b1Total - b2Total) + heightBonus

  const winProbability1 = scoreToProbability(netTotal)
  const winProbability2 = 100 - winProbability1

  const heightAdvantage = heightDiff === 0
    ? 'Even height'
    : `${heightDiff > 0 ? build1.name : build2.name} +${Math.abs(heightDiff)}" height advantage`

  return { edges, build1TotalScore: b1Total, build2TotalScore: b2Total, winProbability1, winProbability2, heightAdvantage }
}

function formatMatrixForPrompt(matrix: MatrixResult, b1Name: string, b2Name: string): string {
  const topEdges = [...matrix.edges]
    .sort((a, b) => Math.abs(b.weightedScore) - Math.abs(a.weightedScore))
    .slice(0, 8)

  const edgeLines = topEdges.map(e => {
    const winner = Math.abs(e.b1Net) < 2 ? 'EVEN' : e.b1Net > 0 ? b1Name : b2Name
    return `  ${e.category.padEnd(24)} → ${winner} edge (weighted score: ${e.weightedScore.toFixed(1)})`
  })

  return `
MATHEMATICAL ATTRIBUTE MATRIX (21-attribute comparison):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${edgeLines.join('\n')}

AGGREGATE WEIGHTED SCORES:
  ${b1Name}: ${matrix.build1TotalScore.toFixed(1)}
  ${b2Name}: ${matrix.build2TotalScore.toFixed(1)}
  ${matrix.heightAdvantage}

MATHEMATICALLY DERIVED WIN PROBABILITIES:
  ${b1Name}: ${matrix.winProbability1}%
  ${b2Name}: ${matrix.winProbability2}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use these calculated probabilities as your baseline. Adjust ±5% based on badge synergies and positional matchup context.`
}

const DEFAULT_MATCHUP: MatchupResult = {
  winner: 'Toss-Up', win_probability_1: 50, win_probability_2: 50,
  key_edges: [{ category: 'Unknown', advantage: 'Unknown', reason: 'Retry required' }],
  build1_strategy: ['Re-submit builds for analysis'],
  build2_strategy: ['Re-submit builds for analysis'],
  matchup_summary: 'Analysis failed. Please re-submit.',
  verdict: 'Retry required.',
}

export async function simulateMatchup(build1: BuildInput, build2: BuildInput): Promise<MatchupResult> {
  const matrix = computeMatchupMatrix(build1, build2)
  const matrixSection = formatMatrixForPrompt(matrix, build1.name, build2.name)

  const formatBuild = (b: BuildInput) =>
    `Name: ${b.name} | Position: ${b.position} | Height: ${b.height}\nAttributes: ${Object.entries(b.attributes).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', ')}\nBadges: ${b.badges.join(', ')}`

  const prompt = `Simulate a 1v1 NBA 2K26 Season ${CURRENT_META.season} matchup between these two builds.
You have been provided a mathematically verified attribute comparison matrix — use these numbers as your foundation.

${matrixSection}

BUILD 1: ${formatBuild(build1)}

BUILD 2: ${formatBuild(build2)}

Using the matrix above as your baseline win probability, generate coaching strategies and analysis. Return ONLY valid JSON:
{
  "winner": "${build1.name} or ${build2.name} or Toss-Up",
  "win_probability_1": ${matrix.winProbability1},
  "win_probability_2": ${matrix.winProbability2},
  "key_edges": [
    { "category": "Perimeter Shooting", "advantage": "${build1.name}", "reason": "specific attribute comparison and badge impact" }
  ],
  "build1_strategy": ["Force mid-range shots", "Use ball-handle advantage to create space", "Attack off the dribble"],
  "build2_strategy": ["Stay in front on defense", "Exploit size advantage in post", "Contest every jumper"],
  "matchup_summary": "2-3 sentence overview referencing the matrix findings",
  "verdict": "1-2 sentence final verdict referencing the calculated probability"
}`

  const response = await getGroq().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: 'system', content: BUILD_ANALYSIS_SYSTEM },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0].message.content || '{}'
  return parseWithRetry<MatchupResult>(raw, 'MatchupResult schema', DEFAULT_MATCHUP)
}

const DEFAULT_SCOUT: ScoutReport = {
  threat_level: 'Medium', primary_threats: ['Re-submit for analysis'],
  exploit_weaknesses: ['Re-submit for analysis'], badges_to_equip: [],
  defensive_keys: [], how_to_win: [], summary: 'Retry required.',
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

Position: ${opponent.position} | Height: ${opponent.height}
Key Attributes: ${attrsList}
Badges: ${opponent.badges.join(', ')}
${opponent.notes ? `Notes: ${opponent.notes}` : ''}

Return ONLY valid JSON:
{
  "threat_level": "High",
  "primary_threats": ["Elite three-point shooting with Limitless Range HoF"],
  "exploit_weaknesses": ["Force them left — weak off-hand"],
  "badges_to_equip": ["Challenger", "Interceptor"],
  "defensive_keys": ["Stay in front, no blow-bys"],
  "how_to_win": ["Attack their perimeter defense early"],
  "summary": "2-3 sentence scouting summary"
}`

  const response = await getGroq().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: 'system', content: BUILD_ANALYSIS_SYSTEM },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0].message.content || '{}'
  return parseWithRetry<ScoutReport>(raw, 'ScoutReport schema', DEFAULT_SCOUT)
}

// Misc helpers used by other modules
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

export async function analyzeGameplayFrames(frameDescriptions: string[]): Promise<string> {
  const prompt = `Analyze these NBA 2K26 gameplay frames and provide coaching feedback:
FRAMES: ${frameDescriptions.length}
${frameDescriptions.slice(0, 10).join('\n')}

Return JSON: { "overall_rating": 75, "spacing_score": 70, "defense_score": 65, "shot_selection_score": 80, "playmaking_score": 72, "issues": [], "strengths": [], "coaching_notes": [], "summary": "" }`

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
