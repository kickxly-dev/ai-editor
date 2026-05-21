import { NextRequest, NextResponse } from 'next/server'
import { chatWithCoach, getGroq, MODELS } from '@/lib/groq'
import { searchForCoach, formatSearchContext } from '@/lib/web-search'

export const runtime = 'nodejs'
export const maxDuration = 45

/* Skip search only for pure small talk */
function isSmallTalk(question: string): boolean {
  const q = question.toLowerCase().trim()
  if (q.length < 15) return true
  const smallTalk = ['thanks', 'thank you', 'ok', 'okay', 'got it', 'nice', 'cool', 'lol', 'lmao', 'hello', 'hi ', 'hey ']
  return smallTalk.some(s => q.startsWith(s)) && q.length < 40
}

/* Use Groq to generate a tight search query */
async function generateSearchQuery(question: string): Promise<string> {
  try {
    const res = await getGroq().chat.completions.create({
      model: MODELS.fast,
      messages: [
        {
          role: 'system',
          content: 'Output only a short web search query (max 8 words). No quotes, no explanation. Focus on the specific 2K26 topic.',
        },
        {
          role: 'user',
          content: `NBA 2K26 question: "${question}"`,
        },
      ],
      temperature: 0,
      max_tokens: 25,
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

    // Search unless it's pure small talk
    let searchContext = ''
    let searchQuery = ''
    if (latestQuestion && !isSmallTalk(latestQuestion)) {
      searchQuery = await generateSearchQuery(latestQuestion)
      const results = await searchForCoach(searchQuery)
      searchContext = formatSearchContext(results)
    }

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
