// ===== ตั้งค่าร้าน: ชื่อร้าน / จำนวนโต๊ะ / เมนู / ราคา แก้ที่ไฟล์นี้ไฟล์เดียว =====

export const SHOP_NAME = 'Bluehouse Cafe'
export const TOTAL_TABLES = 6

export type Product = {
  id: number
  name: string
  price: number
  category: string
  image: string
  tag?: string
}

export type OrderItem = {
  id?: number
  name: string
  price: number
  quantity: number
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
