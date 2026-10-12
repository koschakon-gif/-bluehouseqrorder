'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  CATEGORIES,
  PRODUCTS,
  SHOP_NAME,
  SWEETNESS_OPTIONS,
  TOTAL_TABLES,
  baht,
  getStoredProducts,
  type OrderItem,
  type Product,
} from '@/lib/config'
import { supabase } from '@/lib/supabase'

interface CartItem {
  cartKey: string
  productId: number
  name: string
  price: number
  quantity: number
  sweetness?: string
  image: string
}

export default function TableOrderPage() {
  const router = useRouter()
  const routeParams = useParams()
  const rawId = routeParams?.id as string | undefined
  const tableId = Number(rawId)

  const [products, setProducts] = useState<Product[]>(PRODUCTS)
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)

  // Options modal for drink sweetness
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null)
  const [selectedSweetness, setSelectedSweetness] = useState<string>('50%')
  const [modalQuantity, setModalQuantity] = useState<number>(1)

  useEffect(() => {
    setProducts(getStoredProducts())

    const handleMenuUpdate = (e: any) => {
      if (e.detail) {
        setProducts(e.detail)
      }
    }
    window.addEventListener('bluehouse_menu_updated', handleMenuUpdate)
    return () => window.removeEventListener('bluehouse_menu_updated', handleMenuUpdate)
  }, [])

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'ทั้งหมด') return products
    return products.filter((p) => p.category === activeCategory)
  }, [activeCategory, products])

  // Open modal or add directly
  const handleItemClick = (product: Product) => {
    if (product.is_out_of_stock) return

    // If it's a drink, prompt for sweetness
    const isDrink = product.category === 'เครื่องดื่ม' || product.has_sweetness !== false
    if (isDrink) {
      setCustomizingProduct(product)
      setSelectedSweetness('50%') // default standard sweet
      setModalQuantity(1)
    } else {
      // Non-drink item, add directly
      addItemToCart(product, undefined, 1)
    }
  }

  const addItemToCart = (product: Product, sweetness?: string, qty = 1) => {
    const cartKey = `${product.id}_${sweetness || 'none'}`

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartKey === cartKey)
      if (existingIndex > -1) {
        const next = [...prev]
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + qty,
        }
        return next
      } else {
        return [
          ...prev,
          {
            cartKey,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: qty,
            sweetness,
            image: product.image,
          },
        ]
      }
    })
  }

  const handleConfirmCustomization = () => {
    if (!customizingProduct) return
    addItemToCart(customizingProduct, selectedSweetness, modalQuantity)
    setCustomizingProduct(null)
  }

  const updateCartQuantity = (cartKey: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            const nextQty = item.quantity + delta
            return nextQty > 0 ? { ...item, quantity: nextQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    })
  }

  const totalQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  const cartItemsForPayload: OrderItem[] = useMemo(() => {
    return cart.map((item) => ({
      id: item.productId,
      name: item.sweetness ? `${item.name} (ความหวาน ${item.sweetness})` : item.name,
      price: item.price,
      quantity: item.quantity,
      sweetness: item.sweetness,
    }))
  }, [cart])

  const handleConfirmOrder = async () => {
    if (cart.length === 0 || isSubmitting) return

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const orderNo = `B${tableId}-${Math.floor(100 + Math.random() * 900)}`

      const payload = {
        order_no: orderNo,
        table_no: tableId,
        customer_name: customerName.trim() || null,
        note: note.trim() || null,
        items: cartItemsForPayload,
        total_price: totalPrice,
        status: 'pending',
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('orders').insert([payload])

      if (error) {
        console.error('Submit order error:', error)
        setErrorMessage('เกิดข้อผิดพลาดในการส่งออเดอร์ กรุณาลองใหม่อีกครั้ง')
        return
      }

      // Fire Admin Alert in background
      fetch('/api/admin/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: payload }),
      }).catch((err) => console.error('Admin alert error:', err))

      // Broadcast event for real-time in-browser alerts
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bluehouse_admin_alert', { detail: payload }))
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

      setCart([])
      setIsCartOpen(false)
      setOrderSuccess(orderNo)
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการส่งออเดอร์')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValidTable = !isNaN(tableId) && tableId >= 1 && tableId <= TOTAL_TABLES

  if (!isValidTable) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm max-w-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            📷
          </div>
          <h1 className="text-xl font-bold text-slate-800">กรุณาสแกน QR บนโต๊ะ</h1>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            ระบบไม่อนุญาตให้ระบุหรือเลือกโต๊ะด้วยตนเอง เพื่อป้องกันการเสิร์ฟผิดโต๊ะ กรุณาใช้กล้องมือถือสแกนป้าย QR Code ที่ติดอยู่บนโต๊ะของคุณเพื่อเริ่มสั่งอาหาร
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
          >
            ดูวิธีสแกน QR Code
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-28 text-slate-900">
      {/* Sticky Table Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-xs">
              {tableId}
            </span>
            <div>
              <h1 className="text-sm font-bold text-slate-900">{SHOP_NAME}</h1>
              <p className="text-[11px] font-medium text-slate-500">โต๊ะที่ {tableId} · สั่งอาหารที่โต๊ะ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/my-orders"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              ออเดอร์ของฉัน
            </Link>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <nav className="sticky top-[57px] z-20 border-b border-slate-100 bg-white px-4 py-2.5 shadow-2xs">
        <div className="mx-auto flex max-w-2xl gap-1.5 overflow-x-auto no-scrollbar">
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

      {/* Error notification banner */}
      {errorMessage && (
        <div className="mx-auto mt-4 max-w-2xl px-4">
          <div className="flex items-center justify-between rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-bold hover:text-red-900"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Product List Grid */}
      <div className="mx-auto max-w-2xl px-4 py-5">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2">
          {filteredProducts.map((product) => {
            const isDrink = product.category === 'เครื่องดื่ม' || product.has_sweetness !== false
            const isOut = Boolean(product.is_out_of_stock)
            const countInCart = cart
              .filter((c) => c.productId === product.id)
              .reduce((sum, c) => sum + c.quantity, 0)

            return (
              <div
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:shadow-md"
              >
                {/* Menu Image Container - Fits Perfectly to Menu Cards */}
                <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className={`h-full w-full object-cover object-center transition duration-300 hover:scale-105 ${
                      isOut ? 'grayscale opacity-75' : ''
                    }`}
                    loading="lazy"
                  />
                  {isOut ? (
                    <span className="absolute left-2 top-2 rounded-lg bg-red-600/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      ✕ สินค้าหมด
                    </span>
                  ) : product.tag ? (
                    <span className="absolute left-2 top-2 rounded-lg bg-blue-600/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {product.tag}
                    </span>
                  ) : null}

                  {isDrink && !isOut && (
                    <span className="absolute right-2 bottom-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-amber-200 backdrop-blur-xs">
                      เลือกความหวานได้
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between p-3">
                  <div>
                    <h3 className="line-clamp-1 text-sm font-bold text-slate-800">{product.name}</h3>
                    <p className="mt-1 text-sm font-extrabold text-blue-600">{baht(product.price)}</p>
                  </div>

                  <div className="mt-3">
                    {isOut ? (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-xl bg-slate-100 py-1.5 text-xs font-bold text-slate-400 cursor-not-allowed"
                      >
                        สินค้าหมดชั่วคราว
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleItemClick(product)}
                        className={`w-full rounded-xl py-1.5 text-xs font-bold transition active:scale-95 ${
                          countInCart > 0
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        {countInCart > 0 ? `+ สั่งเพิ่ม (${countInCart})` : '+ เลือกเมนูนี้'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Drink Customization Modal (Sweetness Level 10%, 25%, 50%, 100%) */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={customizingProduct.image}
                  alt={customizingProduct.name}
                  className="h-14 w-14 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{customizingProduct.name}</h3>
                  <p className="text-sm font-extrabold text-blue-600">{baht(customizingProduct.price)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomizingProduct(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-400 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Sweetness Selector */}
            <div className="my-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800">
                  เลือกระดับความหวาน (Sweetness):
                </label>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                  เลือกแล้ว: {selectedSweetness}
                </span>
              </div>

              {/* 4 Sweetness Level Buttons: 10%, 25%, 50%, 100% */}
              <div className="grid grid-cols-4 gap-2">
                {SWEETNESS_OPTIONS.map((level) => {
                  const isSelected = selectedSweetness === level
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedSweetness(level)}
                      className={`flex flex-col items-center justify-center rounded-2xl p-3 border text-center transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-extrabold ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm font-extrabold">{level}</span>
                      <span className="text-[10px] mt-0.5 text-slate-400">
                        {level === '10%'
                          ? 'หวาน 10%'
                          : level === '25%'
                          ? 'หวาน 25%'
                          : level === '50%'
                          ? 'หวาน 50%'
                          : 'หวานปกติ 100%'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-700">จำนวนแก้ว:</span>
              <div className="flex items-center rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-700 shadow-xs active:scale-95"
                >
                  -
                </button>
                <span className="w-10 text-center text-sm font-bold text-slate-800">
                  {modalQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQuantity((q) => q + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-xs active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleConfirmCustomization}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition"
              >
                เพิ่มลงตะกร้า · {baht(customizingProduct.price * modalQuantity)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {totalQuantity > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-md">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-blue-600 px-5 py-3.5 text-white shadow-xl shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {totalQuantity}
              </span>
              <span className="text-sm font-semibold">ดูรายการในตะกร้า</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">{baht(totalPrice)}</span>
              <span className="text-xs">→</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Modal Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center p-0 sm:p-4">
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">ตะกร้าอาหาร โต๊ะ {tableId}</h2>
                <p className="text-xs text-slate-400">ตรวจสอบรายการและระดับความหวานก่อนยืนยัน</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-xs font-bold text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.cartKey} className="flex items-center justify-between pt-2.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-10 w-10 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                      {item.sweetness && (
                        <span className="mt-0.5 inline-block rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          ความหวาน {item.sweetness}
                        </span>
                      )}
                      <p className="text-xs font-extrabold text-blue-600">
                        {baht(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.cartKey, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-700 shadow-xs"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.cartKey, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Details Form */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">
                  ชื่อลูกค้า (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  placeholder="เช่น คุณฟ้า"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-0.5 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">
                  หมายเหตุเพิ่มเติม (เช่น แยกน้ำแข็ง)
                </label>
                <input
                  type="text"
                  placeholder="เช่น แยกน้ำแข็ง, รับช้อนส้อม"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-0.5 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Total & Submit */}
            <div className="mt-3 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-3 text-sm font-bold">
                <span className="text-slate-700">ยอดรวมทั้งสิ้น</span>
                <span className="text-base text-blue-600">{baht(totalPrice)}</span>
              </div>

              <button
                type="button"
                disabled={isSubmitting || cart.length === 0}
                onClick={handleConfirmOrder}
                className="w-full rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังส่งออเดอร์เข้าครัว...' : `ยืนยันสั่งอาหาร โต๊ะ ${tableId}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl font-bold text-emerald-600">
              ✓
            </div>
            <h2 className="mt-3 text-lg font-bold text-slate-900">สั่งอาหารสำเร็จ!</h2>
            <p className="mt-1 text-xs text-slate-500">
              ออเดอร์ถูกส่งไปยังหน้าจอครัวเรียบร้อยแล้ว
            </p>
            <div className="my-4 rounded-2xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-400">หมายเลขออเดอร์</p>
              <p className="text-xl font-extrabold text-blue-600">{orderSuccess}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/my-orders"
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
              >
                ดูสถานะอาหาร
              </Link>
              <button
                type="button"
                onClick={() => setOrderSuccess(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                สั่งเพิ่ม
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
