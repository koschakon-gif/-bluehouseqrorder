'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CATEGORIES,
  baht,
  compressAndResizeImage,
  getStoredProducts,
  saveStoredProducts,
  type Product,
} from '@/lib/config'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function AdminMenuModal({ isOpen, onClose }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

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
    if (isOpen) {
      setProducts(getStoredProducts())
    }
  }, [isOpen])

  if (!isOpen) return null

  const handlePriceChange = (id: number, val: string) => {
    const num = Number(val)
    if (isNaN(num) || num < 0) return
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price: num } : p))
    )
  }

  const handleToggleStock = (id: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, is_out_of_stock: !p.is_out_of_stock } : p
      )
    )
  }

  const handleDelete = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const handleSaveAll = () => {
    saveStoredProducts(products)
    setToastMsg('✓ บันทึกการเปลี่ยนแปลงเมนูสำเร็จแล้ว!')
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
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
    setIsAddOpen(false)
    setNewItem({
      name: '',
      price: '',
      category: 'เครื่องดื่ม',
      tag: '',
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
      is_out_of_stock: false,
    })
    setToastMsg(`✓ เพิ่มเมนู "${created.name}" เรียบร้อยแล้ว!`)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const filtered = products.filter((p) => {
    if (activeCategory !== 'ทั้งหมด' && p.category !== activeCategory) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-sm">
              ⚙️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  จัดการเมนูอาหาร (Admin Menu)
                </h2>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                  {products.length} เมนู
                </span>
              </div>
              <p className="text-xs text-slate-500">
                เพิ่มเมนู, ปรับราคา, และเปิด/ปิดสถานะสินค้าหมด
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAll}
              className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95"
            >
              💾 บันทึก
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-emerald-600 px-4 py-2 text-center text-xs font-bold text-white">
            {toastMsg}
          </div>
        )}

        {/* Toolbar: Category & Add Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 p-3 sm:px-5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c)}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                  activeCategory === c
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="ค้นหาเมนู..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              + เพิ่มเมนูใหม่
            </button>
          </div>
        </div>

        {/* Menu list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {filtered.map((item) => {
            const isOut = Boolean(item.is_out_of_stock)

            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3 transition ${
                  isOut ? 'border-red-200 bg-red-50/20 opacity-80' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800">{item.name}</p>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">
                        {item.category}
                      </span>
                      {item.tag && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-600">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">รหัส: #{item.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-0.5">
                    <span className="text-xs font-bold text-slate-500 mr-1">฿</span>
                    <input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) => handlePriceChange(item.id, e.target.value)}
                      className="w-14 bg-transparent text-xs font-extrabold text-blue-600 outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStock(item.id)}
                    className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                      isOut
                        ? 'border border-red-200 bg-red-100 text-red-700'
                        : 'border border-emerald-200 bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isOut ? '✕ สินค้าหมด' : '✓ มีสินค้า'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg p-1 text-slate-400 hover:text-red-600"
                    title="ลบ"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 p-4">
          <p className="text-xs text-slate-500">
            แก้ไขเสร็จแล้วอย่าลืมกดปุ่ม <strong>"บันทึก"</strong> เพื่ออัปเดตหน้าลูกค้า
          </p>
          <button
            type="button"
            onClick={handleSaveAll}
            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
          >
            💾 บันทึกทั้งหมด
          </button>
        </div>
      </div>

      {/* Add Item Nested Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-3">+ เพิ่มเมนูใหม่</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700">ชื่อเมนู</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น มัทฉะลาเต้เย็น"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">ราคา (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="65"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">หมวดหมู่</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-500"
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
                <label className="text-[11px] font-semibold text-slate-700">ป้ายกำกับ (Tag - ไม่บังคับ)</label>
                <input
                  type="text"
                  placeholder="เช่น แนะนำ, ขายดี"
                  value={newItem.tag}
                  onChange={(e) => setNewItem({ ...newItem, tag: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  รูปภาพเมนูอาหาร (อัปโหลดไฟล์ภาพได้โดยตรง)
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img
                      src={newItem.image}
                      alt="Preview"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition">
                      <span>📁</span>
                      <span>เลือกไฟล์ภาพ</span>
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
                              console.error(err)
                            }
                          }
                        }}
                      />
                    </label>
                    <p className="text-[9px] text-slate-400">
                      ปรับขนาดให้พอดีกับเมนูอัตโนมัติ
                    </p>
                  </div>
                </div>

                <details className="mt-1.5 text-[10px] text-slate-500">
                  <summary className="cursor-pointer text-blue-600 hover:underline">
                    หรือวางลิงก์รูปภาพ
                  </summary>
                  <input
                    type="url"
                    value={newItem.image}
                    onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-mono outline-none"
                    placeholder="https://..."
                  />
                </details>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  เพิ่มเมนู
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
