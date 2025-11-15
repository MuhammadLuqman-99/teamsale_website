'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { fetchOrders, OrderData } from '@/lib/firestore'
import OrdersAnalytics from './analytics'
import { exportToExcel, exportToPDF, exportFilteredData, exportDateRange } from '@/lib/exportUtils'
import ThemeToggle from '@/components/ThemeToggle'

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)

  // Advanced filtering states
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  })
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [minAmount, setMinAmount] = useState<string>('')
  const [maxAmount, setMaxAmount] = useState<string>('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportOptions && !(event.target as Element).closest('.relative')) {
        setShowExportOptions(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showExportOptions])

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

  // Get unique platforms and teams for filters
  const getUniquePlatforms = () => {
    const platforms = [...new Set(orders.map(order => order.platform).filter(Boolean))]
    return platforms.sort()
  }

  const getUniqueTeams = () => {
    const teams = [...new Set(orders.map(order => order.team_sale).filter(Boolean))]
    return teams.sort()
  }

  // Clear all filters
  const clearFilters = () => {
    setDateRange({ start: '', end: '' })
    setSelectedPlatform('all')
    setSelectedTeam('all')
    setMinAmount('')
    setMaxAmount('')
    setSearchTerm('')
  }

  // Check if any filters are active
  const hasActiveFilters = () => {
    return dateRange.start || dateRange.end || selectedPlatform !== 'all' ||
           selectedTeam !== 'all' || minAmount || maxAmount || searchTerm
  }

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase()

    // Search filter
    const matchesSearch =
      order.nama_customer.toLowerCase().includes(searchLower) ||
      order.nombor_po_invoice.toLowerCase().includes(searchLower) ||
      order.team_sale.toLowerCase().includes(searchLower) ||
      order.platform.toLowerCase().includes(searchLower) ||
      order.jenis_order.toLowerCase().includes(searchLower) ||
      (order.code_kain && order.code_kain.toLowerCase().includes(searchLower))

    // Date range filter
    const matchesDateRange =
      (!dateRange.start || order.tarikh >= dateRange.start) &&
      (!dateRange.end || order.tarikh <= dateRange.end)

    // Platform filter
    const matchesPlatform =
      selectedPlatform === 'all' || order.platform === selectedPlatform

    // Team filter
    const matchesTeam =
      selectedTeam === 'all' || order.team_sale === selectedTeam

    // Amount filter
    const orderAmount = order.total_rm || 0
    const matchesAmount =
      (!minAmount || orderAmount >= parseFloat(minAmount)) &&
      (!maxAmount || orderAmount <= parseFloat(maxAmount))

    return matchesSearch && matchesDateRange && matchesPlatform && matchesTeam && matchesAmount
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

  const handleExport = (format: 'csv' | 'pdf') => {
    if (filteredOrders.length === 0) {
      alert('No orders to export')
      return
    }

    if (format === 'pdf') {
      exportToPDF(filteredOrders, `orders_${new Date().toISOString().split('T')[0]}.pdf`)
    } else {
      exportToExcel(filteredOrders, `orders_${new Date().toISOString().split('T')[0]}.csv`)
    }
    setShowExportOptions(false)
  }

  const handleExportFiltered = () => {
    const filters = {
      dateRange: dateRange.start && dateRange.end ? `${dateRange.start} to ${dateRange.end}` : null,
      platform: selectedPlatform !== 'all' ? selectedPlatform : null,
      team: selectedTeam !== 'all' ? selectedTeam : null,
      minAmount: minAmount || null,
      maxAmount: maxAmount || null,
      search: searchTerm || null
    }

    exportFilteredData(filteredOrders, filters)
    setShowExportOptions(false)
  }

  const handleExportDateRange = () => {
    if (dateRange.start && dateRange.end) {
      exportDateRange(orders, dateRange.start, dateRange.end)
      setShowExportOptions(false)
    }
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
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">← Back to Dashboard</Button>
              </Link>
            </div>
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
            <div className="flex gap-3 flex-wrap">
              <Button variant="secondary" onClick={loadOrders}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>

              {/* Enhanced Export Button with Dropdown */}
              <div className="relative">
                <Button
                  variant="secondary"
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10V6m0 0l-3 3m3-3v3m0 6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Export
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>

                {showExportOptions && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => handleExport('csv')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <span className="text-green-600">📊</span>
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport('pdf')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <span className="text-red-600">📄</span>
                        Export as PDF
                      </button>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleExportFiltered}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                        disabled={filteredOrders.length === orders.length}
                      >
                        <span className="text-blue-600">🔍</span>
                        Export Filtered Data
                        {filteredOrders.length < orders.length && (
                          <span className="text-xs text-gray-500">({filteredOrders.length} of {orders.length})</span>
                        )}
                      </button>
                      <button
                        onClick={handleExportDateRange}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                        disabled={!dateRange.start || !dateRange.end}
                      >
                        <span className="text-purple-600">📅</span>
                        Export Date Range
                        {dateRange.start && dateRange.end && (
                          <span className="text-xs text-gray-500">
                            ({dateRange.start} to {dateRange.end})
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <Link href="/debug-firestore">
                <Button variant="secondary">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Debug
                </Button>
              </Link>
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

          {/* Analytics Section */}
          {!loading && orders.length > 0 && (
            <OrdersAnalytics orders={orders} filteredOrders={filteredOrders} />
          )}

          {/* Search Bar & Filters */}
          <Card className="p-4 mb-6">
            {/* Main Search Bar */}
            <div className="flex items-center gap-3 mb-4">
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

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  hasActiveFilters()
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {hasActiveFilters() && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {[dateRange.start, dateRange.end, selectedPlatform !== 'all', selectedTeam !== 'all', minAmount, maxAmount].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Clear Filters */}
              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Platform Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                    <select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Platforms</option>
                      {getUniquePlatforms().map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
                      ))}
                    </select>
                  </div>

                  {/* Team Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Teams</option>
                      {getUniqueTeams().map(team => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>

                  {/* Min Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount (RM)</label>
                    <input
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Max Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount (RM)</label>
                    <input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      placeholder="99999.99"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Quick Filter Presets */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const today = new Date()
                      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                      setDateRange({
                        start: lastWeek.toISOString().split('T')[0],
                        end: today.toISOString().split('T')[0]
                      })
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date()
                      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
                      setDateRange({
                        start: lastMonth.toISOString().split('T')[0],
                        end: today.toISOString().split('T')[0]
                      })
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date()
                      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                      setDateRange({
                        start: firstDayOfMonth.toISOString().split('T')[0],
                        end: today.toISOString().split('T')[0]
                      })
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700"
                  >
                    This Month
                  </button>
                </div>
              </div>
            )}
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
                  {hasActiveFilters() ? 'No orders match your filters' : (orders.length === 0 ? 'No orders yet' : 'No orders found')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {hasActiveFilters()
                    ? 'Try adjusting your filters or search term'
                    : (orders.length === 0 ? 'Start by adding your first order' : 'Try adjusting your search term')
                  }
                </p>
                {hasActiveFilters() && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
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
