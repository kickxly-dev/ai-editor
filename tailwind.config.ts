import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#09090B',
        surface: '#0F0F12',
        card: '#141418',
        border: '#1E1E26',
        muted: '#27272A',
        'muted-fg': '#71717A',
        crimson: {
          DEFAULT: '#E11D48',
          light: '#FB7185',
          dark: '#9F1239',
          muted: 'rgba(225,29,72,0.12)',
          border: 'rgba(225,29,72,0.25)',
        },
        sky: {
          DEFAULT: '#38BDF8',
          muted: 'rgba(56,189,248,0.10)',
          border: 'rgba(56,189,248,0.22)',
        },
        emerald: {
          DEFAULT: '#10B981',
          muted: 'rgba(16,185,129,0.10)',
        },
        amber: {
          DEFAULT: '#F59E0B',
          muted: 'rgba(245,158,11,0.10)',
        },
        violet: {
          DEFAULT: '#8B5CF6',
          muted: 'rgba(139,92,246,0.10)',
        },
        fg: {
          DEFAULT: '#FAFAFA',
          muted: '#A1A1AA',
          subtle: '#52525B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        DEFAULT: '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.4)',
        md: '0 8px 24px rgba(0,0,0,0.5)',
        lg: '0 16px 48px rgba(0,0,0,0.6)',
        card: '0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        'glow-crimson': '0 0 0 1px rgba(225,29,72,0.3), 0 4px 20px rgba(225,29,72,0.2)',
        'glow-sky': '0 0 0 1px rgba(56,189,248,0.3), 0 4px 20px rgba(56,189,248,0.15)',
        'glow-violet': '0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(139,92,246,0.15)',
        'ring-crimson': '0 0 0 3px rgba(225,29,72,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'border-beam': 'borderBeam 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.8)' },
        },
        borderBeam: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
        'crimson-radial': 'radial-gradient(ellipse at center, rgba(225,29,72,0.08) 0%, transparent 70%)',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(225,29,72,0.06), transparent)',
      },
    },
  },
  plugins: [],
}

export default config
