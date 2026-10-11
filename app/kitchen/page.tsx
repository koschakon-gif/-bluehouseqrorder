'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { SHOP_NAME, STATUS, baht, formatTime, statusOf, type Order } from '@/lib/config'
import { supabase } from '@/lib/supabase'

export default function KitchenPage() {
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const checkUser = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user || null)
    } catch {
      setUser(null)
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  useEffect(() => {
    if (!user) return

    fetchOrders()

    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    // Poll periodically in case of socket issues
    const interval = setInterval(fetchOrders, 8000)

    return () => {
      supabase.removeChannel?.(channel)
      clearInterval(interval)
    }
  }, [user, fetchOrders])

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsLoggingIn(true)
    setAuthError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })
      if (error) {
        setAuthError(error.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      } else {
        setUser(data.user)
      }
    } catch (err: any) {
      setAuthError(err?.message || 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleQuickDemoLogin = async () => {
    setIsLoggingIn(true)
    setAuthError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'staff@bluehouse.cafe',
        password: 'password123',
      })
      if (error) {
        setAuthError(error.message)
      } else {
        setUser(data.user)
      }
    } catch (err: any) {
      setAuthError(err?.message || 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateOrderStatus = async (orderId: string | number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (!error) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'active') return ['pending', 'preparing'].includes(o.status || '')
    return o.status === filterStatus
  })

  // Pending count for badge
  const pendingCount = orders.filter((o) => o.status === 'pending').length

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-md shadow-blue-500/30">
              B
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900">หน้าจอครัว & แคชเชียร์</h1>
            <p className="mt-1 text-xs text-slate-500">{SHOP_NAME} · สำหรับพนักงานเท่านั้น</p>
          </div>

          {authError && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs text-red-600">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">อีเมลพนักงาน</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@bluehouse.cafe"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">รหัสผ่าน</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="mt-2 w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="relative my-6 text-center text-xs text-slate-400">
            <span className="bg-white px-2">หรือเข้าใช้งานเพื่อทดสอบ</span>
          </div>

          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={isLoggingIn}
            className="w-full rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
          >
            เข้าใช้งานด่วน (Demo Mode)
          </button>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
              ← กลับสู่หน้าหลัก
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base font-bold">
              B
            </span>
            <div>
              <h1 className="text-base font-bold">{SHOP_NAME} · หน้าจอจัดการออเดอร์</h1>
              <p className="text-xs text-slate-400">
                พนักงาน: {user.email || 'Demo Staff'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchOrders}
              className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              รีเฟรช ⟳
            </button>
            <Link
              href="/"
              className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              หน้าร้าน
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-red-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ทั้งหมด ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('active')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              filterStatus === 'active'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            กำลังดำเนินการ
            {pendingCount > 0 && (
              <span className="rounded-full bg-red-600 px-1.5 py-0.2 text-[10px] text-white">
                {pendingCount}
              </span>
            )}
          </button>
          {Object.entries(STATUS).map(([key, info]) => {
            const count = orders.filter((o) => o.status === key).length
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilterStatus(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  filterStatus === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {info.label} ({count})
              </button>
            )
          })}
        </div>
      </header>

      {/* Orders Grid */}
      <div className="p-6">
        {loadingOrders ? (
          <div className="py-20 text-center text-slate-400">กำลังโหลดรายการออเดอร์...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <p className="text-base font-bold text-slate-600">ไม่มีออเดอร์ในหมวดนี้</p>
            <p className="mt-1 text-xs text-slate-400">เมื่อมีลูกค้าสั่งอาหาร รายการจะแสดงขึ้นที่นี่อัตโนมัติ</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOrders.map((order) => {
              const statusInfo = statusOf(order.status)
              return (
                <div
                  key={order.id}
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                    order.status === 'pending'
                      ? 'border-amber-400 ring-2 ring-amber-400/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-extrabold text-white">
                            โต๊ะ {order.table_no ?? '-'}
                          </span>
                          <span className="text-sm font-bold text-slate-800">{order.order_no}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {formatTime(order.created_at)}
                          {order.customer_name ? ` · ${order.customer_name}` : ''}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusInfo.badge}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {order.note && (
                      <div className="mt-2.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
                        ⚡ {order.note}
                      </div>
                    )}

                    <div className="my-3 space-y-1.5 divide-y divide-slate-50 text-xs">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between pt-1.5 text-slate-700">
                          <span className="font-semibold text-slate-800">
                            {item.name}{' '}
                            <span className="font-bold text-blue-600">×{item.quantity}</span>
                          </span>
                          <span className="text-slate-500">{baht(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs text-slate-400">ยอดรวม</span>
                      <span className="text-base font-extrabold text-blue-600">
                        {baht(order.total_price)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      {order.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="col-span-2 rounded-xl bg-blue-600 py-2 text-white hover:bg-blue-700 shadow-xs"
                        >
                          รับออเดอร์ (เข้าครัว)
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(order.id, 'served')}
                          className="col-span-2 rounded-xl bg-green-600 py-2 text-white hover:bg-green-700 shadow-xs"
                        >
                          พร้อมเสิร์ฟ / เสิร์ฟแล้ว
                        </button>
                      )}

                      {order.status === 'served' && (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(order.id, 'paid')}
                          className="col-span-2 rounded-xl bg-slate-900 py-2 text-white hover:bg-slate-800 shadow-xs"
                        >
                          ชำระเงินเรียบร้อย
                        </button>
                      )}

                      {order.status !== 'cancelled' && order.status !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`ต้องการยกเลิกออเดอร์ ${order.order_no} ใช่หรือไม่?`)) {
                              updateOrderStatus(order.id, 'cancelled')
                            }
                          }}
                          className="col-span-2 rounded-xl border border-red-200 bg-red-50 py-1.5 text-red-600 hover:bg-red-100"
                        >
                          ยกเลิกออเดอร์
                        </button>
                      )}
                    </div>
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
