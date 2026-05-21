'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, User, RotateCcw, Copy, Check, Globe } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { CoachMessage } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STARTERS = [
  'What badges should I prioritize for a Shot Creator?',
  'Best jumpshot for a 6\'4" guard right now?',
  'How do I stop getting cooked on perimeter defense?',
  'Why do I keep getting blocked going to the rim?',
  'What animations should I use for park?',
  'What is the strongest meta build right now?',
]

function Message({ msg, searched }: { msg: CoachMessage; searched?: string }) {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Brain className="w-4 h-4 text-rose-400" />
        </div>
      )}
      <div className={cn('max-w-[78%] group', isUser ? 'items-end' : 'items-start flex flex-col')}>
        <div className={cn(
          'px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-rose-500 text-white rounded-2xl rounded-tr-sm'
            : 'bg-card border border-border text-fg rounded-2xl rounded-tl-sm'
        )}>
          {msg.content.split('\n').map((line, i) => (
            <p key={i} className={line === '' ? 'h-3' : undefined}>{line}</p>
          ))}
        </div>
        {!isUser && (
          <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {searched && (
              <span className="flex items-center gap-1 text-xs text-white/25">
                <Globe className="w-3 h-3 text-sky-400/60" />
                <span className="text-sky-400/60">searched: {searched}</span>
              </span>
            )}
            <button onClick={copy} className="flex items-center gap-1 text-xs text-fg-subtle hover:text-fg-muted">
              {copied ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-fg-muted" />
        </div>
      )}
    </motion.div>
  )
}

type CoachMessageWithSearch = CoachMessage & { searched?: string }

export default function CoachPage() {
  const [msgs, setMsgs] = useState<CoachMessageWithSearch[]>([{
    id: '0', role: 'assistant', timestamp: new Date().toISOString(),
    content: "What's good! I'm your CourtIQ AI coach powered by Groq + live web search. Ask me anything — builds, badges, meta, animations, or how to improve your game. Let's get to work. 🏀",
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showStarters, setShowStarters] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return

    const userMsg: CoachMessageWithSearch = { id: Date.now().toString(), role: 'user', content, timestamp: new Date().toISOString() }
    setMsgs(p => [...p, userMsg])
    setInput(''); setShowStarters(false); setLoading(true)

    try {
      const res = await fetch('/api/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...msgs, userMsg].map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsgs(p => [...p, {
        id: (Date.now()+1).toString(), role: 'assistant',
        content: data.message, timestamp: new Date().toISOString(),
        searched: data.searched || undefined,
      }])
    } catch {
      toast.error('Coach unavailable. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = 'auto'
      textRef.current.style.height = Math.min(textRef.current.scrollHeight, 160) + 'px'
    }
  }, [input])

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 pt-20 pb-6">

        {/* Header */}
        <div className="flex items-center justify-between py-4 border-b border-border mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-fg font-semibold">AI Coach</p>
              <div className="flex items-center gap-1.5">
                <span className="status-online" />
                <span className="text-fg-subtle text-xs">Groq — Online</span>
              </div>
            </div>
          </div>
          <button onClick={() => { setMsgs([{ id:'0', role:'assistant', content:'New session. What do you want to work on?', timestamp: new Date().toISOString() }]); setShowStarters(true) }}
            className="btn btn-ghost btn-sm gap-2">
            <RotateCcw className="w-3.5 h-3.5" /> New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-0">
          {msgs.map(m => <Message key={m.id} msg={m} searched={m.searched} />)}

          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-rose-400 animate-pulse" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-rose-400/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {showStarters && msgs.length <= 1 && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {STARTERS.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="text-left text-xs text-fg-muted hover:text-fg bg-surface hover:bg-card border border-border hover:border-rose-500/20 px-4 py-3 rounded-xl transition-all text-left">
                    {q}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="mt-4 card p-3 flex-shrink-0">
          <div className="flex items-end gap-2.5">
            <textarea
              ref={textRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
              placeholder="Ask your AI coach anything about 2K26..."
              className="flex-1 bg-transparent text-fg text-sm placeholder:text-fg-subtle outline-none resize-none min-h-[40px] max-h-40 leading-relaxed"
              rows={1}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className={cn('btn btn-primary btn-icon flex-shrink-0 transition-all',
                (!input.trim() || loading) && 'opacity-40')}>
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-fg-subtle text-xs mt-2">Enter to send · Shift+Enter for new line · Powered by Groq</p>
        </div>
      </div>
    </div>
  )
}
