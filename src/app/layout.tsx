'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { ChatProvider } from '@/app/context/ChatContext'
import 'highlight.js/styles/github.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  )
}
