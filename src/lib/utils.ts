import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`
  return n.toString()
}

export function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60)     return 'just now'
  if (s < 3600)   return `${Math.floor(s/60)}m ago`
  if (s < 86400)  return `${Math.floor(s/3600)}h ago`
  if (s < 2592000)return `${Math.floor(s/86400)}d ago`
  return `${Math.floor(s/2592000)}mo ago`
}

export function getMetaTierColor(tier: string): string {
  const m: Record<string,string> = {
    S: 'text-amber-400  bg-amber-400/8  border-amber-400/25',
    A: 'text-emerald-400 bg-emerald-400/8 border-emerald-400/25',
    B: 'text-sky-400    bg-sky-400/8    border-sky-400/25',
    C: 'text-orange-400 bg-orange-400/8 border-orange-400/25',
    D: 'text-zinc-400   bg-zinc-400/8   border-zinc-400/25',
  }
  return m[tier] || m.C
}

export const POSITIONS     = ['PG','SG','SF','PF','C']
export const META_CATEGORIES = ['Park','Rec','Pro-Am','ISO','Lock','Popper','Comp Guard','Center','Stretch','Hybrid Defender']
export const BADGE_CATEGORIES = ['Finishing','Shooting','Playmaking','Defense']
export const BADGE_LEVELS  = ['Bronze','Silver','Gold','Hall of Fame']
