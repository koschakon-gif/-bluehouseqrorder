import { NextRequest, NextResponse } from 'next/server'
import {
  AVAILABLE_TOPPINGS,
  PRODUCTS,
  TEMPERATURE_CONFIG,
  TOTAL_TABLES,
  type Order,
  type OrderItem,
  type Product,
  type TemperatureType,
} from '@/lib/config'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { table_no, customer_name, note, items } = body

    // 1. ตรวจสอบเลขโต๊ะ
    const tableId = Number(table_no)
    if (isNaN(tableId) || tableId < 1 || tableId > TOTAL_TABLES) {
      return NextResponse.json(
        { error: `หมายเลขโต๊ะไม่ถูกต้อง (อนุญาตโต๊ะ 1 ถึง ${TOTAL_TABLES} เท่านั้น)` },
        { status: 400 }
      )
    }

    // 2. ตรวจสอบรายการอาหาร
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'กรุณาเลือกรายการอาหารอย่างน้อย 1 รายการ' },
        { status: 400 }
      )
    }

    // 3. ดึง Master Products จากฐานข้อมูล (หรือ Fallback) เพื่อป้องกัน Client แก้ไขราคา
    let masterProducts: Product[] = PRODUCTS
    try {
      const { data: dbProducts, error: dbError } = await supabase
        .from('products')
        .select('*')
      if (!dbError && dbProducts && dbProducts.length > 0) {
        masterProducts = dbProducts as Product[]
      }
    } catch {
      // ใช้ fallback PRODUCTS
    }

    // 4. ตรวจสอบความถูกต้องและคำนวณราคาจริงบน Server (Server-Side Price Calculation)
    let computedTotalPrice = 0
    const validatedItems: OrderItem[] = []

    for (const item of items) {
      const productId = Number(item.id || item.productId)
      const quantity = Math.max(1, Math.min(50, Number(item.quantity) || 1))

      const master = masterProducts.find((p) => p.id === productId)
      if (!master) {
        return NextResponse.json(
          { error: `ไม่พบข้อมูลสินค้ารหัส #${productId} ในระบบ` },
          { status: 400 }
        )
      }

      if (master.is_out_of_stock) {
        return NextResponse.json(
          { error: `ขออภัย เมนู "${master.name}" สินค้าหมดชั่วคราว` },
          { status: 400 }
        )
      }

      // คำนวณราคาอุณหภูมิ (ร้อน/เย็น/ปั่น)
      let tempDiff = 0
      const temp = item.temperature as TemperatureType | undefined
      if (temp && master.has_temperature) {
        const diffMap = master.temperature_diff || {
          hot: 0,
          iced: TEMPERATURE_CONFIG.iced.defaultDiff,
          frappe: TEMPERATURE_CONFIG.frappe.defaultDiff,
        }
        tempDiff = diffMap[temp] ?? 0
      }

      // คำนวณราคาท็อปปิ้ง
      let toppingsTotal = 0
      const validatedToppings: string[] = []
      if (Array.isArray(item.toppings) && master.allow_toppings) {
        for (const tName of item.toppings) {
          const toppingFound = AVAILABLE_TOPPINGS.find((t) => t.name === tName)
          if (toppingFound) {
            toppingsTotal += toppingFound.price
            validatedToppings.push(toppingFound.name)
          }
        }
      }

      const verifiedUnitPrice = master.price + tempDiff + toppingsTotal
      const lineTotal = verifiedUnitPrice * quantity
      computedTotalPrice += lineTotal

      // ประกอบข้อความสรุปตัวเลือก
      const parts: string[] = []
      if (temp) {
        const tInfo = TEMPERATURE_CONFIG[temp]
        parts.push(`${tInfo?.icon || ''} ${tInfo?.label || temp}`)
      }
      if (item.sweetness && master.has_sweetness !== false) {
        parts.push(`หวาน ${item.sweetness}`)
      }
      if (validatedToppings.length > 0) {
        parts.push(`+${validatedToppings.join(', ')}`)
      }
      if (item.note && typeof item.note === 'string' && item.note.trim()) {
        parts.push(`โน้ต: ${item.note.trim().slice(0, 50)}`)
      }

      const summaryNote = parts.length > 0 ? ` (${parts.join(' | ')})` : ''

      validatedItems.push({
        id: master.id,
        name: `${master.name}${summaryNote}`,
        price: verifiedUnitPrice,
        quantity,
        temperature: temp,
        sweetness: item.sweetness,
        toppings: validatedToppings,
        note: item.note ? String(item.note).trim().slice(0, 100) : undefined,
        optionsNote: parts.join(' · '),
      })
    }

    // 5. สร้างหมายเลขออเดอร์ที่ไม่ซ้ำกัน
    const orderNo = `B${tableId}-${Math.floor(100 + Math.random() * 900)}`

    const newOrder: Order = {
      id: Date.now(),
      order_no: orderNo,
      table_no: tableId,
      customer_name: customer_name ? String(customer_name).trim().slice(0, 50) : null,
      note: note ? String(note).trim().slice(0, 200) : null,
      items: validatedItems,
      total_price: computedTotalPrice,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    // 6. บันทึกลงฐานข้อมูล Supabase
    const { error: insertError } = await supabase.from('orders').insert([newOrder])
    if (insertError) {
      console.error('Database insert order error:', insertError)
      return NextResponse.json(
        { error: 'ไม่สามารถบันทึกออเดอร์ลงฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง' },
        { status: 500 }
      )
    }

    // 7. แจ้งเตือนแอดมินและจอครัว
    const host = req.headers.get('host') || 'localhost:3000'
    const proto = req.headers.get('x-forwarded-proto') || 'http'
    const alertUrl = `${proto}://${host}/api/admin/alert`

    fetch(alertUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder }),
    }).catch((err) => console.warn('Trigger admin alert failed:', err))

    return NextResponse.json({
      success: true,
      order: newOrder,
      order_no: orderNo,
    })
  } catch (err: any) {
    console.error('Create order API error:', err)
    return NextResponse.json(
      { error: err?.message || 'เกิดข้อผิดพลาดในการประมวลผลออเดอร์' },
      { status: 500 }
    )
  }
}
