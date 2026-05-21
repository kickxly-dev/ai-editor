import Groq from 'groq-sdk'
import { BuildAttributes, Badge, AIAnalysis } from '@/types'

let _groq: Groq | null = null

function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
  }
  return _groq
}

export const MODELS = {
  fast: 'llama-3.3-70b-versatile',
  vision: 'meta-llama/llama-4-scout-17b-16e-instruct',
  reasoning: 'llama-3.3-70b-versatile',
} as const

const BUILD_ANALYSIS_SYSTEM = `You are CourtIQ's elite NBA 2K26 AI analyst. You have deep knowledge of:
- Every build archetype and their strengths/weaknesses
- Badge synergies and tier rankings
- Current meta trends and patch notes
- Animation recommendations for every play style
- Takeover ability effectiveness by build type
- Competitive vs casual play optimization

Analyze builds with the precision of a professional 2K coach. Be specific, contextual, and actionable.
Always respond in valid JSON matching the exact schema requested.`

const COACH_SYSTEM = `You are CourtIQ's elite NBA 2K26 AI coach. You are:
- A veteran 2K player with deep mechanical knowledge
- An expert in build optimization and badge selection
- Knowledgeable about current meta trends
- Able to give personalized advice based on player builds
- Concise but thorough — always give actionable tips
- Encouraging but honest about build limitations

Speak like a knowledgeable friend who plays 2K at a high level. Keep responses focused and practical.
Reference specific attributes, badges, and mechanics when relevant.`

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

  const badgesList = badges
    .map((b) => `${b.name} (${b.level}) - ${b.category}`)
    .join('\n')

  const prompt = `Analyze this NBA 2K26 build and return a JSON object:

BUILD NAME: ${buildName}
POSITION: ${position}
HEIGHT: ${height}
WINGSPAN: ${wingspan}
TAKEOVER: ${takeover}

ATTRIBUTES:
${attributesList}

BADGES:
${badgesList || 'None specified'}

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
  "animation_recommendations": ["animation type: specific recommendation", "animation 2", "animation 3"],
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

  const content = response.choices[0].message.content || '{}'
  return JSON.parse(content) as AIAnalysis
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
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
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

  return response.choices[0].message.content || '{}'
}

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
    temperature: 0.7,
    max_tokens: 800,
  })

  return response.choices[0].message.content || 'Unable to generate response.'
}

export async function analyzeGameplayFrames(frameDescriptions: string[]): Promise<string> {
  const prompt = `Analyze these NBA 2K26 gameplay frames and provide coaching feedback:

FRAMES ANALYZED: ${frameDescriptions.length}
FRAME DATA:
${frameDescriptions.slice(0, 10).join('\n')}

Provide a coaching analysis covering:
1. Spacing and positioning issues
2. Defensive mistakes observed
3. Shot selection quality
4. Ball movement efficiency
5. Transition play
6. 3 specific actionable improvements

Return JSON:
{
  "overall_rating": 75,
  "spacing_score": 70,
  "defense_score": 65,
  "shot_selection_score": 80,
  "playmaking_score": 72,
  "issues": ["issue 1", "issue 2", "issue 3"],
  "strengths": ["strength 1", "strength 2"],
  "coaching_notes": ["actionable tip 1", "actionable tip 2", "actionable tip 3"],
  "summary": "2-3 sentence overall assessment"
}`

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

export { getGroq }
