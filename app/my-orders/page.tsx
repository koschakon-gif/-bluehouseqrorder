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

    const handleLocalAlert = () => fetchOrders()
    window.addEventListener('bluehouse_orders_updated', handleLocalAlert)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Gentle heartbeat fallback (35s) instead of aggressive 8s
    const interval = setInterval(fetchOrders, 35000)

    return () => {
      supabase.removeChannel?.(channel)
      window.removeEventListener('bluehouse_orders_updated', handleLocalAlert)
      document.removeEventListener('visibilitychange', handleVisibility)
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
    <main className="min-h-screen bg-[#FBF9F5] px-4 py-8 pb-20 text-[#2E2825]">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-xs font-semibold text-[#7D5537] hover:underline">
              ← กลับหน้าแรก
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-[#2E2825]">ติดตามสถานะออเดอร์</h1>
            <p className="text-xs text-[#7A6B60]">{SHOP_NAME} · อัปเดตสถานะแบบเรียลไทม์</p>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="rounded-xl border border-[#EAE2D7] bg-white px-3 py-1.5 text-xs font-semibold text-[#6F4E37] shadow-xs hover:bg-[#FAF6F0] transition"
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
                ? 'bg-[#7D5537] text-white shadow-xs'
                : 'bg-white border border-[#EAE2D7] text-[#6A5A4F] hover:bg-[#FAF6F0]'
            }`}
          >
            ออเดอร์ของเครื่องนี้ ({myOrderNos.length > 0 ? myOrderNos.length : 'ทั้งหมด'})
          </button>
          <button
            type="button"
            onClick={() => setViewScope('all')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              viewScope === 'all'
                ? 'bg-[#7D5537] text-white shadow-xs'
                : 'bg-white border border-[#EAE2D7] text-[#6A5A4F] hover:bg-[#FAF6F0]'
            }`}
          >
            ออเดอร์ล่าสุดทั้งหมด ({orders.length})
          </button>
        </div>

        {/* Search form */}
        <section className="mb-6 rounded-2xl border border-[#EDE5DA] bg-white p-4 shadow-2xs">
          <h2 className="mb-3 text-xs font-bold text-[#7A6B60]">ค้นหาออเดอร์</h2>
          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="เลขที่ออเดอร์ เช่น B2-101"
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              className="flex-1 rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs text-[#2E2825] outline-none focus:border-[#7D5537]"
            />
            <input
              type="number"
              placeholder="ค้นหาตามเลขโต๊ะ"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="w-full rounded-xl border border-[#EAE2D7] bg-[#FBF9F5] px-3 py-2 text-xs text-[#2E2825] outline-none focus:border-[#7D5537] sm:w-36"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#7D5537] px-4 py-2 text-xs font-bold text-white hover:bg-[#65432B] transition"
            >
              ค้นหา
            </button>
          </form>
        </section>

        {/* Orders list */}
        {loading && orders.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8D7F75]">กำลังโหลดรายการออเดอร์...</div>
        ) : displayedOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#EAE2D7] bg-white py-14 text-center">
            <p className="text-base font-bold text-[#55473F]">ไม่พบรายการออเดอร์</p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#F6EDE0] px-4 py-2 text-xs font-bold text-[#6F4E37]">
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
                  className="rounded-2xl border border-[#EDE5DA] bg-white p-5 shadow-2xs transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between border-b border-[#EFE8DE] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[#2E2825]">
                          {order.order_no}
                        </span>
                        {order.table_no && (
                          <span className="rounded-md bg-[#F6EDE0] px-2 py-0.5 text-xs font-bold text-[#6F4E37]">
                            โต๊ะ {order.table_no}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#8D7F75]">
                        {formatTime(order.created_at)}
                        {order.customer_name ? ` · โดย ${order.customer_name}` : ''}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusInfo.badge}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {order.note && (
                    <div className="mt-2.5 rounded-lg bg-[#FAF6F0] border border-[#EAE2D7] px-3 py-1.5 text-xs text-[#6F4E37]">
                      หมายเหตุ: {order.note}
                    </div>
                  )}

                  <ul className="mt-3 divide-y divide-[#F2ECE3] text-sm">
                    {order.items?.map((item, idx) => (
                      <li key={idx} className="flex justify-between py-2 text-[#3D2E24]">
                        <div>
                          <span className="font-semibold">
                            {item.name.replace(/\s*\([^)]*\)$/, '')}{' '}
                            <span className="text-xs font-bold text-[#7D5537]">×{item.quantity}</span>
                          </span>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {item.temperature && (
                              <span className="rounded bg-[#F6EDE0] px-1.5 py-0.5 text-[10px] font-bold text-[#6F4E37]">
                                {item.temperature === 'hot' ? '☕ ร้อน' : item.temperature === 'iced' ? '🧊 เย็น' : '🥤 ปั่น'}
                              </span>
                            )}
                            {item.sweetness && (
                              <span className="rounded bg-[#F6EDE0] px-1.5 py-0.5 text-[10px] font-bold text-[#6F4E37]">
                                หวาน {item.sweetness}
                              </span>
                            )}
                            {item.toppings && item.toppings.map((tp) => (
                              <span key={tp} className="rounded bg-[#EFE8DE] px-1.5 py-0.5 text-[10px] text-[#5C3D2E]">
                                +{tp}
                              </span>
                            ))}
                            {item.note && (
                              <span className="rounded bg-[#FAF6F0] px-1.5 py-0.5 text-[10px] text-[#8D7F75] italic">
                                📝 {item.note}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-[#7D5537]">
                          {baht(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex items-center justify-between border-t border-[#EFE8DE] pt-3">
                    <div>
                      <span className="text-xs text-[#8D7F75]">ยอดรวมทั้งสิ้น</span>
                      <p className="text-base font-extrabold text-[#7D5537]">
                        {baht(order.total_price)}
                      </p>
                    </div>

                    {order.table_no && (
                      <Link
                        href={`/table/${order.table_no}`}
                        className="rounded-xl border border-[#EAE2D7] bg-[#FAF6F0] px-3 py-1.5 text-xs font-bold text-[#6F4E37] hover:bg-[#F2ECE3] transition"
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
