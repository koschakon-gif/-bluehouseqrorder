'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CATEGORIES,
  PRODUCTS,
  SHOP_NAME,
  TOTAL_TABLES,
  baht,
  type OrderItem,
  type Product,
} from '@/lib/config'
import { supabase } from '@/lib/supabase'

export default function TableOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const tableId = Number(params.id)

  const [activeCategory, setActiveCategory] = useState('ทั้งหมด')
  const [cart, setCart] = useState<Record<number, number>>({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'ทั้งหมด') return PRODUCTS
    return PRODUCTS.filter((p) => p.category === activeCategory)
  }, [activeCategory])

  const addToCart = (product: Product) => {
    setCart((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }))
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0
      const next = current + delta
      if (next <= 0) {
        const copy = { ...prev }
        delete copy[productId]
        return copy
      }
      return { ...prev, [productId]: next }
    })
  }

  const cartItems: OrderItem[] = useMemo(() => {
    return Object.entries(cart)
      .map(([idStr, quantity]) => {
        const prod = PRODUCTS.find((p) => p.id === Number(idStr))
        if (!prod || quantity <= 0) return null
        return {
          id: prod.id,
          name: prod.name,
          price: prod.price,
          quantity,
        }
      })
      .filter(Boolean) as OrderItem[]
  }, [cart])

  const totalQuantity = useMemo(() => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  }, [cart])

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cartItems])

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0 || isSubmitting) return

    try {
      setIsSubmitting(true)
      const orderNo = `B${tableId}-${Math.floor(100 + Math.random() * 900)}`

      const payload = {
        order_no: orderNo,
        table_no: tableId,
        customer_name: customerName.trim() || null,
        note: note.trim() || null,
        items: cartItems,
        total_price: totalPrice,
        status: 'pending',
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('orders').insert([payload])

      if (error) {
        console.error('Submit order error:', error)
        alert('เกิดข้อผิดพลาดในการส่งออเดอร์ กรุณาลองใหม่อีกครั้ง')
        return
      }

      // Save order number to localStorage for tracking in /my-orders
      if (typeof window !== 'undefined') {
        try {
          const current = JSON.parse(
            localStorage.getItem('bluehouse_my_order_numbers') || '[]'
          )
          localStorage.setItem(
            'bluehouse_my_order_numbers',
            JSON.stringify([orderNo, ...current])
          )
        } catch {
          // fallback
        }
      }

      setCart({})
      setIsCartOpen(false)
      setOrderSuccess(orderNo)
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาดในการส่งออเดอร์')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValidTable = !isNaN(tableId) && tableId >= 1 && tableId <= TOTAL_TABLES

  if (!isValidTable) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-slate-800">ไม่พบหมายเลขโต๊ะนี้</h1>
        <p className="mt-2 text-sm text-slate-500">กรุณาสแกน QR หรือเลือกโต๊ะที่ถูกต้อง (1 - {TOTAL_TABLES})</p>
        <Link
          href="/"
          className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          กลับหน้าหลัก
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                โต๊ะ {tableId}
              </span>
              <h1 className="text-base font-bold text-slate-900">{SHOP_NAME}</h1>
            </div>
            <p className="text-[11px] text-slate-500">เลือกเมนูและสั่งอาหารที่โต๊ะได้ทันที</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/my-orders"
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              ออเดอร์ของฉัน
            </Link>
          </div>
        </div>
      </header>

      {/* Category Pills */}
      <nav className="sticky top-[57px] z-10 border-b border-slate-100 bg-white px-4 py-2.5 shadow-xs">
        <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* Product List */}
      <div className="mx-auto max-w-2xl px-4 py-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          {filteredProducts.map((product) => {
            const count = cart[product.id] || 0
            return (
              <div
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs transition hover:shadow-md"
              >
                <div className="relative aspect-4/3 w-full bg-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {product.tag && (
                    <span className="absolute left-2 top-2 rounded-md bg-blue-600/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                      {product.tag}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-3">
                  <div>
                    <h3 className="line-clamp-1 text-sm font-bold text-slate-800">{product.name}</h3>
                    <p className="mt-1 text-sm font-extrabold text-blue-600">{baht(product.price)}</p>
                  </div>

                  <div className="mt-3">
                    {count === 0 ? (
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="w-full rounded-xl bg-blue-50 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                      >
                        + เพิ่ม
                      </button>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl bg-slate-100 p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-700 shadow-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-slate-800">{count}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-xs"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalQuantity > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-md">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-blue-600 px-5 py-3.5 text-white shadow-xl shadow-blue-500/30 transition hover:bg-blue-700 active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {totalQuantity}
              </span>
              <span className="text-sm font-semibold">ดูรายการที่เลือก</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">{baht(totalPrice)}</span>
              <span className="text-xs">→</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Modal / Sheet */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs sm:items-center p-0 sm:p-4">
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">ตะกร้าสั่งอาหาร โต๊ะ {tableId}</h2>
                <p className="text-xs text-slate-400">ตรวจสอบรายการก่อนกดยืนยัน</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 divide-y divide-slate-100">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div className="pr-3">
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">{baht(item.price)} ต่อชิ้น</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id!, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-700 shadow-xs"
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id!, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-xs"
                      >
                        +
                      </button>
                    </div>
                    <span className="w-16 text-right text-sm font-bold text-slate-900">
                      {baht(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-3">
              <input
                type="text"
                placeholder="ชื่อลูกค้า (ไม่บังคับ)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="หมายเหตุเพิ่มเติม เช่น หวานน้อย, แยกน้ำแข็ง"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-slate-500">ยอดรวมทั้งหมด</span>
                <span className="text-lg font-bold text-blue-600">{baht(totalPrice)}</span>
              </div>

              <button
                type="button"
                disabled={isSubmitting || cartItems.length === 0}
                onClick={handleConfirmOrder}
                className="w-full rounded-2xl bg-blue-600 py-3.5 text-center text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังส่งออเดอร์...' : 'ยืนยันสั่งอาหาร'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl font-bold text-green-600">
              ✓
            </div>
            <h2 className="text-lg font-bold text-slate-900">สั่งอาหารสำเร็จ!</h2>
            <p className="mt-1 text-xs text-slate-500">
              ออเดอร์หมายเลข <span className="font-bold text-slate-800">{orderSuccess}</span> (โต๊ะ {tableId})
            </p>
            <p className="mt-2 text-xs text-slate-400">
              ห้องครัวได้รับรายการแล้ว กำลังเตรียมอาหารให้คุณ
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => router.push('/my-orders')}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                ดูสถานะออเดอร์ของฉัน
              </button>
              <button
                type="button"
                onClick={() => setOrderSuccess(null)}
                className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                สั่งอาหารเพิ่ม
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
