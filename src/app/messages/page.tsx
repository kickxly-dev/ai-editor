'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { MessageSquare, Send, Loader2, ArrowLeft } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  read: boolean | null
  createdAt: string | null
  senderName: string | null
  senderUsername: string | null
  senderImage: string | null
}

interface Conversation {
  userId: string
  name: string
  username: string | null
  lastMessage: string
  lastTime: string | null
  unreadCount: number
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showList, setShowList] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Build conversation list from all messages involving this user
  // We fetch from each known conversation partner. For simplicity, we maintain a local list.
  // On mount, we fetch all messages to/from current user by querying known contacts.
  // Since we don't have a "list all conversations" endpoint, we fetch messages grouped by userId
  // stored in local state (derived from fetched messages).

  const fetchConversation = useCallback(async (userId: string, markRead = false) => {
    if (!session?.user?.id) return
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/messages?with=${userId}`)
      if (!res.ok) return
      const data = await res.json()
      const msgs: Message[] = data.messages || []
      setMessages(msgs)

      if (markRead) {
        await fetch(`/api/messages?from=${userId}`, { method: 'PATCH' })
      }

      // Update conversation list
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1]
        const partnerId = last.senderId === session.user.id ? last.receiverId : last.senderId
        const partnerName = last.senderId === session.user.id
          ? activeConvo?.name || 'Unknown'
          : (last.senderUsername || last.senderName || 'Unknown')

        setConversations((prev) => {
          const existing = prev.findIndex((c) => c.userId === userId)
          const unread = msgs.filter((m) => m.senderId === userId && !m.read).length
          const updated: Conversation = {
            userId,
            name: partnerName,
            username: last.senderId !== session.user?.id ? last.senderUsername : null,
            lastMessage: last.content,
            lastTime: last.createdAt,
            unreadCount: markRead ? 0 : unread,
          }
          if (existing >= 0) {
            const next = [...prev]
            next[existing] = updated
            return next
          }
          return [...prev, updated]
        })
      }
    } finally {
      setLoadingMessages(false)
    }
  }, [session?.user?.id, activeConvo?.name])

  // Open conversation
  const openConversation = useCallback((convo: Conversation) => {
    setActiveUserId(convo.userId)
    setActiveConvo(convo)
    setShowList(false)
    fetchConversation(convo.userId, true)
  }, [fetchConversation])

  // Polling
  useEffect(() => {
    if (!activeUserId) return
    pollingRef.current = setInterval(() => {
      fetchConversation(activeUserId, true)
    }, 5000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [activeUserId, fetchConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !activeUserId || !session?.user?.id) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activeUserId, content }),
      })
      if (res.ok) {
        await fetchConversation(activeUserId)
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-fg mb-2">Sign in to view messages</h2>
            <p className="text-fg-muted mb-6">Connect with teammates through direct messages.</p>
            <Link href="/login" className="btn btn-primary">Sign In</Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Messages</span>
          </div>
          <h1 className="text-2xl font-bold text-fg">Direct Messages</h1>
        </motion.div>

        <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[400px]">
          {/* Conversation List */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className={`card flex flex-col w-full md:w-72 flex-shrink-0 overflow-hidden ${
              !showList ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-4 border-b border-white/08">
              <p className="font-semibold text-fg text-sm">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="w-8 h-8 text-fg-subtle mx-auto mb-2" />
                  <p className="text-sm text-fg-muted">No conversations yet.</p>
                  <p className="text-xs text-fg-subtle mt-1">Send a DM from the Find page to start.</p>
                </div>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.userId}
                    onClick={() => openConversation(convo)}
                    className={`w-full text-left px-4 py-3 border-b border-white/05 hover:bg-white/04 transition-colors ${
                      activeUserId === convo.userId ? 'bg-white/06' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {convo.name[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-fg truncate">{convo.username || convo.name}</p>
                          {convo.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center flex-shrink-0 ml-1">
                              {convo.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-fg-muted truncate">{convo.lastMessage}</p>
                        <p className="text-xs text-fg-subtle">{timeAgo(convo.lastTime)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>

          {/* Active Conversation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`card flex flex-col flex-1 overflow-hidden ${
              showList && !activeUserId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConvo ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-white/08 flex items-center gap-3">
                  <button
                    onClick={() => setShowList(true)}
                    className="md:hidden text-fg-muted hover:text-fg transition-colors mr-1"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {activeConvo.name[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-fg text-sm">{activeConvo.username || activeConvo.name}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-fg-muted text-sm">
                      No messages yet. Say hello!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId === session.user?.id
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm ${
                              isOwn
                                ? 'bg-rose-500 text-white rounded-tr-sm'
                                : 'bg-white/08 text-fg rounded-tl-sm border border-white/06'
                            }`}
                          >
                            <p className="leading-relaxed">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-rose-200' : 'text-fg-subtle'}`}>
                              {timeAgo(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/08">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="input flex-1 h-10 text-sm"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !newMessage.trim()}
                      className="btn btn-primary h-10 w-10 p-0 flex items-center justify-center flex-shrink-0"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare className="w-12 h-12 text-fg-subtle mx-auto mb-3" />
                  <p className="text-fg-muted">Select a conversation to start messaging.</p>
                  <p className="text-xs text-fg-subtle mt-1">
                    You can start new conversations from the{' '}
                    <Link href="/find" className="text-rose-400 hover:underline">Find</Link>{' '}
                    page.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}
