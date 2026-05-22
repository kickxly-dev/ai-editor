import { NextRequest, NextResponse } from 'next/server'
import { analyzeBuildText, analyzeBuildImage } from '@/lib/groq'
import { BuildAttributes, Badge } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 45

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY is not configured. Add it in Vercel → Settings → Environment Variables.' },
      { status: 503 }
    )
  }

  try {
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('image') as File | null

      if (!file) {
        return NextResponse.json({ error: 'No image provided' }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mimeType = file.type || 'image/png'

      // Vision extraction
      let extractedData: Record<string, unknown> = {}
      try {
        const visionResult = await analyzeBuildImage(base64, mimeType)
        extractedData = JSON.parse(visionResult)
      } catch (visionErr) {
        console.error('Vision extraction error:', visionErr)
        // Continue — we'll try text analysis with whatever we got
      }

      // Build reasonable defaults from extracted data
      const position = (extractedData.position as string) || 'SG'
      const height = (extractedData.height as string) || "6'4\""
      const wingspan = (extractedData.wingspan as string) || 'Normal'
      const takeover = (extractedData.takeover as string) || 'None'
      const buildName = (extractedData.build_name as string) || 'Screenshot Build'
      const attributes = (extractedData.attributes as Partial<BuildAttributes>) || {}
      const badges = (extractedData.badges as Badge[]) || []

      const capBreakers = Number(formData.get('capBreakers') || 0)
      const analysis = await analyzeBuildText(
        attributes,
        badges,
        position,
        height,
        wingspan,
        takeover,
        buildName,
        capBreakers
      )

      return NextResponse.json({
        success: true,
        extracted: extractedData,
        analysis,
      })
    }

    // Manual JSON entry
    const body = await req.json()
    const { attributes, badges, position, height, wingspan, takeover, buildName, capBreakers } = body

    if (!position || !attributes) {
      return NextResponse.json(
        { error: 'Position and attributes are required' },
        { status: 400 }
      )
    }

    const analysis = await analyzeBuildText(
      attributes as Partial<BuildAttributes>,
      badges || [],
      position,
      height || "6'4\"",
      wingspan || 'Normal',
      takeover || 'None',
      buildName || 'My Build',
      Number(capBreakers || 0)
    )

    return NextResponse.json({ success: true, analysis })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Build analysis error:', message)
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    )
  }
}
