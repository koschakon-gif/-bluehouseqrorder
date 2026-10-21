'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  AVAILABLE_TOPPINGS,
  CATEGORIES,
  PRODUCTS,
  SHOP_NAME,
  SWEETNESS_LEVELS,
  TEMPERATURE_CONFIG,
  TOTAL_TABLES,
  baht,
  fetchLiveProducts,
  getStoredProducts,
  type OrderItem,
  type Product,
  type TemperatureType,
  type ToppingItem,
} from '@/lib/config'
import { supabase } from '@/lib/supabase'

interface CartItem {
  cartKey: string
  productId: number
  name: string
  basePrice: number
  unitPrice: number
  quantity: number
  temperature?: TemperatureType
  sweetness?: string
  toppings: string[]
  toppingsTotal: number
  tempDiff: number
  itemNote?: string
  image: string
}

export default function TableOrderPage() {
  const router = useRouter()
  const routeParams = useParams()
  const rawId = routeParams?.id as string | undefined
  const tableId = Number(rawId)

  const [products, setProducts] = useState<Product[]>(PRODUCTS)
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [orderNote, setOrderNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)

  // Customization Modal State
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null)
  const [selectedTemperature, setSelectedTemperature] = useState<TemperatureType>('iced')
  const [selectedSweetness, setSelectedSweetness] = useState<string>('50%')
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [itemNote, setItemNote] = useState<string>('')
  const [modalQuantity, setModalQuantity] = useState<number>(1)

  useEffect(() => {
    setProducts(getStoredProducts())

    // Sync live products from central database
    fetchLiveProducts().then((live) => {
      if (live && live.length > 0) {
        setProducts(live)
      }
    })

    const handleMenuUpdate = (e: any) => {
      if (e.detail) {
        setProducts(e.detail)
      }
    }
    window.addEventListener('bluehouse_menu_updated', handleMenuUpdate)
    return () => window.removeEventListener('bluehouse_menu_updated', handleMenuUpdate)
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === 'ทั้งหมด' || p.category === activeCategory
      const matchQuery =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchCat && matchQuery
    })
  }, [activeCategory, products, searchQuery])

  // Open customization modal
  const handleItemClick = (product: Product) => {
    if (product.is_out_of_stock) return

    const hasOptions =
      product.has_temperature ||
      product.has_sweetness !== false ||
      product.allow_toppings

    if (hasOptions) {
      setCustomizingProduct(product)

      // Set default temperature
      if (product.has_temperature && product.temperature_options && product.temperature_options.length > 0) {
        if (product.temperature_options.includes('iced')) {
          setSelectedTemperature('iced')
        } else {
          setSelectedTemperature(product.temperature_options[0])
        }
      } else {
        setSelectedTemperature('iced')
      }

      // Default sweetness: 50%
      setSelectedSweetness('50%')
      setSelectedToppings([])
      setItemNote('')
      setModalQuantity(1)
    } else {
      // Direct add for bakery/food with no options
      addDirectToCart(product)
    }
  }

  // Calculate current modal unit price based on temperature & toppings
  const modalUnitPrice = useMemo(() => {
    if (!customizingProduct) return 0
    let price = customizingProduct.price

    // Add temperature diff
    if (customizingProduct.has_temperature) {
      const diffMap = customizingProduct.temperature_diff || { hot: 0, iced: 5, frappe: 15 }
      const diff = diffMap[selectedTemperature] ?? 0
      price += diff
    }

    // Add toppings
    if (customizingProduct.allow_toppings && selectedToppings.length > 0) {
      for (const tName of selectedToppings) {
        const found = AVAILABLE_TOPPINGS.find((t) => t.name === tName)
        if (found) price += found.price
      }
    }

    return price
  }, [customizingProduct, selectedTemperature, selectedToppings])

  const toggleTopping = (toppingName: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingName)
        ? prev.filter((t) => t !== toppingName)
        : [...prev, toppingName]
    )
  }

  const addDirectToCart = (product: Product) => {
    const cartKey = `${product.id}_standard`
    setCart((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey)
      if (existing) {
        return prev.map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [
        ...prev,
        {
          cartKey,
          productId: product.id,
          name: product.name,
          basePrice: product.price,
          unitPrice: product.price,
          quantity: 1,
          toppings: [],
          toppingsTotal: 0,
          tempDiff: 0,
          image: product.image,
        },
      ]
    })
  }

  const handleConfirmCustomization = () => {
    if (!customizingProduct) return

    const tempDiff =
      customizingProduct.has_temperature
        ? (customizingProduct.temperature_diff?.[selectedTemperature] ?? 0)
        : 0

    let toppingsTotal = 0
    selectedToppings.forEach((tName) => {
      const t = AVAILABLE_TOPPINGS.find((item) => item.name === tName)
      if (t) toppingsTotal += t.price
    })

    const finalUnitPrice = customizingProduct.price + tempDiff + toppingsTotal

    // Unique key per option configuration
    const sortedToppings = [...selectedToppings].sort().join(',')
    const cartKey = `${customizingProduct.id}_${selectedTemperature}_${selectedSweetness}_${sortedToppings}_${itemNote.trim()}`

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartKey === cartKey)
      if (existingIndex > -1) {
        const next = [...prev]
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + modalQuantity,
        }
        return next
      } else {
        return [
          ...prev,
          {
            cartKey,
            productId: customizingProduct.id,
            name: customizingProduct.name,
            basePrice: customizingProduct.price,
            unitPrice: finalUnitPrice,
            quantity: modalQuantity,
            temperature: customizingProduct.has_temperature ? selectedTemperature : undefined,
            sweetness: customizingProduct.has_sweetness !== false ? selectedSweetness : undefined,
            toppings: selectedToppings,
            toppingsTotal,
            tempDiff,
            itemNote: itemNote.trim() || undefined,
            image: customizingProduct.image,
          },
        ]
      }
    })

    setCustomizingProduct(null)
  }

  const updateCartQuantity = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            const nextQty = item.quantity + delta
            return nextQty > 0 ? { ...item, quantity: nextQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const totalQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  }, [cart])

  // Build payload for Supabase orders table
  const cartItemsForPayload: OrderItem[] = useMemo(() => {
    return cart.map((item) => {
      // Build descriptive Thai summary for the item
      const parts: string[] = []
      if (item.temperature) {
        const tInfo = TEMPERATURE_CONFIG[item.temperature]
        parts.push(`${tInfo?.icon || ''} ${tInfo?.label || item.temperature}`)
      }
      if (item.sweetness) {
        parts.push(`หวาน ${item.sweetness}`)
      }
      if (item.toppings && item.toppings.length > 0) {
        parts.push(`+${item.toppings.join(', ')}`)
      }
      if (item.itemNote) {
        parts.push(`โน้ต: ${item.itemNote}`)
      }

      const summaryNote = parts.length > 0 ? ` (${parts.join(' | ')})` : ''

      return {
        id: item.productId,
        name: `${item.name}${summaryNote}`,
        price: item.unitPrice,
        quantity: item.quantity,
        temperature: item.temperature,
        sweetness: item.sweetness,
        toppings: item.toppings,
        note: item.itemNote,
        optionsNote: parts.join(' · '),
      }
    })
  }, [cart])

  const handleConfirmOrder = async () => {
    if (cart.length === 0 || isSubmitting) return

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_no: tableId,
          customer_name: customerName.trim() || null,
          note: orderNote.trim() || null,
          items: cart.map((item) => ({
            id: item.productId,
            quantity: item.quantity,
            temperature: item.temperature,
            sweetness: item.sweetness,
            toppings: item.toppings,
            note: item.itemNote,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการส่งออเดอร์ กรุณาลองใหม่อีกครั้ง')
        return
      }

      const orderNo = data.order_no || data.order?.order_no || `B${tableId}`

      // Broadcast event for real-time in-browser alerts
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('bluehouse_admin_alert', { detail: data.order })
        )
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
      <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-[#FAF7F2]">
        <div className="rounded-3xl border border-[#EAE2D7] bg-white p-8 shadow-sm max-w-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6EDE0] text-2xl text-[#7D5537]">
            ☕
          </div>
          <h1 className="text-xl font-bold text-[#3D2E24]">กรุณาสแกน QR บนโต๊ะ</h1>
          <p className="mt-2 text-xs text-[#7A6B60] leading-relaxed">
            ระบบไม่อนุญาตให้ระบุหรือเลือกโต๊ะด้วยตนเอง เพื่อป้องกันการเสิร์ฟผิดโต๊ะ
            กรุณาใช้กล้องมือถือสแกนป้าย QR Code ที่ติดอยู่บนโต๊ะของคุณ
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-xl bg-[#7D5537] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#65432B] shadow-sm transition"
          >
            ดูวิธีสแกน QR Code
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FBF9F5] pb-32 text-[#2E2825]">
      {/* Top Header - Warm Minimalist Cafe Aesthetic */}
      <header className="sticky top-0 z-30 border-b border-[#EFE8DE] bg-[#FAF6F0]/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7D5537] text-sm font-extrabold text-white shadow-xs">
              {tableId}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-[#2E2825]">{SHOP_NAME}</h1>
                <span className="text-[10px] text-[#A6998E]">· โต๊ะ {tableId}</span>
              </div>
              <p className="text-[11px] font-medium text-[#7D5537]">
                โทนมินิมอล อบอุ่น ขาวครีม & ไม้ธรรมชาติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/my-orders"
              className="rounded-xl border border-[#E8DEC8] bg-[#FAF5EE] px-3 py-1.5 text-xs font-semibold text-[#6F4E37] hover:bg-[#F3ECE0] transition"
            >
              ออเดอร์ของฉัน
            </Link>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <nav className="sticky top-[57px] z-20 border-b border-[#EFE8DE] bg-[#FBF9F5] px-4 py-2.5 shadow-2xs">
        <div className="mx-auto flex max-w-2xl gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                activeCategory === cat
                  ? 'bg-[#7D5537] text-white shadow-xs'
                  : 'bg-[#F2ECE3] text-[#6A5A4F] hover:bg-[#EAE2D7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* Search Bar */}
      <div className="mx-auto max-w-2xl px-4 pt-3 pb-1">
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาเครื่องดื่ม กาแฟ หรือของหวาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-[#EAE2D7] bg-white px-3.5 py-2 pl-9 text-xs text-[#2E2825] placeholder-[#A69B91] outline-none focus:border-[#7D5537] focus:ring-1 focus:ring-[#7D5537]/20 shadow-2xs"
          />
          <span className="absolute left-3 top-2.5 text-xs text-[#A69B91]">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-[#A69B91] hover:text-[#2E2825]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Error notification banner */}
      {errorMessage && (
        <div className="mx-auto mt-4 max-w-2xl px-4">
          <div className="flex items-center justify-between rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-bold hover:text-rose-950"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Product List Grid */}
      <div className="mx-auto max-w-2xl px-4 py-4">
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#EAE2D7] bg-white py-16 text-center text-[#8D7F75]">
            <p className="text-base font-bold">ไม่พบเมนูในหมวดหมู่นี้</p>
            <p className="mt-1 text-xs">ลองเลือกหมวดหมู่อื่น หรือพิมพ์คำค้นหาใหม่</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2">
            {filteredProducts.map((product) => {
              const isOut = Boolean(product.is_out_of_stock)
              const countInCart = cart
                .filter((c) => c.productId === product.id)
                .reduce((sum, c) => sum + c.quantity, 0)

              return (
                <div
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-[#EDE5DA] bg-white shadow-2xs transition hover:shadow-md hover:border-[#D9CCBF]"
                >
                  {/* Thumbnail Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2EDE6]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`h-full w-full object-cover object-center transition duration-300 hover:scale-105 ${
                        isOut ? 'grayscale opacity-75' : ''
                      }`}
                      loading="lazy"
                    />

                    {/* Stock & Tag Badges */}
                    {isOut ? (
                      <span className="absolute left-2 top-2 rounded-lg bg-rose-600/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        ✕ สินค้าหมด
                      </span>
                    ) : product.tag ? (
                      <span className="absolute left-2 top-2 rounded-lg bg-[#7D5537]/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs shadow-xs">
                        {product.tag}
                      </span>
                    ) : null}

                    {/* Temperature Pill on thumbnail */}
                    {product.has_temperature && !isOut && (
                      <span className="absolute right-2 bottom-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-[#F6EDE0] backdrop-blur-xs flex items-center gap-1">
                        ☕ 🧊 🥤 ร้อน/เย็น/ปั่น
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col justify-between p-3">
                    <div>
                      <h3 className="line-clamp-1 text-sm font-bold text-[#2E2825]">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-[#7A6B60] leading-snug">
                          {product.description}
                        </p>
                      )}
                      <p className="mt-1.5 text-sm font-extrabold text-[#7D5537]">
                        {baht(product.price)}
                      </p>
                    </div>

                    <div className="mt-3">
                      {isOut ? (
                        <button
                          type="button"
                          disabled
                          className="w-full rounded-xl bg-[#F4EFE8] py-1.5 text-xs font-semibold text-[#A69B91] cursor-not-allowed"
                        >
                          สินค้าหมดชั่วคราว
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleItemClick(product)}
                          className={`w-full rounded-xl py-1.5 text-xs font-bold transition active:scale-95 ${
                            countInCart > 0
                              ? 'bg-[#7D5537] text-white shadow-xs'
                              : 'bg-[#F6EDE0] text-[#6F4E37] hover:bg-[#7D5537] hover:text-white'
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
        )}
      </div>

      {/* Customization Modal / Bottom Sheet */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#EFE8DE] pb-3.5">
              <div className="flex items-center gap-3">
                <img
                  src={customizingProduct.image}
                  alt={customizingProduct.name}
                  className="h-14 w-14 rounded-2xl object-cover border border-[#EAE2D7] shrink-0"
                />
                <div>
                  <h3 className="text-base font-bold text-[#2E2825]">
                    {customizingProduct.name}
                  </h3>
                  <p className="text-xs text-[#7A6B60]">{customizingProduct.description}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-[#7D5537]">
                    ราคาเริ่มต้น {baht(customizingProduct.price)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomizingProduct(null)}
                className="rounded-full bg-[#F4EFE8] p-2 text-xs font-bold text-[#7A6B60] hover:bg-[#EAE2D7]"
              >
                ✕
              </button>
            </div>

            {/* Temperature Selector */}
            {customizingProduct.has_temperature && (
              <div className="my-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#2E2825]">
                    ตัวเลือกอุณหภูมิ (ร้อน / เย็น / ปั่น):
                  </label>
                  <span className="rounded-md bg-[#F6EDE0] px-2 py-0.5 text-[11px] font-bold text-[#6F4E37]">
                    เลือก: {TEMPERATURE_CONFIG[selectedTemperature]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    customizingProduct.temperature_options || ['hot', 'iced', 'frappe']
                  ).map((temp) => {
                    const info = TEMPERATURE_CONFIG[temp]
                    const diff =
                      customizingProduct.temperature_diff?.[temp] ?? info.defaultDiff
                    const isSelected = selectedTemperature === temp

                    return (
                      <button
                        key={temp}
                        type="button"
                        onClick={() => setSelectedTemperature(temp)}
                        className={`flex flex-col items-center justify-center rounded-2xl p-3 border text-center transition ${
                          isSelected
                            ? 'border-[#7D5537] bg-[#F6EDE0] text-[#5C3D2E] font-extrabold ring-2 ring-[#7D5537]/20 shadow-xs'
                            : 'border-[#EAE2D7] bg-white text-[#55473F] hover:bg-[#FAF6F0]'
                        }`}
                      >
                        <span className="text-xl mb-0.5">{info.icon}</span>
                        <span className="text-xs font-bold">{info.label}</span>
                        <span className="text-[10px] mt-0.5 text-[#8D7F75]">
                          {diff > 0 ? `+${diff}฿` : 'ปกติ'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sweetness Selector */}
            {customizingProduct.has_sweetness !== false && (
              <div className="my-4 border-t border-[#EFE8DE] pt-3.5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#2E2825]">
                    ระดับความหวาน (Sweetness Level):
                  </label>
                  <span className="rounded-md bg-[#F6EDE0] px-2 py-0.5 text-[11px] font-bold text-[#6F4E37]">
                    {selectedSweetness}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {SWEETNESS_LEVELS.map((lvl) => {
                    const isSelected = selectedSweetness === lvl.value
                    return (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => setSelectedSweetness(lvl.value)}
                        className={`flex flex-col items-center justify-center rounded-2xl py-2.5 px-1 border text-center transition ${
                          isSelected
                            ? 'border-[#7D5537] bg-[#7D5537] text-white font-extrabold shadow-xs'
                            : 'border-[#EAE2D7] bg-white text-[#55473F] hover:bg-[#FAF6F0]'
                        }`}
                      >
                        <span className="text-xs font-bold">{lvl.label}</span>
                        <span
                          className={`text-[9px] mt-0.5 ${
                            isSelected ? 'text-[#F6EDE0]' : 'text-[#8D7F75]'
                          }`}
                        >
                          {lvl.note.split(' ')[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Toppings / Add-ons Selector */}
            {customizingProduct.allow_toppings && (
              <div className="my-4 border-t border-[#EFE8DE] pt-3.5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#2E2825]">
                    ท็อปปิ้งเพิ่มเติม (Toppings & Add-ons):
                  </label>
                  <span className="text-[11px] text-[#8D7F75]">เลือกได้มากกว่า 1 อย่าง</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_TOPPINGS.map((topping) => {
                    const isChecked = selectedToppings.includes(topping.name)
                    return (
                      <button
                        key={topping.id}
                        type="button"
                        onClick={() => toggleTopping(topping.name)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-left border transition ${
                          isChecked
                            ? 'border-[#7D5537] bg-[#F6EDE0] text-[#5C3D2E] font-bold'
                            : 'border-[#EAE2D7] bg-white text-[#55473F] hover:bg-[#FAF6F0]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded text-[10px] ${
                              isChecked
                                ? 'bg-[#7D5537] text-white font-bold'
                                : 'border border-[#C8BEB3]'
                            }`}
                          >
                            {isChecked ? '✓' : ''}
                          </span>
                          <span className="text-xs">{topping.name}</span>
                        </div>
                        <span className="text-xs font-bold text-[#7D5537]">
                          +{topping.price}฿
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Item Special Note */}
            <div className="my-3 border-t border-[#EFE8DE] pt-3">
              <label className="text-xs font-bold text-[#2E2825] block mb-1">
                รายละเอียดเพิ่มเติมถึงบาริสต้า (ไม่บังคับ):
              </label>
              <input
                type="text"
                placeholder="เช่น แยกน้ำแข็ง, ขอแก้วกระดาษ, ใส่นมโอ๊ต..."
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                className="w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs text-[#2E2825] placeholder-[#A69B91] outline-none focus:border-[#7D5537]"
              />
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between border-t border-[#EFE8DE] pt-3.5">
              <div>
                <span className="text-xs font-bold text-[#2E2825]">จำนวนแก้ว/ชิ้น:</span>
                <span className="block text-[11px] text-[#8D7F75]">
                  ราคาต่อหน่วย: {baht(modalUnitPrice)}
                </span>
              </div>
              <div className="flex items-center rounded-xl bg-[#F2EDE6] p-1">
                <button
                  type="button"
                  onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#55473F] shadow-xs active:scale-95"
                >
                  -
                </button>
                <span className="w-10 text-center text-sm font-bold text-[#2E2825]">
                  {modalQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQuantity((q) => q + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7D5537] text-sm font-bold text-white shadow-xs active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleConfirmCustomization}
                className="w-full rounded-2xl bg-[#7D5537] py-3 text-sm font-bold text-white shadow-md shadow-[#7D5537]/20 hover:bg-[#65432B] active:scale-95 transition"
              >
                เพิ่มลงในรายการ · {baht(modalUnitPrice * modalQuantity)}
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
            className="flex w-full items-center justify-between rounded-2xl bg-[#7D5537] px-5 py-3.5 text-white shadow-xl shadow-[#7D5537]/30 transition hover:bg-[#65432B] active:scale-95"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-extrabold">
                {totalQuantity}
              </span>
              <span className="text-sm font-bold">ดูรายการในตะกร้า</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold">{baht(totalPrice)}</span>
              <span className="text-xs">→</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Modal Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#EFE8DE] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#2E2825]">
                  รายการสั่งอาหาร โต๊ะ {tableId}
                </h2>
                <p className="text-xs text-[#7A6B60]">
                  ตรวจสอบรายละเอียด อุณหภูมิ และระดับความหวาน
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full bg-[#F4EFE8] p-2 text-xs font-bold text-[#7A6B60] hover:bg-[#EAE2D7]"
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 divide-y divide-[#EFE8DE]">
              {cart.map((item) => {
                const tInfo = item.temperature ? TEMPERATURE_CONFIG[item.temperature] : null
                return (
                  <div key={item.cartKey} className="flex items-start justify-between pt-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 rounded-xl object-cover border border-[#EAE2D7] shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#2E2825]">{item.name}</h4>

                        {/* Options pills */}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {tInfo && (
                            <span className="rounded bg-[#F6EDE0] px-1.5 py-0.5 text-[10px] font-bold text-[#6F4E37]">
                              {tInfo.icon} {tInfo.label}
                            </span>
                          )}
                          {item.sweetness && (
                            <span className="rounded bg-[#F6EDE0] px-1.5 py-0.5 text-[10px] font-bold text-[#6F4E37]">
                              หวาน {item.sweetness}
                            </span>
                          )}
                          {item.toppings.map((tp) => (
                            <span
                              key={tp}
                              className="rounded bg-[#EFE8DE] px-1.5 py-0.5 text-[10px] text-[#5C3D2E]"
                            >
                              +{tp}
                            </span>
                          ))}
                        </div>

                        {item.itemNote && (
                          <p className="mt-1 text-[10px] text-[#8D7F75] italic">
                            โน้ต: {item.itemNote}
                          </p>
                        )}

                        <p className="mt-1 text-xs font-extrabold text-[#7D5537]">
                          {baht(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center rounded-xl bg-[#F2EDE6] p-1">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.cartKey, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-[#55473F] shadow-xs active:scale-95"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[#2E2825]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.cartKey, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7D5537] text-xs font-bold text-white shadow-xs active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Inputs: Customer Name & General Order Note */}
            <div className="border-t border-[#EFE8DE] pt-3 space-y-2">
              <input
                type="text"
                placeholder="ชื่อลูกค้า (ไม่บังคับ)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs text-[#2E2825] placeholder-[#A69B91] outline-none focus:border-[#7D5537]"
              />
              <input
                type="text"
                placeholder="หมายเหตุคำสั่งซื้อทั้งโต๊ะ (เช่น เสิร์ฟพร้อมกัน)"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs text-[#2E2825] placeholder-[#A69B91] outline-none focus:border-[#7D5537]"
              />
            </div>

            {/* Checkout Total & Submit */}
            <div className="border-t border-[#EFE8DE] pt-3 mt-2">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-[#7A6B60]">ยอดรวมทั้งสิ้น</span>
                <span className="text-lg font-extrabold text-[#7D5537]">
                  {baht(totalPrice)}
                </span>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmOrder}
                className="w-full rounded-2xl bg-[#7D5537] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#7D5537]/25 hover:bg-[#65432B] active:scale-95 transition disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังส่งรายการเข้าครัว...' : 'ยืนยันการสั่งอาหาร (ส่งเข้าครัว)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl border border-[#EAE2D7]">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F6EDE0] text-3xl">
              ✨
            </div>
            <h3 className="text-lg font-bold text-[#2E2825]">ส่งออเดอร์เรียบร้อยแล้ว!</h3>
            <p className="mt-1 text-xs text-[#7A6B60]">
              รายการของคุณถูกส่งตรงไปยังห้องครัวแล้ว กำลังเริ่มจัดเตรียม
            </p>

            <div className="my-4 rounded-2xl bg-[#FAF6F0] p-4 border border-[#EFE8DE]">
              <span className="text-xs text-[#8D7F75]">หมายเลขออเดอร์</span>
              <p className="text-2xl font-extrabold text-[#7D5537] tracking-wider">
                {orderSuccess}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#5C3D2E]">โต๊ะที่ {tableId}</p>
            </div>

            <div className="space-y-2">
              <Link
                href="/my-orders"
                className="block w-full rounded-2xl bg-[#7D5537] py-3 text-xs font-bold text-white hover:bg-[#65432B] transition shadow-xs"
              >
                ติดตามสถานะออเดอร์
              </Link>
              <button
                type="button"
                onClick={() => setOrderSuccess(null)}
                className="w-full rounded-2xl border border-[#EAE2D7] bg-[#FBF9F5] py-2.5 text-xs font-bold text-[#6F4E37] hover:bg-[#F2ECE3] transition"
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
