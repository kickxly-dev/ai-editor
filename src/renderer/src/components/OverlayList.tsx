import { useEditorStore } from '../store/editorStore'

export default function OverlayList(): JSX.Element {
  const { overlays, removeOverlay, updateOverlay, videoPath } = useEditorStore()

  if (!videoPath || overlays.length === 0) return <></>

  return (
    <div className="overlay-list">
      <div className="overlay-list-header">
        <span>Overlays</span>
        <span className="overlay-count">{overlays.length}</span>
      </div>
      <div className="overlay-list-items">
        {overlays.map((ov) => (
          <div key={ov.id} className="overlay-item">
            <div className="overlay-color-dot" style={{ background: ov.color ?? '#6366f1' }} />
            <div className="overlay-item-info">
              <span className="overlay-item-text">{ov.type === 'text' ? ov.text : ov.id}</span>
              <span className="overlay-item-time">
                {ov.startTime.toFixed(1)}s – {ov.endTime.toFixed(1)}s
              </span>
            </div>
            <div className="overlay-item-actions">
              {ov.type === 'text' && (
                <button
                  className="icon-btn"
                  title="Toggle bold"
                  onClick={() => updateOverlay(ov.id, { bold: !ov.bold })}
                >
                  <strong>B</strong>
                </button>
              )}
              <button
                className="icon-btn icon-btn-danger"
                title="Remove overlay"
                onClick={() => removeOverlay(ov.id)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
