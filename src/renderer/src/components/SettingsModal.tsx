import { useState, useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'

export default function SettingsModal(): JSX.Element {
  const { groqApiKey, setGroqApiKey, setShowSettings } = useEditorStore()
  const [key, setKey] = useState(groqApiKey)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setKey(groqApiKey)
  }, [groqApiKey])

  async function save(): Promise<void> {
    setGroqApiKey(key.trim())
    await window.electronAPI.saveSettings({ groqApiKey: key.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function close(): void {
    setShowSettings(false)
  }

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={close}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <label className="settings-label">GROQ API Key</label>
            <p className="settings-desc">
              Free at{' '}
              <button
                className="link-btn"
                onClick={() => window.electronAPI.openExternal('https://console.groq.com')}
              >
                console.groq.com
              </button>
              . Uses Llama 3.1 8B Instant — fast and free tier available.
            </p>
            <input
              type="password"
              className="settings-input"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="gsk_..."
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          <div className="settings-section">
            <label className="settings-label">Model</label>
            <div className="settings-model-tag">llama-3.1-8b-instant</div>
            <p className="settings-desc">Fastest GROQ model. Free tier: ~14,400 req/day.</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
