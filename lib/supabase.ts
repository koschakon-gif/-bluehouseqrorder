import { createClient } from '@supabase/supabase-js'
import type { Order } from './config'

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

// true = ใส่ค่า Supabase ครบแล้ว (รองรับทั้งคีย์ anon แบบเก่า และ publishable แบบใหม่)
export const isSupabaseReady =
  url.startsWith('https://') && (key.startsWith('eyJ') || key.startsWith('sb_publishable_'))

// Helper to generate dates in past days
const pastDate = (daysAgo: number, hoursAgo = 2) =>
  new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000).toISOString()

// Default demo orders for local/preview mode with 7-day history
const INITIAL_DEMO_ORDERS: Order[] = [
  // Today
  {
    id: 1,
    order_no: 'B2-101',
    table_no: 2,
    customer_name: 'คุณมายด์',
    note: 'หวานน้อย',
    items: [
      { id: 1, name: 'อเมริกาโน่เย็น', price: 55, quantity: 1 },
      { id: 5, name: 'เค้กช็อกโกแลต', price: 85, quantity: 1 },
    ],
    total_price: 140,
    status: 'pending',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    order_no: 'B4-102',
    table_no: 4,
    customer_name: 'คุณกอล์ฟ',
    note: 'แยกน้ำแข็ง',
    items: [
      { id: 2, name: 'ลาเต้ร้อน', price: 60, quantity: 2 },
      { id: 6, name: 'ครัวซองต์เนยสด', price: 70, quantity: 1 },
    ],
    total_price: 190,
    status: 'preparing',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    order_no: 'B1-103',
    table_no: 1,
    customer_name: null,
    note: null,
    items: [
      { id: 3, name: 'ชาไทยนมสด', price: 60, quantity: 1 },
      { id: 8, name: 'มัทฉะลาเต้', price: 75, quantity: 1 },
    ],
    total_price: 135,
    status: 'served',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  // 1 day ago
  {
    id: 4,
    order_no: 'B3-098',
    table_no: 3,
    customer_name: 'คุณแพรว',
    note: null,
    items: [
      { id: 7, name: 'เซ็ตกาแฟ + เค้ก', price: 120, quantity: 2 },
      { id: 4, name: 'โกโก้เย็น', price: 65, quantity: 1 },
    ],
    total_price: 305,
    status: 'paid',
    created_at: pastDate(1, 3),
  },
  {
    id: 5,
    order_no: 'B5-097',
    table_no: 5,
    customer_name: null,
    note: null,
    items: [
      { id: 1, name: 'อเมริกาโน่เย็น', price: 55, quantity: 3 },
      { id: 6, name: 'ครัวซองต์เนยสด', price: 70, quantity: 2 },
    ],
    total_price: 305,
    status: 'paid',
    created_at: pastDate(1, 6),
  },
  // 2 days ago
  {
    id: 6,
    order_no: 'B2-092',
    table_no: 2,
    customer_name: 'คุณบอส',
    note: null,
    items: [
      { id: 2, name: 'ลาเต้ร้อน', price: 60, quantity: 2 },
      { id: 8, name: 'มัทฉะลาเต้', price: 75, quantity: 2 },
      { id: 5, name: 'เค้กช็อกโกแลต', price: 85, quantity: 1 },
    ],
    total_price: 355,
    status: 'paid',
    created_at: pastDate(2, 4),
  },
  {
    id: 7,
    order_no: 'B6-091',
    table_no: 6,
    customer_name: null,
    note: null,
    items: [{ id: 7, name: 'เซ็ตกาแฟ + เค้ก', price: 120, quantity: 3 }],
    total_price: 360,
    status: 'paid',
    created_at: pastDate(2, 7),
  },
  // 3 days ago
  {
    id: 8,
    order_no: 'B1-085',
    table_no: 1,
    customer_name: 'คุณอาร์ม',
    note: null,
    items: [
      { id: 3, name: 'ชาไทยนมสด', price: 60, quantity: 2 },
      { id: 4, name: 'โกโก้เย็น', price: 65, quantity: 2 },
    ],
    total_price: 250,
    status: 'paid',
    created_at: pastDate(3, 5),
  },
  {
    id: 9,
    order_no: 'B4-084',
    table_no: 4,
    customer_name: null,
    note: null,
    items: [
      { id: 1, name: 'อเมริกาโน่เย็น', price: 55, quantity: 2 },
      { id: 6, name: 'ครัวซองต์เนยสด', price: 70, quantity: 1 },
    ],
    total_price: 180,
    status: 'paid',
    created_at: pastDate(3, 8),
  },
  // 4 days ago
  {
    id: 10,
    order_no: 'B5-079',
    table_no: 5,
    customer_name: 'คุณเจ',
    note: null,
    items: [
      { id: 7, name: 'เซ็ตกาแฟ + เค้ก', price: 120, quantity: 2 },
      { id: 2, name: 'ลาเต้ร้อน', price: 60, quantity: 1 },
    ],
    total_price: 300,
    status: 'paid',
    created_at: pastDate(4, 4),
  },
  {
    id: 11,
    order_no: 'B3-078',
    table_no: 3,
    customer_name: null,
    note: null,
    items: [
      { id: 5, name: 'เค้กช็อกโกแลต', price: 85, quantity: 2 },
      { id: 8, name: 'มัทฉะลาเต้', price: 75, quantity: 2 },
    ],
    total_price: 320,
    status: 'paid',
    created_at: pastDate(4, 7),
  },
  // 5 days ago
  {
    id: 12,
    order_no: 'B2-071',
    table_no: 2,
    customer_name: 'คุณตั้ม',
    note: null,
    items: [
      { id: 1, name: 'อเมริกาโน่เย็น', price: 55, quantity: 4 },
      { id: 6, name: 'ครัวซองต์เนยสด', price: 70, quantity: 3 },
    ],
    total_price: 430,
    status: 'paid',
    created_at: pastDate(5, 5),
  },
  // 6 days ago
  {
    id: 13,
    order_no: 'B6-065',
    table_no: 6,
    customer_name: 'คุณหญิง',
    note: null,
    items: [
      { id: 7, name: 'เซ็ตกาแฟ + เค้ก', price: 120, quantity: 1 },
      { id: 4, name: 'โกโก้เย็น', price: 65, quantity: 2 },
    ],
    total_price: 250,
    status: 'paid',
    created_at: pastDate(6, 6),
  },
]

const LOCAL_STORAGE_KEY = 'bluehouse_mock_orders'

function getLocalOrders(): Order[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_ORDERS
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ORDERS))
      return INITIAL_DEMO_ORDERS
    }
    const parsed = JSON.parse(raw) as Order[]
    if (parsed.length <= 3) {
      // Merge with initial demo orders to ensure 7-day chart has rich historical data
      const merged = [...parsed]
      for (const item of INITIAL_DEMO_ORDERS) {
        if (!merged.some((m) => m.order_no === item.order_no)) {
          merged.push(item)
        }
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged))
      return merged
    }
    return parsed
  } catch {
    return INITIAL_DEMO_ORDERS
  }
}

