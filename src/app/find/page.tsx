'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, X, Send, Clock, Loader2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

interface LfgPost {
  id: string
  title: string
  myBuild: {
    position?: string
    height?: string
    archetype?: string
    badges?: string[]
  } | null
  lookingFor: string[] | null
  gameMode: string | null
  description: string | null
  isActive: boolean | null
  createdAt: string | null
  userId: string
  userName: string | null
  userUsername: string | null
  userImage: string | null
}

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']
const GAME_MODES = ['All', 'Park', 'Rec', 'Pro-Am']

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

function DMModal({ post, onClose, currentUserId }: {
  post: LfgPost
  onClose: () => void
  currentUserId: string
}) {
  const [message, setMessage] = useState(`Hey! I saw your LFG post "${post.title}" and I'm interested.`)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: post.userId, content: message }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to send.')
        return
      }
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="card p-6 w-full max-w-md"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-fg">Send Message</h3>
            <p className="text-xs text-fg-muted mt-0.5">To: {post.userUsername || post.userName || 'Unknown'}</p>
          </div>
          <button onClick={onClose} className="text-fg-muted hover:text-fg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-6">
            <Send className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <p className="text-fg font-semibold">Message sent!</p>
            <p className="text-sm text-fg-muted mt-1">Check your messages for their reply.</p>
            <button onClick={onClose} className="btn btn-secondary mt-4">Close</button>
          </div>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="input resize-none w-full mb-3"
              placeholder="Write your message..."
            />
            {error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
            <button onClick={handleSend} disabled={sending || !message.trim()} className="btn btn-primary w-full gap-1.5">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Message
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function FindPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<LfgPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMode, setFilterMode] = useState('All')
  const [filterPos, setFilterPos] = useState('All')
  const [dmPost, setDmPost] = useState<LfgPost | null>(null)

  // Post form
  const [showForm, setShowForm] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postMyPos, setPostMyPos] = useState('')
  const [postArchetype, setPostArchetype] = useState('')
  const [postLookingFor, setPostLookingFor] = useState<string[]>([])
  const [postMode, setPostMode] = useState('Park')
  const [postDesc, setPostDesc] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/lfg')
      const data = await res.json()
      setPosts(data.posts || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleToggleLookingFor = (pos: string) => {
    setPostLookingFor((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    )
  }

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setPostError('')
    setPosting(true)
    try {
      const res = await fetch('/api/lfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postTitle,
          myBuild: postMyPos ? { position: postMyPos, archetype: postArchetype } : null,
          lookingFor: postLookingFor,
          gameMode: postMode,
          description: postDesc,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPostError(data.error || 'Failed to post.')
        return
      }
      setPostTitle('')
      setPostMyPos('')
      setPostArchetype('')
      setPostLookingFor([])
      setPostDesc('')
      setShowForm(false)
      fetchPosts()
    } finally {
      setPosting(false)
    }
  }

  const filtered = posts.filter((p) => {
    if (filterMode !== 'All' && p.gameMode !== filterMode) return false
    if (filterPos !== 'All' && !(p.lookingFor || []).includes(filterPos)) return false
    return true
  })

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Teammate Finder</span>
          </div>
          <h1 className="text-3xl font-bold text-fg">Find Your Squad</h1>
          <p className="text-fg-muted mt-1">Browse player listings and connect with teammates in NBA 2K26.</p>
        </motion.div>

        {/* Post a Listing (signed-in only, collapsible) */}
        {session?.user && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-secondary gap-1.5 mb-3"
            >
              {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showForm ? 'Hide Form' : 'Post a Listing'}
            </button>

            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="card p-5">
                    <h2 className="font-semibold text-fg mb-4">Post a Listing</h2>
                    <form onSubmit={handlePost} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">Title</label>
                        <input
                          type="text"
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value)}
                          placeholder="e.g. LF1 PG for park runs"
                          className="input"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">My Position</label>
                          <select value={postMyPos} onChange={(e) => setPostMyPos(e.target.value)} className="input">
                            <option value="">Select</option>
                            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">Archetype</label>
                          <input
                            type="text"
                            value={postArchetype}
                            onChange={(e) => setPostArchetype(e.target.value)}
                            placeholder="e.g. Shot Creator"
                            className="input"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">Looking For</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {POSITIONS.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handleToggleLookingFor(p)}
                              className={`chip cursor-pointer transition-colors ${
                                postLookingFor.includes(p)
                                  ? 'text-rose-400 border-rose-500/40 bg-rose-500/15'
                                  : 'hover:border-white/20'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">Game Mode</label>
                        <select value={postMode} onChange={(e) => setPostMode(e.target.value)} className="input">
                          {GAME_MODES.filter((m) => m !== 'All').map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">Description</label>
                        <textarea
                          value={postDesc}
                          onChange={(e) => setPostDesc(e.target.value)}
                          placeholder="Tell potential teammates about yourself..."
                          className="input min-h-[72px] resize-none"
                        />
                      </div>
                      {postError && <p className="text-xs text-rose-400">{postError}</p>}
                      <button type="submit" disabled={posting} className="btn btn-primary gap-1.5">
                        {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Post Listing
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Filter bar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-muted">Mode:</span>
            {GAME_MODES.map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`chip cursor-pointer transition-colors ${
                  filterMode === m ? 'text-rose-400 border-rose-500/40 bg-rose-500/15' : 'hover:border-white/20'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-muted">LF:</span>
            {['All', ...POSITIONS].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPos(p)}
                className={`chip cursor-pointer transition-colors ${
                  filterPos === p ? 'text-violet-400 border-violet-500/40 bg-violet-500/15' : 'hover:border-white/20'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Listings grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-10 h-10 text-fg-subtle mx-auto mb-3" />
            <p className="text-fg-muted">No listings found. {!session?.user && 'Sign in to post your own!'}</p>
            {!session?.user && (
              <Link href="/login" className="btn btn-primary mt-4">Sign In</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-4 flex flex-col gap-3"
              >
                {/* User */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(post.userUsername || post.userName || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-fg truncate">{post.userUsername || post.userName || 'Unknown'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-fg-subtle" />
                      <span className="text-xs text-fg-subtle">{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                  <span className="chip flex-shrink-0">{post.gameMode}</span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-fg">{post.title}</h3>

                {/* Build chip */}
                {post.myBuild && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {post.myBuild.position && <span className="chip text-rose-400 border-rose-500/30 bg-rose-500/10">{post.myBuild.position}</span>}
                    {post.myBuild.archetype && <span className="text-xs text-fg-muted">{post.myBuild.archetype}</span>}
                  </div>
                )}

                {/* Looking For */}
                {post.lookingFor && post.lookingFor.length > 0 && (
                  <div>
                    <p className="text-xs text-fg-muted mb-1">Looking for:</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {post.lookingFor.map((pos) => (
                        <span key={pos} className="chip text-violet-400 border-violet-500/30 bg-violet-500/10">{pos}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {post.description && (
                  <p className="text-xs text-fg-muted line-clamp-2">{post.description}</p>
                )}

                {/* DM button */}
                {session?.user && session.user.id !== post.userId && (
                  <button
                    onClick={() => setDmPost(post)}
                    className="btn btn-secondary btn-sm gap-1.5 mt-auto"
                  >
                    <Send className="w-3.5 h-3.5" /> Send DM
                  </button>
                )}
                {!session?.user && (
                  <Link href="/login" className="btn btn-secondary btn-sm gap-1.5 mt-auto justify-center">
                    Sign in to message
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* DM Modal */}
      <AnimatePresence>
        {dmPost && session?.user && (
          <DMModal
            post={dmPost}
            onClose={() => setDmPost(null)}
            currentUserId={session.user.id!}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
