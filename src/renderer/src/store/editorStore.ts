import { create } from 'zustand'

export interface TextOverlay {
  id: string
  type: 'text'
  text: string
  startTime: number
  endTime: number
  x: number       // 0–100 percent
  y: number       // 0–100 percent
  fontSize: number
  color: string
  bold: boolean
  italic: boolean
  shadow: boolean
}

export type Overlay = TextOverlay

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
  timestamp: number
}

export interface EditorState {
  // Video
  videoPath: string | null
  videoDuration: number
  currentTime: number
  isPlaying: boolean

  // Trim
  trimStart: number
  trimEnd: number

  // Overlays
  overlays: Overlay[]

  // Chat
  chatMessages: ChatMessage[]
  isChatLoading: boolean

  // Settings
  groqApiKey: string

  // Export
  isExporting: boolean
  exportProgress: number

  // Modals
  showSettings: boolean
  showExport: boolean

  // Actions
  setVideoPath: (path: string, duration: number) => void
  setCurrentTime: (t: number) => void
  setIsPlaying: (v: boolean) => void
  setTrim: (start: number, end: number) => void
  addOverlay: (o: Overlay) => void
  removeOverlay: (id: string) => void
  updateOverlay: (id: string, patch: Partial<Overlay>) => void
  clearOverlays: () => void
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setChatLoading: (v: boolean) => void
  setGroqApiKey: (k: string) => void
  setExporting: (v: boolean, pct?: number) => void
  setShowSettings: (v: boolean) => void
  setShowExport: (v: boolean) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  videoPath: null,
  videoDuration: 0,
  currentTime: 0,
  isPlaying: false,
  trimStart: 0,
  trimEnd: 0,
  overlays: [],
  chatMessages: [],
  isChatLoading: false,
  groqApiKey: '',
  isExporting: false,
  exportProgress: 0,
  showSettings: false,
  showExport: false,

  setVideoPath: (path, duration) =>
    set({ videoPath: path, videoDuration: duration, trimStart: 0, trimEnd: duration, currentTime: 0 }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setTrim: (start, end) => set({ trimStart: start, trimEnd: end }),
  addOverlay: (o) => set((s) => ({ overlays: [...s.overlays, o] })),
  removeOverlay: (id) => set((s) => ({ overlays: s.overlays.filter((o) => o.id !== id) })),
  updateOverlay: (id, patch) =>
    set((s) => ({ overlays: s.overlays.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
  clearOverlays: () => set({ overlays: [] }),
  addMessage: (msg) =>
    set((s) => ({
      chatMessages: [
        ...s.chatMessages,
        { ...msg, id: `msg_${Date.now()}_${Math.random()}`, timestamp: Date.now() }
      ]
    })),
  setChatLoading: (v) => set({ isChatLoading: v }),
  setGroqApiKey: (k) => set({ groqApiKey: k }),
  setExporting: (v, pct) => set({ isExporting: v, exportProgress: pct ?? 0 }),
  setShowSettings: (v) => set({ showSettings: v }),
  setShowExport: (v) => set({ showExport: v })
}))
