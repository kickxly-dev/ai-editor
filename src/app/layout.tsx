import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: {
    default: 'CourtIQ — AI-Powered NBA 2K26 Platform',
    template: '%s | CourtIQ',
  },
  description:
    'Build smarter, play better. CourtIQ is the AI-powered NBA 2K26 companion for build analysis, AI coaching, meta tracking, and community.',
  keywords: ['NBA 2K26', 'AI coach', 'build analyzer', 'meta', '2K26 builds', 'CourtIQ'],
  themeColor: '#0A0A0F',
  openGraph: {
    title: 'CourtIQ — AI-Powered NBA 2K26 Platform',
    description: 'Your personal AI 2K coach. Analyze builds, track meta, get coached.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Rajdhani:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#16161E',
              color: '#F8FAFC',
              border: '1px solid #1E1E2A',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#00FF87', secondary: '#0A0A0F' } },
            error: { iconTheme: { primary: '#DC143C', secondary: '#0A0A0F' } },
          }}
        />
      </body>
    </html>
  )
}
