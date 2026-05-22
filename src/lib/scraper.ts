import { parse } from 'node-html-parser'
import Groq from 'groq-sdk'

let _groq: Groq | null = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
  return _groq
}

/* ── Types ────────────────────────────────────────────────────── */
export interface MetaEntry {
  name: string
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  category: 'build' | 'badge' | 'animation' | 'takeover'
  usage: number
  winRate: number
  trend: 'rising' | 'stable' | 'falling'
  description: string
  source?: string
}

export interface ScrapedMeta {
  builds: MetaEntry[]
  badges: MetaEntry[]
  animations: MetaEntry[]
  takeovers: MetaEntry[]
  patchNotes: string[]
  scrapedAt: string
  sources: string[]
}

/* ── Reddit scraper ───────────────────────────────────────────── */
async function fetchRedditPosts(subreddit: string, query?: string): Promise<{ title: string; body: string; score: number; url: string }[]> {
  const url = query
    ? `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=top&t=week&limit=25`
    : `https://www.reddit.com/r/${subreddit}/hot.json?limit=30`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'CourtIQ/1.0 (NBA 2K meta tracker)' },
    next: { revalidate: 3600 },
  })

  if (!res.ok) return []

  const data = await res.json()
  const posts = data?.data?.children || []

  return posts
    .filter((p: { data: { title: string; score: number } }) => p.data.score > 10)
    .map((p: { data: { title: string; selftext: string; score: number; url: string } }) => ({
      title: p.data.title,
      body: (p.data.selftext || '').slice(0, 800),
      score: p.data.score,
      url: `https://reddit.com${p.data.url}`,
    }))
}

/* ── 2kratings.com scraper ────────────────────────────────────── */
async function scrape2KRatings(): Promise<string> {
  try {
    const res = await fetch('https://www.2kratings.com/nba-2k26', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 7200 },
    })
    if (!res.ok) return ''
    const html = await res.text()
    const root = parse(html)
    // Extract player names and ratings from tables
    const rows = root.querySelectorAll('table tr').slice(0, 50)
    return rows.map(r => r.text.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n')
  } catch {
    return ''
  }
}

/* ── NBA2KLab scraper ─────────────────────────────────────────── */
async function scrapeNBA2KLab(): Promise<string> {
  try {
    const res = await fetch('https://nba2klab.com/session-data/shooting/greenpct', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CourtIQ/1.0)' },
      next: { revalidate: 7200 },
    })
    if (!res.ok) return ''
    const data = await res.json()
    return JSON.stringify(data).slice(0, 2000)
  } catch {
    return ''
  }
}

/* ── Collect all raw data ─────────────────────────────────────── */
async function gatherRawData(): Promise<{ sources: string[]; raw: string }> {
  const sources: string[] = []

  const [
    hotPosts,
    buildPosts,
    tierPosts,
    buildsPosts,
    ratingsText,
    labText,
  ] = await Promise.allSettled([
    fetchRedditPosts('NBA2k', 'meta build tier list 2k26'),
    fetchRedditPosts('NBA2k', 'best build 2k26 season'),
    fetchRedditPosts('NBA2k', 'tier list patch update'),
    fetchRedditPosts('NBA2kBuilds', ''),
    scrape2KRatings(),
    scrapeNBA2KLab(),
  ])

  const sections: string[] = []

  // Reddit NBA2k - meta posts
  if (hotPosts.status === 'fulfilled' && hotPosts.value.length > 0) {
    sources.push('Reddit r/NBA2k (hot posts)')
    const top = hotPosts.value.slice(0, 15)
    sections.push('=== REDDIT r/NBA2k META POSTS ===\n' +
      top.map(p => `[${p.score} upvotes] ${p.title}\n${p.body}`).join('\n---\n'))
  }

  // Reddit build posts
  if (buildPosts.status === 'fulfilled' && buildPosts.value.length > 0) {
    sources.push('Reddit r/NBA2k (best builds)')
    sections.push('=== REDDIT BUILD DISCUSSIONS ===\n' +
      buildPosts.value.slice(0, 10).map(p => `${p.title}\n${p.body}`).join('\n---\n'))
  }

  // Reddit tier posts
  if (tierPosts.status === 'fulfilled' && tierPosts.value.length > 0) {
    sections.push('=== REDDIT TIER LIST POSTS ===\n' +
      tierPosts.value.slice(0, 8).map(p => `${p.title}\n${p.body}`).join('\n---\n'))
  }

  // Reddit r/NBA2kBuilds
  if (buildsPosts.status === 'fulfilled' && buildsPosts.value.length > 0) {
    sources.push('Reddit r/NBA2kBuilds')
    sections.push('=== r/NBA2kBuilds POSTS ===\n' +
      buildsPosts.value.slice(0, 10).map(p => `${p.title}\n${p.body}`).join('\n---\n'))
  }

  // 2kratings
  if (ratingsText.status === 'fulfilled' && ratingsText.value) {
    sources.push('2kratings.com')
    sections.push('=== 2KRATINGS.COM DATA ===\n' + ratingsText.value.slice(0, 1500))
  }

  // NBA2KLab
  if (labText.status === 'fulfilled' && labText.value) {
    sources.push('NBA2KLab.com')
    sections.push('=== NBA2KLAB DATA ===\n' + labText.value)
  }

  return { sources, raw: sections.join('\n\n') }
}

