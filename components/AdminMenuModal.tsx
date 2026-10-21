'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CATEGORIES,
  PRODUCTS,
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

interface Props {
  isOpen: boolean
  onClose: () => void
}

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
    if (isOpen) {
      setProducts(getStoredProducts())
      fetchLiveProducts().then((live) => {
        if (live && live.length > 0) setProducts(live)
      })
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

  const handleToggleStock = async (id: number) => {
    const target = products.find((p) => p.id === id)
    if (!target) return
    const nextStatus = !target.is_out_of_stock

    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, is_out_of_stock: nextStatus } : p
      )
    )

    await updateProductStockLive(id, nextStatus)
  }

  const handleDelete = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const handleSaveAll = () => {
    saveStoredProducts(products)
    setToastMsg('✓ บันทึกการเปลี่ยนแปลงเมนูสำเร็จแล้ว!')
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleResetToDefault = () => {
    if (confirm('คุณต้องการรีเซ็ตเมนูเป็น 15 เมนูยอดนิยมธีมมินิมอล (พร้อมภาพ Thumbnail สวยงาม) ใช่หรือไม่?')) {
      const def = resetToDefaultProducts()
      setProducts(def)
      setToastMsg('✓ รีเซ็ตเมนูเป็น 15 เมนูธีมมินิมอลพร้อมภาพ Thumbnail เรียบร้อยแล้ว!')
      setTimeout(() => setToastMsg(null), 4000)
    }
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
    setIsAddOpen(false)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl border border-[#EAE2D7]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#EFE8DE] p-4 sm:p-5 bg-[#FAF6F0] rounded-t-3xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7D5537] text-lg font-bold text-white shadow-xs">
              ☕
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#2E2825] sm:text-lg">
                  จัดการเมนูอาหาร & ธีมร้าน
                </h2>
                <span className="rounded bg-[#F6EDE0] px-2 py-0.5 text-[10px] font-bold text-[#6F4E37]">
                  {products.length} เมนู
                </span>
              </div>
              <p className="text-xs text-[#7A6B60]">
                ปรับแต่งราคา, ตัวเลือกร้อน/เย็น/ปั่น, ท็อปปิ้ง และรูป Thumbnail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              title="กู้คืน 15 เมนูยอดนิยมและรูปภาพ Thumbnail คุณภาพสูง"
              className="rounded-xl border border-[#EAE2D7] bg-white px-3 py-2 text-xs font-semibold text-[#6F4E37] hover:bg-[#F2ECE3] transition shadow-xs"
            >
              🔄 รีเซ็ตเมนูเริ่มต้น
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="rounded-xl bg-[#7D5537] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#65432B] transition"
            >
              💾 บันทึกทั้งหมด
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#F4EFE8] p-2 text-xs font-bold text-[#7A6B60] hover:bg-[#EAE2D7]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-[#65432B] px-4 py-2 text-center text-xs font-bold text-white">
            {toastMsg}
          </div>
        )}

        {/* Toolbar: Category & Add Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE8DE] bg-[#FBF9F5] p-3 sm:px-5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c)}
                className={`shrink-0 rounded-xl px-3 py-1 text-xs font-semibold transition ${
                  activeCategory === c
                    ? 'bg-[#7D5537] text-white shadow-xs'
                    : 'bg-white border border-[#EAE2D7] text-[#6A5A4F] hover:bg-[#FAF6F0]'
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
              className="rounded-xl border border-[#EAE2D7] bg-white px-2.5 py-1 text-xs text-[#2E2825] outline-none focus:border-[#7D5537]"
            />
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="rounded-xl bg-[#7D5537] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#65432B] transition shadow-xs"
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
                  isOut ? 'border-rose-200 bg-rose-50/20 opacity-80' : 'border-[#EDE5DA] bg-white shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 rounded-xl object-cover border border-[#EAE2D7] shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-[#2E2825]">{item.name}</p>
                      <span className="rounded bg-[#FAF6F0] border border-[#EAE2D7] px-1.5 py-0.5 text-[9px] text-[#7A6B60]">
                        {item.category}
                      </span>
                      {item.tag && (
                        <span className="rounded bg-[#F6EDE0] px-1.5 py-0.5 text-[9px] font-bold text-[#6F4E37]">
                          {item.tag}
                        </span>
                      )}
                      {item.has_temperature && (
                        <span className="text-[10px] text-[#7D5537]">☕ 🧊 🥤</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-0.5 text-[10px] text-[#7A6B60] line-clamp-1">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  <div className="flex items-center rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-2 py-0.5">
                    <span className="text-xs font-bold text-[#7A6B60] mr-1">฿</span>
                    <input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) => handlePriceChange(item.id, e.target.value)}
                      className="w-14 bg-transparent text-xs font-extrabold text-[#7D5537] outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStock(item.id)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      isOut
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-[#F6EDE0] text-[#6F4E37] border border-[#E8DEC8]'
                    }`}
                  >
                    {isOut ? '✕ สินค้าหมด' : '✓ มีสินค้า'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-xl border border-rose-200 bg-white px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add New Product Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl border border-[#EAE2D7] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EFE8DE] pb-3">
              <h3 className="text-sm font-bold text-[#2E2825]">เพิ่มเมนูใหม่</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-full bg-[#F4EFE8] p-1.5 text-xs text-[#7A6B60]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#2E2825]">ชื่อเมนู</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ลาเต้เย็น ซิกเนเจอร์"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-1.5 text-xs outline-none focus:border-[#7D5537]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2E2825]">คำอธิบายเมนู</label>
                <input
                  type="text"
                  placeholder="เช่น กาแฟสกัดสดใหม่ หอมอโรมา กลมกล่อมนุ่มละมุน"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-1.5 text-xs outline-none focus:border-[#7D5537]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#2E2825]">ราคา (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="65"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-1.5 text-xs outline-none focus:border-[#7D5537]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#2E2825]">หมวดหมู่</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-2 py-1.5 text-xs outline-none focus:border-[#7D5537]"
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
                <label className="text-xs font-bold text-[#2E2825]">ป้ายกำกับ (Tag)</label>
                <input
                  type="text"
                  placeholder="เช่น ขายดี, Signature, แนะนำ"
                  value={newItem.tag}
                  onChange={(e) => setNewItem({ ...newItem, tag: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-1.5 text-xs outline-none focus:border-[#7D5537]"
                />
              </div>

              {/* Option toggles */}
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
                    <span>มีตัวเลือก ร้อน/เย็น/ปั่น</span>
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

              {/* Thumbnail Image Selection */}
              <div>
                <label className="text-xs font-bold text-[#2E2825] block mb-1">
                  รูปภาพ Thumbnail
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#EAE2D7] bg-[#F4EFE8]">
                    <img
                      src={newItem.image}
                      alt="Preview"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#EAE2D7] bg-white px-2.5 py-1.5 text-xs font-bold text-[#6F4E37] hover:bg-[#FAF6F0] transition">
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

                {/* Preset thumbnails list */}
                <div className="mt-2">
                  <span className="text-[10px] text-[#7A6B60] block mb-1">
                    หรือเลือกรูปภาพคาเฟ่สำเร็จรูป:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {PRESET_THUMBNAILS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setNewItem({ ...newItem, image: preset.url })}
                        className={`rounded-lg px-2 py-1 text-[10px] font-medium border transition ${
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

              <div className="flex gap-2 pt-2 border-t border-[#EFE8DE]">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#7D5537] py-2.5 text-xs font-bold text-white hover:bg-[#65432B] transition"
                >
                  บันทึกเมนูใหม่
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl border border-[#EAE2D7] px-4 py-2.5 text-xs font-bold text-[#6A5A4F] hover:bg-[#FAF6F0]"
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
