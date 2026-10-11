'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SHOP_NAME, TOTAL_TABLES } from '@/lib/config'

// ถ้าตั้ง NEXT_PUBLIC_SITE_URL ไว้ QR จะใช้โดเมนนี้เสมอ (แนะนำ)
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '')

const qrImage = (url: string) =>
  'https://api.qrserver.com/v1/create-qr-code/?size=500x500&qzone=2&data=' + encodeURIComponent(url)

export default function QrPage() {
  const [origin, setOrigin] = useState(SITE_URL)

  useEffect(() => {
    if (!SITE_URL) setOrigin(window.location.origin)
  }, [])

  const tables = Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1)
  const badOrigin = /localhost|127\.0\.0\.1|-projects\.vercel\.app/.test(origin)

  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center print:hidden">
          <h1 className="text-2xl font-bold">QR Code สั่งอาหารประจำโต๊ะ</h1>
          <p className="mt-1 text-sm text-slate-500">กดพิมพ์ ตัดตามกรอบ แล้วติดบนโต๊ะให้ตรงหมายเลข</p>
          {badOrigin && (
            <p className="mx-auto mt-4 max-w-xl rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              ตอนนี้เปิดจาก {origin} ซึ่งลูกค้าสแกนเข้าไม่ได้ ให้เปิดหน้านี้จากโดเมนจริงของร้าน หรือตั้งค่า NEXT_PUBLIC_SITE_URL ก่อนพิมพ์
            </p>
          )}
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white"
            >
              พิมพ์ QR ทั้งหมด
            </button>
            <Link href="/" className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold">
              กลับหน้าแรก
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 print:grid-cols-2">
          {tables.map((t) => {
            const url = origin + '/table/' + t
            return (
              <div key={t} className="break-inside-avoid rounded-2xl border-2 border-slate-900 p-5 text-center">
                <p className="text-xs font-medium text-slate-500">{SHOP_NAME}</p>
                <p className="mb-3 mt-1 text-3xl font-extrabold">โต๊ะ {t}</p>
                {origin && (
                  <img src={qrImage(url)} alt={'QR โต๊ะ ' + t} className="mx-auto aspect-square w-full max-w-[220px]" />
                )}
                <p className="mt-3 text-sm font-bold">สแกนเพื่อสั่งอาหาร</p>
                <p className="mt-1 break-all text-[10px] text-slate-400">{url}</p>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
