import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { IBM_Plex_Sans_Thai } from 'next/font/google'
import { SHOP_NAME } from '@/lib/config'
import { isSupabaseReady } from '@/lib/supabase'
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
  themeColor: '#1d4ed8',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className={font.className}>
        {!isSupabaseReady && (
          <div className="bg-red-600 px-4 py-2 text-center text-sm text-white">
            ยังไม่ได้ตั้งค่า Supabase: ใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local หรือบน Vercel แล้ว Redeploy
          </div>
        )}
        {children}
      </body>
    </html>
  )
}
