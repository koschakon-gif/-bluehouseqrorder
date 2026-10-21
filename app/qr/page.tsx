'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SHOP_NAME, TOTAL_TABLES } from '@/lib/config'

const DEFAULT_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '')

const qrImage = (url: string) =>
  'https://api.qrserver.com/v1/create-qr-code/?size=500x500&qzone=2&data=' + encodeURIComponent(url)

export default function QrPage() {
  const [origin, setOrigin] = useState(DEFAULT_SITE_URL)
  const [copiedTable, setCopiedTable] = useState<number | null>(null)

  useEffect(() => {
    if (!DEFAULT_SITE_URL && typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const tables = Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1)
  const isLocalOrInternal = /localhost|127\.0\.0\.1/.test(origin)

  const copyUrl = (tableNum: number, url: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url)
      setCopiedTable(tableNum)
      setTimeout(() => setCopiedTable(null), 2000)
    }
  }

  return (
    <main className="min-h-screen bg-[#FBF9F5] px-4 py-8 text-[#2E2825] print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center print:hidden">
          <Link href="/" className="inline-block text-xs font-semibold text-[#7D5537] hover:underline mb-2">
            ← กลับหน้าแรก
          </Link>
          <h1 className="text-2xl font-extrabold text-[#2E2825]">ป้าย QR Code สั่งอาหารประจำโต๊ะ</h1>
          <p className="mt-1 text-sm text-[#7A6B60]">
            พิมพ์ QR Code ตัดตามกรอบ แล้วตั้งบนโต๊ะ {TOTAL_TABLES} โต๊ะ ลูกค้าสามารถสแกนเพื่อสั่งอาหารได้ทันที
          </p>

          {/* Domain configuration input */}
          <div className="mx-auto mt-4 max-w-md rounded-2xl border border-[#EDE5DA] bg-white p-4 shadow-2xs text-left">
            <label className="text-xs font-semibold text-[#2E2825]">
              URL พื้นฐานสำหรับ QR Code (ปรับแก้ได้ตามโดเมนจริงของร้าน):
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.trim())}
              placeholder="https://your-domain.com"
              className="mt-1.5 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs font-mono outline-none focus:border-[#7D5537]"
            />
            {isLocalOrInternal && (
              <p className="mt-2 text-[11px] text-amber-800 bg-[#F6EDE0] p-2 rounded-lg">
                ⚠️ ตอนนี้ URL เป็น localhost หากต้องการให้ลูกค้าสแกนจากโทรศัพท์จริง ให้ใส่ IP ของเครื่องในวง Wi-Fi หรือ URL จริงของร้าน
              </p>
            )}
          </div>

          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-[#7D5537] px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#65432B] transition"
            >
              สั่งพิมพ์ QR ทุกโต๊ะ ⎙
            </button>
            <Link
              href="/"
              className="rounded-xl border border-[#EAE2D7] bg-white px-5 py-2.5 text-sm font-semibold text-[#6F4E37] shadow-xs hover:bg-[#FAF6F0]"
            >
              หน้าร้าน
            </Link>
          </div>
        </div>

        {/* QR Code Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-2 print:gap-8">
          {tables.map((t) => {
            const url = origin + '/table/' + t
            return (
              <div
                key={t}
                className="flex flex-col items-center justify-between rounded-3xl border-2 border-slate-900 bg-white p-6 text-center shadow-sm print:border-2 print:shadow-none break-inside-avoid"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {SHOP_NAME}
                  </p>
                  <p className="mb-4 mt-1 text-3xl font-extrabold text-slate-900">โต๊ะ {t}</p>
                </div>

                {origin && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-inner">
                    <img
                      src={qrImage(url)}
                      alt={'QR โต๊ะ ' + t}
                      className="aspect-square w-48 max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-800">สแกนเพื่อสั่งอาหารที่โต๊ะ</p>
                  <p className="mt-1 break-all text-[11px] font-mono text-slate-400">{url}</p>
                </div>

                {/* Test buttons (hidden on print) */}
                <div className="mt-4 flex gap-2 print:hidden">
                  <Link
                    href={`/table/${t}`}
                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    เปิดทดสอบ
                  </Link>
                  <button
                    type="button"
                    onClick={() => copyUrl(t, url)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {copiedTable === t ? 'คัดลอกแล้ว ✓' : 'คัดลอกลิงก์'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
