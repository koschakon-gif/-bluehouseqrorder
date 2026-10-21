// ===== ตั้งค่าร้าน: Bluehouse Cafe (โทนมินิมอล อบอุ่น ขาวครีมและน้ำตาลไม้ธรรมชาติ) =====

export const SHOP_NAME = 'Bluehouse Cafe'
export const TOTAL_TABLES = 6

export type TemperatureType = 'hot' | 'iced' | 'frappe'

export const TEMPERATURE_CONFIG: Record<
  TemperatureType,
  { label: string; icon: string; defaultDiff: number }
> = {
  hot: { label: 'ร้อน', icon: '☕', defaultDiff: 0 },
  iced: { label: 'เย็น', icon: '🧊', defaultDiff: 5 },
  frappe: { label: 'ปั่น', icon: '🥤', defaultDiff: 15 },
}

export const SWEETNESS_LEVELS = [
  { value: '0%', label: '0%', note: 'ไม่หวานเลย' },
  { value: '25%', label: '25%', note: 'หวานน้อยมาก' },
  { value: '50%', label: '50%', note: 'หวานน้อย (แนะนำ)' },
  { value: '100%', label: '100%', note: 'หวานปกติ' },
  { value: '125%', label: '125%', note: 'หวานพิเศษ' },
] as const

export const SWEETNESS_OPTIONS = ['0%', '25%', '50%', '100%', '125%'] as const
export type SweetnessLevel = (typeof SWEETNESS_OPTIONS)[number]

export interface ToppingItem {
  id: string
  name: string
  price: number
}

export const AVAILABLE_TOPPINGS: ToppingItem[] = [
  { id: 'extra_shot', name: 'เอสเพรสโซ่ช็อตพิเศษ', price: 15 },
  { id: 'whip_cream', name: 'วิปครีมสดแท้ละมุน', price: 15 },
  { id: 'brown_sugar_jelly', name: 'ไข่มุกบราวน์ชูการ์', price: 15 },
  { id: 'crystal_jelly', name: 'บุกคริสตัลหนึบ', price: 15 },
  { id: 'milk_foam', name: 'ฟองนมนุ่มนวล', price: 10 },
  { id: 'vanilla_ice_cream', name: 'ไอศกรีมวานิลลา 1 สกู๊ป', price: 25 },
]

export type Product = {
  id: number
  name: string
  price: number
  category: string
  image: string
  tag?: string
  description?: string
  is_out_of_stock?: boolean
  has_sweetness?: boolean
  has_temperature?: boolean
  temperature_options?: TemperatureType[]
  temperature_diff?: {
    hot?: number
    iced?: number
    frappe?: number
  }
  allow_toppings?: boolean
}

