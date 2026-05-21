import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { messages, users } from '@/lib/schema'
import { eq, or, and, desc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const withUserId = searchParams.get('with')

    if (!withUserId) {
      return NextResponse.json({ error: 'with parameter required' }, { status: 400 })
    }

    const conversation = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        read: messages.read,
        createdAt: messages.createdAt,
        senderName: users.name,
        senderUsername: users.username,
        senderImage: users.image,
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.senderId))
      .where(
        or(
          and(eq(messages.senderId, session.user.id), eq(messages.receiverId, withUserId)),
          and(eq(messages.senderId, withUserId), eq(messages.receiverId, session.user.id))
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(100)

    return NextResponse.json({ messages: conversation.reverse() })
  } catch (err) {
    console.error('GET /api/messages error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { receiverId, content } = body

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'receiverId and content are required.' }, { status: 400 })
    }

    if (receiverId === session.user.id) {
      return NextResponse.json({ error: 'Cannot message yourself.' }, { status: 400 })
    }

    const [message] = await db
      .insert(messages)
      .values({
        senderId: session.user.id,
        receiverId,
        content,
        read: false,
      })
      .returning()

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error('POST /api/messages error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const fromUserId = searchParams.get('from')

    if (!fromUserId) {
      return NextResponse.json({ error: 'from parameter required' }, { status: 400 })
    }

    await db
      .update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.senderId, fromUserId),
          eq(messages.receiverId, session.user.id),
          eq(messages.read, false)
        )
      )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/messages error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
