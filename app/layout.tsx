import type { Metadata } from 'next'
import { ReactNode } from 'react'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'
import ErrorBoundary from '@/components/ErrorBoundary'
import SkipToMain from '@/components/SkipToMain'
import AIAssistant from '@/components/AIAssistant'

export const metadata: Metadata = {
  title: 'REFLY — Контроль лётной годности',
  description: 'Система контроля лётной годности воздушных судов · АО REFLY',
  manifest: '/manifest.json',
  themeColor: '#1e3a5f',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'КЛГ' },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <Providers>
          <ErrorBoundary>
            <SkipToMain />
            {children}
            <AIAssistant />
          </ErrorBoundary>
        </Providers>
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(function(){}); }`}
        </Script>
      </body>
    </html>
  )
}
