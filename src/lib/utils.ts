import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export function getMetaTierColor(tier: string): string {
  const colors: Record<string, string> = {
    S: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    A: 'text-green-400 bg-green-400/10 border-green-400/30',
    B: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    C: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    D: 'text-red-400 bg-red-400/10 border-red-400/30',
  }
  return colors[tier] || colors.C
}

export function getBadgeLevelColor(level: string): string {
  const colors: Record<string, string> = {
    'Hall of Fame': 'text-purple-400 bg-purple-400/10',
    Gold: 'text-yellow-400 bg-yellow-400/10',
    Silver: 'text-gray-300 bg-gray-300/10',
    Bronze: 'text-orange-700 bg-orange-700/10',
  }
  return colors[level] || 'text-gray-400 bg-gray-400/10'
}

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`
  return `${Math.floor(seconds / 2592000)}mo ago`
}

export function positionColor(position: string): string {
  const colors: Record<string, string> = {
    PG: 'text-neon-blue',
    SG: 'text-green-400',
    SF: 'text-yellow-400',
    PF: 'text-orange-400',
    C: 'text-crimson',
  }
  return colors[position] || 'text-text-secondary'
}

export const META_CATEGORIES = [
  'Park', 'Rec', 'Pro-Am', 'ISO', 'Lock',
  'Popper', 'Comp Guard', 'Center', 'Stretch', 'Hybrid Defender',
]

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']

export const BADGE_CATEGORIES = ['Finishing', 'Shooting', 'Playmaking', 'Defense']

export const BADGE_LEVELS = ['Bronze', 'Silver', 'Gold', 'Hall of Fame']
