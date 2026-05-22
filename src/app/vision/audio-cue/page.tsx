'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AudioCueSniffer from '@/components/vision/AudioCueSniffer'

export default function AudioCuePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !isAdmin) router.replace('/vision')
  }, [session, status, isAdmin, router])

  if (status === 'loading' || !isAdmin) return null

  return <AudioCueSniffer />
}
