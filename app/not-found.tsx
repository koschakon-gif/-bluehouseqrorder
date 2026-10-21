import Link from 'next/link'
import { SHOP_NAME } from '@/lib/config'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-center text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-800/80 p-8 shadow-2xl backdrop-blur-md">
        <span className="inline-block rounded-2xl bg-blue-600/20 p-4 text-4xl">☕</span>
        <h1 className="mt-4 text-3xl font-extrabold text-white">404</h1>
        <p className="mt-2 text-base font-semibold text-slate-200">ไม่พบหน้าที่คุณต้องการ</p>
        <p className="mt-1 text-xs text-slate-400">
          ลิงก์อาจมีการเปลี่ยนแปลงหรือพิมพ์ที่อยู่ไม่ถูกต้องในระบบ {SHOP_NAME}
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/admin/menu"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-blue-700"
          >
            ⚙️ เมนูแอดมิน (/admin/menu)
          </Link>
          <Link
            href="/kitchen"
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            🍳 หน้าจอครัว (/kitchen)
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            🏠 หน้าร้าน
          </Link>
        </div>
      </div>
    </main>
  )
}
