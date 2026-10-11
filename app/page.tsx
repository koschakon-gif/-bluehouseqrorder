import Link from 'next/link'
import { SHOP_NAME, TOTAL_TABLES } from '@/lib/config'

const STEPS = ['สแกน QR บนโต๊ะของคุณ', 'เลือกเมนู กดเพิ่มลงตะกร้า', 'กดยืนยัน ออเดอร์เข้าครัวทันที', 'รอรับอาหารที่โต๊ะได้เลย']

export default function HomePage() {
  const tables = Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1)

  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 px-4 py-16 text-center text-white">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold">
          B
        </div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{SHOP_NAME}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-blue-100 sm:text-base">
          สแกน QR บนโต๊ะ เลือกเมนู แล้วกดสั่งได้ทันที ไม่ต้องรอพนักงาน
        </p>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <section className="mb-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold">วิธีสั่งอาหาร</h2>
          <ol className="space-y-3">
            {STEPS.map((text, i) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </section>

        <h2 className="mb-3 font-bold">เลือกโต๊ะด้วยตัวเอง (กรณีสแกนไม่ได้)</h2>
        <div className="mb-10 grid grid-cols-3 gap-3">
          {tables.map((t) => (
            <Link
              key={t}
              href={'/table/' + t}
              className="rounded-2xl border border-slate-200 bg-white py-6 text-center transition hover:border-blue-500 hover:shadow-md active:scale-95"
            >
              <p className="text-xs text-slate-500">โต๊ะที่</p>
              <p className="text-2xl font-bold">{t}</p>
            </Link>
          ))}
        </div>

        <h2 className="mb-3 text-sm font-semibold text-slate-500">สำหรับลูกค้าและพนักงาน</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/my-orders" className="rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-semibold hover:bg-slate-100">
            ออเดอร์ของฉัน
          </Link>
          <Link href="/kitchen" className="rounded-xl bg-slate-900 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">
            หน้าจอครัว (พนักงาน)
          </Link>
          <Link href="/qr" className="rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-semibold hover:bg-slate-100">
            พิมพ์ QR ประจำโต๊ะ
          </Link>
        </div>
      </div>

      <footer className="pb-10 text-center text-sm text-slate-400">{SHOP_NAME} · สั่งง่าย ไม่ต้องรอ</footer>
    </main>
  )
}
