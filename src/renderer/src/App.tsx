import { useEffect } from 'react'
import { useEditorStore } from './store/editorStore'
import Toolbar from './components/Toolbar'
import VideoPlayer from './components/VideoPlayer'
import AIChat from './components/AIChat'
import Timeline from './components/Timeline'
import OverlayList from './components/OverlayList'
import ExportModal from './components/ExportModal'
import SettingsModal from './components/SettingsModal'

declare global {
  interface Window {
    electronAPI: {
      openVideo: () => Promise<string | null>
      saveDialog: (name: string) => Promise<string | null>
      openExternal: (url: string) => void
      getVideoMeta: (path: string) => Promise<{ duration: number }>
      getSettings: () => Promise<Record<string, string>>
      saveSettings: (d: Record<string, string>) => Promise<void>
      groqChat: (p: {
        messages: { role: string; content: string }[]
        apiKey: string
        videoInfo: string
      }) => Promise<string>
      exportVideo: (p: {
        inputPath: string
        outputPath: string
        trimStart: number
        trimEnd: number
        overlays: {
          text: string
          startTime: number
          endTime: number
          x: number
          y: number
          fontSize: number
          color: string
          bold: boolean
          shadow: boolean
        }[]
      }) => Promise<void>
      onExportProgress: (cb: (pct: number) => void) => () => void
    }
  }
}

export default function App(): JSX.Element {
  const { showSettings, showExport, setGroqApiKey } = useEditorStore()

  // Load persisted settings on boot
  useEffect(() => {
    window.electronAPI.getSettings().then((s) => {
      if (s.groqApiKey) setGroqApiKey(s.groqApiKey)
    })
  }, [])

  return (
    <div className="app-root">
      <Toolbar />

      <div className="workspace">
        <div className="preview-panel">
          <VideoPlayer />
        </div>
        <div className="sidebar">
          <AIChat />
          <OverlayList />
        </div>
      </div>

      <div className="timeline-panel">
        <Timeline />
      </div>

      {showExport && <ExportModal />}
      {showSettings && <SettingsModal />}
    </div>
  )
}
