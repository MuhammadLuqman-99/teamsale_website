'use client'

import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import { OrderData } from '@/lib/firestore'

interface CustomersTabProps {
  orders: OrderData[]
  filteredOrders: OrderData[]
}

interface CustomerStats {
  name: string
  phone: string
  address: string
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate: string
  products: string[]
}

export default function CustomersTab({ orders, filteredOrders }: CustomersTabProps) {
  const customerStats = useMemo(() => {
    const stats: Record<string, CustomerStats> = {}

    filteredOrders.forEach(order => {
      const customerName = order.nama_customer
      if (!stats[customerName]) {
        stats[customerName] = {
          name: customerName,
          phone: order.nombor_phone || 'N/A',
          address: order.alamat_penghantaran || 'N/A',
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastOrderDate: order.tarikh,
          products: []
        }
      }

      stats[customerName].totalOrders++
      stats[customerName].totalSpent += order.total_rm || 0

      if (order.tarikh > stats[customerName].lastOrderDate) {
        stats[customerName].lastOrderDate = order.tarikh
        stats[customerName].phone = order.nombor_phone || stats[customerName].phone
        stats[customerName].address = order.alamat_penghantaran || stats[customerName].address
      }

      if (order.jenis_order && !stats[customerName].products.includes(order.jenis_order)) {
        stats[customerName].products.push(order.jenis_order)
      }
    })

    // Calculate average order value
    Object.values(stats).forEach(customer => {
      customer.averageOrderValue = customer.totalSpent / customer.totalOrders
    })

    return Object.values(stats)
  }, [filteredOrders])

  const topCustomers = useMemo(() => {
    return [...customerStats]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
  }, [customerStats])

  const repeatCustomers = useMemo(() => {
    return customerStats.filter(c => c.totalOrders > 1)
  }, [customerStats])

  const newCustomers = useMemo(() => {
    return customerStats.filter(c => c.totalOrders === 1)
  }, [customerStats])

  return (
    <div className="space-y-6">
      {/* Customer Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-50">{customerStats.length}</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Repeat Customers</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{repeatCustomers.length}</p>
            <p className="text-xs text-gray-500 dark:text-slate-500">
              {((repeatCustomers.length / customerStats.length) * 100).toFixed(0)}% retention
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">New Customers</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{newCustomers.length}</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Avg Customer Value</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              RM {(customerStats.reduce((sum, c) => sum + c.totalSpent, 0) / customerStats.length || 0).toFixed(0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Top Customers by Spending */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">🏆 Top Customers by Spending</h3>
        <div className="space-y-3">
          {topCustomers.map((customer, index) => (
            <div key={customer.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <div className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                  index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                  index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                  'bg-gradient-to-r from-blue-400 to-blue-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-slate-200">{customer.name}</p>
                  <div className="flex gap-4 text-xs text-gray-600 dark:text-slate-400 mt-1">
                    <span>📞 {customer.phone}</span>
                    <span>📦 {customer.totalOrders} orders</span>
                    <span>📅 Last: {customer.lastOrderDate}</span>
                  </div>
                  {customer.address !== 'N/A' && (
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 truncate">📍 {customer.address}</p>
                  )}
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-bold text-gray-900 dark:text-slate-200">
                  RM {customer.totalSpent.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Avg: RM {customer.averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* All Customers Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">👥 All Customers</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">Complete customer directory with contact details</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
              {customerStats.map((customer) => (
                <tr key={customer.name} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-200">{customer.name}</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">Last order: {customer.lastOrderDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{customer.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400 max-w-xs truncate">
                    {customer.address}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                      {customer.totalOrders} orders
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-slate-200">
                    RM {customer.totalSpent.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    {customer.totalOrders > 1 ? (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                        ✅ Repeat
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-400 rounded-full text-xs font-medium">
                        🆕 New
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
