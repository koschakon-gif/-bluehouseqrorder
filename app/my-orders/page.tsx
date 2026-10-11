'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SHOP_NAME, baht, formatTime, statusOf } from '@/lib/config'
import type { Order } from '@/lib/config'

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchNo, setSearchNo] = useState('')
  const [searchTable, setSearchTable] = useState('')

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      // Retrieve stored order numbers from this device
      let localOrderNos: string[] = []
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('bluehouse_my_order_numbers')
        if (stored) {
          try {
            localOrderNos = JSON.parse(stored)
          } catch {
            localOrderNos = []
          }
        }
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        return
      }

      if (data) {
        // If user has specific stored orders, we prioritize or mark them, or show all device orders
        if (localOrderNos.length > 0) {
          const userOrders = data.filter((o: Order) => localOrderNos.includes(o.order_no))
          if (userOrders.length > 0) {
            setOrders(userOrders)
            return
          }
        }
        // Fallback: show recent orders so user has visibility
        setOrders(data.slice(0, 10))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('my-orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel?.(channel)
    }
  }, [fetchOrders])

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false })

      if (searchNo.trim()) {
        query = query.eq('order_no', searchNo.trim())
      } else if (searchTable.trim()) {
        query = query.eq('table_no', Number(searchTable.trim()))
      }

      const { data, error } = await query
      if (!error && data) {
        setOrders(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-xs text-blue-600 hover:underline">
              ← กลับหน้าแรก
            </Link>
            <h1 className="mt-1 text-2xl font-bold">ออเดอร์ของฉัน</h1>
            <p className="text-xs text-slate-500">{SHOP_NAME} · ติดตามสถานะอาหารแบบเรียลไทม์</p>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            รีเฟรช ⟳
          </button>
        </header>

        {/* Search form */}
        <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xs font-semibold text-slate-500">ค้นหาออเดอร์</h2>
          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="เลขที่ออเดอร์ เช่น B2-101"
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="หรือค้นหาตามเลขโต๊ะ"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:w-36"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              ค้นหา
            </button>
          </form>
        </section>

        {/* Orders list */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">กำลังโหลดรายการออเดอร์...</div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <p className="text-base font-semibold text-slate-700">ยังไม่มีรายการออเดอร์</p>
            <p className="mt-1 text-xs text-slate-400">สแกน QR บนโต๊ะเพื่อเริ่มสั่งอาหารได้เลย</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              ไปเลือกโต๊ะสั่งอาหาร
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = statusOf(order.status)
              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">
                          {order.order_no}
                        </span>
                        {order.table_no && (
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            โต๊ะ {order.table_no}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {formatTime(order.created_at)}
                        {order.customer_name ? ` · โดย ${order.customer_name}` : ''}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.badge}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {order.note && (
                    <div className="mt-2.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
                      หมายเหตุ: {order.note}
                    </div>
                  )}

                  <ul className="mt-3 divide-y divide-slate-50 text-sm">
                    {order.items?.map((item, idx) => (
                      <li key={idx} className="flex justify-between py-2 text-slate-700">
                        <span>
                          {item.name} <span className="text-xs text-slate-400">×{item.quantity}</span>
                        </span>
                        <span className="font-medium text-slate-900">
                          {baht(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">ยอดรวมทั้งสิ้น</span>
                    <span className="text-base font-bold text-blue-600">
                      {baht(order.total_price)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
