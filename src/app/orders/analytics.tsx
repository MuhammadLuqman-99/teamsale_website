'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import { OrderData } from '@/lib/firestore'

interface OrdersAnalyticsProps {
  orders: OrderData[]
  filteredOrders: OrderData[]
}

export default function OrdersAnalytics({ orders, filteredOrders }: OrdersAnalyticsProps) {
  const [chartType, setChartType] = useState<'revenue' | 'platform' | 'team' | 'monthly'>('revenue')

  // Analytics calculations
  const analytics = useMemo(() => {
    // Revenue by platform
    const revenueByPlatform = orders.reduce((acc, order) => {
      const platform = order.platform || 'Unknown'
      acc[platform] = (acc[platform] || 0) + (order.total_rm || 0)
      return acc
    }, {} as Record<string, number>)

    // Revenue by team
    const revenueByTeam = orders.reduce((acc, order) => {
      const team = order.team_sale || 'Unknown'
      acc[team] = (acc[team] || 0) + (order.total_rm || 0)
      return acc
    }, {} as Record<string, number>)

    // Monthly trends
    const monthlyTrends = orders.reduce((acc, order) => {
      if (order.tarikh) {
        const month = order.tarikh.substring(0, 7) // YYYY-MM
        acc[month] = (acc[month] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Top performing products
    const productPerformance = orders.reduce((acc, order) => {
      const product = order.jenis_order || order.code_kain || 'Unknown Product'
      if (!acc[product]) {
        acc[product] = { count: 0, revenue: 0 }
      }
      acc[product].count += 1
      acc[product].revenue += (order.total_rm || 0)
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    return {
      revenueByPlatform,
      revenueByTeam,
      monthlyTrends,
      productPerformance,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total_rm || 0), 0),
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + (order.total_rm || 0), 0) / orders.length : 0,
      filteredRevenue: filteredOrders.reduce((sum, order) => sum + (order.total_rm || 0), 0),
      filteredOrdersCount: filteredOrders.length
    }
  }, [orders, filteredOrders])

  // Prepare data for charts
  const prepareChartData = () => {
    switch (chartType) {
      case 'revenue':
        return Object.entries(analytics.monthlyTrends)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({
            name: month,
            value: count,
            revenue: orders
              .filter(order => order.tarikh?.startsWith(month))
              .reduce((sum, order) => sum + (order.total_rm || 0), 0)
          }))

      case 'platform':
        return Object.entries(analytics.revenueByPlatform)
          .sort(([_, a], [__, b]) => b - a)
          .map(([platform, revenue]) => ({
            name: platform,
            value: revenue,
            orders: orders.filter(order => order.platform === platform).length
          }))

      case 'team':
        return Object.entries(analytics.revenueByTeam)
          .sort(([_, a], [__ , b]) => b - a)
          .map(([team, revenue]) => ({
            name: team,
            value: revenue,
            orders: orders.filter(order => order.team_sale === team).length
          }))

      case 'monthly':
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const currentYear = new Date().getFullYear()

        return months.map((month, index) => {
          const monthKey = `${currentYear}-${String(index + 1).padStart(2, '0')}`
          const monthOrders = orders.filter(order => order.tarikh?.startsWith(monthKey))

          return {
            name: month,
            value: monthOrders.length,
            revenue: monthOrders.reduce((sum, order) => sum + (order.total_rm || 0), 0)
          }
        })

      default:
        return []
    }
  }

  const chartData = prepareChartData()
  const maxValue = Math.max(...chartData.map(d => d.value))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Analytics Summary Cards */}
      <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-green-600 font-bold">📊</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                RM {analytics.totalRevenue.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
              </p>
              {filteredOrders.length < orders.length && (
                <p className="text-xs text-gray-500">
                  RM {analytics.filteredRevenue.toLocaleString('ms-MY', { minimumFractionDigits: 2 })} filtered
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-bold">📦</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders}</p>
              {filteredOrders.length < orders.length && (
                <p className="text-xs text-gray-500">{filteredOrders.length} filtered</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-purple-600 font-bold">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                RM {analytics.averageOrderValue.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-orange-600 font-bold">🎯</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">100%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart Type Selector */}
      <div className="lg:col-span-2">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Data Analytics</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('revenue')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  chartType === 'revenue'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📈 Trends
              </button>
              <button
                onClick={() => setChartType('platform')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  chartType === 'platform'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🛍️ Platform
              </button>
              <button
                onClick={() => setChartType('team')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  chartType === 'team'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                👥 Team
              </button>
              <button
                onClick={() => setChartType('monthly')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  chartType === 'monthly'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📅 Monthly
              </button>
            </div>
          </div>

          {/* Chart Visualization */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 capitalize">
              {chartType === 'revenue' && 'Order Trends Over Time'}
              {chartType === 'platform' && 'Revenue by Platform'}
              {chartType === 'team' && 'Revenue by Team'}
              {chartType === 'monthly' && 'Monthly Performance'}
            </h4>

            <div className="h-64 relative">
              {chartData.map((item, index) => (
                <div
                  key={index}
                  className="absolute left-0 right-0 flex items-end justify-between"
                  style={{ bottom: `${(index / chartData.length) * 100}%`, height: `${100 / chartData.length}%` }}
                >
                  <span className="text-xs text-gray-600 truncate">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="bg-blue-500 rounded transition-all duration-300"
                      style={{
                        width: `${maxValue > 0 ? (item.value / maxValue) * 50 : 2}px`,
                        height: '8px'
                      }}
                    />
                    <span className="text-xs font-medium text-gray-900">
                      {chartType === 'revenue' && `${item.value} orders`}
                      {chartType === 'platform' && `RM ${item.value.toLocaleString()}`}
                      {chartType === 'team' && `RM ${item.value.toLocaleString()}`}
                      {chartType === 'monthly' && `${item.value} orders`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Data Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-600">Name</th>
                  <th className="text-right py-2 text-gray-600">Orders</th>
                  <th className="text-right py-2 text-gray-600">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {chartData.slice(0, 5).map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900">{item.name}</td>
                    <td className="py-2 text-gray-600 text-right">{item.orders || item.value}</td>
                    <td className="py-2 text-gray-600 text-right">
                      RM {(item.revenue || 0).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}