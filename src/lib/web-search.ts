import { parse } from 'node-html-parser'

export interface SearchResult {
  title: string
  snippet: string
  url: string
  source: string
}

/* ── DuckDuckGo HTML search ─────────────────────────────────────── */
async function searchDDG(query: string, maxResults = 5): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
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
      results.push({
        title,
        snippet,
        url: rawUrl,
        source: rawUrl.split('/')[0] || 'web',
      })
      if (results.length >= maxResults) break
    }
    return results
  } catch {
    return []
  }
}

/* ── Reddit JSON search ─────────────────────────────────────────── */
async function searchReddit(query: string, maxResults = 4): Promise<SearchResult[]> {
  const url = `https://www.reddit.com/r/NBA2k/search.json?q=${encodeURIComponent(query)}&sort=top&t=month&limit=10`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CourtIQ/1.0 (NBA 2K coach search)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const posts = data?.data?.children || []
    return posts
      .filter((p: { data: { score: number } }) => p.data.score > 5)
      .slice(0, maxResults)
      .map((p: { data: { title: string; selftext: string; permalink: string; score: number } }) => ({
        title: p.data.title,
        snippet: (p.data.selftext || '').slice(0, 400).trim() || '(no body)',
        url: `https://reddit.com${p.data.permalink}`,
        source: 'r/NBA2k',
      }))
  } catch {
    return []
  }
}

/* ── Main export ────────────────────────────────────────────────── */
export async function searchForCoach(query: string): Promise<SearchResult[]> {
  // Run DDG and Reddit in parallel; always scope to 2K26
  const scoped = `${query} NBA 2K26 2026`
  const [ddg, reddit] = await Promise.allSettled([
    searchDDG(scoped, 4),
    searchReddit(query, 4),
  ])
  const results: SearchResult[] = [
    ...(ddg.status === 'fulfilled' ? ddg.value : []),
    ...(reddit.status === 'fulfilled' ? reddit.value : []),
  ]
  return results.slice(0, 8)
}

/* ── Format results as context string ──────────────────────────── */
export function formatSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return ''
  return [
    '=== LIVE WEB SEARCH RESULTS (use these to inform your answer) ===',
    ...results.map((r, i) =>
      `[${i + 1}] ${r.source}: ${r.title}\n${r.snippet}`
    ),
    '=== END SEARCH RESULTS ===',
  ].join('\n\n')
}
