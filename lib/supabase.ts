import { createClient } from '@supabase/supabase-js'
import type { Order } from './config'

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

// true = ใส่ค่า Supabase ครบแล้ว (รองรับทั้งคีย์ anon แบบเก่า และ publishable แบบใหม่)
export const isSupabaseReady =
  url.startsWith('https://') && (key.startsWith('eyJ') || key.startsWith('sb_publishable_'))

// Default demo orders for local/preview mode
const INITIAL_DEMO_ORDERS: Order[] = [
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
    customer_name: null,
    note: null,
    items: [
      { id: 2, name: 'ลาเต้ร้อน', price: 60, quantity: 2 },
      { id: 6, name: 'ครัวซองต์เนยสด', price: 70, quantity: 1 },
    ],
    total_price: 190,
    status: 'preparing',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
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
    return JSON.parse(raw) as Order[]
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
            in(col: string, vals: any[]) {
              const strVals = vals.map(String)
              orders = orders.filter((o: any) => strVals.includes(String(o[col])))
              return queryBuilder
            },
            order(col: string, options?: { ascending?: boolean }) {
              const ascending = options?.ascending ?? true
              orders.sort((a: any, b: any) => {
                if (a[col] < b[col]) return ascending ? -1 : 1
                if (a[col] > b[col]) return ascending ? 1 : -1
                return 0
              })
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
          return {
            select(_cols = '*') {
              return {
                single() {
                  return {
                    then(onfulfilled?: (res: any) => any) {
                      const all = getLocalOrders()
                      const item = Array.isArray(records) ? records[0] : records
                      const newOrder: Order = {
                        id: item.id || Date.now(),
                        order_no: item.order_no || `B-${Math.floor(100 + Math.random() * 900)}`,
                        table_no: item.table_no ?? null,
                        customer_name: item.customer_name ?? null,
                        note: item.note ?? null,
                        items: item.items ?? [],
                        total_price: item.total_price ?? 0,
                        status: item.status ?? 'pending',
                        created_at: item.created_at || new Date().toISOString(),
                      }
                      const updated = [newOrder, ...all]
                      saveLocalOrders(updated)
                      return Promise.resolve({ data: newOrder, error: null }).then(onfulfilled)
                    },
                  }
                },
                then(onfulfilled?: (res: any) => any) {
                  const all = getLocalOrders()
                  const toInsert = (Array.isArray(records) ? records : [records]).map((item: any) => ({
                    id: item.id || Date.now() + Math.random(),
                    order_no: item.order_no || `B-${Math.floor(100 + Math.random() * 900)}`,
                    table_no: item.table_no ?? null,
                    customer_name: item.customer_name ?? null,
                    note: item.note ?? null,
                    items: item.items ?? [],
                    total_price: item.total_price ?? 0,
                    status: item.status ?? 'pending',
                    created_at: item.created_at || new Date().toISOString(),
                  }))
                  const updated = [...toInsert, ...all]
                  saveLocalOrders(updated)
                  return Promise.resolve({ data: toInsert, error: null }).then(onfulfilled)
                },
              }
            },
            then(onfulfilled?: (res: any) => any) {
              const all = getLocalOrders()
              const toInsert = (Array.isArray(records) ? records : [records]).map((item: any) => ({
                id: item.id || Date.now() + Math.random(),
                order_no: item.order_no || `B-${Math.floor(100 + Math.random() * 900)}`,
                table_no: item.table_no ?? null,
                customer_name: item.customer_name ?? null,
                note: item.note ?? null,
                items: item.items ?? [],
                total_price: item.total_price ?? 0,
                status: item.status ?? 'pending',
                created_at: item.created_at || new Date().toISOString(),
              }))
              const updated = [...toInsert, ...all]
              saveLocalOrders(updated)
              return Promise.resolve({ data: toInsert, error: null }).then(onfulfilled)
            },
          }
        },
        update(patch: any) {
          let targetId: any = null
          return {
            eq(col: string, val: any) {
              if (col === 'id' || col === 'order_no') targetId = val
              return {
                then(onfulfilled?: (res: any) => any) {
                  const all = getLocalOrders()
                  const updated = all.map((o) => {
                    if (String((o as any)[col]) === String(val)) {
                      return { ...o, ...patch }
                    }
                    return o
                  })
                  saveLocalOrders(updated)
                  return Promise.resolve({ data: updated, error: null }).then(onfulfilled)
                },
              }
            },
          }
        },
        delete() {
          return {
            eq(col: string, val: any) {
              return {
                then(onfulfilled?: (res: any) => any) {
                  const all = getLocalOrders()
                  const updated = all.filter((o) => String((o as any)[col]) !== String(val))
                  saveLocalOrders(updated)
                  return Promise.resolve({ data: updated, error: null }).then(onfulfilled)
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
        // Mock sign in - allow staff login in preview
        if (password && password.length >= 4) {
          const user = { id: 'mock-staff-id', email }
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
