import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Add missing columns if they don't exist
let schemaReady = false
async function ensureAuthSchema() {
  if (schemaReady) return
  const client = await pool.connect()
  try {
    const cols = [
      ['name',          'TEXT'],
      ['username',      'TEXT'],
      ['image',         'TEXT'],
      ['email_verified','TIMESTAMP'],
      ['is_admin',      'BOOLEAN DEFAULT FALSE'],
      ['password_hash', 'TEXT'],
    ]
    for (const [col, type] of cols) {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} ${type}`)
    }
    schemaReady = true
  } catch (e) {
    console.error('ensureAuthSchema error:', e)
  } finally {
    client.release()
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        try {
          await ensureAuthSchema()
          const client = await pool.connect()
          try {
            const { rows } = await client.query(
              `SELECT id::text, email, name, username, image, password_hash, is_admin
               FROM users WHERE email = $1 LIMIT 1`,
              [email]
            )
            const user = rows[0]
            if (!user) {
              console.log('Auth: no user found for', email)
              return null
            }
            if (!user.password_hash) {
              console.log('Auth: user has no password_hash', email)
              return null
            }
            const valid = await bcrypt.compare(password, user.password_hash)
            if (!valid) {
              console.log('Auth: wrong password for', email)
              return null
            }
            // Always enforce admin status based on ADMIN_EMAIL env var
            const shouldBeAdmin = email === process.env.ADMIN_EMAIL
            if (shouldBeAdmin && !user.is_admin) {
              await client.query('UPDATE users SET is_admin = TRUE WHERE id = $1', [user.id])
              user.is_admin = true
            }
            return {
              id: user.id,
              email: user.email,
              name: user.name || user.username,
              image: user.image,
              isAdmin: user.is_admin,
            }
          } finally {
            client.release()
          }
        } catch (err) {
          console.error('Auth authorize error:', err)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string
        ;(session.user as { isAdmin?: boolean }).isAdmin = token.isAdmin as boolean
      }
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
  trustHost: true,
})
