'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { baht, type Order } from '@/lib/config'

interface Props {
  orders: Order[]
}

interface DailyData {
  dateKey: string // YYYY-MM-DD
  displayDate: string // e.g. "5 ต.ค."
  fullDate: string
  revenue: number
  ordersCount: number
}

export default function KitchenAnalyticsChart({ orders }: Props) {
  const [mounted, setMounted] = useState(false)
  const [activeMetric, setActiveMetric] = useState<'both' | 'revenue' | 'orders'>('both')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate the 7 days window (last 6 days + today)
  const chartData: DailyData[] = useMemo(() => {
    const days: DailyData[] = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)

      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`

      const displayDate = d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
      })

      const fullDate = d.toLocaleDateString('th-TH', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
      })

      days.push({
        dateKey,
        displayDate: i === 0 ? `วันนี้ (${displayDate})` : displayDate,
        fullDate,
        revenue: 0,
        ordersCount: 0,
      })
    }

    // Aggregate orders
    orders.forEach((o) => {
      if (o.status === 'cancelled') return // Exclude cancelled orders
      if (!o.created_at) return

      const orderDate = new Date(o.created_at)
      if (isNaN(orderDate.getTime())) return

      const year = orderDate.getFullYear()
      const month = String(orderDate.getMonth() + 1).padStart(2, '0')
      const day = String(orderDate.getDate()).padStart(2, '0')
      const key = `${year}-${month}-${day}`

      const target = days.find((d) => d.dateKey === key)
      if (target) {
        target.ordersCount += 1
        target.revenue += Number(o.total_price || 0)
      }
    })

    return days
  }, [orders])

  // Summary Metrics
  const totalRevenue7d = useMemo(
    () => chartData.reduce((sum, d) => sum + d.revenue, 0),
    [chartData]
  )
  const totalOrders7d = useMemo(
    () => chartData.reduce((sum, d) => sum + d.ordersCount, 0),
    [chartData]
  )
  const avgOrderValue = totalOrders7d > 0 ? Math.round(totalRevenue7d / totalOrders7d) : 0
  const todayData = chartData[chartData.length - 1]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload as DailyData
      return (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/95 p-3.5 text-xs text-white shadow-xl backdrop-blur-md">
          <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2">
            {dataItem.fullDate}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                ยอดขายรวม:
              </span>
              <span className="font-bold text-white">{baht(dataItem.revenue)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                จำนวนออเดอร์:
              </span>
              <span className="font-bold text-white">{dataItem.ordersCount} ออเดอร์</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header and Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
              📈
            </span>
            <h2 className="text-base font-bold text-slate-900">
              สถิติยอดขายและจำนวนออเดอร์ 7 วันล่าสุด
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            กราฟเปรียบเทียบจำนวนออเดอร์ (Order Volume) และยอดขายรวม (Total Revenue) ย้อนหลัง 7 วัน
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMetric('both')}
            className={`rounded-lg px-2.5 py-1 transition ${
              activeMetric === 'both'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            แสดงทั้งสองอย่าง
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('revenue')}
            className={`rounded-lg px-2.5 py-1 transition ${
              activeMetric === 'revenue'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เฉพาะยอดขาย
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('orders')}
            className={`rounded-lg px-2.5 py-1 transition ${
              activeMetric === 'orders'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เฉพาะจำนวนออเดอร์
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5">
          <p className="text-[11px] font-semibold text-blue-700">ยอดขายรวม 7 วัน</p>
          <p className="mt-1 text-lg font-extrabold text-blue-900">{baht(totalRevenue7d)}</p>
          <p className="mt-0.5 text-[10px] text-blue-600">จากออเดอร์ทั้งหมดในระบบ</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5">
          <p className="text-[11px] font-semibold text-emerald-700">จำนวนออเดอร์ 7 วัน</p>
          <p className="mt-1 text-lg font-extrabold text-emerald-900">{totalOrders7d} ออเดอร์</p>
          <p className="mt-0.5 text-[10px] text-emerald-600">เฉลี่ย ~{Math.round(totalOrders7d / 7)} รายการ/วัน</p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5">
          <p className="text-[11px] font-semibold text-indigo-700">เฉลี่ยต่อบิล (AOV)</p>
          <p className="mt-1 text-lg font-extrabold text-indigo-900">{baht(avgOrderValue)}</p>
          <p className="mt-0.5 text-[10px] text-indigo-600">ต่อ 1 ใบเสร็จ</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5">
          <p className="text-[11px] font-semibold text-amber-700">ยอดขายวันนี้</p>
          <p className="mt-1 text-lg font-extrabold text-amber-900">{baht(todayData?.revenue || 0)}</p>
          <p className="mt-0.5 text-[10px] text-amber-600">{todayData?.ordersCount || 0} ออเดอร์ของวันนี้</p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-4 h-72 w-full pt-2">
        {!mounted ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            กำลังโหลดข้อมูลกราฟ...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />

              {/* Left Y-Axis for Revenue */}
              {(activeMetric === 'both' || activeMetric === 'revenue') && (
                <YAxis
                  yAxisId="revenue"
                  orientation="left"
                  tick={{ fontSize: 11, fill: '#3b82f6' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `฿${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                />
              )}

              {/* Right Y-Axis for Orders Count */}
              {(activeMetric === 'both' || activeMetric === 'orders') && (
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#10b981' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `${val} บิล`}
                />
              )}

              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
              />

              {/* Revenue Line */}
              {(activeMetric === 'both' || activeMetric === 'revenue') && (
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name="ยอดขาย (บาท)"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#1d4ed8' }}
                />
              )}

              {/* Order Volume Line */}
              {(activeMetric === 'both' || activeMetric === 'orders') && (
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="ordersCount"
                  name="จำนวนออเดอร์ (รายการ)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#047857' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}
