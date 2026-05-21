import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // No adapter — JWT sessions don't need one, and it avoids id type conflicts
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const client = await pool.connect()
        try {
          const { rows } = await client.query(
            'SELECT id, email, name, username, image, password_hash, is_admin FROM users WHERE email = $1 LIMIT 1',
            [credentials.email]
          )
          const user = rows[0]
          if (!user || !user.password_hash) return null
          const valid = await bcrypt.compare(credentials.password as string, user.password_hash)
          if (!valid) return null
          return {
            id: String(user.id),
            email: user.email,
            name: user.name || user.username,
            image: user.image,
            isAdmin: user.is_admin,
          }
        } finally {
          client.release()
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
