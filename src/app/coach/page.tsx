'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, User, RotateCcw, Copy, Check, Globe, Sparkles } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { CoachMessage } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STARTERS = [
  'What badges should I prioritize for a Shot Creator?',
  "Best jumpshot for a 6'4\" guard right now?",
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
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.2)' }}>
          <Brain className="w-4 h-4" style={{ color: '#E11D48' }} />
        </div>
      )}
      <div className={cn('max-w-[80%] group', isUser ? 'items-end' : 'items-start flex flex-col')}>
        <div
          className={cn('px-4 py-3 text-[14px] leading-relaxed', isUser ? 'text-white rounded-2xl rounded-tr-sm' : 'text-white/90 rounded-2xl rounded-tl-sm')}
          style={isUser
            ? { background: '#E11D48' }
            : { background: 'rgba(255,255,255,0.048)', border: '1px solid rgba(255,255,255,0.07)' }
          }
        >
          {msg.content.split('\n').map((line, i) => (
            <p key={i} className={line === '' ? 'h-3' : undefined}>{line}</p>
          ))}
        </div>
        {!isUser && (
          <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {searched && (
              <span className="flex items-center gap-1 text-[11px] text-white/30">
                <Globe className="w-3 h-3 text-sky-400/60" />
                <span className="text-sky-400/60">searched: {searched}</span>
              </span>
            )}
            <button onClick={copy} className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors">
              {copied
                ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
                : <><Copy className="w-3 h-3" />Copy</>}
            </button>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <User className="w-4 h-4 text-white/50" />
        </div>
      )}
    </motion.div>
  )
}

type CoachMessageWithSearch = CoachMessage & { searched?: string }

export default function CoachPage() {
  const [msgs, setMsgs] = useState<CoachMessageWithSearch[]>([{
    id: '0', role: 'assistant', timestamp: new Date().toISOString(),
    content: "What's good! Ask me anything about NBA 2K26 — builds, badges, jumpshots, meta picks, or how to improve your game. I search the web in real-time so my answers are always current.",
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showStarters, setShowStarters] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const reset = () => {
    setMsgs([{ id: '0', role: 'assistant', content: "New session. What do you want to work on?", timestamp: new Date().toISOString() }])
    setShowStarters(true)
  }

  const send = async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return
    const userMsg: CoachMessageWithSearch = { id: Date.now().toString(), role: 'user', content, timestamp: new Date().toISOString() }
    setMsgs(p => [...p, userMsg])
    setInput('')
    setShowStarters(false)
    setLoading(true)
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...msgs, userMsg].map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsgs(p => [...p, {
        id: (Date.now() + 1).toString(), role: 'assistant',
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

  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = 'auto'
      textRef.current.style.height = Math.min(textRef.current.scrollHeight, 160) + 'px'
    }
  }, [input])

  return (
    <AppLayout>
      <div className="flex flex-col" style={{ minHeight: '100vh' }}>
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 pt-6 md:pt-8 pb-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                <Brain className="w-5 h-5" style={{ color: '#E11D48' }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1"
                  style={{ color: 'rgba(225,29,72,0.8)' }}>
                  AI + Live Search
                </p>
                <h1 className="text-[24px] font-black text-white tracking-tight leading-tight">AI Coach</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[12px] text-white/35">Ready — real-time answers</span>
                </div>
              </div>
            </div>
            <button onClick={reset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white/50 hover:text-white/80 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <RotateCcw className="w-3.5 h-3.5" /> New Chat
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-0 pb-4">
            {msgs.map(m => <Message key={m.id} msg={m} searched={(m as CoachMessageWithSearch).searched} />)}

            {loading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.2)' }}>
                  <Brain className="w-4 h-4 animate-pulse" style={{ color: '#E11D48' }} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.048)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: '#E11D48', opacity: 0.6, animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {showStarters && msgs.length <= 1 && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: '#E11D48' }} />
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">Try asking</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {STARTERS.map(q => (
                      <button key={q} onClick={() => send(q)}
                        className="text-left text-[13px] text-white/50 hover:text-white/80 px-4 py-3 rounded-xl transition-all duration-200"
                        style={{ background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(255,255,255,0.06)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(225,29,72,0.3)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 rounded-2xl p-3.5"
            style={{ background: 'rgba(255,255,255,0.032)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-end gap-3">
              <textarea
                ref={textRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask your AI coach anything about 2K26..."
                className="flex-1 bg-transparent text-white text-[14px] placeholder-white/25 outline-none resize-none min-h-[40px] max-h-40 leading-relaxed"
                rows={1}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  background: input.trim() && !loading ? '#E11D48' : 'rgba(255,255,255,0.06)',
                  opacity: !input.trim() || loading ? 0.5 : 1,
                }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-[11px] text-white/25 mt-2">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
