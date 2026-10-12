import { NextRequest, NextResponse } from 'next/server'
import type { Order } from '@/lib/config'

// LINE Notify ปิดตัวแล้ว — เปลี่ยนการทำงานทั้งหมดให้ส่งเข้า Admin Alert แทน
export async function POST(req: NextRequest) {
  try {
    const order: Order = await req.json()

    // ส่งต่อไปยัง Admin Alert
    const host = req.headers.get('host') || 'localhost:3000'
    const proto = req.headers.get('x-forwarded-proto') || 'http'
    const alertUrl = `${proto}://${host}/api/admin/alert`

    let forwardSuccess = false
    try {
      const alertRes = await fetch(alertUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      })
      forwardSuccess = alertRes.ok
    } catch (err) {
      console.warn('Forward to admin alert error:', err)
    }

    return NextResponse.json({
      success: true,
      status: 'deprecated',
      message: 'LINE Notify ปิดตัวแล้ว — ระบบเปลี่ยนมาส่งเข้า Admin Alert (แจ้งเตือนผู้ดูแล) เรียบร้อยแล้ว',
      forwardedToAdminAlert: forwardSuccess,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
