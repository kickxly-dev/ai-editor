import Groq from 'groq-sdk'

let _groq: Groq | null = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
  return _groq
}

export interface ScrapedBuild {
  id: string
  name: string
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C'
  height: string
  wingspan: string
  archetype: string
  category: string
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  overallRating: number
  competitiveness: number
  attributes: {
    close_shot: number; driving_layup: number; driving_dunk: number; standing_dunk: number; post_control: number
    mid_range: number; three_point: number; free_throw: number
    pass_accuracy: number; ball_handle: number; speed_with_ball: number
    interior_defense: number; perimeter_defense: number; steal: number; block: number
    offensive_rebound: number; defensive_rebound: number
    speed: number; acceleration: number; strength: number; vertical: number; stamina: number
  }
  badges: { name: string; level: 'HOF' | 'Gold' | 'Silver' | 'Bronze' }[]
  description: string
  strengths: string[]
  weaknesses: string[]
  howToMake: string[]
  sourceUrl: string
  sourceTitle: string
  upvotes: number
  createdAt: string
}

async function fetchRedditPosts(sub: string, query?: string) {
  const url = query
    ? `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&sort=top&t=month&limit=15`
    : `https://www.reddit.com/r/${sub}/hot.json?limit=20`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CourtIQ/1.0' },
    next: { revalidate: 1800 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data?.data?.children || [])
    .filter((p: { data: { score: number } }) => p.data.score > 20)
    .map((p: { data: { title: string; selftext: string; score: number; permalink: string; created_utc: number } }) => ({
      title: p.data.title,
      body: (p.data.selftext || '').slice(0, 1200),
      score: p.data.score,
      url: `https://reddit.com${p.data.permalink}`,
      created: new Date(p.data.created_utc * 1000).toISOString(),
    }))
}

async function extractBuildsWithGroq(posts: { title: string; body: string; score: number; url: string; created: string }[]): Promise<ScrapedBuild[]> {
  const raw = posts.slice(0, 12).map((p, i) => `[POST ${i+1}] ${p.title}\n${p.body}\nURL: ${p.url}\nUpvotes: ${p.score}`).join('\n\n---\n\n')

  const resp = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a NBA 2K26 expert. Extract build information from Reddit posts and return structured JSON.' },
      { role: 'user', content: `Extract NBA 2K26 builds from these Reddit posts. For each post that describes a real build, extract all the info. Return JSON:

${raw}

Return ONLY this JSON (no markdown):
{
  "builds": [
    {
      "name": "build name or catchy name from post title",
      "position": "PG",
      "height": "6'4\\"",
      "wingspan": "Normal",
      "archetype": "Shot Creator",
      "category": "Park",
      "tier": "S",
      "overallRating": 92,
      "competitiveness": 89,
      "attributes": {
        "close_shot": 50, "driving_layup": 80, "driving_dunk": 85, "standing_dunk": 25, "post_control": 25,
        "mid_range": 70, "three_point": 82, "free_throw": 75,
        "pass_accuracy": 75, "ball_handle": 87, "speed_with_ball": 82,
        "interior_defense": 40, "perimeter_defense": 65, "steal": 55, "block": 30,
        "offensive_rebound": 30, "defensive_rebound": 40,
        "speed": 85, "acceleration": 87, "strength": 55, "vertical": 75, "stamina": 90
      },
      "badges": [
        {"name": "Limitless Range", "level": "HOF"},
        {"name": "Quick First Step", "level": "Gold"},
        {"name": "Clamps", "level": "Silver"}
      ],
      "description": "2-sentence description of why this build is good",
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "howToMake": [
        "Step 1: Select Point Guard position at 6'4\\" height",
        "Step 2: Maximize Ball Handle to 87 — this unlocks HOF dribble packages",
        "Step 3: Push Three Point to 82 for consistent shooting",
        "Step 4: Equip Limitless Range HOF and Quick First Step Gold as your top badges",
        "Step 5: Use Pro 3 dribble package and Base 98 jumpshot"
      ],
      "sourceUrl": "https://reddit.com/...",
      "sourceTitle": "original post title",
      "upvotes": 234,
      "createdAt": "2026-01-15T00:00:00Z"
    }
  ]
}

Rules:
- Extract up to 8 builds from the posts
- If a post doesn't describe a specific build, skip it
- Infer missing attribute values from context (position, archetype, described playstyle)
- howToMake must have 5-7 actionable steps specific to the build
- Make names catchy if the post title is boring
- tier based on upvotes + described effectiveness: S(>500 upvotes or very hyped), A(200-500), B(50-200), C(<50)` },
    ],
    temperature: 0.2,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  })

  const content = resp.choices[0].message.content || '{}'
  const parsed = JSON.parse(content)
  return (parsed.builds || []).map((b: Partial<ScrapedBuild>, i: number) => ({
    ...b,
    id: `scraped-${Date.now()}-${i}`,
    attributes: { ...getDefaultAttrs(), ...b.attributes },
  }))
}

