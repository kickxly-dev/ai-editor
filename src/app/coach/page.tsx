'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, User, Zap, RotateCcw, Copy, ThumbsUp, ChevronDown } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CoachMessage } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STARTER_QUESTIONS = [
  'What badges should I prioritize for a Shot Creator guard?',
  'How do I stop getting cooked on defense?',
  'What is the best jumpshot for a 6\'4" guard right now?',
  'Why am I always getting blocked when I drive?',
  'Which animations should I use for park?',
  'What is the strongest build meta right now in 2K26?',
  'How do I get better at reading pick and roll defense?',
]

function MessageBubble({ msg }: { msg: CoachMessage }) {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)

  const copyText = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-crimson/10 border border-crimson/20 flex items-center justify-center flex-shrink-0 mt-1">
          <Brain className="w-4 h-4 text-crimson" />
        </div>
      )}

      <div className={cn('max-w-[80%] group', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-crimson text-white rounded-tr-sm'
              : 'bg-card border border-border text-text-primary rounded-tl-sm'
          )}
        >
          {msg.content.split('\n').map((line, i) => (
            <p key={i} className={line === '' ? 'h-2' : ''}>
              {line}
            </p>
          ))}
        </div>

        {!isUser && (
          <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={copyText}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button className="flex items-center gap-1 text-xs text-text-muted hover:text-green-400 transition-colors">
              <ThumbsUp className="w-3 h-3" />
              Helpful
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-text-secondary" />
        </div>
      )}
    </motion.div>
  )
}

export default function CoachPage() {
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: "What's good! I'm your CourtIQ AI coach — powered by Groq. Ask me anything about your 2K26 build, meta, badges, animations, or how to improve your game. Let's get to work. 🏀",
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showStarters, setShowStarters] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading) return

    const userMsg: CoachMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setShowStarters(false)
    setLoading(true)

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const assistantMsg: CoachMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: unknown) {
      toast.error('Coach is unavailable right now.')
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I ran into an issue. Check your connection and try again.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: "New session started. What do you want to work on?",
      timestamp: new Date().toISOString(),
    }])
    setShowStarters(true)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-20 pb-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between py-4 border-b border-border mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-crimson/10 border border-crimson/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-crimson" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">AI Coach</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-text-muted">Groq — Online</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearChat} className="gap-2">
            <RotateCcw className="w-3.5 h-3.5" />
            New Chat
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide min-h-[400px]">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-crimson/10 border border-crimson/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-crimson animate-pulse" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-crimson/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-crimson/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-crimson/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Starter questions */}
          <AnimatePresence>
            {showStarters && messages.length <= 1 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4"
              >
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left text-xs text-text-secondary hover:text-text-primary bg-surface hover:bg-card border border-border hover:border-crimson/30 px-4 py-3 rounded-xl transition-all"
                  >
                    {q}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-4 glass-card p-3">
          <div className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI coach anything about 2K26..."
              className="flex-1 min-h-[48px] max-h-40 border-0 bg-transparent focus-visible:ring-0 focus-visible:border-0 resize-none p-0 text-sm"
              rows={1}
            />
            <Button
              size="icon"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className={cn(
                'flex-shrink-0 transition-all',
                !input.trim() || loading ? 'opacity-50' : 'shadow-crimson'
              )}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-2 px-1">
            Press Enter to send · Shift+Enter for new line · Powered by Groq AI
          </p>
        </div>
      </div>
    </div>
  )
}
