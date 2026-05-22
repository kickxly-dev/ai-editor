export interface Build {
  id: string
  user_id: string
  name: string
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C'
  archetype: string
  height: string
  weight: number
  wingspan: string
  attributes: BuildAttributes
  badges: Badge[]
  takeover: string
  image_url?: string
  description?: string
  tags: string[]
  category: BuildCategory
  likes: number
  saves: number
  views: number
  is_public: boolean
  ai_analysis?: AIAnalysis
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface BuildAttributes {
  // Finishing
  close_shot: number
  driving_layup: number
  driving_dunk: number
  standing_dunk: number
  post_control: number
  // Shooting
  mid_range: number
  three_point: number
  free_throw: number
  // Playmaking
  pass_accuracy: number
  ball_handle: number
  speed_with_ball: number
  // Defense/Rebounding
  interior_defense: number
  perimeter_defense: number
  steal: number
  block: number
  offensive_rebound: number
  defensive_rebound: number
  // Athleticism
  speed: number
  agility: number
  strength: number
  vertical: number
}

export interface Badge {
  name: string
  level: 'Bronze' | 'Silver' | 'Gold' | 'Hall of Fame'
  category: 'Finishing' | 'Shooting' | 'Playmaking' | 'Defense'
}

export interface AIAnalysis {
  archetype: string
  strengths: string[]
  weaknesses: string[]
  skill_ceiling: number
  competitiveness: number
  playstyle_summary: string
  offensive_role: string
  defensive_role: string
  upgrade_recommendations: string[]
  badge_recommendations: string[]
  animation_recommendations: string[]
  takeover_recommendation: string
  overall_rating: number
  meta_viability: 'S' | 'A' | 'B' | 'C' | 'D'
}

export interface CoachMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface CoachSession {
  id: string
  user_id: string
  build_id?: string
  messages: CoachMessage[]
  created_at: string
}

export interface Profile {
  id: string
  email: string
  username: string
  avatar_url?: string
  bio?: string
  is_verified: boolean
  is_premium: boolean
  total_builds: number
  total_likes: number
  followers: number
  following: number
  created_at: string
}

export interface MetaTrend {
  id: string
  category: 'build' | 'badge' | 'animation' | 'takeover'
  name: string
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  usage_rate: number
  win_rate: number
  trend: 'rising' | 'stable' | 'falling'
  description: string
  updated_at: string
}

export interface Tutorial {
  id: string
  title: string
  description: string
  youtube_id: string
  thumbnail_url: string
  category: TutorialCategory
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  tags: string[]
  views: number
  duration: string
  creator: string
}

export type BuildCategory =
  | 'Park'
  | 'Rec'
  | 'Pro-Am'
  | 'ISO'
  | 'Lock'
  | 'Popper'
  | 'Comp Guard'
  | 'Center'
  | 'Stretch'
  | 'Hybrid Defender'

export type TutorialCategory =
  | 'Dribbling'
  | 'Shooting'
  | 'Defense'
  | 'Playmaking'
  | 'Build Creation'
  | 'Meta'
  | 'Advanced'

export interface AnalyzeResponse {
  success: boolean
  analysis: AIAnalysis
  tokens_used: number
}

export interface ChatResponse {
  success: boolean
  message: string
  tokens_used: number
}
