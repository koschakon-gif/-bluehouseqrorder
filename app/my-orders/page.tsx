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
  const [viewScope, setViewScope] = useState<'my' | 'all'>('my')
  const [myOrderNos, setMyOrderNos] = useState<string[]>([])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
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
      setMyOrderNos(localOrderNos)

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        return
      }

      if (data) {
        setOrders(data)
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

    const interval = setInterval(fetchOrders, 8000)

    return () => {
      supabase.removeChannel?.(channel)
      clearInterval(interval)
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
        setViewScope('all')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Filter based on viewScope
  const displayedOrders = orders.filter((o) => {
    if (viewScope === 'my') {
      if (myOrderNos.length > 0) {
        return myOrderNos.includes(o.order_no)
      }
      // If no local orders yet, show all so screen isn't unexpectedly blank
      return true
    }
    return true
  })

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 pb-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-xs text-blue-600 hover:underline">
              ← กลับหน้าแรก
            </Link>
            <h1 className="mt-1 text-2xl font-bold">ติดตามออเดอร์</h1>
            <p className="text-xs text-slate-500">{SHOP_NAME} · อัปเดตสถานะแบบเรียลไทม์</p>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            รีเฟรช ⟳
          </button>
        </header>

        {/* View Scope Tabs */}
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setViewScope('my')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              viewScope === 'my'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            ออเดอร์ของเครื่องนี้ ({myOrderNos.length > 0 ? myOrderNos.length : 'ทั้งหมด'})
          </button>
          <button
            type="button"
            onClick={() => setViewScope('all')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              viewScope === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            ออเดอร์ล่าสุดทั้งหมด ({orders.length})
          </button>
        </div>

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
              placeholder="ค้นหาตามเลขโต๊ะ"
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
        {loading && orders.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">กำลังโหลดรายการออเดอร์...</div>
        ) : displayedOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <p className="text-base font-semibold text-slate-700">ไม่พบรายการออเดอร์</p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
              <span>📱 กรุณาสแกน QR Code บนโต๊ะเพื่อเริ่มสั่งอาหาร</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => {
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
                    <div>
                      <span className="text-xs text-slate-500">ยอดรวมทั้งสิ้น</span>
                      <p className="text-base font-bold text-blue-600">
                        {baht(order.total_price)}
                      </p>
                    </div>

                    {order.table_no && (
                      <Link
                        href={`/table/${order.table_no}`}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        + สั่งอาหารเพิ่มที่โต๊ะ {order.table_no}
                      </Link>
                    )}
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
