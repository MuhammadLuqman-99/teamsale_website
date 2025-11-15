'use client'

import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { OrderData } from '@/lib/firestore'

interface OverviewTabProps {
  orders: OrderData[]
  filteredOrders: OrderData[]
  onViewDetails: (order: OrderData) => void
}

export default function OverviewTab({ orders, filteredOrders, onViewDetails }: OverviewTabProps) {
  const getTotalRevenue = () => {
    return filteredOrders.reduce((sum, order) => sum + (order.total_rm || 0), 0)
  }

  const getAverageOrderValue = () => {
    if (filteredOrders.length === 0) return 0
    return getTotalRevenue() / filteredOrders.length
  }

  // Get recent orders (last 10)
  const recentOrders = [...filteredOrders]
    .sort((a, b) => (b.tarikh || '').localeCompare(a.tarikh || ''))
    .slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">📦</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">{filteredOrders.length}</p>
              {filteredOrders.length < orders.length && (
                <p className="text-xs text-gray-500">of {orders.length} total</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
              <span className="text-green-600 dark:text-green-400 font-bold text-xl">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">
                RM {getTotalRevenue().toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold text-xl">📊</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Average Order</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">
                RM {getAverageOrderValue().toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mr-3">
              <span className="text-orange-600 dark:text-orange-400 font-bold text-xl">👥</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Unique Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">
                {[...new Set(filteredOrders.map(o => o.nama_customer))].length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">📋 Recent Orders</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">Latest {recentOrders.length} orders</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
              {recentOrders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-300">{order.tarikh}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-200">{order.nama_customer}</span>
                      {order.nombor_phone && (
                        <span className="text-xs text-gray-500 dark:text-slate-400">{order.nombor_phone}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-slate-300">
                      {order.jenis_order?.length > 30
                        ? order.jenis_order.substring(0, 30) + '...'
                        : order.jenis_order || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                      {order.team_sale}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-slate-200">
                    RM {order.total_rm.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewDetails(order)}
                    >
                      View
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
