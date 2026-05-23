'use client'
import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ─── SectionLabel ─────────────────────────────────────────────────────────────
// Tiny uppercase label that sits above content blocks.
export function SectionLabel({
  children, className, accent,
}: {
  children: React.ReactNode
  className?: string
  accent?: string
}) {
  return (
    <p
      className={cn('text-[10px] font-bold uppercase tracking-[0.22em] select-none', className)}
      style={{ color: accent ? `${accent}b3` : 'rgba(255,255,255,0.32)' }}
    >
      {children}
    </p>
  )
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
// Standardized page top: optional icon + eyebrow + title + subtitle + action.
export function PageHeader({
  eyebrow, title, subtitle, action, icon: Icon, accent = '#E11D48', className,
}: {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  icon?: React.ElementType
  accent?: string
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-8 md:mb-10', className)}>
      <div className="flex items-start gap-4 min-w-0">
        {Icon && (
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: `${accent}12`, border: `1px solid ${accent}24` }}
          >
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1.5"
              style={{ color: `${accent}cc` }}
            >
              {eyebrow}
            </p>
          )}
          <h1 className="text-[26px] md:text-[34px] font-black text-white leading-[1.05] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/45 text-[14px] md:text-[15px] mt-2 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 hidden sm:block">{action}</div>}
    </div>
  )
}

// ─── Surface ──────────────────────────────────────────────────────────────────
// Elevated glass panel — the new default for content containers.
export function Surface({
  children, className, padding = 'md', accent, hover, ...rest
}: {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  accent?: string
  hover?: boolean
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>) {
  const pad =
    padding === 'none' ? '' :
    padding === 'sm'   ? 'p-3 md:p-4' :
    padding === 'lg'   ? 'p-6 md:p-8' : 'p-4 md:p-5'
  return (
    <div
      {...rest}
      className={cn(
        'relative rounded-2xl overflow-hidden transition-all duration-200',
        hover && 'hover:bg-white/[0.035]',
        pad,
        className,
      )}
      style={{
        background: 'rgba(255,255,255,0.022)',
        border: `1px solid ${accent ? `${accent}28` : 'rgba(255,255,255,0.06)'}`,
        ...rest.style,
      }}
    >
      {children}
    </div>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
// KPI tile — big number, small label, optional sub.
export function MetricCard({
  label, value, sub, icon: Icon, accent = '#E11D48', delta,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon?: React.ElementType
  accent?: string
  delta?: { value: string; positive?: boolean }
}) {
  return (
    <div
      className="relative rounded-2xl p-4 md:p-5 overflow-hidden group transition-all duration-200"
      style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.055)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{label}</p>
        {Icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${accent}12` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
          </div>
        )}
      </div>
      <p className="text-[26px] md:text-[30px] font-black text-white tracking-tight leading-none">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {delta && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{
              background: delta.positive ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
              color: delta.positive ? '#34d399' : '#f87171',
            }}
          >
            {delta.positive ? '↑' : '↓'} {delta.value}
          </span>
        )}
        {sub && <p className="text-[12px] text-white/40">{sub}</p>}
      </div>
    </div>
  )
}

// ─── ToolCard ─────────────────────────────────────────────────────────────────
// Apple-style tool tile. `size="hero"` makes it a large featured card.
export function ToolCard({
  href, icon: Icon, label, desc, accent = '#E11D48', badge, size = 'md', index = 0,
}: {
  href: string
  icon: React.ElementType
  label: string
  desc?: string
  accent?: string
  badge?: string
  size?: 'sm' | 'md' | 'hero'
  index?: number
}) {
  const isHero = size === 'hero'
  const isSm   = size === 'sm'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 + index * 0.04, type: 'spring', stiffness: 280, damping: 26 }}
    >
      <Link
        href={href}
        className={cn(
          'group relative flex rounded-2xl overflow-hidden transition-all duration-300',
          isHero ? 'flex-col h-full min-h-[130px] p-5 md:p-6' :
          isSm   ? 'items-center gap-3 px-3.5 py-3'           :
                   'flex-col h-full min-h-[110px] p-4',
        )}
        style={{
          background: 'rgba(255,255,255,0.022)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Hover gradient */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top left, ${accent}10 0%, transparent 60%)` }}
        />
        {/* Hover border accent */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1px ${accent}28` }}
        />

        <div className={cn('flex items-start justify-between relative z-10', isSm ? 'contents' : 'mb-auto')}>
          <div
            className={cn(
              'rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105',
              isHero ? 'w-10 h-10' : isSm ? 'w-8 h-8' : 'w-8 h-8',
            )}
            style={{ background: `${accent}14`, border: `1px solid ${accent}26` }}
          >
            <Icon className={cn(isHero ? 'w-5 h-5' : 'w-4 h-4')} style={{ color: accent }} />
          </div>

          {isSm ? (
            <div className="min-w-0 flex-1">
              <p className="text-white text-[13px] font-semibold leading-tight truncate">{label}</p>
            </div>
          ) : (
            badge && (
              <span
                className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: `${accent}1c`, color: accent, border: `1px solid ${accent}30` }}
              >
                {badge}
              </span>
            )
          )}
        </div>

        {!isSm && (
          <div className="relative z-10 mt-3">
            <p className={cn('text-white font-bold leading-tight tracking-tight', isHero ? 'text-[17px]' : 'text-[14px]')}>
              {label}
            </p>
            {desc && (
              <p className={cn('text-white/40 mt-1 leading-snug', isHero ? 'text-[12px]' : 'text-[11px]')}>
                {desc}
              </p>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  )
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
export function Pill({
  children, accent, className,
}: {
  children: React.ReactNode
  accent?: string
  className?: string
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', className)}
      style={{
        background: accent ? `${accent}14` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${accent ? `${accent}30` : 'rgba(255,255,255,0.08)'}`,
        color: accent || 'rgba(255,255,255,0.6)',
      }}
    >
      {children}
    </span>
  )
}
