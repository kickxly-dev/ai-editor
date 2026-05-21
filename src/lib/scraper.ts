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

Rules:
- Include at least 6 builds (S through C tier), 14 badges across all 4 categories (Finishing/Shooting/Playmaking/Defense), 4 animations, 3 takeovers
- Do NOT duplicate badge names — each badge must appear only once
- Only include valid NBA 2K26 badge names — do NOT invent badge names
- Base tiers on actual community consensus from the data
- usage is estimated % of players using it (0-100)
- winRate is estimated win rate (48-65)
- trend is one of: rising, stable, falling
- Extract actual build/badge names mentioned in the data
- For animations, only reference 2K26-valid jumpshot bases (e.g. Steph Curry base, KD base) — NOT outdated bases like Base 98 from prior games
- For patchNotes, extract any actual patch changes mentioned
- If specific data is missing, use reasonable estimates based on 2K26 meta knowledge (game released September 2025)`

  const response = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a NBA 2K26 meta analyst. Extract structured meta data from community posts and return valid JSON only.',
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
      'Patch 1.08: Limitless Range range reduced by 2 feet',
      'Patch 1.08: Glass Cleaner badge boosted for centers',
      'Patch 1.08: Clamps effectiveness increased on ball handlers',
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
      { name: 'Limitless Range', tier: 'S', category: 'badge', usage: 67, winRate: 61, trend: 'rising', description: 'Expands shooting range to near half-court. Meta-defining badge this season.' },
      { name: 'Clamps', tier: 'S', category: 'badge', usage: 72, winRate: 61, trend: 'stable', description: 'Best perimeter defense badge. Essential for any lockdown build.' },
      { name: 'Quick First Step', tier: 'S', category: 'badge', usage: 62, winRate: 59, trend: 'stable', description: 'Enhances blow-by speed off the dribble. Essential for guards.' },
      { name: 'Green Machine', tier: 'S', category: 'badge', usage: 58, winRate: 60, trend: 'rising', description: 'Bonus on back-to-back greens. Snowballs quickly when hot.' },
      { name: 'Posterizer', tier: 'A', category: 'badge', usage: 39, winRate: 56, trend: 'stable', description: 'Activates on contact dunks. High-percentage plays at the rim.' },
      { name: 'Catch & Shoot', tier: 'A', category: 'badge', usage: 55, winRate: 57, trend: 'rising', description: 'Shooting boost after catching a pass. Essential for spot-up shooters.' },
      { name: 'Deadeye', tier: 'A', category: 'badge', usage: 51, winRate: 56, trend: 'stable', description: 'Reduces penalty from contested shots. Strong for pull-up scorers.' },
      { name: 'Space Creator', tier: 'A', category: 'badge', usage: 44, winRate: 55, trend: 'stable', description: 'Boosts step-back and hop jumpers. Pairs well with handles.' },
      { name: 'Unpluckable', tier: 'A', category: 'badge', usage: 60, winRate: 55, trend: 'stable', description: 'Prevents steal attempts. Must-have for ball handlers in traffic.' },
      { name: 'Contact Finisher', tier: 'A', category: 'badge', usage: 42, winRate: 56, trend: 'rising', description: 'Boosts finishing through contact at the rim. Great for slashers.' },
      { name: 'Intimidator', tier: 'A', category: 'badge', usage: 38, winRate: 55, trend: 'stable', description: 'Lowers opponent shot percentages near the rim. Best on bigs.' },
      { name: 'Dream Shake', tier: 'A', category: 'badge', usage: 35, winRate: 57, trend: 'rising', description: 'Post fade and drop step combo is powerful in current meta.' },
      { name: 'Handles For Days', tier: 'B', category: 'badge', usage: 40, winRate: 53, trend: 'stable', description: 'Reduces stamina drain from dribble moves. Good for guards running combos.' },
      { name: 'Dimer', tier: 'B', category: 'badge', usage: 29, winRate: 52, trend: 'falling', description: 'Boosts teammate shots off your passes. Nerfed in recent patch.' },
      { name: 'Acrobat', tier: 'B', category: 'badge', usage: 32, winRate: 52, trend: 'stable', description: 'Boosts euro steps and hop steps. Solid for drives to the basket.' },
      { name: 'Rebound Chaser', tier: 'B', category: 'badge', usage: 26, winRate: 51, trend: 'stable', description: 'Improves pursuit of missed shots. Good for energy big builds.' },
      { name: 'Hot Zone Hunter', tier: 'C', category: 'badge', usage: 22, winRate: 50, trend: 'falling', description: 'Shooting boost in established hot zones. Situational value only.' },
      { name: 'Brick Wall', tier: 'C', category: 'badge', usage: 18, winRate: 49, trend: 'falling', description: 'Drains stamina off screen setting. Very niche use case.' },
    ],
    animations: [
      { name: 'Dribble Style: Pro 3', tier: 'S', category: 'animation', usage: 58, winRate: 61, trend: 'rising', description: 'Tightest dribble package for guards this patch in 2K26.' },
      { name: 'Jumpshot: Steph Curry (Base 6)', tier: 'S', category: 'animation', usage: 48, winRate: 62, trend: 'rising', description: 'Fastest green window for guards under 6\'5" in 2K26 meta.' },
      { name: 'Jumpshot: KD Base 8', tier: 'A', category: 'animation', usage: 35, winRate: 59, trend: 'stable', description: 'Best jumpshot base for wings and forwards 6\'5"–6\'9".' },
      { name: 'Post Fade: Dream', tier: 'A', category: 'animation', usage: 29, winRate: 57, trend: 'stable', description: 'Most effective post fade animation for power forwards.' },
      { name: 'Size Up: Pro 5', tier: 'B', category: 'animation', usage: 18, winRate: 52, trend: 'stable', description: 'Solid size-up package for bigger guards and wings.' },
    ],
    takeovers: [
      { name: 'Limitless Shooter', tier: 'S', category: 'takeover', usage: 39, winRate: 63, trend: 'rising', description: 'Extends range dramatically. Pairs with any shooting build.' },
      { name: 'Rim Protector', tier: 'A', category: 'takeover', usage: 29, winRate: 58, trend: 'stable', description: 'Dominant at rim when activated. Essential for centers.' },
      { name: 'Floor General', tier: 'B', category: 'takeover', usage: 19, winRate: 52, trend: 'stable', description: 'Boosts teammates. Strong in Pro-Am and Rec.' },
    ],
  }
}
