'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Code2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'

const BASE_URL = 'https://courtiq.gg/api/v1'

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/builds',
    desc: 'List public community builds ordered by likes, views, or created date.',
    params: [
      { name: 'limit', type: 'number', default: '20', max: '50', desc: 'Number of results' },
      { name: 'position', type: 'string', default: 'null', desc: 'Filter by position: PG, SG, SF, PF, C' },
      { name: 'sort', type: 'string', default: 'likes', desc: 'Sort by: likes | views | created' },
    ],
    example: `// Fetch top 10 PG builds
const res = await fetch('${BASE_URL}/builds?limit=10&position=PG')
const { data, meta } = await res.json()`,
    response: `{
  "data": [{
    "id": "uuid",
    "name": "Park God",
    "position": "PG",
    "height": "6'4\\"",
    "archetype": "Shot Creator",
    "overall_rating": 87,
    "likes": 142,
    "views": 3420,
    "author": "kickxly",
    "created_at": "2026-05-01T..."
  }],
  "meta": { "count": 10, "limit": 10, "filters": { "position": "PG", "sort": "likes" } }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/meta',
    desc: 'Get current Season 5 meta trends — tier rankings, usage rates, trends.',
    params: [
      { name: 'tier', type: 'string', default: 'null', desc: 'Filter by tier: S | A | B | C | D' },
    ],
    example: `// Get S-tier meta entries
const res = await fetch('${BASE_URL}/meta?tier=S')
const { data, by_tier } = await res.json()`,
    response: `{
  "data": [{ "name": "Shot Creator Guard", "tier": "S", "usage_rate": 34.2, "trend": "rising" }],
  "by_tier": { "S": [...], "A": [...] },
  "meta": { "count": 13, "season": 5, "game": "NBA 2K26" }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/badges',
    desc: 'All verified Season 5 badges with tier rankings, categories, and descriptions.',
    params: [],
    example: `// Get all Season 5 badges
const res = await fetch('${BASE_URL}/badges')
const { data, by_tier, by_category } = await res.json()`,
    response: `{
  "data": [{ "name": "Deadeye", "tier": "S", "category": "Shooting", "description": "..." }],
  "by_tier": { "S": [...], "A": [...], "B": [...] },
  "by_category": { "Shooting": [...], "Defense": [...] },
  "meta": { "count": 41, "season": 5, "tiers": ["S","A","B","C","D"] }
}`,
  },
]

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function ApiDocsPage() {
  const [expanded, setExpanded] = useState<string[]>(['/api/v1/badges'])

  const toggle = (path: string) =>
    setExpanded((prev) => prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path])

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Developer API</span>
          </div>
          <h1 className="text-3xl font-bold text-fg">CourtIQ Public API</h1>
          <p className="text-fg-muted mt-1">Free, open, CORS-enabled REST API for NBA 2K26 data.</p>
        </motion.div>

        {/* Base URL */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">Base URL</p>
            <code className="font-mono text-sm text-rose-300">{BASE_URL}</code>
          </div>
          <CopyBtn text={BASE_URL} />
        </motion.div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="chip bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs">No auth required</div>
          <div className="chip bg-blue-500/10 border-blue-500/20 text-blue-400 text-xs">CORS enabled</div>
          <div className="chip bg-violet-500/10 border-violet-500/20 text-violet-400 text-xs">JSON responses</div>
          <div className="chip bg-amber-500/10 border-amber-500/20 text-amber-400 text-xs">Rate limit: 60 req/min</div>
        </div>

        <div className="space-y-3">
          {ENDPOINTS.map((ep, i) => {
            const isOpen = expanded.includes(ep.path)
            return (
              <motion.div
                key={ep.path}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card overflow-hidden"
              >
                <button
                  onClick={() => toggle(ep.path)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <span className={cn('chip font-bold text-xs flex-shrink-0', METHOD_COLORS[ep.method])}>
                    {ep.method}
                  </span>
                  <code className="font-mono text-sm text-fg flex-1">{ep.path}</code>
                  <span className="text-xs text-fg-muted hidden sm:block flex-1">{ep.desc}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-fg-subtle flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-fg-subtle flex-shrink-0" />}
                </button>

                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-4 pb-4 space-y-4 border-t border-white/[0.04]"
                  >
                    <p className="text-sm text-fg-muted pt-3">{ep.desc}</p>

                    {ep.params.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Query Parameters</p>
                        <div className="space-y-2">
                          {ep.params.map((p) => (
                            <div key={p.name} className="flex items-start gap-3 text-sm">
                              <code className="font-mono text-rose-300 w-28 flex-shrink-0">{p.name}</code>
                              <span className="chip text-xs chip-muted flex-shrink-0">{p.type}</span>
                              <span className="text-fg-muted text-xs flex-1">{p.desc}</span>
                              <span className="text-fg-subtle text-xs flex-shrink-0">default: <code className="font-mono">{p.default}</code></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Example</p>
                        <CopyBtn text={ep.example} />
                      </div>
                      <pre className="bg-black/40 rounded-lg p-3 text-xs font-mono text-emerald-300 overflow-x-auto">
                        {ep.example}
                      </pre>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Response</p>
                      <pre className="bg-black/40 rounded-lg p-3 text-xs font-mono text-sky-300 overflow-x-auto">
                        {ep.response}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 card p-5 bg-violet-500/5 border-violet-500/20 text-center">
          <p className="text-sm text-fg-muted">
            Built something with the CourtIQ API? Hit us up on Twitter{' '}
            <span className="text-violet-300">@CourtIQ</span> — we&apos;ll feature it.
          </p>
        </motion.div>
      </div>
    </AppLayout>
  )
}
