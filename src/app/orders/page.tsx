'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { fetchOrders, OrderData } from '@/lib/firestore'

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      console.log('🔄 Loading orders...')
      const data = await fetchOrders()
      console.log('📦 Orders loaded:', data.length)
      setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewOrderDetails = (order: OrderData) => {
    setSelectedOrder(order)
    setShowDetails(true)
  }

  const closeOrderDetails = () => {
    setSelectedOrder(null)
    setShowDetails(false)
  }

  const getAverageOrderValue = () => {
    if (orders.length === 0) return 0
    const total = orders.reduce((sum, order) => sum + (order.total_rm || 0), 0)
    return total / orders.length
  }

  const getTotalRevenue = () => {
    return orders.reduce((sum, order) => sum + (order.total_rm || 0), 0)
  }

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase()
    return (
      order.nama_customer.toLowerCase().includes(searchLower) ||
      order.nombor_po_invoice.toLowerCase().includes(searchLower) ||
      order.team_sale.toLowerCase().includes(searchLower) ||
      order.platform.toLowerCase().includes(searchLower) ||
      order.jenis_order.toLowerCase().includes(searchLower) ||
      (order.code_kain && order.code_kain.toLowerCase().includes(searchLower))
    )
  })

  // Calculate product statistics from PDF invoices
  interface ProductStat {
    name: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
    type: string;
  }

  const productStats = orders.reduce((acc: Record<string, ProductStat>, order) => {
    if (order.structuredProducts && order.structuredProducts.length > 0) {
      order.structuredProducts.forEach((product: any) => {
        const key = product.name || 'Unknown Product'
        if (!acc[key]) {
          acc[key] = {
            name: key,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
            type: product.type || 'Unknown'
          }
        }
        acc[key].totalQuantity += product.totalQty || 0
        acc[key].orderCount += 1
        acc[key].totalRevenue += (order.total_rm || 0)
      })
    } else {
      // For non-PDF orders, group by jenis_order
      const key = order.jenis_order || 'Unknown Product'
      if (!acc[key]) {
        acc[key] = {
          name: key,
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0,
          type: 'Order'
        }
      }
      acc[key].totalQuantity += 1
      acc[key].orderCount += 1
      acc[key].totalRevenue += (order.total_rm || 0)
    }
    return acc
  }, {} as Record<string, ProductStat>)

  const topProducts: ProductStat[] = Object.values(productStats)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)

  const exportToCSV = () => {
    const headers = ['Tarikh', 'Customer', 'PO/Invoice', 'Team Sale', 'Phone', 'Jenis Order', 'Total (RM)', 'Platform']
    const csvData = filteredOrders.map(order => [
      order.tarikh,
      order.nama_customer,
      order.nombor_po_invoice,
      order.team_sale,
      order.nombor_phone,
      order.jenis_order,
      order.total_rm,
      order.platform
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen gradient-soft">
      <nav className="glass sticky top-0 z-50 border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">📦</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Orders</h2>
                <span className="text-xs text-gray-600">View All Orders</span>
              </div>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Dashboard</h1>
              <p className="text-gray-600">View and manage all orders</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={loadOrders}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
              <Button variant="secondary" onClick={exportToCSV}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </Button>
              <Link href="/ecommerce">
                <Button variant="primary">+ Add Order</Button>
              </Link>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">📦</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">💰</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    RM {getTotalRevenue().toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">📊</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Order</p>
                  <p className="text-2xl font-bold text-gray-900">
                    RM {getAverageOrderValue().toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">🔥</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Top Product</p>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {topProducts[0]?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Top Products Chart */}
          {topProducts.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Selling Products</h3>
              <div className="space-y-3">
                {topProducts.map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          {product.totalQuantity} items • {product.orderCount} orders • {product.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        RM {product.totalRevenue.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
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
          )}

          {/* Search Bar */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by customer, invoice, team, or platform..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border-0 focus:ring-0 focus:outline-none text-gray-900"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </Card>

          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>

          {/* Orders Table */}
          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No orders found' : 'No orders yet'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search term' : 'Start by adding your first order'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarikh</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO/Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Sale</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.tarikh}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{order.nama_customer}</span>
                            {order.nombor_phone && (
                              <span className="text-xs text-gray-500">{order.nombor_phone}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{order.nombor_po_invoice}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900 font-medium">
                              {order.jenis_order?.length > 30
                                ? order.jenis_order.substring(0, 30) + '...'
                                : order.jenis_order || 'N/A'}
                            </span>
                            {order.code_kain && order.code_kain !== 'N/A' && (
                              <span className="text-xs text-gray-500">SKU: {order.code_kain}</span>
                            )}
                            {order.structuredProducts && order.structuredProducts.length > 0 && (
                              <div className="text-xs text-blue-600">
                                📦 {order.structuredProducts.length} product(s) • {order.totalQuantity || 0} items
                              </div>
                            )}
                            {(order.tracking_number || order.payment_method) && (
                              <div className="flex gap-2 mt-1">
                                {order.tracking_number && (
                                  <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                                    📮 {order.tracking_number}
                                  </span>
                                )}
                                {order.payment_method && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">
                                    💳 {order.payment_method}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {order.team_sale}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">
                              RM {order.total_rm.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                            </span>
                            {order.quantity && order.quantity > 1 && (
                              <span className="text-xs text-gray-500">{order.quantity} units</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {order.platform}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => viewOrderDetails(order)}
                          >
                            View Details
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={closeOrderDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Invoice Number</p>
                    <p className="font-mono text-sm">{selectedOrder.nombor_po_invoice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">{selectedOrder.tarikh}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-semibold">{selectedOrder.nama_customer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{selectedOrder.nombor_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Platform</p>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {selectedOrder.platform}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Team Sale</p>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {selectedOrder.team_sale}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
                {selectedOrder.structuredProducts && selectedOrder.structuredProducts.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOrder.structuredProducts.map((product: any, index: number) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {product.type}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">SKU:</p>
                            <p className="font-semibold">{product.sku}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Total Quantity:</p>
                            <p className="font-semibold">{product.totalQty}</p>
                          </div>
                        </div>
                        {product.sizeBreakdown && product.sizeBreakdown.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 mb-2">Size Breakdown:</p>
                            <div className="flex flex-wrap gap-2">
                              {product.sizeBreakdown.map((size: any, sIndex: number) => (
                                <span
                                  key={sIndex}
                                  className="px-2 py-1 bg-white rounded border text-xs"
                                >
                                  {size.size}: {size.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Product Type</p>
                        <p className="font-semibold">{selectedOrder.jenis_order || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">SKU/Code</p>
                        <p className="font-semibold">{selectedOrder.code_kain || 'N/A'}</p>
                      </div>
                      {selectedOrder.quantity && (
                        <div>
                          <p className="text-sm text-gray-600">Quantity</p>
                          <p className="font-semibold">{selectedOrder.quantity}</p>
                        </div>
                      )}
                      {selectedOrder.unit_price && (
                        <div>
                          <p className="text-sm text-gray-600">Unit Price</p>
                          <p className="font-semibold">RM {selectedOrder.unit_price.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedOrder.tracking_number && (
                    <div>
                      <p className="text-sm text-gray-600">Tracking Number</p>
                      <p className="font-mono text-sm bg-green-100 p-2 rounded border border-green-200">
                        📮 {selectedOrder.tracking_number}
                      </p>
                    </div>
                  )}
                  {selectedOrder.payment_method && (
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-semibold bg-purple-100 p-2 rounded border border-purple-200">
                        💳 {selectedOrder.payment_method}
                      </p>
                    </div>
                  )}
                  {selectedOrder.shipping_option && (
                    <div>
                      <p className="text-sm text-gray-600">Shipping Option</p>
                      <p className="font-semibold">{selectedOrder.shipping_option}</p>
                    </div>
                  )}
                  {selectedOrder.alamat_penghantaran && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Shipping Address</p>
                      <p className="text-sm bg-gray-50 p-3 rounded border">
                        {selectedOrder.alamat_penghantaran}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-gray-900">Total Amount:</p>
                  <p className="text-2xl font-bold text-green-600">
                    RM {selectedOrder.total_rm.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <Button variant="secondary" onClick={closeOrderDetails}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}
