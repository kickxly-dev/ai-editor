import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { lfgPosts, users } from '@/lib/schema'
import { eq, desc, and } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const posts = await db
      .select({
        id: lfgPosts.id,
        title: lfgPosts.title,
        myBuild: lfgPosts.myBuild,
        lookingFor: lfgPosts.lookingFor,
        gameMode: lfgPosts.gameMode,
        description: lfgPosts.description,
        isActive: lfgPosts.isActive,
        createdAt: lfgPosts.createdAt,
        userId: lfgPosts.userId,
        userName: users.name,
        userUsername: users.username,
        userImage: users.image,
      })
      .from(lfgPosts)
      .innerJoin(users, eq(users.id, lfgPosts.userId))
      .where(eq(lfgPosts.isActive, true))
      .orderBy(desc(lfgPosts.createdAt))
      .limit(20)

    return NextResponse.json({ posts })
  } catch (err) {
    console.error('GET /api/lfg error:', err)
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
    const { title, myBuild, lookingFor, gameMode, description } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    }

    const [post] = await db
      .insert(lfgPosts)
      .values({
        userId: session.user.id,
        title,
        myBuild: myBuild || null,
        lookingFor: lookingFor || [],
        gameMode: gameMode || 'Park',
        description: description || null,
        isActive: true,
      })
      .returning()

    return NextResponse.json({ post }, { status: 201 })
  } catch (err) {
    console.error('POST /api/lfg error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Post ID required' }, { status: 400 })

    const [post] = await db.select().from(lfgPosts).where(eq(lfgPosts.id, id)).limit(1)
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db
      .update(lfgPosts)
      .set({ isActive: false })
      .where(and(eq(lfgPosts.id, id), eq(lfgPosts.userId, session.user.id)))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/lfg error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
