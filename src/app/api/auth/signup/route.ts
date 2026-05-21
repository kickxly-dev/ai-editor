import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

// Ensure all required columns exist — runs once per cold start
let schemaReady = false
async function ensureSchema() {
  if (schemaReady) return
  const cols = [
    ['name',          'TEXT'],
    ['username',      'TEXT'],
    ['bio',           'TEXT'],
    ['is_verified',   'BOOLEAN DEFAULT FALSE'],
    ['is_premium',    'BOOLEAN DEFAULT FALSE'],
    ['is_admin',      'BOOLEAN DEFAULT FALSE'],
    ['password_hash', 'TEXT'],
    ['total_builds',  'INTEGER DEFAULT 0'],
    ['total_likes',   'INTEGER DEFAULT 0'],
    ['created_at',    'TIMESTAMP DEFAULT NOW()'],
    ['updated_at',    'TIMESTAMP DEFAULT NOW()'],
  ]
  const client = await pool.connect()
  try {
    for (const [col, type] of cols) {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} ${type}`)
    }
    schemaReady = true
  } finally {
    client.release()
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, username } = body

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Email, password, and username are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    await ensureSchema()

    const client = await pool.connect()
    try {
      // Check duplicate email
      const { rows: existing } = await client.query(
        'SELECT id FROM users WHERE email = $1 LIMIT 1',
        [email]
      )
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const isAdmin = email === process.env.ADMIN_EMAIL

      const { rows } = await client.query(
        `INSERT INTO users (email, name, username, password_hash, is_admin)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id::text`,
        [email, username, username, passwordHash, isAdmin]
      )

      return NextResponse.json({ success: true, userId: rows[0].id }, { status: 201 })
    } finally {
      client.release()
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Signup error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
