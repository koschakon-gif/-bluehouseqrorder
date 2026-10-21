'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { baht, formatTime, type AdminAlert } from '@/lib/config'

interface Props {
  soundEnabled?: boolean
  onSelectOrder?: (orderNo: string) => void
}

export default function AdminAlertCenter({ soundEnabled = true, onSelectOrder }: Props) {
  const [alerts, setAlerts] = useState<AdminAlert[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [toastAlert, setToastAlert] = useState<AdminAlert | null>(null)
  const [filterUnread, setFilterUnread] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)

  const audioCtxRef = useRef<any>(null)
  const prevAlertCountRef = useRef<number>(0)

  // Web Audio Chime on alert
  const playAlertChime = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = audioCtxRef.current || new AudioCtx()
      audioCtxRef.current = ctx

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(659.25, ctx.currentTime) // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12) // A5
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.25) // C6
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.65)
    } catch {
      // ignore
    }
  }, [soundEnabled])

  // Fetch alerts from API
  const fetchAlerts = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch('/api/admin/alert')
      if (res.ok) {
        const data = await res.json()
        const fetched: AdminAlert[] = data.alerts || []

        if (!isInitial && fetched.length > prevAlertCountRef.current) {
          const newest = fetched[0]
          if (newest && !newest.is_read) {
            setToastAlert(newest)
            playAlertChime()
          }
        }

        prevAlertCountRef.current = fetched.length
        setAlerts(fetched)
      }
    } catch (err) {
      console.warn('Fetch alerts error:', err)
    }
  }, [playAlertChime])

  useEffect(() => {
    fetchAlerts(true)

    // Listen to local in-browser broadcast event
    const handleLocalAlert = (e: any) => {
      const order = e.detail
      if (order) {
        const localAlert: AdminAlert = {
          id: `alert-${Date.now()}`,
          type: 'new_order',
          title: `🔔 ออเดอร์ใหม่ โต๊ะ ${order.table_no ?? '-'} (#${order.order_no})`,
          message: (order.items || []).map((i: any) => `${i.name} x${i.quantity}`).join(', '),
          order_no: order.order_no,
          table_no: order.table_no,
          amount: order.total_price,
          is_read: false,
          created_at: new Date().toISOString(),
        }
        setAlerts((prev) => [localAlert, ...prev])
        setToastAlert(localAlert)
        playAlertChime()
      }
    }

    window.addEventListener('bluehouse_admin_alert', handleLocalAlert)

    // Polling interval
    const timer = setInterval(() => fetchAlerts(false), 5000)

    return () => {
      window.removeEventListener('bluehouse_admin_alert', handleLocalAlert)
      clearInterval(timer)
    }
  }, [fetchAlerts, playAlertChime])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastAlert) return
    const dismissTimer = setTimeout(() => {
      setToastAlert(null)
    }, 6000)
    return () => clearTimeout(dismissTimer)
  }, [toastAlert])

  const unreadCount = alerts.filter((a) => !a.is_read).length

  const markAsRead = async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)))
    try {
      await fetch('/api/admin/alert', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {
      // ignore
    }
  }

  const markAllAsRead = async () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
    try {
      await fetch('/api/admin/alert', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
    } catch {
      // ignore
    }
  }

  const clearAllAlerts = async () => {
    setAlerts([])
    try {
      await fetch('/api/admin/alert', { method: 'DELETE' })
    } catch {
      // ignore
    }
  }

  const sendTestAlert = async () => {
    setIsSendingTest(true)
    try {
      const res = await fetch('/api/admin/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `🔔 ทดสอบแจ้งเตือนแอดมิน โต๊ะ ${Math.floor(1 + Math.random() * 6)}`,
          message: 'ชาไทยนมสด x2, เค้กช็อกโกแลต x1 (ทดสอบระบบ Admin Alert)',
          order_no: `TEST-${Math.floor(100 + Math.random() * 900)}`,
          table_no: Math.floor(1 + Math.random() * 6),
          amount: 205,
          type: 'new_order',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.alert) {
          setAlerts((prev) => [data.alert, ...prev])
          setToastAlert(data.alert)
          playAlertChime()
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSendingTest(false)
    }
  }

  const displayedAlerts = filterUnread ? alerts.filter((a) => !a.is_read) : alerts

  return (
    <>
      {/* Trigger Button in Navigation */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 active:scale-95"
        title="Admin Alert Center (การแจ้งเตือนผู้ดูแล)"
      >
        <span className="text-sm">🔔</span>
        <span>Admin Alert</span>
        {unreadCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Pop-up Toast Alert */}
      {toastAlert && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-red-500/30 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-600 text-sm font-bold animate-bounce">
                🚨
              </span>
              <div>
                <p className="text-xs font-bold text-white">{toastAlert.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-300">
                  {toastAlert.message}
                </p>
                {toastAlert.amount && (
                  <p className="mt-1 text-xs font-extrabold text-amber-400">
                    ยอดรวม: {baht(toastAlert.amount)}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToastAlert(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
            <span className="text-slate-400">{formatTime(toastAlert.created_at)}</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(true)
                setToastAlert(null)
              }}
              className="font-bold text-blue-400 hover:underline"
            >
              ดูทั้งหมด →
            </button>
          </div>
        </div>
      )}

      {/* Admin Alert Center Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-base font-bold text-white shadow-sm">
                  🔔
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Admin Alert Center</h3>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        {unreadCount} ใหม่
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    ระบบแจ้งเตือนออเดอร์และกิจกรรมของร้านแบบเรียลไทม์
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Sub-actions toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterUnread(false)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    !filterUnread ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({alerts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterUnread(true)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    filterUnread ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ยังไม่อ่าน ({unreadCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSendingTest}
                  onClick={sendTestAlert}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {isSendingTest ? '...' : '+ ยิงทดสอบ'}
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-blue-600 hover:underline"
                  >
                    อ่านทั้งหมด
                  </button>
                )}
                {alerts.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllAlerts}
                    className="text-[11px] font-medium text-red-500 hover:underline"
                  >
                    ล้าง
                  </button>
                )}
              </div>
            </div>

            {/* Alert List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-transparent">
              {displayedAlerts.length === 0 ? (
                <div className="py-16 text-center">
                  <span className="text-3xl">📭</span>
                  <p className="mt-2 text-sm font-semibold text-slate-700">ไม่มีการแจ้งเตือน</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    เมื่อลูกค้าสั่งอาหาร รายการแจ้งเตือนจะเด้งที่นี่ทันที
                  </p>
                </div>
              ) : (
                displayedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-2xl border p-4 transition ${
                      !alert.is_read
                        ? 'border-blue-200 bg-blue-50/40 ring-1 ring-blue-500/20'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {!alert.is_read && (
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                          )}
                          <h4 className="text-sm font-bold text-slate-900">{alert.title}</h4>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          {alert.message}
                        </p>
                        {alert.amount !== undefined && (
                          <p className="mt-1.5 text-xs font-extrabold text-blue-600">
                            ยอดรวม: {baht(alert.amount)}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400">
                          {formatTime(alert.created_at)}
                        </span>
                        {!alert.is_read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(alert.id)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            ทำเครื่องหมายว่าอ่านแล้ว
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-4 text-center">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
