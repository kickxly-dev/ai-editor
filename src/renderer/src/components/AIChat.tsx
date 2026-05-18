import { useState, useRef, useEffect, FormEvent } from 'react'
import { useEditorStore } from '../store/editorStore'

interface AIAction {
  type: string
  id?: string
  text?: string
  startTime?: number
  endTime?: number
  x?: number
  y?: number
  fontSize?: number
  color?: string
  bold?: boolean
  italic?: boolean
  shadow?: boolean
}

interface AIResponse {
  message: string
  actions: AIAction[]
}

function parseResponse(raw: string): AIResponse {
  try {
    const parsed = JSON.parse(raw)
    return {
      message: parsed.message ?? 'Done.',
      actions: Array.isArray(parsed.actions) ? parsed.actions : []
    }
  } catch {
    return { message: raw, actions: [] }
  }
}

export default function AIChat(): JSX.Element {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const {
    chatMessages,
    isChatLoading,
    groqApiKey,
    videoPath,
    videoDuration,
    trimStart,
    trimEnd,
    overlays,
    addMessage,
    setChatLoading,
    addOverlay,
    removeOverlay,
    clearOverlays,
    setTrim,
    setShowSettings
  } = useEditorStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatLoading])

  function executeActions(actions: AIAction[]): void {
    for (const action of actions) {
      switch (action.type) {
        case 'add_text_overlay':
          if (action.id && action.text != null) {
            addOverlay({
              id: action.id,
              type: 'text',
              text: action.text,
              startTime: action.startTime ?? 0,
              endTime: action.endTime ?? videoDuration,
              x: action.x ?? 50,
              y: action.y ?? 50,
              fontSize: action.fontSize ?? 40,
              color: action.color ?? '#ffffff',
              bold: action.bold ?? false,
              italic: action.italic ?? false,
              shadow: action.shadow ?? true
            })
          }
          break

        case 'remove_overlay':
          if (action.id) removeOverlay(action.id)
          break

        case 'clear_overlays':
          clearOverlays()
          break

        case 'trim_video':
          if (action.startTime != null && action.endTime != null) {
            setTrim(
              Math.max(0, action.startTime),
              Math.min(videoDuration, action.endTime)
            )
          }
          break

        case 'reset_trim':
          setTrim(0, videoDuration)
          break

        default:
          break
      }
    }
  }

  async function handleSend(e: FormEvent): Promise<void> {
    e.preventDefault()
    const text = input.trim()
    if (!text || isChatLoading) return
    setInput('')

    if (!groqApiKey) {
      addMessage({ role: 'error', content: 'Please add your GROQ API key in Settings first.' })
      setShowSettings(true)
      return
    }
    if (!videoPath) {
      addMessage({ role: 'error', content: 'Open a video first before giving editing instructions.' })
      return
    }

    addMessage({ role: 'user', content: text })
    setChatLoading(true)

    const history = useEditorStore.getState().chatMessages.slice(-10).map((m) => ({
      role: m.role === 'error' ? 'assistant' : m.role,
      content: m.content
    }))

    const overlaysSummary = overlays.map((o) => {
      if (o.type === 'text')
        return `TextOverlay(id=${o.id}, text="${o.text}", ${o.startTime}s-${o.endTime}s, pos=${o.x}%,${o.y}%)`
      return o.id
    })

    const videoInfo = [
      `duration=${Math.round(videoDuration)}s`,
      `trim=${Math.round(trimStart)}s-${Math.round(trimEnd)}s`,
      `overlays=[${overlaysSummary.join(', ')}]`
    ].join(', ')

    try {
      const raw = await window.electronAPI.groqChat({
        messages: [...history, { role: 'user', content: text }],
        apiKey: groqApiKey,
        videoInfo
      })

      const response = parseResponse(raw)
      executeActions(response.actions)
      addMessage({ role: 'assistant', content: response.message })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      addMessage({ role: 'error', content: `Error: ${msg}` })
    } finally {
      setChatLoading(false)
    }
  }

  const suggestions = [
    'Add a title at the start',
    'Add subtitles at the bottom',
    'Trim to first 30 seconds',
    'Remove all overlays'
  ]

  return (
    <div className="ai-chat">
      <div className="chat-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
        <span>AI Editor</span>
        <span className="chat-model">Llama 3.1 · GROQ</span>
      </div>

      <div className="chat-messages">
        {chatMessages.length === 0 && (
          <div className="chat-welcome">
            <div className="welcome-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M2 17l10 5 10-5" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M2 12l10 5 10-5" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <p>Tell me how to edit your video</p>
            <div className="suggestions">
              {suggestions.map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => setInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="msg-avatar assistant-avatar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#6366f1">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                </svg>
              </div>
            )}
            <div className="msg-bubble">{msg.content}</div>
          </div>
        ))}

        {isChatLoading && (
          <div className="chat-msg chat-msg-assistant">
            <div className="msg-avatar assistant-avatar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#6366f1">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              </svg>
            </div>
            <div className="msg-bubble loading-bubble">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell AI what to edit…"
          disabled={isChatLoading}
        />
        <button type="submit" className="send-btn" disabled={isChatLoading || !input.trim()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
          </svg>
        </button>
      </form>
    </div>
  )
}
