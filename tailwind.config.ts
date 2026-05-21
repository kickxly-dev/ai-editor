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
        background: '#0A0A0F',
        surface: '#111118',
        card: '#16161E',
        border: '#1E1E2A',
        muted: '#2A2A38',
        crimson: {
          DEFAULT: '#DC143C',
          dark: '#A50E2D',
          light: '#FF1F4F',
          glow: 'rgba(220,20,60,0.3)',
        },
        neon: {
          blue: '#00D4FF',
          purple: '#7C3AED',
          green: '#00FF87',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-crimson': 'linear-gradient(135deg, #DC143C 0%, #7C3AED 100%)',
        'gradient-neon': 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0A0A0F 0%, #111118 100%)',
        'hero-grid': 'linear-gradient(rgba(220,20,60,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(220,20,60,0.03) 1px, transparent 1px)',
      },
      boxShadow: {
        'crimson': '0 0 20px rgba(220,20,60,0.4), 0 0 40px rgba(220,20,60,0.2)',
        'neon': '0 0 20px rgba(0,212,255,0.4), 0 0 40px rgba(0,212,255,0.2)',
        'purple': '0 0 20px rgba(124,58,237,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'glow': '0 0 30px rgba(220,20,60,0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideUp': 'slideUp 0.5s ease-out',
        'slideIn': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(220,20,60,0.2)' },
          '100%': { boxShadow: '0 0 40px rgba(220,20,60,0.5), 0 0 80px rgba(220,20,60,0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
