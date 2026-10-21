'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CATEGORIES,
  SHOP_NAME,
  baht,
  compressAndResizeImage,
  fetchLiveProducts,
  getStoredProducts,
  resetToDefaultProducts,
  saveStoredProducts,
  updateProductStockLive,
  type Product,
  type TemperatureType,
} from '@/lib/config'

const PRESET_THUMBNAILS = [
  { label: '☕ เอสเพรสโซ่ / กาแฟดำ', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=720&q=85' },
  { label: '🥛 ลาเต้ / คาปูชิโน่', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=720&q=85' },
  { label: '🍵 มัทฉะเกียวโต', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b08?auto=format&fit=crop&w=720&q=85' },
  { label: '🧋 ชาไทยนมสด', url: 'https://images.unsplash.com/photo-1558857563-b32142717a3e?auto=format&fit=crop&w=720&q=85' },
  { label: '🍫 โกโก้ดาร์กเบลเยียม', url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=720&q=85' },
  { label: '🍓 สตรอว์เบอร์รี่นมสด', url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=720&q=85' },
  { label: '🍑 ชาพีชโซดา', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=720&q=85' },
  { label: '🥐 ครัวซองต์เนยฝรั่งเศส', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=720&q=85' },
  { label: '🧇 ครอฟเฟิลไอศกรีม', url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=720&q=85' },
  { label: '🍰 ชีสเค้กหน้าไหม้', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=720&q=85' },
]

export default function AdminMenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด')
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  // New item form state
  const [newItem, setNewItem] = useState<{
    name: string
    price: string
    category: string
    tag: string
    description: string
    image: string
    is_out_of_stock: boolean
    has_sweetness: boolean
    has_temperature: boolean
    allow_toppings: boolean
  }>({
    name: '',
    price: '',
    category: 'กาแฟ',
    tag: '',
    description: '',
    image: PRESET_THUMBNAILS[0].url,
    is_out_of_stock: false,
    has_sweetness: true,
    has_temperature: true,
    allow_toppings: true,
  })

  useEffect(() => {
    setProducts(getStoredProducts())

    // Sync from Central Database on mount
    fetchLiveProducts().then((live) => {
      if (live && live.length > 0) {
        setProducts(live)
      }
    })

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setProducts(e.detail)
      }
    }

    window.addEventListener('bluehouse_menu_updated', handleUpdate)
    return () => window.removeEventListener('bluehouse_menu_updated', handleUpdate)
  }, [])

  // Quick price change inline
  const handlePriceChange = (id: number, newPriceStr: string) => {
    const num = Number(newPriceStr)
    if (isNaN(num) || num < 0) return

    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price: num } : item))
    )
  }

  // Toggle out of stock status with Live Database Sync
  const handleToggleStock = async (id: number) => {
    const target = products.find((p) => p.id === id)
    if (!target) return
    const nextStatus = !target.is_out_of_stock

    setProducts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_out_of_stock: nextStatus } : item
      )
    )

    // Sync to database
    await updateProductStockLive(id, nextStatus)
  }

  // Delete product
  const handleDeleteProduct = (id: number, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบเมนู "${name}"?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  // Save all changes button
  const handleSaveAll = () => {
    saveStoredProducts(products)
    setSaveSuccessMsg('บันทึกข้อมูลเมนูและราคาสำเร็จ! หน้าสั่งอาหารของลูกค้าได้รับการอัปเดตแล้ว')
    setTimeout(() => setSaveSuccessMsg(null), 4000)
  }

  const handleResetToDefault = () => {
    if (
      confirm(
        'ต้องการรีเซ็ตเมนูเป็น 15 เมนูยอดนิยมธีมมินิมอล (พร้อมรูปภาพ Thumbnail สวยงาม และตัวเลือกร้อน/เย็น/ปั่น) ใช่หรือไม่?'
      )
    ) {
      const def = resetToDefaultProducts()
      setProducts(def)
      setSaveSuccessMsg('รีเซ็ตเมนูเป็น 15 เมนูธีมมินิมอลอบอุ่นเรียบร้อยแล้ว!')
      setTimeout(() => setSaveSuccessMsg(null), 4000)
    }
  }

  // Add new menu item
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name.trim() || !newItem.price.trim()) return

    const priceNum = Math.max(0, Number(newItem.price) || 0)
    const newId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1

    const created: Product = {
      id: newId,
      name: newItem.name.trim(),
      price: priceNum,
      category: newItem.category,
      tag: newItem.tag.trim() || undefined,
      description: newItem.description.trim() || undefined,
      image: newItem.image.trim() || PRESET_THUMBNAILS[0].url,
      is_out_of_stock: newItem.is_out_of_stock,
      has_sweetness: newItem.has_sweetness,
      has_temperature: newItem.has_temperature,
      temperature_options: newItem.has_temperature ? ['hot', 'iced', 'frappe'] : undefined,
      temperature_diff: newItem.has_temperature ? { hot: 0, iced: 5, frappe: 15 } : undefined,
      allow_toppings: newItem.allow_toppings,
    }

    const updated = [created, ...products]
    setProducts(updated)
    saveStoredProducts(updated)

    setIsAddModalOpen(false)
    setNewItem({
      name: '',
      price: '',
      category: 'กาแฟ',
      tag: '',
      description: '',
      image: PRESET_THUMBNAILS[0].url,
      is_out_of_stock: false,
      has_sweetness: true,
      has_temperature: true,
      allow_toppings: true,
    })
    setSaveSuccessMsg(`เพิ่มเมนู "${created.name}" เรียบร้อยแล้ว!`)
    setTimeout(() => setSaveSuccessMsg(null), 4000)
  }

  // Save edit product
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    const updated = products.map((p) =>
      p.id === editingProduct.id ? editingProduct : p
    )
    setProducts(updated)
    saveStoredProducts(updated)
    setEditingProduct(null)
    setSaveSuccessMsg(`แก้ไขเมนู "${editingProduct.name}" เรียบร้อยแล้ว!`)
    setTimeout(() => setSaveSuccessMsg(null), 4000)
  }

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeCategory !== 'ทั้งหมด' && p.category !== activeCategory) {
        return false
      }
      if (stockFilter === 'in_stock' && p.is_out_of_stock) return false
      if (stockFilter === 'out_of_stock' && !p.is_out_of_stock) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchName = p.name.toLowerCase().includes(query)
        const matchCat = p.category.toLowerCase().includes(query)
        const matchTag = p.tag?.toLowerCase().includes(query)
        if (!matchName && !matchCat && !matchTag) return false
      }
      return true
    })
  }, [products, activeCategory, stockFilter, searchQuery])

  // Summary counts
  const totalCount = products.length
  const outOfStockCount = products.filter((p) => p.is_out_of_stock).length
  const inStockCount = totalCount - outOfStockCount

  return (
    <main className="min-h-screen bg-[#FBF9F5] text-[#2E2825] pb-24">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-[#4A3525] bg-[#3D2817] px-4 py-3.5 text-white sm:px-6 shadow-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7D5537] text-base font-bold shadow-xs">
              ☕
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold sm:text-lg">จัดการเมนูอาหาร & ธีมร้าน</h1>
                <span className="rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-[#F6EDE0]">
                  Admin Panel
                </span>
              </div>
              <p className="text-xs text-[#D8C7B8]">{SHOP_NAME} · โทนมินิมอล อบอุ่น ขาวครีม & ไม้ธรรมชาติ</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Switch Tabs */}
            <div className="flex items-center rounded-xl bg-black/30 p-1 border border-white/10">
              <Link
                href="/kitchen"
                className="rounded-lg px-3 py-1 text-xs font-semibold text-[#D8C7B8] hover:text-white hover:bg-white/10 transition"
              >
                🍳 จอครัว (KDS)
              </Link>
              <span className="rounded-lg bg-[#7D5537] px-3 py-1 text-xs font-bold text-white shadow-xs">
                📋 จัดการเมนู (Admin)
              </span>
              <Link
                href="/qr"
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-[#D8C7B8] hover:text-white hover:bg-white/10 transition hidden sm:inline-block"
              >
                📱 QR โต๊ะ
              </Link>
            </div>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition"
              title="กู้คืนเมนูเริ่มต้น 15 เมนูพร้อมภาพ Thumbnail"
            >
              🔄 รีเซ็ตเมนูเริ่มต้น
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 rounded-xl bg-[#7D5537] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-black/20 transition hover:bg-[#65432B] active:scale-95"
            >
              <span>💾</span>
              <span>บันทึกทั้งหมด</span>
            </button>
            <Link
              href="/"
              className="rounded-xl border border-white/15 px-3 py-1.5 text-xs font-medium text-[#D8C7B8] hover:bg-white/10"
            >
              หน้าร้าน
            </Link>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {saveSuccessMsg && (
        <div className="bg-[#65432B] px-4 py-2.5 text-center text-xs font-bold text-white shadow-md">
          ✓ {saveSuccessMsg}
        </div>
      )}

      {/* Main Content Area */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* KPI Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#EDE5DA] bg-white p-4 shadow-2xs">
            <span className="text-xs font-semibold text-[#7A6B60]">เมนูทั้งหมด</span>
            <p className="mt-1 text-2xl font-extrabold text-[#2E2825]">{totalCount}</p>
            <span className="text-[10px] text-[#A69B91]">รายการที่แสดงในระบบ</span>
          </div>

          <div className="rounded-2xl border border-[#EDE5DA] bg-white p-4 shadow-2xs">
            <span className="text-xs font-semibold text-emerald-700">พร้อมจำหน่าย</span>
            <p className="mt-1 text-2xl font-extrabold text-emerald-800">{inStockCount}</p>
            <span className="text-[10px] text-emerald-600">ลูกค้าสามารถกดสั่งได้</span>
          </div>

          <div className="rounded-2xl border border-[#EDE5DA] bg-white p-4 shadow-2xs">
            <span className="text-xs font-semibold text-rose-700">สินค้าหมด (ชั่วคราว)</span>
            <p className="mt-1 text-2xl font-extrabold text-rose-800">{outOfStockCount}</p>
            <span className="text-[10px] text-rose-600">ขึ้นป้ายสินค้าหมด</span>
          </div>

          <div className="rounded-2xl border border-[#EDE5DA] bg-white p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[#7D5537]">เพิ่มเมนูใหม่</span>
              <p className="text-[11px] text-[#7A6B60] mt-0.5">เครื่องดื่ม อาหาร ของหวาน</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 w-full rounded-xl bg-[#7D5537] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#65432B] active:scale-95 transition"
            >
              + เพิ่มเมนู
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#EDE5DA] bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  activeCategory === cat
                    ? 'bg-[#7D5537] text-white shadow-xs'
                    : 'bg-[#FBF9F5] border border-[#EAE2D7] text-[#6A5A4F] hover:bg-[#F2ECE3]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e: any) => setStockFilter(e.target.value)}
              className="rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-2.5 py-1.5 text-xs text-[#2E2825] outline-none"
            >
              <option value="all">สต็อก: ทั้งหมด</option>
              <option value="in_stock">เฉพาะพร้อมขาย</option>
              <option value="out_of_stock">เฉพาะสินค้าหมด</option>
            </select>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาชื่อเมนู..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-1.5 pl-8 text-xs text-[#2E2825] outline-none focus:border-[#7D5537] sm:w-48"
              />
              <span className="absolute left-2.5 top-2 text-xs text-[#A69B91]">🔍</span>
            </div>
          </div>
        </div>

        {/* Menu Items List */}
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#EAE2D7] bg-white py-16 text-center text-[#7A6B60]">
              <p className="text-base font-bold">ไม่พบรายการเมนูในเงื่อนไขนี้</p>
              <p className="mt-1 text-xs text-[#A69B91]">ลองเปลี่ยนหมวดหมู่หรือล้างคำค้นหา</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isOut = Boolean(product.is_out_of_stock)
              return (
                <div
                  key={product.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                    isOut
                      ? 'border-rose-200 bg-rose-50/20 opacity-80'
                      : 'border-[#EDE5DA] bg-white shadow-2xs hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-16 w-16 rounded-2xl object-cover border border-[#EAE2D7] shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-[#2E2825]">{product.name}</h3>
                        <span className="rounded bg-[#FAF6F0] border border-[#EAE2D7] px-2 py-0.5 text-[10px] text-[#7A6B60]">
                          {product.category}
                        </span>
                        {product.tag && (
                          <span className="rounded bg-[#F6EDE0] px-2 py-0.5 text-[10px] font-bold text-[#6F4E37]">
                            {product.tag}
                          </span>
                        )}
                        {product.has_temperature && (
                          <span className="rounded bg-[#FBF9F5] border border-[#EAE2D7] px-1.5 py-0.5 text-[10px] text-[#7D5537]">
                            ☕ 🧊 🥤 ร้อน/เย็น/ปั่น
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <p className="mt-1 text-xs text-[#7A6B60] line-clamp-1">
                          {product.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-[#A69B91]">รหัสเมนู: #{product.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 justify-between sm:justify-end flex-wrap">
                    {/* Inline Price Editor */}
                    <div className="flex items-center rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-2.5 py-1">
                      <span className="text-xs font-bold text-[#7A6B60] mr-1">฿</span>
                      <input
                        type="number"
                        min="0"
                        value={product.price}
                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                        className="w-16 bg-transparent text-sm font-extrabold text-[#7D5537] outline-none"
                      />
                    </div>

                    {/* Stock Status Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStock(product.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        isOut
                          ? 'border border-rose-300 bg-rose-50 text-rose-700'
                          : 'border border-emerald-300 bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${isOut ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      <span>{isOut ? '✕ สินค้าหมด' : '✓ มีพร้อมขาย'}</span>
                    </button>

                    {/* Edit Details Button */}
                    <button
                      type="button"
                      onClick={() => setEditingProduct(product)}
                      className="rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-1.5 text-xs font-semibold text-[#6F4E37] hover:bg-[#F2ECE3] transition"
                    >
                      แก้ไข
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="rounded-xl border border-rose-200 bg-white p-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                      title="ลบเมนูนี้"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Bottom Save Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-[#EDE5DA] bg-white p-5 shadow-2xs">
          <div>
            <h4 className="text-sm font-bold text-[#2E2825]">บันทึกข้อมูลเมนูอาหาร & ธีมร้าน</h4>
            <p className="text-xs text-[#7A6B60]">
              หลังการปรับแต่งราคา หรือเปิด/ปิดสต็อก อย่าลืมกดปุ่มบันทึกเพื่อให้อัปเดตไปยังหน้าโต๊ะลูกค้า
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            className="w-full sm:w-auto rounded-2xl bg-[#7D5537] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#7D5537]/25 transition hover:bg-[#65432B] active:scale-95"
          >
            💾 บันทึกการเปลี่ยนแปลงทั้งหมด
          </button>
        </div>
      </div>

      {/* Add New Menu Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#EAE2D7] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EFE8DE] pb-3">
              <h3 className="text-base font-bold text-[#2E2825]">+ เพิ่มเมนูใหม่</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full bg-[#F4EFE8] p-2 text-xs font-bold text-[#7A6B60] hover:bg-[#EAE2D7]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#2E2825]">ชื่อเมนู</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น มัทฉะลาเต้เย็น"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs outline-none focus:border-[#7D5537]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2E2825]">คำอธิบายเมนู</label>
                <input
                  type="text"
                  placeholder="เช่น ชาเขียวมัทฉะแท้เกรดพรีเมียม หอมละมุน"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs outline-none focus:border-[#7D5537]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#2E2825]">ราคา (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="65"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs outline-none focus:border-[#7D5537]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#2E2825]">หมวดหมู่</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs outline-none focus:border-[#7D5537]"
                  >
                    {CATEGORIES.filter((c) => c !== 'ทั้งหมด').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2E2825]">ป้ายกำกับ (Tag)</label>
                <input
                  type="text"
                  placeholder="เช่น ขายดี, Signature, แนะนำ"
                  value={newItem.tag}
                  onChange={(e) => setNewItem({ ...newItem, tag: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs outline-none focus:border-[#7D5537]"
                />
              </div>

              {/* Toggles */}
              <div className="rounded-2xl border border-[#EFE8DE] bg-[#FAF6F0] p-3 space-y-2">
                <p className="text-xs font-bold text-[#2E2825]">ตัวเลือกการปรับแต่ง</p>
                <div className="flex flex-wrap gap-4 text-xs text-[#55473F]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newItem.has_temperature}
                      onChange={(e) => setNewItem({ ...newItem, has_temperature: e.target.checked })}
                      className="rounded accent-[#7D5537]"
                    />
                    <span>มีตัวเลือกร้อน/เย็น/ปั่น</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newItem.has_sweetness}
                      onChange={(e) => setNewItem({ ...newItem, has_sweetness: e.target.checked })}
                      className="rounded accent-[#7D5537]"
                    />
                    <span>เลือกระดับความหวานได้</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newItem.allow_toppings}
                      onChange={(e) => setNewItem({ ...newItem, allow_toppings: e.target.checked })}
                      className="rounded accent-[#7D5537]"
                    />
                    <span>เลือกท็อปปิ้งได้</span>
                  </label>
                </div>
              </div>

              {/* Thumbnail image selector */}
              <div>
                <label className="text-xs font-semibold text-[#2E2825] block mb-1">
                  รูปภาพ Thumbnail
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#EAE2D7] bg-[#F4EFE8]">
                    <img
                      src={newItem.image}
                      alt="Preview"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-1.5 text-xs font-bold text-[#6F4E37] hover:bg-[#F2ECE3] transition">
                      <span>📁</span>
                      <span>เลือกไฟล์ภาพจากเครื่อง</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const dataUrl = await compressAndResizeImage(file, 900, 0.88)
                              setNewItem({ ...newItem, image: dataUrl })
                            } catch (err) {
                              console.error(err)
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-2">
                  <span className="text-[10px] text-[#7A6B60] block mb-1">
                    หรือเลือกรูปภาพคาเฟ่สวยงาม:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {PRESET_THUMBNAILS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setNewItem({ ...newItem, image: preset.url })}
                        className={`rounded-lg px-2 py-1 text-[10px] border transition ${
                          newItem.image === preset.url
                            ? 'border-[#7D5537] bg-[#F6EDE0] text-[#5C3D2E] font-bold'
                            : 'border-[#EAE2D7] bg-white text-[#6A5A4F] hover:bg-[#FAF6F0]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-2 pt-2 border-t border-[#EFE8DE]">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#7D5537] py-2.5 text-xs font-bold text-white hover:bg-[#65432B] shadow-xs transition"
                >
                  บันทึกเมนูใหม่
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-[#EAE2D7] px-4 py-2.5 text-xs font-bold text-[#6A5A4F] hover:bg-[#FAF6F0]"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Menu Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#EAE2D7] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EFE8DE] pb-3">
              <h3 className="text-base font-bold text-[#2E2825]">
                แก้ไขเมนู: {editingProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-full bg-[#F4EFE8] p-2 text-xs font-bold text-[#7A6B60] hover:bg-[#EAE2D7]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#2E2825]">ชื่อเมนู</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs outline-none focus:border-[#7D5537]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2E2825]">คำอธิบายเมนู</label>
                <input
                  type="text"
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs outline-none focus:border-[#7D5537]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#2E2825]">ราคา (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs outline-none focus:border-[#7D5537]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#2E2825]">หมวดหมู่</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs outline-none focus:border-[#7D5537]"
                  >
                    {CATEGORIES.filter((c) => c !== 'ทั้งหมด').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2E2825]">ป้ายกำกับ (Tag)</label>
                <input
                  type="text"
                  placeholder="เช่น ขายดี, Signature, แนะนำ"
                  value={editingProduct.tag || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, tag: e.target.value || undefined })
                  }
                  className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs outline-none focus:border-[#7D5537]"
                />
              </div>

              {/* Toggles */}
              <div className="rounded-2xl border border-[#EFE8DE] bg-[#FAF6F0] p-3 space-y-2">
                <p className="text-xs font-bold text-[#2E2825]">ตัวเลือกการปรับแต่ง</p>
                <div className="flex flex-wrap gap-4 text-xs text-[#55473F]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.has_temperature)}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          has_temperature: e.target.checked,
                          temperature_options: e.target.checked ? ['hot', 'iced', 'frappe'] : undefined,
                          temperature_diff: e.target.checked ? { hot: 0, iced: 5, frappe: 15 } : undefined,
                        })
                      }
                      className="rounded accent-[#7D5537]"
                    />
                    <span>มีตัวเลือกร้อน/เย็น/ปั่น</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.has_sweetness !== false}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, has_sweetness: e.target.checked })
                      }
                      className="rounded accent-[#7D5537]"
                    />
                    <span>เลือกระดับความหวานได้</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.allow_toppings)}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, allow_toppings: e.target.checked })
                      }
                      className="rounded accent-[#7D5537]"
                    />
                    <span>เลือกท็อปปิ้งได้</span>
                  </label>
                </div>
              </div>

              {/* Thumbnail image selector */}
              <div>
                <label className="text-xs font-semibold text-[#2E2825] block mb-1.5">
                  รูปภาพ Thumbnail
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#EAE2D7] bg-[#F4EFE8]">
                    <img
                      src={editingProduct.image}
                      alt="Preview"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-1.5 text-xs font-bold text-[#6F4E37] hover:bg-[#F2ECE3] transition">
                      <span>📁</span>
                      <span>เลือกไฟล์ภาพใหม่</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const dataUrl = await compressAndResizeImage(file, 900, 0.88)
                              setEditingProduct({ ...editingProduct, image: dataUrl })
                            } catch (err) {
                              console.error('Resize error:', err)
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-2">
                  <span className="text-[10px] text-[#7A6B60] block mb-1">
                    หรือเลือกรูปภาพคาเฟ่สวยงาม:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {PRESET_THUMBNAILS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() =>
                          setEditingProduct({ ...editingProduct, image: preset.url })
                        }
                        className={`rounded-lg px-2 py-1 text-[10px] border transition ${
                          editingProduct.image === preset.url
                            ? 'border-[#7D5537] bg-[#F6EDE0] text-[#5C3D2E] font-bold'
                            : 'border-[#EAE2D7] bg-white text-[#6A5A4F] hover:bg-[#FAF6F0]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit_out_of_stock"
                  checked={Boolean(editingProduct.is_out_of_stock)}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      is_out_of_stock: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-[#EAE2D7] accent-[#7D5537]"
                />
                <label htmlFor="edit_out_of_stock" className="text-xs font-medium text-[#2E2825]">
                  สถานะ: สินค้าหมด (Out of Stock)
                </label>
              </div>

              <div className="mt-5 flex gap-2 pt-2 border-t border-[#EFE8DE]">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#7D5537] py-2.5 text-xs font-bold text-white hover:bg-[#65432B] shadow-xs transition"
                >
                  บันทึกการแก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-xl border border-[#EAE2D7] px-4 py-2.5 text-xs font-bold text-[#6A5A4F] hover:bg-[#FAF6F0]"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