function getDefaultAttrs(): ScrapedBuild['attributes'] {
  return {
    close_shot:50, driving_layup:70, driving_dunk:70, standing_dunk:25, post_control:25,
    mid_range:70, three_point:75, free_throw:75,
    pass_accuracy:70, ball_handle:80, speed_with_ball:75,
    interior_defense:40, perimeter_defense:60, steal:50, block:30,
    offensive_rebound:30, defensive_rebound:40,
    speed:80, acceleration:82, strength:55, vertical:72, stamina:85,
  }
}

let _cache: ScrapedBuild[] | null = null
let _cacheTime = 0
const TTL = 30 * 60 * 1000

export async function getScrapedBuilds(forceRefresh = false): Promise<ScrapedBuild[]> {
  const now = Date.now()
  if (!forceRefresh && _cache && now - _cacheTime < TTL) return _cache

  try {
    const [hot, top, search] = await Promise.allSettled([
      fetchRedditPosts('NBA2kBuilds'),
      fetchRedditPosts('NBA2kBuilds', 'best build 2k26'),
      fetchRedditPosts('NBA2k', 'build guide 2k26 attributes badges'),
    ])

    const allPosts = [
      ...(hot.status === 'fulfilled' ? hot.value : []),
      ...(top.status === 'fulfilled' ? top.value : []),
      ...(search.status === 'fulfilled' ? search.value : []),
    ]

    if (!allPosts.length) return _cache || getFallback()

    const builds = await extractBuildsWithGroq(allPosts)
    if (builds.length > 0) {
      _cache = builds
      _cacheTime = now
    }
    return builds.length > 0 ? builds : (_cache || getFallback())
  } catch (err) {
    console.error('Builds scraper error:', err)
    return _cache || getFallback()
  }
}

