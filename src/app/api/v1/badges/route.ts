import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-CourtIQ-API': 'v1',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

const SEASON5_BADGES = [
  // S tier
  { name: 'Deadeye', tier: 'S', category: 'Shooting', description: 'Reduces shot contest penalty on jumpers' },
  { name: 'Set Shot Specialist', tier: 'S', category: 'Shooting', description: 'Standstill and catch-and-shoot jumpers' },
  { name: 'Shifty Shooter', tier: 'S', category: 'Shooting', description: 'Off-the-dribble difficult shots, fading, step-back pull-ups' },
  { name: 'Dimer', tier: 'S', category: 'Playmaking', description: 'Passing boosts to open teammates' },
  { name: 'Lightning Launch', tier: 'S', category: 'Finishing', description: 'Explosive first step out of triple threat and off the dribble' },
  { name: 'Challenger', tier: 'S', category: 'Defense', description: 'Improved shot contest quality and timing' },
  { name: 'Interceptor', tier: 'S', category: 'Defense', description: 'Pass deflections and interceptions' },
  { name: 'Pogo Stick', tier: 'S', category: 'Defense', description: 'Quick successive jumps for shot blocks and rebounds' },
  { name: 'Rebound Chaser', tier: 'S', category: 'Defense', description: 'Tracking and chasing down missed shots' },
  // A tier
  { name: 'Limitless Range', tier: 'A', category: 'Shooting', description: 'Extends 3PT range beyond the arc' },
  { name: 'Mini Marksman', tier: 'A', category: 'Shooting', description: 'Shooting boost for shorter/smaller builds' },
  { name: 'Strong Handle', tier: 'A', category: 'Playmaking', description: 'Tight ball control under defensive pressure' },
  { name: 'Versatile Visionary', tier: 'A', category: 'Playmaking', description: 'Playmaking vision and passing in multiple situations' },
  { name: 'Break Starter', tier: 'A', category: 'Playmaking', description: 'Outlet passes in transition' },
  { name: 'Handles for Days', tier: 'A', category: 'Playmaking', description: 'Reduces stamina drain on dribble moves' },
  { name: 'Pick Dodger', tier: 'A', category: 'Playmaking', description: 'Navigating through and around screens on offense' },
  { name: 'Posterizer', tier: 'A', category: 'Finishing', description: 'Dunk over and through defenders' },
  { name: 'Rise Up', tier: 'A', category: 'Finishing', description: 'Standing dunks and posterizing attempts in the paint' },
  { name: 'High-Flying Denier', tier: 'A', category: 'Finishing', description: 'Explosive dunk attempts over and around defenders' },
  { name: 'On-Ball Menace', tier: 'A', category: 'Defense', description: 'On-ball defensive pressure — reduces opponent attributes' },
  { name: 'Immovable Enforcer', tier: 'A', category: 'Defense', description: 'Interior defense — hard to back down in the post' },
  { name: 'Boxout Beast', tier: 'A', category: 'Defense', description: 'Boxing out opponents on rebounds' },
  { name: 'Paint Patroller', tier: 'A', category: 'Defense', description: 'Protecting the paint — improves shot contests inside' },
  { name: 'Brick Wall', tier: 'A', category: 'Defense', description: 'Setting physical screens and being harder to move through' },
  { name: 'Off-Ball Pest', tier: 'A', category: 'Defense', description: 'Bothering off-ball offensive players and denying passes' },
  // B tier
  { name: 'Bail Out', tier: 'B', category: 'Playmaking', description: 'Passing out of the air and skip passes' },
  { name: 'Ankle Assassin', tier: 'B', category: 'Playmaking', description: 'Ankle-breaking dribble moves' },
  { name: 'Unpluckable', tier: 'B', category: 'Playmaking', description: 'Reduces steal success against you when dribbling' },
  { name: 'Float Game', tier: 'B', category: 'Finishing', description: 'Floaters and runners in the paint' },
  { name: 'Layup Mixmaster', tier: 'B', category: 'Finishing', description: 'Varied layup packages — off-balance and leaning finishes' },
  { name: 'Aerial Wizard', tier: 'B', category: 'Finishing', description: 'Alley-oops and put-back finishes' },
  { name: 'Post Up Poet', tier: 'B', category: 'Finishing', description: 'Post up scoring and faking from the block' },
  { name: 'Post Fade Phenom', tier: 'B', category: 'Finishing', description: 'Post fade-away shots and step-through moves' },
  { name: 'Post Powerhouse', tier: 'B', category: 'Finishing', description: 'Power post moves and drop steps' },
  { name: 'Glove', tier: 'B', category: 'Defense', description: 'Stealing the ball from ball-handlers' },
  { name: 'Post Lockdown', tier: 'B', category: 'Defense', description: 'Defending in the post against post scorers' },
  // C tier
  { name: 'Physical Finisher', tier: 'C', category: 'Finishing', description: 'Contact layups and dunks through physical defenders' },
  { name: 'Post Prodigy', tier: 'C', category: 'Finishing', description: 'Overall post game effectiveness' },
  { name: 'Hook Specialist', tier: 'C', category: 'Finishing', description: 'Hook shots from the post' },
  { name: 'Slippery Off-Ball', tier: 'C', category: 'Finishing', description: 'Off-ball movement and getting open cuts' },
  // D tier
  { name: 'Paint Prodigy', tier: 'D', category: 'Finishing', description: 'General paint finishing boost' },
]

export async function GET() {
  const byTier: Record<string, typeof SEASON5_BADGES> = {}
  const byCategory: Record<string, typeof SEASON5_BADGES> = {}

  for (const badge of SEASON5_BADGES) {
    if (!byTier[badge.tier]) byTier[badge.tier] = []
    byTier[badge.tier].push(badge)
    if (!byCategory[badge.category]) byCategory[badge.category] = []
    byCategory[badge.category].push(badge)
  }

  return NextResponse.json({
    data: SEASON5_BADGES,
    by_tier: byTier,
    by_category: byCategory,
    meta: {
      count: SEASON5_BADGES.length,
      season: 5,
      game: 'NBA 2K26',
      tiers: ['S', 'A', 'B', 'C', 'D'],
      categories: ['Finishing', 'Shooting', 'Playmaking', 'Defense'],
      note: 'Verified from Season 5 community tier list — May 2026',
    },
  }, { headers: corsHeaders() })
}
