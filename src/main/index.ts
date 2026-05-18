import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs'
import { platform } from 'os'
import ffmpeg from 'fluent-ffmpeg'
import Groq from 'groq-sdk'

// ─── FFmpeg path ────────────────────────────────────────────────────────────
function getFfmpegPath(): string {
  if (app.isPackaged) {
    const ext = platform() === 'win32' ? '.exe' : ''
    return join(process.resourcesPath, `ffmpeg${ext}`)
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('ffmpeg-static') as string
}

// ─── Settings ───────────────────────────────────────────────────────────────
function getSettingsPath(): string {
  const dir = app.getPath('userData')
  return join(dir, 'settings.json')
}

function loadSettings(): Record<string, string> {
  try {
    return JSON.parse(readFileSync(getSettingsPath(), 'utf-8'))
  } catch {
    return {}
  }
}

function saveSettingsToDisk(data: Record<string, string>): void {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(getSettingsPath(), JSON.stringify(data, null, 2))
}

// ─── Window ──────────────────────────────────────────────────────────────────
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0d0d0f',
    titleBarStyle: 'hiddenInset',
    frame: platform() !== 'win32',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // allow local file:// video URLs
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

// ─── IPC: File operations ────────────────────────────────────────────────────
ipcMain.handle('open-video', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Video',
    filters: [
      { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v'] }
    ],
    properties: ['openFile']
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('save-dialog', async (_e, defaultName: string) => {
  const result = await dialog.showSaveDialog({
    title: 'Export Video',
    defaultPath: defaultName,
    filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
  })
  return result.canceled ? null : result.filePath
})

ipcMain.handle('open-external', (_e, url: string) => {
  shell.openExternal(url)
})

// ─── IPC: Settings ───────────────────────────────────────────────────────────
ipcMain.handle('get-settings', () => loadSettings())
ipcMain.handle('save-settings', (_e, data: Record<string, string>) => {
  saveSettingsToDisk(data)
})

// ─── IPC: Video metadata ─────────────────────────────────────────────────────
ipcMain.handle('get-video-meta', (_e, filePath: string): Promise<{ duration: number }> => {
  return new Promise((resolve, reject) => {
    ffmpeg.setFfmpegPath(getFfmpegPath())
    ffmpeg.ffprobe(filePath, (err, meta) => {
      if (err) return reject(err)
      resolve({ duration: meta.format.duration ?? 0 })
    })
  })
})

// ─── IPC: GROQ chat ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an AI video editor assistant embedded in a professional editing app.

When the user gives editing instructions, respond ONLY with a valid JSON object — no markdown, no extra text.

Response format:
{
  "message": "Friendly explanation of what you did",
  "actions": []
}

Available actions:

Add text overlay:
{"type":"add_text_overlay","id":"ov_<timestamp>_<rand>","text":"<text>","startTime":<s>,"endTime":<s>,"x":<0-100>,"y":<0-100>,"fontSize":<px>,"color":"<hex>","bold":<bool>,"italic":<bool>,"shadow":<bool>}

Remove overlay by ID:
{"type":"remove_overlay","id":"<id>"}

Clear all overlays:
{"type":"clear_overlays"}

Trim video:
{"type":"trim_video","startTime":<s>,"endTime":<s>}

Reset trim:
{"type":"reset_trim"}

Rules:
- x/y are percentages (0–100). Center = 50,50. Bottom-center = 50,85.
- Times are in seconds.
- Default color is #ffffff, default fontSize 40.
- IDs must be unique: "ov_" + Date.now() pattern.
- If user says "title" put text at top-center (50,12).
- If user says "subtitle" or "caption" put at bottom-center (50,85).
- If user asks a question with no action needed, use actions:[{"type":"none"}].
- Always include the "message" field with a helpful response.`

ipcMain.handle(
  'groq-chat',
  async (
    _e,
    payload: { messages: { role: string; content: string }[]; apiKey: string; videoInfo: string }
  ) => {
    const { messages, apiKey, videoInfo } = payload
    if (!apiKey) throw new Error('No GROQ API key set. Open Settings to add your key.')

    const groq = new Groq({ apiKey })

    const systemWithContext = `${SYSTEM_PROMPT}\n\nCurrent video info: ${videoInfo}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemWithContext },
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1024
    })

    return completion.choices[0].message.content ?? '{}'
  }
)

// ─── IPC: FFmpeg export ───────────────────────────────────────────────────────
interface ExportOverlay {
  text: string
  startTime: number
  endTime: number
  x: number
  y: number
  fontSize: number
  color: string
  bold: boolean
  shadow: boolean
}

interface ExportParams {
  inputPath: string
  outputPath: string
  trimStart: number
  trimEnd: number
  overlays: ExportOverlay[]
}

ipcMain.handle('export-video', (event, params: ExportParams): Promise<void> => {
  const { inputPath, outputPath, trimStart, trimEnd, overlays } = params

  return new Promise((resolve, reject) => {
    ffmpeg.setFfmpegPath(getFfmpegPath())

    let cmd = ffmpeg(inputPath).seekInput(trimStart).duration(trimEnd - trimStart)

    const textFilters = overlays.map((o) => {
      const safeText = o.text.replace(/'/g, "\\'").replace(/:/g, '\\:')
      const hexColor = o.color.replace('#', '')
      const fontStyle = o.bold ? ':fontstyle=Bold' : ''
      const shadow = o.shadow ? ':shadowcolor=black:shadowx=2:shadowy=2' : ''
      const ex = `between(t\\,${o.startTime}\\,${o.endTime})`
      return (
        `drawtext=text='${safeText}'` +
        `:fontsize=${o.fontSize}` +
        `:fontcolor=0x${hexColor}` +
        `${fontStyle}` +
        `${shadow}` +
        `:x=(w-text_w)*${o.x / 100}` +
        `:y=(h-text_h)*${o.y / 100}` +
        `:enable='${ex}'`
      )
    })

    if (textFilters.length > 0) {
      cmd = cmd.videoFilters(textFilters)
    }

    cmd
      .output(outputPath)
      .outputOptions(['-c:v libx264', '-preset fast', '-crf 23', '-c:a aac', '-movflags +faststart'])
      .on('progress', (p) => {
        event.sender.send('export-progress', p.percent ?? 0)
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run()
  })
})

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (platform() !== 'darwin') app.quit()
})