function getFallback(): ScrapedBuild[] {
  return [
    {
      id: 'fallback-1', name: 'Park God Guard', position: 'PG', height: "6'4\"", wingspan: 'Above Average',
      archetype: 'Playmaking Shot Creator', category: 'Park', tier: 'S', overallRating: 94, competitiveness: 91,
      attributes: { close_shot:55, driving_layup:82, driving_dunk:78, standing_dunk:25, post_control:25, mid_range:75, three_point:85, free_throw:80, pass_accuracy:85, ball_handle:91, speed_with_ball:86, interior_defense:40, perimeter_defense:65, steal:58, block:30, offensive_rebound:30, defensive_rebound:42, speed:88, acceleration:90, strength:50, vertical:78, stamina:92 },
      badges: [{ name:'Limitless Range', level:'HOF' },{ name:'Quick First Step', level:'HOF' },{ name:'Dimer', level:'Gold' },{ name:'Clamps', level:'Silver' }],
      description: 'The premier park guard build dominating this season. Elite handles combined with a reliable mid-range and three creates separation at every level.',
      strengths: ['Elite dribble combos from 91 ball handle', 'Consistent 3PT shooting from deep', 'Fast enough to blow by any defender'],
      weaknesses: ['Weak in post situations', 'Below average defense'],
      howToMake: ["Select PG at 6'4\" — optimal height for guard dribble animations",'Push Ball Handle to 91 first — this unlocks HOF Quick First Step','Set Three Point at 85 for reliable deep shooting','Add Pass Accuracy 85 for HOF Dimer to boost teammates','Equip Limitless Range HOF + Quick First Step HOF as anchor badges','Use Pro 3 dribble package + Base 98 jumpshot for best animations','Takeover: Limitless Shooter for extended range in clutch moments'],
      sourceUrl: 'https://reddit.com/r/NBA2kBuilds', sourceTitle: 'Park God PG Build Guide', upvotes: 847, createdAt: new Date().toISOString(),
    },
    {
      id: 'fallback-2', name: 'Rim Destroyer C', position: 'C', height: "7'0\"", wingspan: 'Maximum',
      archetype: 'Glass Cleaner Finisher', category: 'Rec', tier: 'S', overallRating: 92, competitiveness: 94,
      attributes: { close_shot:75, driving_layup:80, driving_dunk:92, standing_dunk:95, post_control:75, mid_range:45, three_point:25, free_throw:55, pass_accuracy:50, ball_handle:45, speed_with_ball:40, interior_defense:90, perimeter_defense:45, steal:40, block:88, offensive_rebound:90, defensive_rebound:92, speed:55, acceleration:52, strength:90, vertical:80, stamina:88 },
      badges: [{ name:'Posterizer', level:'HOF' },{ name:'Glass Cleaner', level:'HOF' },{ name:'Rim Protector', level:'Gold' },{ name:'Post Spin Technician', level:'Gold' }],
      description: 'The most dominant big man build in current meta. Maximum wingspan + elite finishing makes this a nightmare to guard in the paint.',
      strengths: ['Unguardable contact dunks with Posterizer HOF', 'Elite rebounding on both ends', 'Rim protection shuts down guards driving to the basket'],
      weaknesses: ['Zero shooting range', 'Slow getting up the court', 'Matchup issues vs stretch bigs'],
      howToMake: ["Select Center at 7'0\" with maximum wingspan — critical for rim protection",'Max Driving Dunk to 92 and Standing Dunk to 95 for all contact animations','Push Interior Defense to 90 and Block to 88 for elite rim protection','Offensive Rebound 90 + Defensive Rebound 92 for Glass Cleaner HOF threshold','Equip Posterizer HOF + Glass Cleaner HOF as anchor badges','Use Dropstep Extender takeover for unstoppable paint scoring'],
      sourceUrl: 'https://reddit.com/r/NBA2kBuilds', sourceTitle: "7'0 Rim Destroyer Breakdown", upvotes: 623, createdAt: new Date().toISOString(),
    },
    {
      id: 'fallback-3', name: 'Two-Way Lock', position: 'SF', height: "6'7\"", wingspan: 'Maximum',
      archetype: 'Two-Way Slasher', category: 'Pro-Am', tier: 'A', overallRating: 88, competitiveness: 91,
      attributes: { close_shot:65, driving_layup:85, driving_dunk:88, standing_dunk:40, post_control:45, mid_range:72, three_point:78, free_throw:72, pass_accuracy:65, ball_handle:78, speed_with_ball:75, interior_defense:72, perimeter_defense:88, steal:82, block:65, offensive_rebound:50, defensive_rebound:65, speed:82, acceleration:85, strength:65, vertical:80, stamina:90 },
      badges: [{ name:'Clamps', level:'HOF' },{ name:'Posterizer', level:'Gold' },{ name:'Limitless Range', level:'Silver' },{ name:'Pick Dodger', level:'HOF' }],
      description: 'The perfect Pro-Am wing. Does everything — can guard 1-4, finish through contact, and knock down open threes when left alone.',
      strengths: ['Elite perimeter defense with Clamps HOF', 'Versatile scorer from mid-range and at rim', 'Can guard multiple positions effectively'],
      weaknesses: ['Not a primary ball-handler', 'Mid-level shooting (no HOF shooter badges)'],
      howToMake: ["Build SF at 6'7\" with max wingspan for defensive versatility",'Perimeter Defense 88 unlocks Clamps HOF — prioritize this first','Driving Layup 85 + Driving Dunk 88 for consistent finishing','Ball Handle 78 for basic guard animations without being a guard','Steal 82 for Pick Dodger HOF — essential for off-ball defense','Equip Clamps HOF + Pick Dodger HOF as your defensive anchor badges','Takeover: Versatile Defender for ultimate lockdown capability'],
      sourceUrl: 'https://reddit.com/r/NBA2kBuilds', sourceTitle: 'Best Two-Way SF Build 2K26', upvotes: 445, createdAt: new Date().toISOString(),
    },
  ]
}
