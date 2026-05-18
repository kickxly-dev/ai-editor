import { contextBridge, ipcRenderer } from 'electron'

export type VideoMeta = { duration: number }
export type Settings = Record<string, string>

export type ExportOverlay = {
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

export type ExportParams = {
  inputPath: string
  outputPath: string
  trimStart: number
  trimEnd: number
  overlays: ExportOverlay[]
}

contextBridge.exposeInMainWorld('electronAPI', {
  openVideo: (): Promise<string | null> => ipcRenderer.invoke('open-video'),

  saveDialog: (defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke('save-dialog', defaultName),

  openExternal: (url: string): void => {
    ipcRenderer.invoke('open-external', url)
  },

  getVideoMeta: (filePath: string): Promise<VideoMeta> =>
    ipcRenderer.invoke('get-video-meta', filePath),

  getSettings: (): Promise<Settings> => ipcRenderer.invoke('get-settings'),

  saveSettings: (data: Settings): Promise<void> => ipcRenderer.invoke('save-settings', data),

  groqChat: (payload: {
    messages: { role: string; content: string }[]
    apiKey: string
    videoInfo: string
  }): Promise<string> => ipcRenderer.invoke('groq-chat', payload),

  exportVideo: (params: ExportParams): Promise<void> => ipcRenderer.invoke('export-video', params),

  onExportProgress: (cb: (pct: number) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, pct: number): void => cb(pct)
    ipcRenderer.on('export-progress', handler)
    return () => ipcRenderer.removeListener('export-progress', handler)
  }
})
