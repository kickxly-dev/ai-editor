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
  FINISHING: Aerial Wizard, Float Game, Hook Specialist, Layup Mixmaster, Paint Prodigy, Physical Finisher, Post Fade Phenom, Post Powerhouse, Post Up Poet, Posterizer, Rise Up
  SHOOTING: Deadeye, Limitless Range, Mini Marksman, Set Shot Specialist, Shifty Shooter
  PLAYMAKING: Ankle Assassin, Bail Out, Break Starter, Dimer, Handles for Days, Lightning Launch, Strong Handle, Unpluckable, Versatile Visionary
  DEFENSE: Challenger, Glove, High-Flying Denier, Immovable Enforcer, Interceptor, Off-Ball Pest, On-Ball Menace, Paint Patroller, Pick Dodger, Post Lockdown
  REBOUNDING: Boxout Beast, Rebound Chaser
  ALL-AROUND: Brick Wall, Pogo Stick, Slippery Off-Ball
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
        content: 'You are a NBA 2K26 Season 7 meta analyst. Extract structured meta data and return valid JSON only. CRITICAL: Only use badges that exist in NBA 2K26 Season 7. Verified badge categories — FINISHING: Aerial Wizard, Float Game, Hook Specialist, Layup Mixmaster, Paint Prodigy, Physical Finisher, Post Fade Phenom, Post Powerhouse, Post Up Poet, Posterizer, Rise Up. SHOOTING: Deadeye, Limitless Range, Mini Marksman, Set Shot Specialist, Shifty Shooter. PLAYMAKING: Ankle Assassin, Bail Out, Break Starter, Dimer, Handles for Days, Lightning Launch, Strong Handle, Unpluckable, Versatile Visionary. DEFENSE: Challenger, Glove, High-Flying Denier, Immovable Enforcer, Interceptor, Off-Ball Pest, On-Ball Menace, Paint Patroller, Pick Dodger, Post Lockdown. REBOUNDING: Boxout Beast, Rebound Chaser. ALL-AROUND: Brick Wall, Pogo Stick, Slippery Off-Ball. Tier order: S=Unpluckable,Lightning Launch,Deadeye,Pogo Stick,Posterizer,Shifty Shooter,Interceptor,Set Shot Specialist,Float Game,Immovable Enforcer,Rebound Chaser,Strong Handle,Paint Patroller,Handles for Days,Challenger. NEVER use: Clamps, Quick First Step, Green Machine, Catch & Shoot, Space Creator, Contact Finisher, Intimidator, Dream Shake, Hot Zone Hunter, Acrobat, Agent 3, Speed Booster, Post Prodigy, Lightning Launch under Finishing. For jumpshot bases, NEVER use Base 6, Base 8, Base 98 — use player names like Patty Mills, Quinton Grimes, Kevin Durant, Dirk Nowitzki.',
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
      // S tier
      { name: 'Unpluckable', tier: 'S', category: 'badge', usage: 72, winRate: 63, trend: 'rising', description: '#1 dribble protection badge in Season 7. Prevents steals on all dribble moves. Must-have for any ball handler.' },
      { name: 'Lightning Launch', tier: 'S', category: 'badge', usage: 68, winRate: 62, trend: 'rising', description: 'Explosive first-step burst on drive initiation. Best playmaking badge in Season 7 for guards and wings.' },
      { name: 'Deadeye', tier: 'S', category: 'badge', usage: 71, winRate: 62, trend: 'stable', description: 'Eliminates penalty from contested shots. Essential for any scoring guard or wing.' },
      { name: 'Pogo Stick', tier: 'S', category: 'badge', usage: 60, winRate: 62, trend: 'stable', description: 'Blocks shots and immediately recovers for the next contest. Best interior defense badge in the game.' },
      { name: 'Posterizer', tier: 'S', category: 'badge', usage: 55, winRate: 61, trend: 'rising', description: 'Activates contact dunks at the rim. S-tier for slashers — high-percentage finisher in traffic.' },
      { name: 'Shifty Shooter', tier: 'S', category: 'badge', usage: 60, winRate: 61, trend: 'rising', description: 'Boosts shooting off movement and hesitations. Pairs perfectly with Lightning Launch.' },
      { name: 'Interceptor', tier: 'S', category: 'badge', usage: 50, winRate: 61, trend: 'rising', description: 'Off-ball steals and deflections. Dominant when paired with Challenger. Core defensive combo.' },
      { name: 'Set Shot Specialist', tier: 'S', category: 'badge', usage: 65, winRate: 61, trend: 'stable', description: 'Dramatically boosts spot-up and catch-and-shoot efficiency. Meta-defining in Season 7.' },
      { name: 'Float Game', tier: 'S', category: 'badge', usage: 52, winRate: 61, trend: 'rising', description: 'Boosts floaters in the paint and mid-range teardrops. S-tier finisher badge for guards attacking the rim.' },
      { name: 'Immovable Enforcer', tier: 'S', category: 'badge', usage: 48, winRate: 60, trend: 'stable', description: 'Reduces charge and block foul calls. S-tier for bigs and rim protectors in the paint.' },
      { name: 'Rebound Chaser', tier: 'S', category: 'badge', usage: 45, winRate: 60, trend: 'stable', description: 'Elite pursuit of missed shots. Best rebounding badge in Season 7 — essential for glass cleaners.' },
      { name: 'Strong Handle', tier: 'S', category: 'badge', usage: 58, winRate: 60, trend: 'stable', description: 'Ball security under intense pressure. S-tier for guards — prevents fumbles on coast-to-coast drives.' },
      { name: 'Paint Patroller', tier: 'S', category: 'badge', usage: 44, winRate: 60, trend: 'stable', description: 'Boosts shot contests and blocks inside the paint. S-tier defensive badge for shot-blocking bigs.' },
      { name: 'Handles for Days', tier: 'S', category: 'badge', usage: 50, winRate: 60, trend: 'rising', description: 'Unlocks advanced dribble combo chains when maxed. Gate badge for elite dribble packages in Season 7.' },
      { name: 'Challenger', tier: 'S', category: 'badge', usage: 52, winRate: 60, trend: 'stable', description: 'Best perimeter defense badge in Season 7. Replaces Clamps as the lockdown standard for guards.' },
      // A tier
      { name: 'On-Ball Menace', tier: 'A', category: 'badge', usage: 42, winRate: 58, trend: 'stable', description: 'Disrupts ball handler rhythm on defense. Best on-ball pressure badge in the current meta.' },
      { name: 'Rise Up', tier: 'A', category: 'badge', usage: 40, winRate: 57, trend: 'rising', description: 'Boosts standing dunk attempts and contact inside. Best big man finishing badge for powerful forwards.' },
      { name: 'Boxout Beast', tier: 'A', category: 'badge', usage: 38, winRate: 57, trend: 'stable', description: 'Dominant boxing out on both ends. A-tier rebounding badge, especially strong for undersized bigs.' },
      { name: 'Break Starter', tier: 'A', category: 'badge', usage: 35, winRate: 57, trend: 'rising', description: 'Boosts outlet passes and transition speed after rebounds. A-tier for playmaking bigs and wings.' },
      { name: 'Post Lockdown', tier: 'A', category: 'badge', usage: 32, winRate: 56, trend: 'stable', description: 'Shuts down post scorers and post moves. A-tier defensive badge for centers and power forwards.' },
      { name: 'Dimer', tier: 'A', category: 'badge', usage: 46, winRate: 57, trend: 'stable', description: 'Boosts teammate shooting off your passes. A-tier for playmaking guards — solid but not the meta-defining choice it once was.' },
      { name: 'Physical Finisher', tier: 'A', category: 'badge', usage: 36, winRate: 56, trend: 'stable', description: 'Powers through contact on finishing attempts. A-tier for slashers who attack the paint aggressively.' },
      { name: 'Pick Dodger', tier: 'A', category: 'badge', usage: 40, winRate: 56, trend: 'stable', description: 'Navigate through screens without losing your man. A-tier off-ball defense badge for perimeter defenders.' },
      { name: 'Brick Wall', tier: 'A', category: 'badge', usage: 30, winRate: 55, trend: 'stable', description: 'Sets devastating screens that stagger defenders. A-tier for bigs who set screens in the pick-and-roll.' },
      { name: 'Post Powerhouse', tier: 'A', category: 'badge', usage: 28, winRate: 55, trend: 'stable', description: 'Powers through defenders in the post. A-tier for physical post scorers and power forwards.' },
      { name: 'Paint Prodigy', tier: 'A', category: 'badge', usage: 34, winRate: 56, trend: 'stable', description: 'Boosts layup percentage in heavy traffic. A-tier for slashers and guards who finish through contact.' },
      { name: 'Limitless Range', tier: 'A', category: 'badge', usage: 62, winRate: 56, trend: 'stable', description: 'Extends shooting range to deep 3-point territory. A-tier — essential for floor spacers and catch-and-shoot wings.' },
      { name: 'High-Flying Denier', tier: 'A', category: 'badge', usage: 34, winRate: 55, trend: 'stable', description: 'Blocks layups and dunks from behind. A-tier rim protection from the perimeter for athletic wings.' },
      // B tier
      { name: 'Bail Out', tier: 'B', category: 'badge', usage: 28, winRate: 53, trend: 'stable', description: 'Boosts passes out of the air and mid-drive. B-tier for playmakers who kick out on drives.' },
      { name: 'Ankle Assassin', tier: 'B', category: 'badge', usage: 38, winRate: 53, trend: 'stable', description: 'Boosts ankle-breaking animations and step-back effectiveness. B-tier — fun but situational.' },
      { name: 'Mini Marksman', tier: 'B', category: 'badge', usage: 30, winRate: 53, trend: 'stable', description: 'Boosts mid-range shooting. B-tier in a 3-point dominated meta — good for volume mid-range scorers.' },
      { name: 'Layup Mixmaster', tier: 'B', category: 'badge', usage: 26, winRate: 52, trend: 'stable', description: 'Unlocks advanced layup packages and boosts euro steps. B-tier for athletic slashers.' },
      { name: 'Aerial Wizard', tier: 'B', category: 'badge', usage: 22, winRate: 52, trend: 'stable', description: 'Boosts alley-oop catches and off-hand layups. B-tier for athletic bigs who play above the rim.' },
      { name: 'Post Fade Phenom', tier: 'B', category: 'badge', usage: 18, winRate: 52, trend: 'stable', description: 'Boosts post fade-away jumpers. B-tier for skilled post scorers — niche but effective.' },
      { name: 'Off-Ball Pest', tier: 'B', category: 'badge', usage: 24, winRate: 52, trend: 'stable', description: 'Disrupts off-ball movement and cuts. B-tier — situational defensive badge for off-ball defenders.' },
      { name: 'Versatile Visionary', tier: 'B', category: 'badge', usage: 20, winRate: 52, trend: 'stable', description: 'Boosts passing in varied situations. B-tier playmaking badge for all-around playmakers.' },
      // C/D tier
      { name: 'Post Up Poet', tier: 'C', category: 'badge', usage: 14, winRate: 50, trend: 'falling', description: 'Boosts post move effectiveness. C-tier — outclassed by Post Powerhouse for most post builds.' },
      { name: 'Hook Specialist', tier: 'C', category: 'badge', usage: 12, winRate: 50, trend: 'falling', description: 'Boosts hook shots in the paint. C-tier — very situational for centers who exclusively use hooks.' },
      { name: 'Glove', tier: 'D', category: 'badge', usage: 8, winRate: 49, trend: 'falling', description: 'Weakest badge in 2K26 — avoid. The steal boost is negligible and badge points are far better spent on Challenger or Interceptor.' },
      { name: 'Slippery Off-Ball', tier: 'D', category: 'badge', usage: 10, winRate: 49, trend: 'falling', description: 'Off-ball movement boost. D-tier — rarely impactful in current meta, badge points wasted here.' },
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