export type OrderItem = {
  id?: number
  name: string
  price: number
  quantity: number
  temperature?: TemperatureType | string
  sweetness?: string
  toppings?: string[]
  note?: string
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

export const CATEGORIES = [
  'ทั้งหมด',
  'กาแฟ',
  'ชาและนม',
  'เครื่องดื่มสดชื่น',
  'เบเกอรี่ & ของหวาน',
  'โปรโมชัน',
]

// รูปคุณภาพสูงจาก Unsplash พร้อมอัตราส่วนและแสงสวยงามสไตล์มินิมอลคาเฟ่
const unsplash = (id: string) =>
  'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=720&q=85'

export const PRODUCTS: Product[] = [
  // --- กาแฟคั่วพิเศษ ---
  {
    id: 1,
    name: 'อเมริกาโน่เย็น ซิกเนเจอร์',
    price: 55,
    category: 'กาแฟ',
    tag: 'ขายดี',
    description: 'กาแฟเอสเพรสโซ่สกัดสดใหม่ หอมอโรมา กลมกล่อมนุ่มละมุน',
    image: unsplash('photo-1517701604599-bb29b565090c'),
    has_sweetness: true,
    has_temperature: true,
    temperature_options: ['hot', 'iced'],
    temperature_diff: { hot: 0, iced: 5 },
    allow_toppings: true,
  },
  {
    id: 2,
    name: 'คาเฟ่ ลาเต้ นมสดละมุน',
    price: 65,
    category: 'กาแฟ',
    tag: 'Signature',
    description: 'นมสดคุณภาพสูงผสานช็อตเอสเพรสโซ่เข้มข้น นุ่มนวลกลมกล่อม',
    image: unsplash('photo-1534778101976-62847782c213'),
    has_sweetness: true,
    has_temperature: true,
    temperature_options: ['hot', 'iced', 'frappe'],
    temperature_diff: { hot: 0, iced: 5, frappe: 15 },
    allow_toppings: true,
  },
  {
    id: 3,
    name: 'คาราเมล มัคคิอาโต้',
    price: 75,
    category: 'กาแฟ',
    tag: 'แนะนำ',
    description: 'ชั้นนมสดหอมกรุ่น ราดด้วยเอสเพรสโซ่และซอสคาราเมลโฮมเมด',
    image: unsplash('photo-1485808191679-5f86510681a2'),
    has_sweetness: true,
    has_temperature: true,
    temperature_options: ['hot', 'iced', 'frappe'],
    temperature_diff: { hot: 0, iced: 5, frappe: 15 },
    allow_toppings: true,
  },
  {
    id: 4,
    name: 'ยูซุ ฮันนี่ เอสเพรสโซ่ สปาร์คกลิ้ง',
    price: 85,
    category: 'กาแฟ',
    tag: 'สดชื่น',
    description: 'ความสดชื่นจากน้ำส้มยูซุแท้และน้ำผึ้ง ท็อปด้วยช็อตกาแฟเข้มข้น',
    image: unsplash('photo-1514432324607-a09d9b4aefdd'),
    has_sweetness: true,
    has_temperature: true,
    temperature_options: ['iced'],
    temperature_diff: { iced: 0 },
    allow_toppings: true,
  },

  // --- ชาและนม ---
  {
    id: 5,
    name: 'มัทฉะลาเต้แท้ อุจิเกียวโต',
    price: 80,
    category: 'ชาและนม',
    tag: 'ยอดนิยม',
    description: 'ผงชาเขียวมัทฉะแท้เกรดพิธีการ รสสัมผัสอูมามิ หอมละมุนในปาก',
    image: unsplash('photo-1536256263959-770b48d82b08'),
    has_sweetness: true,
    has_temperature: true,
    temperature_options: ['hot', 'iced', 'frappe'],
    temperature_diff: { hot: 0, iced: 5, frappe: 15 },
    allow_toppings: true,
  },
  {
    id: 6,
    name: 'ชาไทยต้นตำรับนมสด',
    price: 60,
    category: 'ชาและนม',
    tag: 'ขายดี',
    description: 'ใบชาไทยคัดเกรด ต้มสด กลิ่นหอมเข้มข้นหวานมันกำลังดี',
    image: unsplash('photo-1558857563-b32142717a3e'),
    has_sweetness: true,
    has_temperature: true,
    temperature_options: ['hot', 'iced', 'frappe'],
    temperature_diff: { hot: 0, iced: 5, frappe: 15 },
    allow_toppings: true,
  },
  {
    id: 7,
    name: 'โกโก้เข้มข้น ดาร์กเบลเยียม',
    price: 70,
    category: 'ชาและนม',
    tag: 'แนะนำ',
    description: 'โกโก้นำเข้าจากเบลเยียม รสเข้มข้นลึกซึ้ง หวานนุ่มละมุนใจ',
    image: unsplash('photo-1542990253-0d0f5be5f0ed'),
    has_sweetness: true,
    has_temperature: true,
    temperature_options: ['hot', 'iced', 'frappe'],
    temperature_diff: { hot: 0, iced: 5, frappe: 15 },
    allow_toppings: true,
  },
  {
    id: 8,
    name: 'สตรอว์เบอร์รี่สด เกาหลีนมสด',
    price: 80,
    category: 'ชาและนม',
    tag: 'ใหม่',
    description: 'ซอสสตรอว์เบอร์รี่เนื้อเน้นๆ กวนสด สลับชั้นนมสดแท้สุดละมุน',
    image: unsplash('photo-1553530666-ba11a7da3888'),
    has_sweetness: true,
    has_temperature: true,
    temperature_options: ['iced', 'frappe'],
    temperature_diff: { iced: 0, frappe: 10 },
    allow_toppings: true,
  },

  // --- เครื่องดื่มสดชื่น ---
  {
    id: 9,
    name: 'ชาพีช เลมอน โซดา หอมสดชื่น',
    price: 70,
    category: 'เครื่องดื่มสดชื่น',
    tag: 'ดับกระหาย',
    description: 'กลิ่นหอมพีชธรรมชาติ ผสานความซ่าของโซดาและเลมอนเหลืองสด',
    image: unsplash('photo-1513558161293-cdaf765ed2fd'),
    has_sweetness: true,
    has_temperature: true,
    temperature_options: ['iced'],
    temperature_diff: { iced: 0 },
    allow_toppings: true,
  },
  {
    id: 10,
    name: 'ลิ้นจี่กุหลาบ สปาร์คกลิ้ง',
    price: 75,
    category: 'เครื่องดื่มสดชื่น',
    tag: 'หอมหวาน',
    description: 'น้ำลิ้นจี่หวานฉ่ำ เติมกลิ่นกุหลาบออร์แกนิกเบาๆ ซ่าสดชื่น',
    image: unsplash('photo-1556881286-fc6915169721'),
    has_sweetness: true,
    has_temperature: true,
    temperature_options: ['iced'],
    temperature_diff: { iced: 0 },
    allow_toppings: true,
  },

  // --- เบเกอรี่ & ของหวาน ---
  {
    id: 11,
    name: 'ครัวซองต์เนยสดแท้ฝรั่งเศส',
    price: 75,
    category: 'เบเกอรี่ & ของหวาน',
    tag: 'อบสดใหม่',
    description: 'แป้งพายกรอบนอกนุ่มใน หอมกรุ่นเนยสด AOP จากฝรั่งเศส',
    image: unsplash('photo-1555507036-ab1f4038808a'),
    has_sweetness: false,
    has_temperature: false,
    allow_toppings: false,
  },
  {
    id: 12,
    name: 'ครอฟเฟิลอบกรอบ คาราเมล & ไอศกรีม',
    price: 95,
    category: 'เบเกอรี่ & ของหวาน',
    tag: 'Signature',
    description: 'ครอฟเฟิลเนยสดเคลือบคาราเมลกรอบ ท็อปด้วยไอศกรีมวานิลลาพรีเมียม',
    image: unsplash('photo-1562376552-0d160a2f238d'),
    has_sweetness: false,
    has_temperature: false,
    allow_toppings: false,
  },
  {
    id: 13,
    name: 'มัทฉะ บาสก์ชีสเค้กหน้าไหม้',
    price: 110,
    category: 'เบเกอรี่ & ของหวาน',
    tag: 'แนะนำ',
    description: 'ชีสเค้กเนื้อครีมมีเข้มข้น ผสานมัทฉะเกียวโต นุ่มละลายในปาก',
    image: unsplash('photo-1533134242443-d4fd215305ad'),
    has_sweetness: false,
    has_temperature: false,
    allow_toppings: false,
  },
  {
    id: 14,
    name: 'เค้กช็อกโกแลตฟัดจ์ เนื้อฉ่ำ',
    price: 90,
    category: 'เบเกอรี่ & ของหวาน',
    tag: 'ยอดนิยม',
    description: 'เค้กช็อกโกแลตราดกานาชเนื้อฉ่ำ เข้มข้นหวานกำลังพอดี',
    image: unsplash('photo-1578985545062-69928b1d9587'),
    has_sweetness: false,
    has_temperature: false,
    allow_toppings: false,
  },

  // --- โปรโมชัน ---
  {
    id: 15,
    name: 'เซ็ต Duo: กาแฟคั่วพิเศษ + ครัวซองต์เนยสด',
    price: 125,
    category: 'โปรโมชัน',
    tag: 'คุ้มสุด เซฟ 20฿',
    description: 'จับคู่กาแฟแก้วโปรด (อเมริกาโน่/ลาเต้) พร้อมครัวซองต์เนยสดอบใหม่',
    image: unsplash('photo-1495474472287-4d71bcdd2085'),
    has_sweetness: true,
    has_temperature: true,
    temperature_options: ['hot', 'iced'],
    temperature_diff: { hot: 0, iced: 5 },
    allow_toppings: true,
  },
]

export const STATUS: Record<string, { label: string; badge: string }> = {
  pending: { label: 'รอร้านรับออเดอร์', badge: 'bg-amber-100 text-amber-800 border border-amber-200' },
  preparing: { label: 'กำลังทำ', badge: 'bg-amber-500 text-white font-bold' },
  served: { label: 'เสิร์ฟแล้ว', badge: 'bg-emerald-600 text-white font-bold' },
  paid: { label: 'ชำระเงินแล้ว', badge: 'bg-stone-200 text-stone-700' },
  cancelled: { label: 'ยกเลิก', badge: 'bg-rose-100 text-rose-700 border border-rose-200' },
}

export function statusOf(status: string | null) {
  const key = status || 'pending'
  return (
    STATUS[key] || {
      label: key,
      badge: 'bg-stone-100 text-stone-600 border border-stone-200',
    }
  )
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

export const MENU_STORAGE_KEY = 'bluehouse_menu_products_v2'

export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return PRODUCTS
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(PRODUCTS))
      return PRODUCTS
    }
    const parsed = JSON.parse(raw) as Product[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(PRODUCTS))
      return PRODUCTS
    }
    return parsed
  } catch {
    return PRODUCTS
  }
}

