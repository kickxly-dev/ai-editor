import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

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

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const isAdmin = email === process.env.ADMIN_EMAIL

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name: username,
        username,
        passwordHash,
        isAdmin,
      })
      .returning({ id: users.id })

    return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Signup error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
