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
    desc: 'เลือกปรับระดับความหวาน ร้อน/เย็น/ปั่น และท็อปปิ้ง ออเดอร์จะส่งตรงเข้าจอครัวทันที',
    icon: '☕',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FBF9F5] text-[#2E2825] pb-24 selection:bg-[#EAE2D7] selection:text-[#5C3D2E]">
      {/* Warm Minimalist Cafe Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF4EC] via-[#FBF9F5] to-[#FBF9F5] px-4 pt-16 pb-16 text-center sm:px-6 lg:px-8 border-b border-[#EFE8DE]">
        {/* Soft Ambient Warm Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-[#EADBC8]/40 blur-3xl" />
        <div className="pointer-events-none absolute top-32 left-1/4 -z-10 h-64 w-64 rounded-full bg-[#D4A373]/15 blur-3xl" />

        <div className="mx-auto max-w-3xl">
          {/* Top Tagline Pill */}
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4A373]/40 bg-[#F6EDE0] px-4 py-1.5 text-xs font-semibold tracking-wide text-[#6F4E37] shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-[#8D5B4C] animate-pulse" />
            <span className="tracking-wide text-[11px]">กาแฟคั่วพิเศษ & เบเกอรี่อบสดใหม่</span>
            <span className="text-[#8D5B4C]/40">·</span>
            <span className="text-[11px] font-normal text-[#7A6B60]">เปิดให้บริการตามปกติ</span>
          </div>

          {/* Brand Monogram Emblem */}
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#EAE2D7] bg-gradient-to-br from-[#7D5537] via-[#65432B] to-[#4A2E15] text-3xl font-extrabold text-white shadow-xl shadow-[#7D5537]/20">
            <span className="text-white">B</span>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#F6EDE0] text-sm shadow-md border border-[#EAE2D7]">
              ☕
            </span>
          </div>

          {/* Main Display Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-[#2E2825] sm:text-5xl">
            {SHOP_NAME}
          </h1>

          {/* Elegant Subtitle */}
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-[#7A6B60] sm:text-base">
            สัมผัสรสชาติกาแฟสกัดสด ชาเขียวมัทฉะเกียวโตแท้ และเบเกอรี่โฮมเมด
            <br className="hidden sm:inline" />
            สั่งอาหารง่ายและสะดวกผ่านการสแกน QR Code ประจำโต๊ะของคุณ
          </p>

          {/* Notice Pill */}
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#EAE2D7] bg-white px-4 py-2 text-xs text-[#5C3D2E] shadow-2xs">
            <span className="text-sm">📱</span>
            <span>
              เข้าสั่งอาหารผ่าน <strong>QR Code ที่ติดบนโต๊ะอาหาร</strong> (ระบบจะระบุโต๊ะให้อัตโนมัติเพื่อความถูกต้อง)
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto -mt-6 max-w-3xl px-4 sm:px-6">
        {/* Table-Tent QR Guide Card */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#EDE5DA] bg-white p-6 shadow-md sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Visual Table QR Frame */}
            <div className="relative flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-3xl border border-[#EAE2D7] bg-[#FAF6F0] p-3 shadow-inner">
              <span className="text-4xl mb-1">📷</span>
              <span className="rounded bg-[#7D5537] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                สแกนที่โต๊ะ
              </span>
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-[#F6EDE0] px-2.5 py-1 text-[11px] font-bold text-[#6F4E37] mb-2">
                <span>📍</span>
                <span>ป้ายประจำโต๊ะ 1 ถึง {TOTAL_TABLES}</span>
              </div>
              <h2 className="text-lg font-bold text-[#2E2825] sm:text-xl">
                กรุณาสแกน QR Code ที่ติดอยู่บนโต๊ะที่คุณนั่ง
              </h2>
              <p className="mt-1.5 text-xs text-[#7A6B60] leading-relaxed">
                เพื่อความถูกต้องในการเสิร์ฟอาหาร รวดเร็ว และแม่นยำ
                เพียงเปิดกล้องมือถือแล้วส่องที่ป้าย QR บนโต๊ะ รายการเมนูพร้อมตัวเลือก ร้อน/เย็น/ปั่น และระดับความหวานจะปรากฏขึ้นทันที
              </p>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-6 rounded-2xl border border-[#EFE8DE] bg-[#FAF6F0] p-4 text-xs text-[#5C3D2E]">
            <div className="flex items-start gap-2.5">
              <span className="text-base">💡</span>
              <div>
                <p className="font-bold text-[#2E2825]">วิธีสแกนง่ายๆ ใน 3 วินาที:</p>
                <p className="mt-0.5 text-[11px] text-[#7A6B60] leading-relaxed">
                  เปิดแอป <strong>กล้องถ่ายรูป (Camera)</strong> บน iPhone หรือ Android แล้วส่องไปที่ป้าย QR บนโต๊ะ แตะที่แถบลิงก์ที่เด้งขึ้นมาเพื่อเข้าสู่หน้าสั่งอาหารประจำโต๊ะนั้นได้ทันที หรือใช้แอป <strong>LINE</strong> สแกนได้เช่นกันครับ
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Simple Ordering Steps */}
        <section className="mb-8 rounded-3xl border border-[#EDE5DA] bg-white p-6 shadow-2xs sm:p-7">
          <h3 className="text-sm font-bold text-[#2E2825] mb-5 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7D5537] text-xs text-white">
              ✓
            </span>
            <span>3 ขั้นตอนการสั่งอาหารง่ายๆ</span>
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.step}
                className="relative flex flex-col justify-between rounded-2xl border border-[#EAE2D7] bg-[#FAF6F0] p-4 transition hover:border-[#D4A373]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7D5537] font-extrabold text-white text-xs shadow-xs">
                      {step.step}
                    </span>
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#2E2825]">{step.title}</h4>
                  <p className="mt-1 text-[11px] text-[#7A6B60] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation & Staff Portals */}
        <section className="rounded-3xl border border-[#EDE5DA] bg-white p-6 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A6B60]">
              เมนูบริการและระบบจัดการร้าน
            </h3>
            <span className="text-[11px] text-[#A69B91]">Bluehouse Cafe Portal</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              href="/my-orders"
              className="flex flex-col items-center justify-center rounded-2xl border border-[#EAE2D7] bg-[#FAF6F0] p-4 text-center transition hover:border-[#7D5537] hover:bg-[#F2ECE3]"
            >
              <span className="text-2xl mb-1.5">📋</span>
              <span className="text-xs font-bold text-[#2E2825]">ออเดอร์ของฉัน</span>
              <span className="text-[10px] text-[#7A6B60] mt-0.5">ติดตามสถานะ</span>
            </Link>

            <Link
              href="/kitchen"
              className="flex flex-col items-center justify-center rounded-2xl border border-[#7D5537]/30 bg-[#FAF4EC] p-4 text-center transition hover:border-[#7D5537] hover:bg-[#F6EDE0]"
            >
              <span className="text-2xl mb-1.5">👨‍🍳</span>
              <span className="text-xs font-bold text-[#65432B]">หน้าจอครัว</span>
              <span className="text-[10px] text-[#7D5537] mt-0.5">จอทำอาหาร (KDS)</span>
            </Link>

            <Link
              href="/admin/menu"
              className="flex flex-col items-center justify-center rounded-2xl border border-[#EAE2D7] bg-[#FAF6F0] p-4 text-center transition hover:border-[#7D5537] hover:bg-[#F2ECE3]"
            >
              <span className="text-2xl mb-1.5">⚙️</span>
              <span className="text-xs font-bold text-[#2E2825]">จัดการเมนู</span>
              <span className="text-[10px] text-[#7A6B60] mt-0.5">เพิ่มเมนู/แก้ราคา</span>
            </Link>

            <Link
              href="/qr"
              className="flex flex-col items-center justify-center rounded-2xl border border-[#EAE2D7] bg-[#FAF6F0] p-4 text-center transition hover:border-[#7D5537] hover:bg-[#F2ECE3]"
            >
              <span className="text-2xl mb-1.5">🖨️</span>
              <span className="text-xs font-bold text-[#2E2825]">พิมพ์ป้าย QR</span>
              <span className="text-[10px] text-[#7A6B60] mt-0.5">พิมพ์ติดบนโต๊ะ</span>
            </Link>
          </div>
        </section>
      </div>

      <footer className="mt-12 text-center text-xs text-[#A69B91]">
        {SHOP_NAME} · กาแฟสด ชา เครื่องดื่ม และเบเกอรี่ · สั่งง่ายผ่าน QR Code ประจำโต๊ะ
      </footer>
    </main>
  )
}
