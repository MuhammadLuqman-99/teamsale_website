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

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await fetchOrders()
      setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase()
    return (
      order.nama_customer.toLowerCase().includes(searchLower) ||
      order.nombor_po_invoice.toLowerCase().includes(searchLower) ||
      order.team_sale.toLowerCase().includes(searchLower) ||
      order.platform.toLowerCase().includes(searchLower)
    )
  })

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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Sale</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.nama_customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.nombor_po_invoice}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {order.team_sale}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.nombor_phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.jenis_order}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          RM {order.total_rm.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {order.platform}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