/* ── Groq meta extraction ─────────────────────────────────────── */
async function extractMetaWithGroq(rawData: string): Promise<Omit<ScrapedMeta, 'scrapedAt' | 'sources'>> {
  const prompt = `You are analyzing scraped NBA 2K26 community data from Reddit, 2kratings, and NBA2KLab.
Extract the current meta information from this raw data and return it as structured JSON.

RAW SCRAPED DATA:
${rawData.slice(0, 12000)}

Return ONLY this exact JSON structure (no markdown, no explanation):
{
  "builds": [
    {
      "name": "build archetype name",
      "tier": "S",
      "category": "build",
      "usage": 35.5,
      "winRate": 61.2,
      "trend": "rising",
      "description": "why this build is good/bad in current meta"
    }
  ],
  "badges": [
    {
      "name": "badge name",
      "tier": "S",
      "category": "badge",
      "usage": 65.0,
      "winRate": 60.5,
      "trend": "stable",
      "description": "badge effectiveness in current meta"
    }
  ],
  "animations": [
    {
      "name": "animation name and type",
      "tier": "S",
      "category": "animation",
      "usage": 45.0,
      "winRate": 62.0,
      "trend": "rising",
      "description": "why this animation is used"
    }
  ],
  "takeovers": [
    {
      "name": "takeover name",
      "tier": "S",
      "category": "takeover",
      "usage": 38.0,
      "winRate": 63.0,
      "trend": "stable",
      "description": "takeover effectiveness"
    }
  ],
  "patchNotes": ["key meta change 1", "key meta change 2", "key meta change 3"]
}

CRITICAL RULES:
- Include at least 6 builds, 12 badges, 5 animations, 3 takeovers
- Do NOT duplicate badge names
- ONLY use badges from this VERIFIED 2K26 Season 7 badge list — DO NOT invent or use any other badge name:
  FINISHING: Aerial Wizard, Float Game, High-Flying Denier, Hook Specialist, Layup Mixmaster, Lightning Launch, Paint Prodigy, Physical Finisher, Post Fade Phenom, Post Powerhouse, Post Prodigy, Post Up Poet, Posterizer, Rise Up, Slippery Off-Ball
  SHOOTING: Deadeye, Limitless Range, Mini Marksman, Set Shot Specialist, Shifty Shooter
  PLAYMAKING: Ankle Assassin, Bail Out, Break Starter, Dimer, Handles for Days, Pick Dodger, Strong Handle, Unpluckable, Versatile Visionary
  DEFENSE: Boxout Beast, Brick Wall, Challenger, Glove, Immovable Enforcer, Interceptor, Off-Ball Pest, On-Ball Menace, Paint Patroller, Pogo Stick, Post Lockdown, Rebound Chaser
- DEPRECATED BADGES — NEVER USE THESE (they do not exist in 2K26): Clamps, Quick First Step, Green Machine, Catch & Shoot, Space Creator, Contact Finisher, Intimidator, Dream Shake, Hot Zone Hunter, Acrobat, Agent 3, Speed Booster, Blinders, Vice Grip, Floor General, Corner Specialist, Volume Shooter, Giant Slayer, Slithery, Tear Dropper, Bullet Passer, Anchor, Box, Chase Down Artist, Menace, Guard Up
- For animations, ONLY use verified 2K26 jumpshot bases: Patty Mills, Quinton Grimes, AJ Green, Paul George, Kevin Durant, Dirk Nowitzki (standing), Damian Lillard. DO NOT use "Base 6", "Base 8", "Base 98", or any 2K24/2K25 bases
- For dribble animations: Pro 3 (S-tier guards), Curry Package (guards 85+ ball handle), KD Package (wings), Pro 5 (guards/wings)
- usage is estimated % of players using it (0-100), winRate is win rate (48-65), trend is one of: rising, stable, falling
- If specific data is missing, estimate from Season 7 meta knowledge`

  const response = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a NBA 2K26 Season 7 meta analyst. Extract structured meta data and return valid JSON only. CRITICAL: Only use badges that exist in NBA 2K26 Season 7. NEVER use these deprecated badges that do not exist in 2K26: Clamps, Quick First Step, Green Machine, Catch & Shoot, Space Creator, Contact Finisher, Intimidator, Dream Shake, Hot Zone Hunter, Acrobat, Agent 3, Speed Booster, Blinders, Vice Grip, Floor General. For jumpshot bases, NEVER use Base 6, Base 8, Base 98 — use player names like Patty Mills, Quinton Grimes, Kevin Durant, Dirk Nowitzki.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content || '{}'
  const parsed = JSON.parse(content)

  return {
    builds: (parsed.builds || []).map((b: MetaEntry) => ({ ...b, category: 'build' as const })),
    badges: (parsed.badges || []).map((b: MetaEntry) => ({ ...b, category: 'badge' as const })),
    animations: (parsed.animations || []).map((b: MetaEntry) => ({ ...b, category: 'animation' as const })),
    takeovers: (parsed.takeovers || []).map((b: MetaEntry) => ({ ...b, category: 'takeover' as const })),
    patchNotes: parsed.patchNotes || [],
  }
}

