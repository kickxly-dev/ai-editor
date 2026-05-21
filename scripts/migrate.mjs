/**
 * Safe idempotent migration script.
 * Uses CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS so it can
 * run on a fresh DB or an existing one without errors.
 */
import pg from 'pg'

const { Pool } = pg

const rawUrl = process.env.DATABASE_URL
if (!rawUrl) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

// Render requires SSL
const url = rawUrl.includes('sslmode') ? rawUrl : `${rawUrl}?sslmode=require`

const pool = new Pool({ connectionString: url })

async function run() {
  const client = await pool.connect()
  try {
    console.log('Running migrations...')
    await client.query('BEGIN')

    // ── users ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT,
        email TEXT UNIQUE,
        email_verified TIMESTAMP,
        image TEXT,
        username TEXT,
        bio TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        is_premium BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE,
        password_hash TEXT,
        total_builds INTEGER DEFAULT 0,
        total_likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    // Add any columns that might be missing on existing tables
    const userCols = [
      ['username',     'TEXT'],
      ['bio',          'TEXT'],
      ['is_verified',  'BOOLEAN DEFAULT FALSE'],
      ['is_premium',   'BOOLEAN DEFAULT FALSE'],
      ['is_admin',     'BOOLEAN DEFAULT FALSE'],
      ['password_hash','TEXT'],
      ['total_builds', 'INTEGER DEFAULT 0'],
      ['total_likes',  'INTEGER DEFAULT 0'],
      ['created_at',   'TIMESTAMP DEFAULT NOW()'],
      ['updated_at',   'TIMESTAMP DEFAULT NOW()'],
      ['name',         'TEXT'],
      ['image',        'TEXT'],
      ['email_verified','TIMESTAMP'],
    ]
    for (const [col, type] of userCols) {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} ${type}`)
    }

    // ── accounts ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        PRIMARY KEY (provider, provider_account_id)
      )
    `)

    // ── sessions ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL
      )
    `)

    // ── verification_tokens ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `)

    // ── builds ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS builds (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        position TEXT NOT NULL,
        archetype TEXT,
        height TEXT,
        weight INTEGER,
        wingspan TEXT,
        takeover TEXT,
        attributes JSONB,
        badges JSONB DEFAULT '[]',
        description TEXT,
        tags JSONB DEFAULT '[]',
        category TEXT DEFAULT 'Park',
        is_public BOOLEAN DEFAULT TRUE,
        likes INTEGER DEFAULT 0,
        saves INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        ai_analysis JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ── build_likes ────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS build_likes (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        build_id TEXT NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, build_id)
      )
    `)

    // ── build_saves ────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS build_saves (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        build_id TEXT NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, build_id)
      )
    `)

    // ── comments ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        build_id TEXT NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ── coach_sessions ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS coach_sessions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        build_id TEXT REFERENCES builds(id) ON DELETE SET NULL,
        messages JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ── meta_trends ────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS meta_trends (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        tier TEXT NOT NULL,
        usage_rate INTEGER DEFAULT 0,
        win_rate INTEGER DEFAULT 0,
        trend TEXT DEFAULT 'stable',
        description TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ── tutorials ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS tutorials (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title TEXT NOT NULL,
        description TEXT,
        youtube_id TEXT,
        thumbnail_url TEXT,
        category TEXT,
        difficulty TEXT DEFAULT 'Beginner',
        tags JSONB DEFAULT '[]',
        views INTEGER DEFAULT 0,
        duration TEXT,
        creator TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ── follows ────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS follows (
        follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (follower_id, following_id)
      )
    `)

    // ── squads ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS squads (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_mode TEXT DEFAULT 'Park',
        description TEXT,
        invite_code TEXT UNIQUE,
        is_open BOOLEAN DEFAULT TRUE,
        max_members INTEGER DEFAULT 5,
        ai_analysis JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ── squad_members ──────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS squad_members (
        squad_id TEXT NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        build JSONB,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (squad_id, user_id)
      )
    `)

    // ── lfg_posts ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS lfg_posts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        my_build JSONB,
        looking_for TEXT[],
        game_mode TEXT DEFAULT 'Park',
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ── messages ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query('COMMIT')
    console.log('✓ All tables are up to date')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
