import Link from 'next/link'
import { SHOP_NAME, TOTAL_TABLES } from '@/lib/config'

const STEPS = [
  {
    step: '1',
    title: 'มองหาป้าย QR บนโต๊ะอาหาร',
    desc: `ที่โต๊ะของคุณจะมีป้าย QR Code ประจำโต๊ะ (โต๊ะ 1 ถึง โต๊ะ ${TOTAL_TABLES}) ตั้งอยู่`,
    icon: '🪑',
  },
  {
    step: '2',
    title: 'เปิดกล้องมือถือส่องเพื่อสแกน',
    desc: 'ใช้กล้องโทรศัพท์ (iOS / Android) หรือแอป LINE ส่องที่ป้าย QR Code บนโต๊ะได้ทันที',
    icon: '📷',
  },
  {
    step: '3',
    title: 'เลือกเมนู กดสั่ง รอเสิร์ฟถึงโต๊ะ',
    desc: 'เลือกอาหาร เครื่องดื่ม และของหวานที่ชื่นชอบ รายการจะส่งตรงเข้าจอครัวทันที',
    icon: '☕',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 pb-20 selection:bg-amber-400 selection:text-slate-900">
      {/* Premium Artisanal Cafe Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 px-4 pt-16 pb-20 text-center sm:px-6 lg:px-8">
        {/* Ambient Glow Orbs */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute top-32 left-1/4 -z-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute top-20 right-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="mx-auto max-w-3xl">
          {/* Top Tagline Pill */}
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-amber-300 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="tracking-wide text-[11px]">กาแฟสด & เครื่องดื่ม เบเกอรี่</span>
            <span className="text-amber-400/40">·</span>
            <span className="text-[11px] font-normal text-amber-200">เปิดให้บริการตามปกติ</span>
          </div>

          {/* Brand Monogram Emblem */}
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-3xl font-extrabold text-white shadow-2xl shadow-blue-500/30 ring-1 ring-white/20">
            <span className="bg-gradient-to-br from-white via-blue-100 to-amber-200 bg-clip-text text-transparent">
              B
            </span>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs shadow-md">
              ☕
            </span>
          </div>

          {/* Main Display Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              {SHOP_NAME}
            </span>
          </h1>

          {/* Elegant Subtitle */}
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-300 sm:text-base">
            สัมผัสรสชาติกาแฟคั่วพิเศษและเบเกอรี่อบสดใหม่ทุกวัน
            <br className="hidden sm:inline" />
            สั่งอาหารง่ายและสะดวกผ่านการสแกน QR Code ประจำโต๊ะของคุณ
          </p>

          {/* Exclusivity Notice Pill */}
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-950/60 px-4 py-2 text-xs text-blue-200 backdrop-blur-sm shadow-inner">
            <span className="text-sm">📱</span>
            <span>
              เข้าสั่งอาหารผ่าน <strong>QR Code ที่ติดบนโต๊ะเท่านั้น</strong> (ระบบไม่เปิดให้เลือกโต๊ะเองเพื่อป้องกันการเสิร์ฟผิดโต๊ะ)
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto -mt-8 max-w-3xl px-4 sm:px-6">
        {/* Table-Tent QR Guide Card */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Visual Table QR Frame */}
            <div className="relative flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-900/40 to-slate-900 p-3 shadow-inner">
              <span className="text-4xl mb-1">📷</span>
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                สแกนที่โต๊ะ
              </span>
              <div className="pointer-events-none absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" />
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 mb-2">
                <span>📍</span>
                <span>ป้ายประจำโต๊ะ 1 ถึง {TOTAL_TABLES}</span>
              </div>
              <h2 className="text-lg font-bold text-white sm:text-xl">
                กรุณาสแกน QR Code ที่ติดอยู่บนโต๊ะที่คุณนั่ง
              </h2>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                เพื่อความถูกต้องในการเสิร์ฟอาหาร รวดเร็ว และแม่นยำ
                เพียงเปิดกล้องมือถือแล้วส่องที่ป้าย QR บนโต๊ะ ลิงก์เมนูอาหารจะปรากฏขึ้นทันที
              </p>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <span className="text-base text-amber-400">💡</span>
              <div>
                <p className="font-bold text-slate-200">วิธีสแกนง่ายๆ ใน 3 วินาที:</p>
                <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">
                  เปิดแอป <strong>กล้องถ่ายรูป (Camera)</strong> บน iPhone หรือ Android แล้วส่องไปที่ป้าย QR บนโต๊ะ แตะที่แถบลิงก์ที่เด้งขึ้นมาเพื่อเข้าสู่หน้าสั่งอาหารประจำโต๊ะนั้นได้ทันที หรือใช้แอป <strong>LINE</strong> สแกนได้เช่นกันครับ
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Simple Ordering Steps */}
        <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl backdrop-blur-md sm:p-7">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-xs text-white">
              ✓
            </span>
            <span>3 ขั้นตอนการสั่งอาหารง่ายๆ</span>
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.step}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 transition hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-white text-xs shadow-sm">
                      {step.step}
                    </span>
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{step.title}</h4>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation & Staff Portals */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              เมนูบริการและระบบจัดการ
            </h3>
            <span className="text-[11px] text-slate-500">Bluehouse Portal</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              href="/my-orders"
              className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center transition hover:border-blue-500 hover:bg-slate-800"
            >
              <span className="text-2xl mb-1.5">📋</span>
              <span className="text-xs font-bold text-slate-200">ออเดอร์ของฉัน</span>
              <span className="text-[10px] text-slate-400 mt-0.5">ติดตามสถานะ</span>
            </Link>

            <Link
              href="/kitchen"
              className="flex flex-col items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-900/40 to-slate-900 p-4 text-center text-white transition hover:border-blue-400 hover:bg-blue-900/50"
            >
              <span className="text-2xl mb-1.5">👨‍🍳</span>
              <span className="text-xs font-bold text-white">หน้าจอครัว</span>
              <span className="text-[10px] text-blue-300 mt-0.5">จอทำอาหาร</span>
            </Link>

            <Link
              href="/admin/menu"
              className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/30 to-slate-900 p-4 text-center transition hover:border-amber-400 hover:bg-amber-950/50"
            >
              <span className="text-2xl mb-1.5">⚙️</span>
              <span className="text-xs font-bold text-amber-200">จัดการเมนู</span>
              <span className="text-[10px] text-amber-300/70 mt-0.5">เพิ่มเมนู/แก้ราคา</span>
            </Link>

            <Link
              href="/qr"
              className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center transition hover:border-slate-700 hover:bg-slate-800"
            >
              <span className="text-2xl mb-1.5">🖨️</span>
              <span className="text-xs font-bold text-slate-200">พิมพ์ป้าย QR</span>
              <span className="text-[10px] text-slate-400 mt-0.5">พิมพ์ติดบนโต๊ะ</span>
            </Link>
          </div>
        </section>
      </div>

      <footer className="mt-12 text-center text-xs text-slate-500">
        {SHOP_NAME} · กาแฟสด ชา เครื่องดื่ม และเบเกอรี่ · สั่งง่ายผ่าน QR Code ประจำโต๊ะ
      </footer>
    </main>
  )
}
