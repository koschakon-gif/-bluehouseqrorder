// ===== ตั้งค่าร้าน: ชื่อร้าน / จำนวนโต๊ะ / เมนู / ราคา แก้ที่ไฟล์นี้ไฟล์เดียว =====

export const SHOP_NAME = 'Bluehouse Cafe'
export const TOTAL_TABLES = 6

export const SWEETNESS_OPTIONS = ['10%', '25%', '50%', '100%'] as const
export type SweetnessLevel = typeof SWEETNESS_OPTIONS[number]

export type Product = {
  id: number
  name: string
  price: number
  category: string
  image: string
  tag?: string
  is_out_of_stock?: boolean
  has_sweetness?: boolean
}

export type OrderItem = {
  id?: number
  name: string
  price: number
  quantity: number
  sweetness?: string
  optionsNote?: string
}

export type Order = {
  id: number | string
  order_no: string
  table_no: number | null
  customer_name: string | null
  note: string | null
  items: OrderItem[] | null
  total_price: number
  status: string | null
  created_at: string
}

export type AdminAlert = {
  id: string
  type: 'new_order' | 'status_change' | 'urgent' | 'system'
  title: string
  message: string
  order_no?: string
  table_no?: number | null
  amount?: number
  is_read: boolean
  created_at: string
}

export const CATEGORIES = ['ทั้งหมด', 'เครื่องดื่ม', 'ของหวาน', 'โปรโมชัน']

// รูปตัวอย่างจาก Unsplash — มีรูปจริงของร้าน ให้วางไฟล์ใน public/menu/ แล้วใส่ image: '/menu/latte.jpg'
const unsplash = (id: string) => 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=600&q=80'

export const PRODUCTS: Product[] = [
  { id: 1, name: 'อเมริกาโน่เย็น', price: 55, category: 'เครื่องดื่ม', tag: 'ขายดี', image: unsplash('photo-1517701604599-bb29b565090c') },
  { id: 2, name: 'ลาเต้ร้อน', price: 60, category: 'เครื่องดื่ม', tag: 'แนะนำ', image: unsplash('photo-1534778101976-62847782c213') },
  { id: 3, name: 'ชาไทยนมสด', price: 60, category: 'เครื่องดื่ม', image: unsplash('photo-1558857563-b32142717a3e') },
  { id: 4, name: 'โกโก้เย็น', price: 65, category: 'เครื่องดื่ม', image: unsplash('photo-1542990253-0d0f5be5f0ed') },
  { id: 5, name: 'เค้กช็อกโกแลต', price: 85, category: 'ของหวาน', tag: 'ใหม่', image: unsplash('photo-1578985545062-69928b1d9587') },
  { id: 6, name: 'ครัวซองต์เนยสด', price: 70, category: 'ของหวาน', image: unsplash('photo-1555507036-ab1f4038808a') },
  { id: 7, name: 'เซ็ตกาแฟ + เค้ก', price: 120, category: 'โปรโมชัน', tag: 'ลด 15%', image: unsplash('photo-1495474472287-4d71bcdd2085') },
  { id: 8, name: 'มัทฉะลาเต้', price: 75, category: 'เครื่องดื่ม', image: unsplash('photo-1536256263959-770b48d82b08') },
]

export const STATUS: Record<string, { label: string; badge: string }> = {
  pending: { label: 'รอร้านรับออเดอร์', badge: 'bg-amber-100 text-amber-700' },
  preparing: { label: 'กำลังทำ', badge: 'bg-blue-100 text-blue-700' },
  served: { label: 'เสิร์ฟแล้ว', badge: 'bg-green-100 text-green-700' },
  paid: { label: 'ชำระเงินแล้ว', badge: 'bg-slate-200 text-slate-700' },
  cancelled: { label: 'ยกเลิก', badge: 'bg-red-100 text-red-700' },
}

export function statusOf(status: string | null) {
  const key = status || 'pending'
  return STATUS[key] || { label: key, badge: 'bg-slate-100 text-slate-600' }
}

export function baht(value: number | string | null) {
  return '฿' + Number(value || 0).toLocaleString('th-TH')
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const MENU_STORAGE_KEY = 'bluehouse_menu_products'

export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return PRODUCTS
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY)
    if (!raw) return PRODUCTS
    return JSON.parse(raw) as Product[]
  } catch {
    return PRODUCTS
  }
}

export function saveStoredProducts(products: Product[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(products))
    window.dispatchEvent(new CustomEvent('bluehouse_menu_updated', { detail: products }))
  } catch {
    // fallback
  }
}

// Client-side image resizer to allow uploading local files directly and fitting menu dimensions
export function compressAndResizeImage(
  file: File,
  maxDim = 800,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(reader.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
