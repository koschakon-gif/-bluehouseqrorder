import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { IBM_Plex_Sans_Thai } from 'next/font/google'
import { SHOP_NAME } from '@/lib/config'
import './globals.css'

const font = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: SHOP_NAME + ' | สั่งอาหารที่โต๊ะ',
  description: 'สแกน QR บนโต๊ะ เลือกเมนู แล้วสั่งได้ทันที',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7D5537',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className={font.className}>
        {children}
      </body>
    </html>
  )
}
