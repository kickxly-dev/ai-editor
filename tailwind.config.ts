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
        // Layer system
        bg:      '#07070C',
        l1:      '#0E0E18',
        l2:      '#141420',
        l3:      '#1A1A28',
        border:  'rgba(255,255,255,0.1)',
        // Keep legacy names for compatibility
        surface: '#141420',
        card:    '#0E0E18',
        muted:   '#1A1A28',
        'muted-fg': 'rgba(255,255,255,0.35)',
        crimson: {
          DEFAULT: '#E11D48',
          light:   '#FF6B81',
          dark:    '#C0133A',
          muted:   'rgba(225,29,72,0.12)',
          border:  'rgba(225,29,72,0.28)',
        },
        sky: {
          DEFAULT: '#38BDF8',
          muted:   'rgba(56,189,248,0.1)',
          border:  'rgba(56,189,248,0.25)',
        },
        emerald: {
          DEFAULT: '#10B981',
          muted:   'rgba(16,185,129,0.1)',
        },
        amber: {
          DEFAULT: '#F59E0B',
          muted:   'rgba(245,158,11,0.1)',
        },
        violet: {
          DEFAULT: '#8B5CF6',
          muted:   'rgba(139,92,246,0.1)',
        },
        fg: {
          DEFAULT: '#F2F2F7',
          muted:   'rgba(255,255,255,0.55)',
          subtle:  'rgba(255,255,255,0.3)',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        sm:    '6px',
        DEFAULT: '8px',
        md:    '10px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        sm:            '0 1px 3px rgba(0,0,0,0.5)',
        DEFAULT:       '0 4px 16px rgba(0,0,0,0.5)',
        md:            '0 8px 32px rgba(0,0,0,0.55)',
        lg:            '0 16px 48px rgba(0,0,0,0.65)',
        card:          '0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 32px rgba(0,0,0,0.4)',
        'glow-crimson':'0 0 0 1px rgba(225,29,72,0.3), 0 4px 24px rgba(225,29,72,0.25)',
        'glow-sky':    '0 0 0 1px rgba(56,189,248,0.3), 0 4px 20px rgba(56,189,248,0.18)',
        'glow-violet': '0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(139,92,246,0.18)',
      },
      animation: {
        'fade-in':   'fadeIn 0.35s ease-out',
        'slide-up':  'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':  'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        float:       'float 6s ease-in-out infinite',
        shimmer:     'shimmer 1.8s linear infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        slideUp: { '0%': { opacity:'0', transform:'translateY(16px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        scaleIn: { '0%': { opacity:'0', transform:'scale(0.95)' }, '100%': { opacity:'1', transform:'scale(1)' } },
        float:   { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-8px)' } },
        shimmer: { '0%': { backgroundPosition:'-400px 0' }, '100%': { backgroundPosition:'400px 0' } },
        pulseDot:{ '0%,100%': { opacity:'1', transform:'scale(1)' }, '50%': { opacity:'0.4', transform:'scale(0.8)' } },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        'crimson-radial': 'radial-gradient(ellipse at center, rgba(225,29,72,0.1) 0%, transparent 65%)',
      },
    },
  },
  plugins: [],
}

export default config
