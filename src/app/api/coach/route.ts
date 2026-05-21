import { NextRequest, NextResponse } from 'next/server'
import { chatWithCoach, getGroq, MODELS } from '@/lib/groq'
import { searchForCoach, formatSearchContext } from '@/lib/web-search'

export const runtime = 'nodejs'
export const maxDuration = 45

/* Decide if the latest user question needs a live web search */
async function shouldSearch(question: string): Promise<boolean> {
  // Fast heuristic: skip searches for simple conversational replies
  const low = question.toLowerCase()
  const alwaysSearch = [
    'best', 'meta', 'patch', 'update', 'current', 'right now', 'season',
    'jumpshot', 'jump shot', 'badge', 'build', 'tier', 'op', 'broken',
    'nerf', 'buff', 'animation', 'dribble', 'after patch', 'latest',
    'recommended', 'what should', 'how do i', 'tips', 'guide', 'tutorial',
  ]
  return alwaysSearch.some(kw => low.includes(kw))
}

/* Use Groq to generate a tight search query from the user's question */
async function generateSearchQuery(question: string): Promise<string> {
  try {
    const res = await getGroq().chat.completions.create({
      model: MODELS.fast,
      messages: [
        {
          role: 'system',
          content: 'You output only a short web search query (max 8 words). No explanation, no quotes, just the query.',
        },
        {
          role: 'user',
          content: `Convert this NBA 2K26 question to a search query: "${question}"`,
        },
      ],
      temperature: 0,
      max_tokens: 30,
    })
    return res.choices[0].message.content?.trim() || question
  } catch {
    return question
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY is not configured.' }, { status: 503 })
  }
  try {
    const body = await req.json()
    const { messages, buildContext } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const validMessages = messages.filter(
      (m: { role: string; content: string }) =>
        (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )
    if (validMessages.length === 0) {
      return NextResponse.json({ error: 'No valid messages provided' }, { status: 400 })
    }

    const lastMessages = validMessages.slice(-10)
    const latestQuestion = lastMessages.filter(m => m.role === 'user').slice(-1)[0]?.content || ''

    // Decide whether to search and fetch live context
    let searchContext = ''
    let searchQuery = ''
    if (latestQuestion && await shouldSearch(latestQuestion)) {
      searchQuery = await generateSearchQuery(latestQuestion)
      const results = await searchForCoach(searchQuery)
      searchContext = formatSearchContext(results)
    }

    // Combine build context + search context
    const fullContext = [buildContext, searchContext].filter(Boolean).join('\n\n') || undefined
    const response = await chatWithCoach(lastMessages, fullContext)

    return NextResponse.json({
      success: true,
      message: response,
      searched: searchQuery || null,
    })
  } catch (err) {
    console.error('Coach chat error:', err)
    return NextResponse.json({ error: 'Coach is unavailable. Please try again.' }, { status: 500 })
  }
}
