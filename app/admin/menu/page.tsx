'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CATEGORIES,
  SHOP_NAME,
  baht,
  compressAndResizeImage,
  getStoredProducts,
  saveStoredProducts,
  type Product,
} from '@/lib/config'

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
    image: string
    is_out_of_stock: boolean
  }>({
    name: '',
    price: '',
    category: 'เครื่องดื่ม',
    tag: '',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
    is_out_of_stock: false,
  })

  useEffect(() => {
    setProducts(getStoredProducts())

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

  // Toggle out of stock status
  const handleToggleStock = (id: number) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_out_of_stock: !item.is_out_of_stock } : item
      )
    )
  }

  // Delete product
  const handleDeleteProduct = (id: number, name: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  // Save all changes button
  const handleSaveAll = () => {
    saveStoredProducts(products)
    setSaveSuccessMsg('บันทึกข้อมูลเมนูและราคาสำเร็จ! หน้าสั่งอาหารของลูกค้าได้รับการอัปเดตแล้ว')
    setTimeout(() => setSaveSuccessMsg(null), 4000)
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
      image:
        newItem.image.trim() ||
        'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
      is_out_of_stock: newItem.is_out_of_stock,
    }

    const updated = [created, ...products]
    setProducts(updated)
    saveStoredProducts(updated)

    setIsAddModalOpen(false)
    setNewItem({
      name: '',
      price: '',
      category: 'เครื่องดื่ม',
      tag: '',
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
      is_out_of_stock: false,
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
      // Category filter
      if (activeCategory !== 'ทั้งหมด' && p.category !== activeCategory) {
        return false
      }
      // Stock filter
      if (stockFilter === 'in_stock' && p.is_out_of_stock) return false
      if (stockFilter === 'out_of_stock' && !p.is_out_of_stock) return false
      // Search query
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
    <main className="min-h-screen bg-slate-100 text-slate-900 pb-20">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900 px-4 py-3.5 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base font-bold shadow-sm">
              ⚙️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold sm:text-lg">จัดการเมนูและราคา</h1>
                <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-300">
                  Admin Panel
                </span>
              </div>
              <p className="text-xs text-slate-400">{SHOP_NAME} · แก้ไขเมนูและสต็อกแบบเรียลไทม์</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Switch Tabs between Kitchen & Admin */}
            <div className="flex items-center rounded-xl bg-slate-800/90 p-1 border border-slate-700/60">
              <Link
                href="/kitchen"
                className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/60 transition"
                title="สลับไปหน้าจอครัว ดูออเดอร์เข้าสดๆ (KDS)"
              >
                🍳 จอครัว (KDS)
              </Link>
              <span className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                📋 จัดการเมนู (Admin)
              </span>
              <Link
                href="/qr"
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/60 transition hidden sm:inline-block"
                title="พิมพ์ QR Code ประจำโต๊ะ"
              >
                📱 QR โต๊ะ
              </Link>
            </div>

            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95"
            >
              <span>💾</span>
              <span>บันทึกการเปลี่ยนแปลง</span>
            </button>
            <Link
              href="/"
              className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              หน้าร้าน
            </Link>
          </div>
        </div>
      </header>

      {/* Floating Success Banner */}
      {saveSuccessMsg && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 transform animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-xl">
            <span>✓</span>
            <span>{saveSuccessMsg}</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Top Control Bar & Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">เมนูทั้งหมด</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{totalCount} รายการ</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
            <p className="text-xs font-semibold text-emerald-700">พร้อมขาย (In Stock)</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-800">{inStockCount} รายการ</p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 shadow-sm">
            <p className="text-xs font-semibold text-red-700">สินค้าหมด (Out of Stock)</p>
            <p className="mt-1 text-2xl font-extrabold text-red-800">{outOfStockCount} รายการ</p>
          </div>
          <div className="flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              <span className="text-sm">+</span>
              <span>เพิ่มเมนูใหม่</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search and stock filter */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={stockFilter}
                onChange={(e: any) => setStockFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">ทุกสถานะสินค้า</option>
                <option value="in_stock">เฉพาะพร้อมขาย</option>
                <option value="out_of_stock">เฉพาะสินค้าหมด</option>
              </select>

              <input
                type="text"
                placeholder="ค้นหาชื่อเมนู..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Menu Items Table / Grid */}
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <span className="text-3xl">🍽️</span>
              <p className="mt-2 text-sm font-bold text-slate-700">ไม่พบรายการเมนู</p>
              <p className="mt-0.5 text-xs text-slate-400">ลองเปลี่ยนคำค้นหาหรือกดปุ่ม "+ เพิ่มเมนูใหม่"</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isOut = Boolean(product.is_out_of_stock)

              return (
                <div
                  key={product.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                    isOut
                      ? 'border-red-200 bg-red-50/20 opacity-80'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-center gap-3.5">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                      <img
                        src={product.image}
                        alt={product.name}
                        className={`h-full w-full object-cover ${isOut ? 'grayscale' : ''}`}
                      />
                      {product.tag && (
                        <span className="absolute left-1 top-1 rounded bg-blue-600/90 px-1 py-0.2 text-[9px] font-bold text-white">
                          {product.tag}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{product.name}</h3>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {product.category}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">รหัสเมนู: #{product.id}</p>
                    </div>
                  </div>

                  {/* Right: Price Edit, Stock Toggle, Actions */}
                  <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                    {/* Price Input Form */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">ราคา:</span>
                      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 focus-within:border-blue-500 focus-within:bg-white">
                        <span className="text-xs font-bold text-slate-600 mr-1">฿</span>
                        <input
                          type="number"
                          min="0"
                          value={product.price}
                          onChange={(e) => handlePriceChange(product.id, e.target.value)}
                          className="w-16 bg-transparent text-xs font-extrabold text-blue-600 outline-none"
                        />
                      </div>
                    </div>

                    {/* Stock Status Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStock(product.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                        isOut
                          ? 'border border-red-200 bg-red-100 text-red-700 hover:bg-red-200'
                          : 'border border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                      title="กดเพื่อเปิด/ปิดสถานะสินค้าหมด"
                    >
                      <span className={`h-2 w-2 rounded-full ${isOut ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <span>{isOut ? '✕ สินค้าหมด' : '✓ มีพร้อมขาย'}</span>
                    </button>

                    {/* Edit Details Button */}
                    <button
                      type="button"
                      onClick={() => setEditingProduct(product)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      แก้ไข
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="rounded-xl border border-red-100 bg-red-50 p-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
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
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h4 className="text-sm font-bold text-slate-900">บันทึกข้อมูลเมนูอาหาร</h4>
            <p className="text-xs text-slate-500">
              หลังการแก้ไขราคา หรือเปิด/ปิดสถานะสินค้าหมด อย่าลืมกดปุ่มบันทึกเพื่อให้อัปเดตไปยังหน้าสั่งอาหาร
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            className="w-full sm:w-auto rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95"
          >
            💾 บันทึกการเปลี่ยนแปลงทั้งหมด
          </button>
        </div>
      </div>

      {/* Add New Menu Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">+ เพิ่มเมนูใหม่</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700">ชื่อเมนูอาหาร / เครื่องดื่ม</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น มัทฉะยูสุสปาร์คกลิ้ง"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">ราคา (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="เช่น 65"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">หมวดหมู่</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
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
                <label className="text-xs font-semibold text-slate-700">ป้ายกำกับ (Tag - ไม่บังคับ)</label>
                <input
                  type="text"
                  placeholder="เช่น ขายดี, แนะนำ, ใหม่, ลด 10%"
                  value={newItem.tag}
                  onChange={(e) => setNewItem({ ...newItem, tag: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  รูปภาพเมนูอาหาร (อัปโหลดไฟล์ภาพได้โดยตรง)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xs">
                    <img
                      src={newItem.image}
                      alt="Preview"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 shadow-2xs transition hover:bg-blue-100 active:scale-95">
                      <span>📁</span>
                      <span>เลือกไฟล์รูปภาพจากเครื่อง</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const dataUrl = await compressAndResizeImage(file, 800, 0.85)
                              setNewItem({ ...newItem, image: dataUrl })
                            } catch (err) {
                              console.error('Resize error:', err)
                            }
                          }
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">
                      ระบบจะปรับขนาดให้พอดีกับเมนูอัตโนมัติ (JPG, PNG, WebP)
                    </p>
                  </div>
                </div>

                <details className="mt-2 text-[11px] text-slate-500">
                  <summary className="cursor-pointer text-blue-600 hover:underline">
                    หรือวางลิงก์รูปภาพ (Image URL)
                  </summary>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newItem.image}
                    onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono outline-none focus:border-blue-500"
                  />
                </details>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="new_out_of_stock"
                  checked={newItem.is_out_of_stock}
                  onChange={(e) => setNewItem({ ...newItem, is_out_of_stock: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="new_out_of_stock" className="text-xs font-medium text-slate-700">
                  ตั้งสถานะเป็น "สินค้าหมด" ทันที
                </label>
              </div>

              <div className="mt-5 flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                >
                  เพิ่มเมนู
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">แก้ไขเมนู: {editingProduct.name}</h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700">ชื่อเมนู</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">ราคา (บาท)</label>
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
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">หมวดหมู่</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
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
                <label className="text-xs font-semibold text-slate-700">ป้ายกำกับ (Tag)</label>
                <input
                  type="text"
                  placeholder="เช่น ขายดี, แนะนำ"
                  value={editingProduct.tag || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, tag: e.target.value || undefined })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  รูปภาพเมนูอาหาร (อัปโหลดไฟล์ภาพได้โดยตรง)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xs">
                    <img
                      src={editingProduct.image}
                      alt="Preview"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 shadow-2xs transition hover:bg-blue-100 active:scale-95">
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
                              const dataUrl = await compressAndResizeImage(file, 800, 0.85)
                              setEditingProduct({ ...editingProduct, image: dataUrl })
                            } catch (err) {
                              console.error('Resize error:', err)
                            }
                          }
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">
                      ระบบจะปรับขนาดให้พอดีกับเมนูอัตโนมัติ (JPG, PNG, WebP)
                    </p>
                  </div>
                </div>

                <details className="mt-2 text-[11px] text-slate-500">
                  <summary className="cursor-pointer text-blue-600 hover:underline">
                    หรือวางลิงก์รูปภาพ (Image URL)
                  </summary>
                  <input
                    type="url"
                    value={editingProduct.image}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, image: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono outline-none focus:border-blue-500"
                  />
                </details>
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
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="edit_out_of_stock" className="text-xs font-medium text-slate-700">
                  สถานะ: สินค้าหมด (Out of Stock)
                </label>
              </div>

              <div className="mt-5 flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                >
                  บันทึกการแก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
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
