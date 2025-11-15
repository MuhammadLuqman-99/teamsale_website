'use client'

import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import { OrderData } from '@/lib/firestore'

interface ProductsTabProps {
  orders: OrderData[]
  filteredOrders: OrderData[]
}

interface ProductStats {
  name: string
  totalQuantity: number
  totalRevenue: number
  orderCount: number
  type: string
  averagePrice: number
}

export default function ProductsTab({ orders, filteredOrders }: ProductsTabProps) {
  const productStats = useMemo(() => {
    const stats: Record<string, ProductStats> = {}

    filteredOrders.forEach(order => {
      if (order.structuredProducts && order.structuredProducts.length > 0) {
        order.structuredProducts.forEach((product: any) => {
          const key = product.name || 'Unknown Product'
          if (!stats[key]) {
            stats[key] = {
              name: key,
              totalQuantity: 0,
              totalRevenue: 0,
              orderCount: 0,
              type: product.type || 'Unknown',
              averagePrice: 0
            }
          }
          stats[key].totalQuantity += product.totalQty || 0
          stats[key].orderCount += 1
          stats[key].totalRevenue += (order.total_rm || 0)
        })
      } else {
        // For non-PDF orders, group by jenis_order
        const key = order.jenis_order || 'Unknown Product'
        if (!stats[key]) {
          stats[key] = {
            name: key,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
            type: 'Order',
            averagePrice: 0
          }
        }
        stats[key].totalQuantity += order.quantity || 1
        stats[key].orderCount += 1
        stats[key].totalRevenue += (order.total_rm || 0)
      }
    })

    // Calculate average price
    Object.values(stats).forEach(product => {
      product.averagePrice = product.totalRevenue / product.totalQuantity
    })

    return Object.values(stats)
  }, [filteredOrders])

  const topProducts = useMemo(() => {
    return [...productStats]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
  }, [productStats])

  const topByQuantity = useMemo(() => {
    return [...productStats]
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5)
  }, [productStats])

  const slowMoving = useMemo(() => {
    return [...productStats]
      .filter(p => p.orderCount < 3)
      .sort((a, b) => a.orderCount - b.orderCount)
      .slice(0, 5)
  }, [productStats])

  const totalRevenue = useMemo(() => {
    return productStats.reduce((sum, p) => sum + p.totalRevenue, 0)
  }, [productStats])

  return (
    <div className="space-y-6">
      {/* Product Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Total Products</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-50">{productStats.length}</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Items Sold</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {productStats.reduce((sum, p) => sum + p.totalQuantity, 0)}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              RM {totalRevenue.toLocaleString('ms-MY', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Top Product</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 truncate px-2">
              {topProducts[0]?.name || 'N/A'}
            </p>
          </div>
        </Card>
      </div>

      {/* Top Products by Revenue */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">🏆 Top Products by Revenue</h3>
        <div className="space-y-3">
          {topProducts.map((product, index) => (
            <div key={product.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
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
                  <p className="font-semibold text-gray-900 dark:text-slate-200">{product.name}</p>
                  <div className="flex gap-4 text-xs text-gray-600 dark:text-slate-400 mt-1">
                    <span>📦 {product.totalQuantity} units</span>
                    <span>🛍️ {product.orderCount} orders</span>
                    <span>🏷️ {product.type}</span>
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-bold text-gray-900 dark:text-slate-200">
                  RM {product.totalRevenue.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Avg: RM {product.averagePrice.toFixed(2)}/unit
                </p>
                <div className="w-32 bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${Math.min((product.totalRevenue / topProducts[0].totalRevenue) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top by Quantity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">📊 Most Popular (by Quantity)</h3>
          <div className="space-y-3">
            {topByQuantity.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center flex-1">
                  <span className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-200 text-sm">{product.name}</p>
                    <p className="text-xs text-gray-600 dark:text-slate-400">{product.orderCount} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600 dark:text-blue-400">{product.totalQuantity}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-500">units</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Slow Moving */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">📉 Slow Moving Products</h3>
          <div className="space-y-3">
            {slowMoving.length > 0 ? (
              slowMoving.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center flex-1">
                    <span className="w-8 h-8 bg-orange-600 dark:bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      ⚠️
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-slate-200 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-600 dark:text-slate-400">{product.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600 dark:text-orange-400">{product.orderCount}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500">orders only</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">
                All products performing well! 🎉
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* All Products Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">👕 All Products</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">Complete product performance data</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Avg Price</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
              {productStats.map((product) => (
                <tr key={product.name} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-200">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-400 rounded text-xs">
                      {product.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-slate-200">{product.totalQuantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{product.orderCount}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-slate-200">
                    RM {product.totalRevenue.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                    RM {product.averagePrice.toFixed(2)}
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
