import { useEditorStore } from '../store/editorStore'

export default function Toolbar(): JSX.Element {
  const {
    videoPath,
    setVideoPath,
    setShowSettings,
    setShowExport,
    groqApiKey
  } = useEditorStore()

  async function handleOpen(): Promise<void> {
    const path = await window.electronAPI.openVideo()
    if (!path) return
    const meta = await window.electronAPI.getVideoMeta(path)
    setVideoPath(path, meta.duration)
  }

  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M2 17l10 5 10-5" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke="#818cf8" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
          AI Studio
        </span>
      </div>

      <div className="toolbar-center">
        <button className="btn btn-primary" onClick={handleOpen}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
          Open Video
        </button>

        {videoPath && (
          <button
            className="btn btn-accent"
            onClick={() => setShowExport(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Export
          </button>
        )}
      </div>

      <div className="toolbar-right">
        {!groqApiKey && (
          <span className="api-warning">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            No API key
          </span>
        )}
        <button className="btn btn-ghost" onClick={() => setShowSettings(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Settings
        </button>
      </div>
    </header>
  )
}