function saveLocalOrders(orders: Order[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders))
    window.dispatchEvent(new CustomEvent('bluehouse_orders_updated', { detail: orders }))
  } catch {
    // fallback ignore
  }
}

// In-memory / localStorage fallback when Supabase is not yet configured
function createMockSupabaseClient(): any {
  return {
    from(table: string) {
      return {
        select(_cols = '*') {
          let orders = [...getLocalOrders()]
          let isSingle = false

          const queryBuilder: any = {
            eq(col: string, val: any) {
              orders = orders.filter((o: any) => String(o[col]) === String(val))
              return queryBuilder
            },
            neq(col: string, val: any) {
              orders = orders.filter((o: any) => String(o[col]) !== String(val))
              return queryBuilder
            },
            in(col: string, vals: any[]) {
              const strVals = vals.map(String)
              orders = orders.filter((o: any) => strVals.includes(String(o[col])))
              return queryBuilder
            },
            order(col: string, options?: { ascending?: boolean }) {
              const ascending = options?.ascending ?? true
              orders.sort((a: any, b: any) => {
                const valA = a[col] ?? ''
                const valB = b[col] ?? ''
                if (valA < valB) return ascending ? -1 : 1
                if (valA > valB) return ascending ? 1 : -1
                return 0
              })
              return queryBuilder
            },
            limit(n: number) {
              orders = orders.slice(0, n)
              return queryBuilder
            },
            single() {
              isSingle = true
              return queryBuilder
            },
            then(onfulfilled?: (res: any) => any, onrejected?: (res: any) => any) {
              const result = isSingle
                ? { data: orders[0] || null, error: orders[0] ? null : { message: 'Not found' } }
                : { data: orders, error: null }
              return Promise.resolve(result).then(onfulfilled, onrejected)
            },
          }

          return queryBuilder
        },
        insert(records: any | any[]) {
          const makeInsertResult = (single: boolean) => {
            const all = getLocalOrders()
            const items = Array.isArray(records) ? records : [records]
            const inserted = items.map((item: any, idx: number) => ({
              id: item.id || Date.now() + idx,
              order_no: item.order_no || `B-${Math.floor(100 + Math.random() * 900)}`,
              table_no: item.table_no ?? null,
              customer_name: item.customer_name ?? null,
              note: item.note ?? null,
              items: item.items ?? [],
              total_price: item.total_price ?? 0,
              status: item.status ?? 'pending',
              created_at: item.created_at || new Date().toISOString(),
            }))
            const updated = [...inserted, ...all]
            saveLocalOrders(updated)
            return single ? inserted[0] : inserted
          }

          return {
            select(_cols = '*') {
              return {
                single() {
                  return {
                    then(onfulfilled?: (res: any) => any) {
                      const res = makeInsertResult(true)
                      return Promise.resolve({ data: res, error: null }).then(onfulfilled)
                    },
                  }
                },
                then(onfulfilled?: (res: any) => any) {
                  const res = makeInsertResult(false)
                  return Promise.resolve({ data: res, error: null }).then(onfulfilled)
                },
              }
            },
            then(onfulfilled?: (res: any) => any) {
              const res = makeInsertResult(false)
              return Promise.resolve({ data: res, error: null }).then(onfulfilled)
            },
          }
        },
        update(patch: any) {
          const applyUpdate = (col: string, val: any) => {
            const all = getLocalOrders()
            const updated = all.map((o) => {
              if (String((o as any)[col]) === String(val)) {
                return { ...o, ...patch }
              }
              return o
            })
            saveLocalOrders(updated)
            return updated.filter((o) => String((o as any)[col]) === String(val))
          }

          return {
            eq(col: string, val: any) {
              const builder: any = {
                select(_cols = '*') {
                  return {
                    single() {
                      return {
                        then(onfulfilled?: (res: any) => any) {
                          const updated = applyUpdate(col, val)
                          return Promise.resolve({ data: updated[0] || null, error: null }).then(onfulfilled)
                        },
                      }
                    },
                    then(onfulfilled?: (res: any) => any) {
                      const updated = applyUpdate(col, val)
                      return Promise.resolve({ data: updated, error: null }).then(onfulfilled)
                    },
                  }
                },
                then(onfulfilled?: (res: any) => any) {
                  const updated = applyUpdate(col, val)
                  return Promise.resolve({ data: updated, error: null }).then(onfulfilled)
                },
              }
              return builder
            },
          }
        },
        delete() {
          return {
            eq(col: string, val: any) {
              return {
                select(_cols = '*') {
                  return {
                    then(onfulfilled?: (res: any) => any) {
                      const all = getLocalOrders()
                      const updated = all.filter((o) => String((o as any)[col]) !== String(val))
                      saveLocalOrders(updated)
                      return Promise.resolve({ data: null, error: null }).then(onfulfilled)
                    },
                  }
                },
                then(onfulfilled?: (res: any) => any) {
                  const all = getLocalOrders()
                  const updated = all.filter((o) => String((o as any)[col]) !== String(val))
                  saveLocalOrders(updated)
                  return Promise.resolve({ data: null, error: null }).then(onfulfilled)
                },
              }
            },
          }
        },
      }
    },
    channel(_channelName: string) {
      return {
        on(_event: string, _filter: any, callback: (payload: any) => void) {
          if (typeof window !== 'undefined') {
            const listener = () => callback({ new: {}, old: {} })
            window.addEventListener('bluehouse_orders_updated', listener)
            window.addEventListener('storage', listener)
          }
          return {
            subscribe() {
              return {
                unsubscribe() {},
              }
            },
          }
        },
        subscribe() {
          return {
            unsubscribe() {},
          }
        },
      }
    },
    removeChannel() {},
    auth: {
      async signInWithPassword({ email, password }: any) {
        if (password && password.length >= 4) {
          const user = { id: 'mock-staff-id', email: email || 'staff@bluehouse.cafe' }
          if (typeof window !== 'undefined') {
            localStorage.setItem('bluehouse_mock_user', JSON.stringify(user))
          }
          return { data: { user, session: { access_token: 'mock-token' } }, error: null }
        }
        return { data: null, error: { message: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร' } }
      },
      async signOut() {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('bluehouse_mock_user')
        }
        return { error: null }
      },
      async getUser() {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('bluehouse_mock_user')
          if (raw) return { data: { user: JSON.parse(raw) }, error: null }
        }
        return { data: { user: null }, error: null }
      },
      async getSession() {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('bluehouse_mock_user')
          if (raw) return { data: { session: { user: JSON.parse(raw) } }, error: null }
        }
        return { data: { session: null }, error: null }
      },
      onAuthStateChange(cb: any) {
        return {
          data: {
            subscription: {
              unsubscribe() {},
            },
          },
        }
      },
    },
  }
}

export const supabase: any = isSupabaseReady
  ? createClient(url, key)
  : createMockSupabaseClient()
