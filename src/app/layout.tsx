import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: { default: 'CourtIQ — AI NBA 2K26 Platform', template: '%s | CourtIQ' },
  description: 'Build smarter, play better. AI-powered NBA 2K26 build analysis, coaching, and meta tracking.',
  themeColor: '#09090B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Toaster position="bottom-right" toastOptions={{
          style: { background:'#141418', color:'#FAFAFA', border:'1px solid #1E1E26', borderRadius:'10px', fontSize:'13px' },
          success: { iconTheme: { primary:'#10B981', secondary:'#09090B' } },
          error:   { iconTheme: { primary:'#E11D48', secondary:'#09090B' } },
        }} />
      </body>
    </html>
  )
}
