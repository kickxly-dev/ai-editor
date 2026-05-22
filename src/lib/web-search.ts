import { parse } from 'node-html-parser'

export interface SearchResult {
  title: string
  snippet: string
  url: string
  source: string
}

// ─── In-memory search cache ───────────────────────────────────────────────────
// Lives in Node.js process memory — persists across requests on the same worker,
// resets on cold starts. Effective for reducing redundant external calls within
// active sessions without requiring any external infrastructure.

interface CacheEntry {
  results: SearchResult[]
  timestamp: number
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const searchCache = new Map<string, CacheEntry>()

function getCacheKey(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ')
}

function getCached(key: string): SearchResult[] | null {
  const entry = searchCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    searchCache.delete(key)
    return null
  }
  return entry.results
}

function setCache(key: string, results: SearchResult[]): void {
  // Evict oldest entry if cache is getting large (>100 keys)
  if (searchCache.size > 100) {
    const oldest = [...searchCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
    if (oldest) searchCache.delete(oldest[0])
  }
  searchCache.set(key, { results, timestamp: Date.now() })
}

// ─── Duplicate content filter ─────────────────────────────────────────────────
// Removes results whose snippet text is substantially identical to one already
// included — prevents inflating the system prompt with repeated paragraphs
// scraped from multiple sources that mirror each other.

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const signatures = new Set<string>()
  return results.filter(r => {
    // Normalize: lowercase, collapse whitespace, take first 140 chars as fingerprint
    const sig = r.snippet.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 140)
    if (signatures.has(sig)) return false
    signatures.add(sig)
    return true
  })
}

// ─── Reddit search ────────────────────────────────────────────────────────────

async function searchReddit(query: string, maxResults = 6): Promise<SearchResult[]> {
  const url = `https://www.reddit.com/r/NBA2k/search.json?q=${encodeURIComponent(query)}&sort=top&t=month&limit=15`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CourtIQ/1.0 (NBA 2K coach app)' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const posts = data?.data?.children || []
    return posts
      .filter((p: { data: { score: number } }) => p.data.score > 2)
      .slice(0, maxResults)
      .map((p: { data: { title: string; selftext: string; permalink: string } }) => ({
        title: p.data.title,
        snippet: (p.data.selftext || '').slice(0, 600).trim() || '(no body)',
        url: `https://reddit.com${p.data.permalink}`,
        source: 'r/NBA2k',
      }))
  } catch {
    return []
  }
}

// ─── Trusted site scraper ─────────────────────────────────────────────────────

async function scrapeUrl(url: string, source: string, titleHint: string): Promise<SearchResult | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(7000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const root = parse(html)
    root.querySelectorAll('script,style,nav,footer,header').forEach(el => el.remove())
    const text = root.text.replace(/\s+/g, ' ').trim().slice(0, 1200)
    if (text.length < 100) return null
    return { title: titleHint, snippet: text, url, source }
  } catch {
    return null
  }
}

// ─── DuckDuckGo fallback ──────────────────────────────────────────────────────

async function searchDDG(query: string, maxResults = 4): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return []
    const html = await res.text()
    const root = parse(html)
    const results: SearchResult[] = []
    for (const el of root.querySelectorAll('.result')) {
      const titleEl = el.querySelector('.result__title a') || el.querySelector('.result__a')
      const snippetEl = el.querySelector('.result__snippet')
      const urlEl = el.querySelector('.result__url')
      if (!titleEl) continue
      const title = titleEl.text.trim()
      const snippet = snippetEl?.text.trim() || ''
      const rawUrl = urlEl?.text.trim() || ''
      if (!title || !snippet) continue
      results.push({ title, snippet, url: rawUrl, source: rawUrl.split('/')[0] || 'web' })
      if (results.length >= maxResults) break
    }
    return results
  } catch {
    return []
  }
}

// ─── Trusted 2K26 sources ─────────────────────────────────────────────────────

