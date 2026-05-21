import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core'
import type { AdapterAccountType } from 'next-auth/adapters'

// ─── NextAuth required tables ─────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  username: text('username'),
  bio: text('bio'),
  isVerified: boolean('is_verified').default(false),
  isPremium: boolean('is_premium').default(false),
  isAdmin: boolean('is_admin').default(false),
  passwordHash: text('password_hash'),
  totalBuilds: integer('total_builds').default(0),
  totalLikes: integer('total_likes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const accounts = pgTable('accounts', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccountType>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
}))

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}))

// ─── App tables ───────────────────────────────────────────────────────────────

export const builds = pgTable('builds', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: text('position').notNull(),
  archetype: text('archetype'),
  height: text('height'),
  weight: integer('weight'),
  wingspan: text('wingspan'),
  takeover: text('takeover'),
  attributes: jsonb('attributes'),
  badges: jsonb('badges').default([]),
  description: text('description'),
  tags: jsonb('tags').default([]),
  category: text('category').default('Park'),
  isPublic: boolean('is_public').default(true),
  likes: integer('likes').default(0),
  saves: integer('saves').default(0),
  views: integer('views').default(0),
  aiAnalysis: jsonb('ai_analysis'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const buildLikes = pgTable('build_likes', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  buildId: text('build_id').notNull().references(() => builds.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (bl) => ({
  compoundKey: primaryKey({ columns: [bl.userId, bl.buildId] }),
}))

export const buildSaves = pgTable('build_saves', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  buildId: text('build_id').notNull().references(() => builds.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (bs) => ({
  compoundKey: primaryKey({ columns: [bs.userId, bs.buildId] }),
}))

export const comments = pgTable('comments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  buildId: text('build_id').notNull().references(() => builds.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const coachSessions = pgTable('coach_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  buildId: text('build_id').references(() => builds.id, { onDelete: 'set null' }),
  messages: jsonb('messages').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const metaTrends = pgTable('meta_trends', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: text('category').notNull(),
  name: text('name').notNull(),
  tier: text('tier').notNull(),
  usageRate: integer('usage_rate').default(0),
  winRate: integer('win_rate').default(0),
  trend: text('trend').default('stable'),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const tutorials = pgTable('tutorials', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description'),
  youtubeId: text('youtube_id'),
  thumbnailUrl: text('thumbnail_url'),
  category: text('category'),
  difficulty: text('difficulty').default('Beginner'),
  tags: jsonb('tags').default([]),
  views: integer('views').default(0),
  duration: text('duration'),
  creator: text('creator'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const follows = pgTable('follows', {
  followerId: text('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: text('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (f) => ({
  compoundKey: primaryKey({ columns: [f.followerId, f.followingId] }),
}))

export const squads = pgTable('squads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  gameMode: text('game_mode').default('Park'),
  description: text('description'),
  inviteCode: text('invite_code').unique().$defaultFn(() => Math.random().toString(36).slice(2, 8).toUpperCase()),
  isOpen: boolean('is_open').default(true),
  maxMembers: integer('max_members').default(5),
  aiAnalysis: jsonb('ai_analysis'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const squadMembers = pgTable('squad_members', {
  squadId: text('squad_id').notNull().references(() => squads.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  build: jsonb('build'),
  role: text('role').default('member'),
  joinedAt: timestamp('joined_at').defaultNow(),
}, (sm) => ({
  pk: primaryKey({ columns: [sm.squadId, sm.userId] }),
}))

export const lfgPosts = pgTable('lfg_posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  myBuild: jsonb('my_build'),
  lookingFor: text('looking_for').array(),
  gameMode: text('game_mode').default('Park'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const messages = pgTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: text('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

// ─── Type exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Build = typeof builds.$inferSelect
export type NewBuild = typeof builds.$inferInsert
export type CoachSession = typeof coachSessions.$inferSelect
export type MetaTrend = typeof metaTrends.$inferSelect
export type Tutorial = typeof tutorials.$inferSelect
export type Squad = typeof squads.$inferSelect
export type NewSquad = typeof squads.$inferInsert
export type SquadMember = typeof squadMembers.$inferSelect
export type NewSquadMember = typeof squadMembers.$inferInsert
export type LfgPost = typeof lfgPosts.$inferSelect
export type NewLfgPost = typeof lfgPosts.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