/* ── In-memory cache ──────────────────────────────────────────── */
let _cache: ScrapedMeta | null = null
let _cacheTime = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/* ── Main export: get meta ────────────────────────────────────── */
export async function getScrapedMeta(forceRefresh = false): Promise<ScrapedMeta> {
  const now = Date.now()

  if (!forceRefresh && _cache && now - _cacheTime < CACHE_TTL) {
    return _cache
  }

  try {
    const { sources, raw } = await gatherRawData()

    if (!raw.trim()) {
      throw new Error('No data scraped')
    }

    const extracted = await extractMetaWithGroq(raw)

    _cache = {
      ...extracted,
      scrapedAt: new Date().toISOString(),
      sources,
    }
    _cacheTime = now
    return _cache
  } catch (err) {
    console.error('Scraper error:', err)
    // Return cached data if available even if stale, otherwise fallback
    if (_cache) return _cache
    return getFallbackMeta()
  }
}

/* ── Fallback data (if scraping fails) ───────────────────────── */
function getFallbackMeta(): ScrapedMeta {
  return {
    scrapedAt: new Date().toISOString(),
    sources: ['Static fallback'],
    patchNotes: [
      'Season 7: Small guard speed exploit (under 6\'2") fully patched — height-based builds now dominant',
      'Season 7: Lightning Launch emerged as the sleeper S-tier finishing badge this season',
      'Season 7: Challenger + Interceptor is the elite defensive combo replacing the old Clamps setup',
    ],
    builds: [
      { name: 'Glass Cleaner Finisher', tier: 'S', category: 'build', usage: 34, winRate: 62, trend: 'rising', description: 'Dominant rim presence. Go-to center build this season.' },
      { name: 'Shot Creator Guard', tier: 'S', category: 'build', usage: 29, winRate: 58, trend: 'stable', description: 'Versatile guard with elite shooting and handles.' },
      { name: 'Playmaking Shot Creator', tier: 'A', category: 'build', usage: 22, winRate: 55, trend: 'stable', description: 'Elite playmaker with solid shooting. Comp standard.' },
      { name: 'Two-Way Slashing Guard', tier: 'A', category: 'build', usage: 20, winRate: 55, trend: 'rising', description: 'Defense-first guard that still threatens offensively.' },
      { name: 'Stretch Big', tier: 'A', category: 'build', usage: 17, winRate: 53, trend: 'stable', description: 'Floor-spacing big that opens lanes for guards.' },
      { name: 'Pure Lock', tier: 'B', category: 'build', usage: 14, winRate: 51, trend: 'falling', description: 'Elite defender but limited offense in current meta.' },
    ],
    badges: [
      { name: 'Deadeye', tier: 'S', category: 'badge', usage: 71, winRate: 62, trend: 'rising', description: 'Eliminates penalty from contested shots. Essential for any scoring guard or wing.' },
      { name: 'Set Shot Specialist', tier: 'S', category: 'badge', usage: 65, winRate: 61, trend: 'stable', description: 'Dramatically boosts spot-up and catch-and-shoot efficiency. Meta-defining in Season 7.' },
      { name: 'Shifty Shooter', tier: 'S', category: 'badge', usage: 60, winRate: 60, trend: 'rising', description: 'Boosts shooting off movement and hesitations. Pairs perfectly with ball handle.' },
      { name: 'Dimer', tier: 'S', category: 'badge', usage: 58, winRate: 60, trend: 'stable', description: 'Boosts teammate shooting off your passes. Must-have for any playmaking guard or PF.' },
      { name: 'Lightning Launch', tier: 'S', category: 'badge', usage: 55, winRate: 61, trend: 'rising', description: 'The sleeper S-tier badge. Explosive drive initiation that blows past defenders.' },
      { name: 'Challenger', tier: 'S', category: 'badge', usage: 52, winRate: 60, trend: 'stable', description: 'Best perimeter defense badge in Season 7. Replaces Clamps as the lockdown standard.' },
      { name: 'Interceptor', tier: 'S', category: 'badge', usage: 50, winRate: 59, trend: 'rising', description: 'Off-ball steals and deflections. Dominant when paired with Challenger.' },
      { name: 'Pogo Stick', tier: 'S', category: 'badge', usage: 48, winRate: 60, trend: 'stable', description: 'Blocks shots and quickly recovers for the next contest. Best interior defense badge.' },
      { name: 'Rebound Chaser', tier: 'S', category: 'badge', usage: 45, winRate: 59, trend: 'stable', description: 'Elite pursuit of missed shots. Glass cleaner badge of the year in Season 7.' },
      { name: 'Limitless Range', tier: 'A', category: 'badge', usage: 62, winRate: 58, trend: 'stable', description: 'Extends shooting range to deep 3-point territory. Essential for floor spacers.' },
      { name: 'Posterizer', tier: 'A', category: 'badge', usage: 44, winRate: 57, trend: 'stable', description: 'Activates contact dunks at the rim. High-percentage finisher badge for slashers.' },
      { name: 'Strong Handle', tier: 'A', category: 'badge', usage: 52, winRate: 56, trend: 'stable', description: 'Ball security under pressure. Essential for any guard taking the ball coast to coast.' },
      { name: 'Handles for Days', tier: 'A', category: 'badge', usage: 46, winRate: 56, trend: 'rising', description: 'Unlocks advanced combo chains when maxed. Gate badge for elite dribble packages.' },
      { name: 'Pick Dodger', tier: 'A', category: 'badge', usage: 40, winRate: 56, trend: 'stable', description: 'Navigate through screens without losing your man. Elite off-ball defense badge.' },
      { name: 'On-Ball Menace', tier: 'A', category: 'badge', usage: 42, winRate: 55, trend: 'stable', description: 'Disrupts ball handler rhythm. Best on-ball pressure badge in current meta.' },
      { name: 'Immovable Enforcer', tier: 'A', category: 'badge', usage: 38, winRate: 55, trend: 'stable', description: 'Reduces charge and block foul calls going to the rim. Essential for rim protectors.' },
      { name: 'Rise Up', tier: 'A', category: 'badge', usage: 36, winRate: 56, trend: 'rising', description: 'Boosts standing dunk attempts and contact inside. Best big man finishing badge.' },
      { name: 'High-Flying Denier', tier: 'A', category: 'badge', usage: 34, winRate: 55, trend: 'stable', description: 'Blocks layups and dunks from behind. Rim protection from the perimeter.' },
      { name: 'Unpluckable', tier: 'B', category: 'badge', usage: 55, winRate: 53, trend: 'stable', description: 'Prevents steal attempts on dribble moves. Good for ball handlers in traffic.' },
      { name: 'Ankle Assassin', tier: 'B', category: 'badge', usage: 38, winRate: 53, trend: 'stable', description: 'Boosts ankle-breaking animations and step-back effectiveness.' },
      { name: 'Glove', tier: 'B', category: 'badge', usage: 30, winRate: 52, trend: 'stable', description: 'Increases steal success rate on on-ball pressure. Pairs with Interceptor.' },
      { name: 'Post Up Poet', tier: 'B', category: 'badge', usage: 22, winRate: 52, trend: 'stable', description: 'Boosts effectiveness of post moves and fakes. Niche but solid for post scorers.' },
    ],
    animations: [
      { name: 'Jumpshot: Patty Mills', tier: 'S', category: 'animation', usage: 62, winRate: 63, trend: 'rising', description: 'S-tier jumpshot base for guards 5\'9"–6\'4". Largest green window and fastest release at this height range.' },
      { name: 'Dribble Style: Pro 3', tier: 'S', category: 'animation', usage: 58, winRate: 61, trend: 'rising', description: 'Best dribble package for guards. Tightest crossover chains and fastest combo animations in Season 7.' },
      { name: 'Jumpshot: Quinton Grimes', tier: 'A', category: 'animation', usage: 42, winRate: 59, trend: 'stable', description: 'A-tier base for guards 5\'9"–6\'4". Easier timing than Patty Mills with a solid green window.' },
      { name: 'Jumpshot: Kevin Durant', tier: 'A', category: 'animation', usage: 38, winRate: 58, trend: 'stable', description: 'Best jumpshot base for wings and forwards 6\'5"–6\'9". Versatile and consistent at slower speeds.' },
      { name: 'Dribble Style: Curry Package', tier: 'A', category: 'animation', usage: 35, winRate: 58, trend: 'rising', description: 'Elite dribble package for guards with 85+ ball handle. Unlocks step-back and hesitation chains.' },
      { name: 'Jumpshot: Dirk Nowitzki (Standing)', tier: 'A', category: 'animation', usage: 28, winRate: 57, trend: 'stable', description: 'Top standing jumpshot base for bigs 6\'10"+. Prioritize green window over speed.' },
      { name: 'Dribble Style: KD Package', tier: 'A', category: 'animation', usage: 30, winRate: 56, trend: 'stable', description: 'Best dribble package for wings 6\'5"–6\'9". Long fluid animations built for length.' },
    ],
    takeovers: [
      { name: 'Limitless Shooter', tier: 'S', category: 'takeover', usage: 39, winRate: 63, trend: 'rising', description: 'Extends range dramatically. Pairs with any shooting build.' },
      { name: 'Rim Protector', tier: 'A', category: 'takeover', usage: 29, winRate: 58, trend: 'stable', description: 'Dominant at rim when activated. Essential for centers.' },
      { name: 'Floor General', tier: 'B', category: 'takeover', usage: 19, winRate: 52, trend: 'stable', description: 'Boosts teammates. Strong in Pro-Am and Rec.' },
    ],
  }
}