const TRUSTED_SOURCES: Record<string, { url: string; title: string; source: string }[]> = {
  badges: [
    { url: 'https://nba2kw.com/nba-2k26-all-badge-descriptions',         title: 'NBA 2K26 All Badge Descriptions',    source: 'NBA2KW' },
    { url: 'https://deltiasgaming.com/nba-2k26-all-badge-requirements/', title: 'NBA 2K26 All Badge Requirements',     source: "Deltia's Gaming" },
  ],
  jumpshot: [
    { url: 'https://www.operationsports.com/nba-2k26-best-jumpshots-ranked/', title: 'NBA 2K26 Best Jumpshots Ranked',    source: 'Operation Sports' },
    { url: 'https://vortexgaming.io/en/postdetail/679584',                    title: 'NBA 2K26 Best Jumpshot Guide S7',  source: 'Vortex Gaming' },
  ],
  builds: [
    { url: 'https://nba2kw.com/nba-2k26-best-builds-for-every-position',  title: 'NBA 2K26 Best Builds Every Position', source: 'NBA2KW' },
    { url: 'https://gethypedsports.com/nba-2k26-best-builds-every-position/', title: 'NBA 2K26 Best Builds Season 7',   source: 'Get Hyped Sports' },
  ],
  meta: [
    { url: 'https://nba2kw.com/nba-2k26-best-badges-for-every-position',          title: 'NBA 2K26 Best Badges Every Position', source: 'NBA2KW' },
    { url: 'https://www.operationsports.com/nba-2k26-best-badges-for-every-position/', title: 'NBA 2K26 Best Badges',        source: 'Operation Sports' },
  ],
}

function detectTopic(query: string): string[] {
  const q = query.toLowerCase()
  const topics: string[] = []
  if (q.match(/badge|badges/)) topics.push('badges', 'meta')
  if (q.match(/jump\s?shot|base|release|animation/)) topics.push('jumpshot')
  if (q.match(/build|archetype|height|weight|wingspan/)) topics.push('builds')
  if (q.match(/meta|best|tier|op|broken|patch|season/)) topics.push('meta', 'builds')
  return [...new Set(topics)]
}

// ─── Main export — cache-aware, dedup-filtered ────────────────────────────────

export async function searchForCoach(query: string): Promise<SearchResult[]> {
  const cacheKey = getCacheKey(query)

  // Return cached results if fresh
  const cached = getCached(cacheKey)
  if (cached) return cached

  const scoped = `${query} NBA 2K26`
  const topics = detectTopic(query)

  const redditPromise = searchReddit(query)

  const scrapePromises: Promise<SearchResult | null>[] = []
  for (const topic of topics.slice(0, 2)) {
    const sources = TRUSTED_SOURCES[topic] || []
    for (const src of sources.slice(0, 1)) {
      scrapePromises.push(scrapeUrl(src.url, src.source, src.title))
    }
  }

  const ddgPromise = searchDDG(scoped, 3)

  const [reddit, ...rest] = await Promise.allSettled([
    redditPromise,
    ...scrapePromises,
    ddgPromise,
  ])

  const raw: SearchResult[] = [
    ...(reddit.status === 'fulfilled' ? reddit.value : []),
    ...rest.flatMap(r => {
      if (r.status !== 'fulfilled') return []
      const v = r.value
      if (!v) return []
      return Array.isArray(v) ? v : [v]
    }),
  ]

  const filtered = deduplicateResults(
    raw.filter(r => r.snippet.length > 50)
  ).slice(0, 8)

  setCache(cacheKey, filtered)
  return filtered
}

// ─── Format results as system prompt context ──────────────────────────────────

export function formatSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return ''
  return [
    '=== LIVE WEB SEARCH RESULTS — read carefully and reason FROM these, do not ignore them ===',
    ...results.map((r, i) =>
      `[${i + 1}] SOURCE: ${r.source}\nTITLE: ${r.title}\nCONTENT: ${r.snippet}`
    ),
    '=== END SEARCH RESULTS ===',
  ].join('\n\n')
}
