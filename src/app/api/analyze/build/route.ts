import { NextRequest, NextResponse } from 'next/server'
import { analyzeBuildText, analyzeBuildImage } from '@/lib/groq'
import { BuildAttributes, Badge } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 30

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
      const metaJson = formData.get('meta') as string | null

      if (!file) {
        return NextResponse.json({ error: 'No image provided' }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mimeType = file.type || 'image/png'

      const visionResult = await analyzeBuildImage(base64, mimeType)
      let extractedData: Record<string, unknown> = {}

      try {
        extractedData = JSON.parse(visionResult)
      } catch {
        extractedData = { notes: visionResult }
      }

      if (extractedData.attributes && extractedData.position) {
        const analysis = await analyzeBuildText(
          extractedData.attributes as Partial<BuildAttributes>,
          (extractedData.badges as Badge[]) || [],
          (extractedData.position as string) || 'PG',
          (extractedData.height as string) || '6\'4"',
          (extractedData.wingspan as string) || 'Normal',
          (extractedData.takeover as string) || 'None',
          (extractedData.build_name as string) || 'Analyzed Build'
        )

        return NextResponse.json({
          success: true,
          extracted: extractedData,
          analysis,
        })
      }

      return NextResponse.json({
        success: true,
        extracted: extractedData,
        analysis: null,
        message: 'Image analyzed — provide build details for full analysis',
      })
    }

    const body = await req.json()
    const { attributes, badges, position, height, wingspan, takeover, buildName } = body

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
      height || '6\'4"',
      wingspan || 'Normal',
      takeover || 'None',
      buildName || 'My Build'
    )

    return NextResponse.json({ success: true, analysis })
  } catch (err) {
    console.error('Build analysis error:', err)
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}