// Fetch live products from Central Database with automatic cache update
export async function fetchLiveProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/menu', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.products) && data.products.length > 0) {
        saveStoredProducts(data.products)
        return data.products
      }
    }
  } catch (err) {
    console.warn('Fetch live products error:', err)
  }
  return getStoredProducts()
}

export function saveStoredProducts(products: Product[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(products))
    window.dispatchEvent(
      new CustomEvent('bluehouse_menu_updated', { detail: products })
    )
  } catch {
    // fallback
  }
}

// Toggle product stock live across all devices
export async function updateProductStockLive(id: number, is_out_of_stock: boolean): Promise<boolean> {
  // 1. Optimistic update in client cache
  const current = getStoredProducts()
  const updated = current.map((p) => (p.id === id ? { ...p, is_out_of_stock } : p))
  saveStoredProducts(updated)

  // 2. Sync to Central API / Database
  try {
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_stock', id, is_out_of_stock }),
    })
    return res.ok
  } catch (err) {
    console.warn('Sync stock to DB error:', err)
    return false
  }
}

export function resetToDefaultProducts(): Product[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(PRODUCTS))
    window.dispatchEvent(
      new CustomEvent('bluehouse_menu_updated', { detail: PRODUCTS })
    )
  }
  return PRODUCTS
}

// Client-side image resizer to allow uploading local files directly and fitting menu dimensions
export function compressAndResizeImage(
  file: File,
  maxDim = 900,
  quality = 0.88
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
