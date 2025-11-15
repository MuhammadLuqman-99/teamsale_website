'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import StatsCard from '@/components/ui/StatsCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import FilterSection, { FilterValues } from '@/components/FilterSection'
import PowerMetrics from '@/components/PowerMetrics'
import MarketingCostChart from '@/components/charts/MarketingCostChart'
import LeadPerformanceChart from '@/components/charts/LeadPerformanceChart'
import LeadSourcesChart from '@/components/charts/LeadSourcesChart'
import TopPerformersChart from '@/components/charts/TopPerformersChart'
import SalesTrendChart from '@/components/charts/SalesTrendChart'
import {
  fetchOrders,
  fetchMarketingData,
  fetchSalesTeamData,
  fetchActiveTeamMembers,
  OrderData,
  MarketingData,
  SalesTeamData
} from '@/lib/firestore'
import {
  calculateDashboardStats,
  calculatePowerMetrics,
  getQuickDateRange,
  formatCurrency
} from '@/lib/metrics'
import ThemeToggle from '@/components/ThemeToggle'

const MONTHLY_TARGET = 15000

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState('')
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderData[]>([])
  const [marketing, setMarketing] = useState<MarketingData[]>([])
  const [salesTeam, setSalesTeam] = useState<SalesTeamData[]>([])
  const [teams, setTeams] = useState<string[]>([])
  const [activeFilters, setActiveFilters] = useState<FilterValues>({
    period: 'this-month',
    startDate: '',
    endDate: '',
    team: ''
  })
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Load initial data
  useEffect(() => {
    setMounted(true)
    loadData()
    loadTeams()
  }, [])

  useEffect(() => {
    if (!mounted) return

    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('ms-MY', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [mounted])

  // Auto-refresh data every 2 minutes
  useEffect(() => {
    if (!autoRefresh) return

    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing data...')
      loadData(activeFilters)
    }, 120000) // 2 minutes

    return () => clearInterval(refreshInterval)
  }, [autoRefresh, activeFilters])

  const loadTeams = async () => {
    try {
      const teamMembers = await fetchActiveTeamMembers()
      const teamNames = teamMembers.map(member => member.name)
      setTeams(teamNames)
    } catch (error) {
      console.error('Error loading teams:', error)
    }
  }

  const loadData = async (filters?: FilterValues) => {
    setLoading(true)
    console.log('🔄 Loading data with filters:', filters)
    try {
      let startDate = ''
      let endDate = ''
      let team = filters?.team || ''

      // Calculate date range based on filter type
      if (filters?.period) {
        const range = getQuickDateRange(filters.period)
        startDate = range.startDate
        endDate = range.endDate
        console.log('📅 Date range:', { startDate, endDate })
      } else if (filters?.startDate && filters?.endDate) {
        startDate = filters.startDate
        endDate = filters.endDate
      }

      console.log('🔍 Fetching from Firebase...')
      const [ordersData, marketingData, salesTeamData] = await Promise.all([
        fetchOrders(startDate, endDate, team),
        fetchMarketingData(startDate, endDate, team),
        fetchSalesTeamData(startDate, endDate, team)
      ])

      console.log('✅ Data loaded successfully:', {
        orders: ordersData.length,
        marketing: marketingData.length,
        salesTeam: salesTeamData.length
      })

      if (ordersData.length === 0 && marketingData.length === 0 && salesTeamData.length === 0) {
        console.warn('⚠️ No data found in Firebase collections. Please add data first.')
      }

      setOrders(ordersData)
      setMarketing(marketingData)
      setSalesTeam(salesTeamData)
    } catch (error: any) {
      console.error('❌ Error loading data:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      alert(`Firebase Error: ${error.message}\n\nCheck browser console for details.`)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterApply = (filters: FilterValues) => {
    setActiveFilters(filters)
    loadData(filters)
  }

  // Get target date for metrics calculation based on active filters
  const getTargetDate = (): Date | undefined => {
    if (activeFilters.period === 'last-month') {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth() - 1, 15) // Mid-month of last month
    }
    if (activeFilters.startDate) {
      // Use the start date of the filter range
      return new Date(activeFilters.startDate)
    }
    return undefined // Use current date
  }

  // Calculate metrics
  const stats = calculateDashboardStats(orders, marketing, salesTeam)
  const powerMetrics = calculatePowerMetrics(orders, marketing, salesTeam, getTargetDate())

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen gradient-soft">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-sm md:text-lg">K</span>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">KilangDM</h2>
                <span className="text-xs text-gray-600 hidden sm:block">Analytics Dashboard</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-900 font-medium">
                Home
              </Link>
              <Link href="/balance" className="text-gray-600 hover:text-gray-900 transition-colors">
                Balance
              </Link>
              <Link href="/orders" className="text-gray-600 hover:text-gray-900 transition-colors">
                Orders
              </Link>
              <Link href="/ecommerce" className="text-gray-600 hover:text-gray-900 transition-colors">
                eCommerce
              </Link>
              <Link href="/marketing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Marketing
              </Link>
              <Link href="/salesteam" className="text-gray-600 hover:text-gray-900 transition-colors">
                Sales Team
              </Link>
              <Link href="/team-members" className="text-gray-600 hover:text-gray-900 transition-colors">
                Team
              </Link>
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <div className="hidden md:block text-right">
              <div className="text-xs text-gray-500">Last Updated</div>
              <div className="text-sm font-mono text-gray-900">{mounted ? currentTime : '--:--:--'}</div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4 space-y-2"
            >
              <Link href="/dashboard" className="block px-4 py-2 text-gray-900 font-medium bg-gray-100 rounded-lg">
                Home
              </Link>
              <Link href="/balance" className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Balance Monitor
              </Link>
              <Link href="/orders" className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Orders
              </Link>
              <Link href="/ecommerce" className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                eCommerce
              </Link>
              <Link href="/marketing" className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Marketing
              </Link>
              <Link href="/salesteam" className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Sales Team
              </Link>
              <Link href="/team-members" className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Team Members
              </Link>
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Theme</span>
                <ThemeToggle />
              </div>
              <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200 mt-2 pt-2">
                Last Updated: {mounted ? currentTime : '--:--:--'}
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-sm md:text-lg text-gray-600">
                Comprehensive Business Intelligence & Performance Metrics
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="text-left sm:text-right">
                <span className="text-xs md:text-sm text-gray-600 block">
                  {activeFilters.team ? 'Target Team' : 'Target Gabungan'}
                </span>
                <span className="text-lg md:text-xl font-bold text-gray-900">
                  {formatCurrency(activeFilters.team ? MONTHLY_TARGET : powerMetrics.totalMonthlyTarget)}
                </span>
                {!activeFilters.team && powerMetrics.numberOfTeams > 1 && (
                  <span className="text-xs text-gray-500 block">
                    {powerMetrics.numberOfTeams} teams × {formatCurrency(MONTHLY_TARGET)}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-full bg-green-50 border border-green-200">
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs md:text-sm font-medium text-green-700">
                  {autoRefresh ? 'Live' : 'Paused'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter Section */}
        <FilterSection onFilterApply={handleFilterApply} teams={teams} />

        {/* Key Performance Indicators */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Key Performance Indicators
                {activeFilters.team && (
                  <span className="text-sm font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full">
                    {activeFilters.team}
                  </span>
                )}
              </h2>
              <p className="text-gray-600">
                {activeFilters.team
                  ? `Showing data for ${activeFilters.team} team`
                  : 'Real-time business metrics'}
              </p>
            </div>
            <Button variant="secondary" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <StatsCard
                  title={activeFilters.team ? `Total Sales - ${activeFilters.team}` : `Total Sales (${stats.activeTeamSales} Teams)`}
                  value={formatCurrency(stats.totalSales)}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  color="blue"
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <StatsCard
                  title={activeFilters.team ? `Total Lead - ${activeFilters.team}` : `Total Lead (Semua Team)`}
                  value={stats.totalLeads.toString()}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                  color="green"
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <StatsCard
                  title="Lead per Team"
                  value={`${stats.leadsPerAgent} / team`}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                  color="purple"
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <StatsCard
                  title="Total Orders"
                  value={`${stats.totalOrders} orders`}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                  color="yellow"
                />
              </motion.div>
            </div>
          )}

          {/* Data Source Info */}
          {!loading && !activeFilters.team && stats.activeTeamSales > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-6"
            >
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">📊 Paparan Data Gabungan</h4>
                    <p className="text-sm text-gray-700">
                      Menunjukkan jumlah gabungan dari <strong>{stats.activeTeamSales} sales team</strong>.
                      Data diambil dari power metrics yang dimasukkan oleh setiap team untuk bulan semasa.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-white rounded-lg border border-blue-200">
                        💰 Total Sales: Dari power_metrics semua team
                      </span>
                      <span className="px-2 py-1 bg-white rounded-lg border border-blue-200">
                        📋 Total Lead: Jumlah lead semua team
                      </span>
                      <span className="px-2 py-1 bg-white rounded-lg border border-blue-200">
                        📦 Orders: Bilangan order keseluruhan
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {!loading && activeFilters.team && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-6"
            >
              <Card className="p-4 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">🎯 Data Team: {activeFilters.team}</h4>
                    <p className="text-sm text-gray-700">
                      Menunjukkan prestasi khusus untuk <strong>{activeFilters.team}</strong>.
                      Data individu team dari power metrics bulan semasa.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </section>

        {/* Power Metrics */}
        {!loading && (
          <PowerMetrics
            metrics={powerMetrics}
            monthlyTarget={MONTHLY_TARGET}
            filteredTeam={activeFilters.team}
          />
        )}

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { href: '/ecommerce', icon: '🛒', color: 'from-green-500 to-green-600', title: 'Input Order', desc: 'Tambah order baru' },
              { href: '/awb-shopee', icon: '🛍️', color: 'from-orange-500 to-red-500', title: 'AWB Shopee', desc: 'Upload AWB Shopee' },
              { href: '/awb-tiktok', icon: '🎵', color: 'from-black to-pink-500', title: 'AWB TikTok', desc: 'Upload AWB TikTok' },
              { href: '/marketing', icon: '📈', color: 'from-purple-500 to-purple-600', title: 'Marketing Data', desc: 'Update campaign' },
              { href: '/salesteam', icon: '👥', color: 'from-yellow-500 to-yellow-600', title: 'Sales Team', desc: 'Update leads' },
              { href: '/team-members', icon: '🧑‍💼', color: 'from-blue-500 to-blue-600', title: 'Team Members', desc: 'Urus ahli team' },
              { href: '/followup', icon: '📞', color: 'from-red-500 to-red-600', title: 'Follow Up', desc: 'Track follow-ups' },
            ].map((action, index) => (
              <Link key={index} href={action.href}>
                <motion.div
                  className={`card-apple bg-gradient-to-br ${action.color} p-6 text-white cursor-pointer group`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* Charts Section */}
        {!loading && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Analytics Charts</h2>
              <p className="text-gray-600">Visual data representation</p>
            </div>

            {/* Main Feature Chart - Sales Trend from Power Metrics */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Sales Trend by Team (Power Metrics)
                  </h3>
                  <p className="text-sm text-gray-600">Team sales performance based on power metrics updates</p>
                </div>
              </div>
              <div className="h-80">
                <SalesTrendChart salesTeamData={salesTeam} chartType="area" />
              </div>
            </Card>

            {/* Lead Performance Chart */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Lead Performance by Sales Team
                  </h3>
                  <p className="text-sm text-gray-600">Cold, Warm, and Hot lead breakdown by team</p>
                </div>
              </div>
              <div className="h-80">
                <LeadPerformanceChart salesTeamData={salesTeam} />
              </div>
            </Card>

            {/* Secondary Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lead Sources */}
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Lead Distribution (Power Metrics)
                  </h3>
                  <p className="text-sm text-gray-600">Total leads by team from power metrics</p>
                </div>
                <div className="h-80">
                  <LeadSourcesChart salesTeamData={salesTeam} />
                </div>
              </Card>

              {/* Top Performers */}
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Top Performers (Power Metrics)
                  </h3>
                  <p className="text-sm text-gray-600">Team ranking by sales from power metrics</p>
                </div>
                <div className="h-80">
                  <TopPerformersChart salesTeamData={salesTeam} />
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Data Table - Show filtered results */}
        {!loading && orders.length > 0 && (
          <section className="mt-12">
            <Card className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  Senarai Data
                </h2>
                <p className="text-gray-600">Paparan data order dan lead yang difilter</p>
              </div>

              {/* Orders Table */}
              {orders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📦 Orders ({orders.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Tarikh</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Team</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Produk</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.slice(0, 20).map((order, index) => (
                          <tr key={order.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600">{order.tarikh}</td>
                            <td className="px-4 py-3 text-gray-900 font-medium">{order.nama_customer || '-'}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                                {order.team_sale || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{order.code_kain || '-'}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(order.total_rm || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {orders.length > 20 && (
                      <div className="mt-3 text-center text-sm text-gray-500">
                        Menunjukkan 20 daripada {orders.length} orders
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sales Team Data Table */}
              {salesTeam.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">👥 Sales Team Data ({salesTeam.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Tarikh</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Team</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {salesTeam.slice(0, 20).map((item, index) => (
                          <tr key={item.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600">{item.tarikh}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                                {item.agent_name || item.team || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                item.type === 'power_metrics'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {item.type || 'lead'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900">
                              {item.type === 'power_metrics'
                                ? `Sale: ${formatCurrency(item.total_sale_bulan || 0)}`
                                : `Lead: ${item.total_lead || 0}`
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {salesTeam.length > 20 && (
                      <div className="mt-3 text-center text-sm text-gray-500">
                        Menunjukkan 20 daripada {salesTeam.length} rekod
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Marketing Data Table */}
              {marketing.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📈 Marketing Data ({marketing.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Tarikh</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Team</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Leads</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {marketing.slice(0, 20).map((item, index) => (
                          <tr key={item.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600">{item.tarikh}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                                {item.team_sale || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900">{item.jumlah_leads || 0}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(item.kos_marketing || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {marketing.length > 20 && (
                      <div className="mt-3 text-center text-sm text-gray-500">
                        Menunjukkan 20 daripada {marketing.length} rekod
                      </div>
                    )}
                  </div>
                </div>
              )}

            </Card>
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <motion.button
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-soft-lg flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Sync Data"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </motion.button>
    </div>
  )
}
