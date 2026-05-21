'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, User, RotateCcw, Copy, Check } from 'lucide-react'
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

function Message({ msg }: { msg: CoachMessage }) {
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
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
          <Brain className="w-4 h-4 text-rose-400" />
        </div>
      )}
      <div className={cn('max-w-[78%] group', isUser ? 'items-end' : 'items-start flex flex-col')}>
        <div className={cn(
          'px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-rose-500 text-white rounded-2xl rounded-tr-sm'
            : 'rounded-2xl rounded-tl-sm text-white/80'
        )}
          style={!isUser ? { background: '#1C1C22', border: '1px solid rgba(255,255,255,0.06)' } : undefined}
        >
          {msg.content.split('\n').map((line, i) => (
            <p key={i} className={line === '' ? 'h-3' : undefined}>{line}</p>
          ))}
        </div>
        {!isUser && (
          <button onClick={copy} className="flex items-center gap-1 text-xs text-white/25 hover:text-white/50 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {copied ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <User className="w-4 h-4 text-white/40" />
        </div>
      )}
    </motion.div>
  )
}

export default function CoachPage() {
  const [msgs, setMsgs] = useState<CoachMessage[]>([{
    id: '0', role: 'assistant', timestamp: new Date().toISOString(),
    content: "What's good! I'm your CourtIQ AI coach powered by Groq. Ask me anything — builds, badges, meta, animations, or how to improve your game. Let's get to work. 🏀",
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

    const userMsg: CoachMessage = { id: Date.now().toString(), role: 'user', content, timestamp: new Date().toISOString() }
    setMsgs(p => [...p, userMsg])
    setInput(''); setShowStarters(false); setLoading(true)

    try {
      const res = await fetch('/api/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...msgs, userMsg].map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsgs(p => [...p, { id: (Date.now()+1).toString(), role: 'assistant', content: data.message, timestamp: new Date().toISOString() }])
    } catch {
      toast.error('Coach unavailable. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

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
        <div className="flex items-center justify-between py-4 mb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
              <Brain className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">AI Coach</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-white/35 text-xs">Groq — Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setMsgs([{ id:'0', role:'assistant', content:'New session. What do you want to work on?', timestamp: new Date().toISOString() }]); setShowStarters(true) }}
            className="btn btn-ghost btn-sm gap-2">
            <RotateCcw className="w-3.5 h-3.5" /> New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-0">
          {msgs.map(m => <Message key={m.id} msg={m} />)}

          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                <Brain className="w-4 h-4 text-rose-400 animate-pulse" />
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5"
                style={{ background: '#1C1C22', border: '1px solid rgba(255,255,255,0.06)' }}>
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
                    className="text-left text-xs text-white/40 hover:text-white/70 px-4 py-3 rounded-xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(225,29,72,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
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
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none resize-none min-h-[40px] max-h-40 leading-relaxed"
              rows={1}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className={cn('btn btn-primary btn-icon flex-shrink-0 transition-all',
                (!input.trim() || loading) && 'opacity-40')}>
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white/25 text-xs mt-2">Enter to send · Shift+Enter for new line · Powered by Groq</p>
        </div>
      </div>
    </div>
  )
}
