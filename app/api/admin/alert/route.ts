import { NextRequest, NextResponse } from 'next/server'
import { baht, formatTime, type AdminAlert, type Order } from '@/lib/config'

// In-memory alert store on the server side
let adminAlerts: AdminAlert[] = [
  {
    id: 'alert-init-1',
    type: 'new_order',
    title: '🔔 ออเดอร์ใหม่ โต๊ะ 2 (#B2-101)',
    message: 'อเมริกาโน่เย็น x1, เค้กช็อกโกแลต x1 (หวานน้อย)',
    order_no: 'B2-101',
    table_no: 2,
    amount: 140,
    is_read: false,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-init-2',
    type: 'new_order',
    title: '🔔 ออเดอร์ใหม่ โต๊ะ 4 (#B4-102)',
    message: 'ลาเต้ร้อน x2, ครัวซองต์เนยสด x1 (แยกน้ำแข็ง)',
    order_no: 'B4-102',
    table_no: 4,
    amount: 190,
    is_read: true,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unread') === 'true'

  const filtered = unreadOnly ? adminAlerts.filter((a) => !a.is_read) : adminAlerts
  const unreadCount = adminAlerts.filter((a) => !a.is_read).length

  return NextResponse.json({
    alerts: filtered.slice(0, 50),
    unreadCount,
    totalCount: adminAlerts.length,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { order, title, message, type = 'new_order' } = body

    let newAlert: AdminAlert

    if (order) {
      const orderObj = order as Order
      const itemsSummary = (orderObj.items || [])
        .map((i) => `${i.name} x${i.quantity}`)
        .join(', ')

      const noteText = orderObj.note ? ` (${orderObj.note})` : ''

      newAlert = {
        id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'new_order',
        title: title || `🔔 ออเดอร์ใหม่ โต๊ะ ${orderObj.table_no ?? '-'} (#${orderObj.order_no})`,
        message: message || `${itemsSummary}${noteText}`,
        order_no: orderObj.order_no,
        table_no: orderObj.table_no,
        amount: orderObj.total_price,
        is_read: false,
        created_at: new Date().toISOString(),
      }
    } else {
      newAlert = {
        id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: type || 'system',
        title: title || 'แจ้งเตือนระบบ',
        message: message || '',
        order_no: body.order_no,
        table_no: body.table_no,
        amount: body.amount,
        is_read: false,
        created_at: new Date().toISOString(),
      }
    }

    // Prepend to server in-memory list (keep max 100)
    adminAlerts = [newAlert, ...adminAlerts].slice(0, 100)

    return NextResponse.json({
      success: true,
      alert: newAlert,
      unreadCount: adminAlerts.filter((a) => !a.is_read).length,
    })
  } catch (error: any) {
    console.error('Admin alert error:', error)
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการสร้างการแจ้งเตือน' },
      { status: 500 }
    )
  }
}

// Mark alert as read or clear alerts
export async function PATCH(req: NextRequest) {
  try {
    const { id, markAllRead } = await req.json()

    if (markAllRead) {
      adminAlerts = adminAlerts.map((a) => ({ ...a, is_read: true }))
    } else if (id) {
      adminAlerts = adminAlerts.map((a) => (a.id === id ? { ...a, is_read: true } : a))
    }

    return NextResponse.json({
      success: true,
      unreadCount: adminAlerts.filter((a) => !a.is_read).length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  adminAlerts = []
  return NextResponse.json({ success: true, unreadCount: 0 })
}
