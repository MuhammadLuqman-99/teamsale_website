'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  fetchOrders,
  fetchMarketingData,
  fetchSalesTeamData,
  OrderData,
  MarketingData,
  SalesTeamData
} from '@/lib/firestore'
import {
  calculatePowerMetrics,
  getQuickDateRange,
  formatCurrency,
  calculateWorkingDays,
  getCurrentWorkingDay
} from '@/lib/metrics'

const MONTHLY_TARGET = 15000

interface TeamBalance {
  teamName: string
  target: number
  sales: number
  balance: number
  balanceMTD: number
  kpiMTD: number
  progress: number
  closeRate: number
  leads: number
  closes: number
}

export default function BalanceMonitorPage() {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderData[]>([])
  const [marketing, setMarketing] = useState<MarketingData[]>([])
  const [salesTeam, setSalesTeam] = useState<SalesTeamData[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [teamBalances, setTeamBalances] = useState<TeamBalance[]>([])

  // Date filter state
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  // Reload data when date filter changes
  useEffect(() => {
    if (mounted) {
      loadData()
    }
  }, [selectedYear, selectedMonth])

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

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!autoRefresh) return

    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing balance data...')
      loadData()
    }, 120000) // 2 minutes

    return () => clearInterval(refreshInterval)
  }, [autoRefresh])

  const loadData = async () => {
    setLoading(true)
    try {
      // Calculate date range based on selected month and year
      const startDate = new Date(selectedYear, selectedMonth, 1)
      const endDate = new Date(selectedYear, selectedMonth + 1, 0) // Last day of month

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      const [ordersData, marketingData, salesTeamData] = await Promise.all([
        fetchOrders(startDateStr, endDateStr),
        fetchMarketingData(startDateStr, endDateStr),
        fetchSalesTeamData(startDateStr, endDateStr)
      ])

      console.log('📅 Balance Monitor - Loading data for:', {
        selectedYear,
        selectedMonth: selectedMonth + 1, // Display as 1-12
        startDate: startDateStr,
        endDate: endDateStr,
        salesTeamData: salesTeamData.length,
        powerMetrics: salesTeamData.filter(d => d.type === 'power_metrics').length
      })

      console.log('📦 ALL salesTeamData fetched:', salesTeamData.filter(d => d.type === 'power_metrics').map(d => ({
        team: d.agent_name || d.team,
        tarikh: d.tarikh,
        sales: d.total_sale_bulan,
        type: d.type
      })))

      setOrders(ordersData)
      setMarketing(marketingData)
      setSalesTeam(salesTeamData)

      // Calculate individual team balances for selected month/year
      calculateTeamBalances(salesTeamData, selectedYear, selectedMonth)
    } catch (error) {
      console.error('Error loading balance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTeamBalances = (salesTeamData: SalesTeamData[], year: number, month: number) => {
    const now = new Date()
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
    const currentDay = isCurrentMonth ? now.getDate() : new Date(year, month + 1, 0).getDate()

    const workingDaysTotal = calculateWorkingDays(year, month)
    const workingDaysCurrent = getCurrentWorkingDay(year, month, currentDay)

    console.log('🔍 CALCULATING TEAM BALANCES FOR:', {
      year,
      month: month + 1,
      totalSalesTeamData: salesTeamData.length,
      powerMetricsCount: salesTeamData.filter(d => d.type === 'power_metrics').length
    })

    // Filter power_metrics for selected month
    const powerMetricsData = salesTeamData.filter(item => {
      if (item.type !== 'power_metrics') return false

      // Parse date string directly (YYYY-MM-DD format)
      const dateParts = item.tarikh.split('-')
      const itemYear = parseInt(dateParts[0])
      const itemMonth = parseInt(dateParts[1]) - 1 // Convert to 0-indexed

      console.log(`  Checking item: ${item.agent_name || item.team} - Date: ${item.tarikh} -> Month: ${itemMonth + 1}, Year: ${itemYear}, Match: ${itemMonth === month && itemYear === year}`)

      return itemMonth === month && itemYear === year
    })

    console.log('💾 Power Metrics Data Found for Selected Month:', powerMetricsData.map(d => ({
      team: d.agent_name || d.team,
      tarikh: d.tarikh,
      sales: d.total_sale_bulan,
      closes: d.total_close_bulan,
      leads: d.total_lead_bulan
    })))

    // Group by team and get latest data
    const teamLatestData: { [key: string]: SalesTeamData } = {}
    powerMetricsData.forEach(item => {
      const teamName = item.agent_name || item.team || 'Unknown'

      console.log(`  Team: ${teamName}, Date: ${item.tarikh}, Sales: ${item.total_sale_bulan}`)

      // Use string comparison for ISO date format (YYYY-MM-DD) to avoid timezone issues
      if (!teamLatestData[teamName] || teamLatestData[teamName].tarikh < item.tarikh) {
        console.log(`    ✓ Selected as latest for ${teamName}`)
        teamLatestData[teamName] = item
      } else {
        console.log(`    ✗ Not latest (current latest: ${teamLatestData[teamName].tarikh})`)
      }
    })

    console.log('✅ FINAL Latest Data Per Team:', Object.entries(teamLatestData).map(([name, data]) => ({
      team: name,
      tarikh: data.tarikh,
      sales: data.total_sale_bulan,
      closes: data.total_close_bulan,
      leads: data.total_lead_bulan
    })))

    // Calculate balance for each team
    const balances: TeamBalance[] = Object.entries(teamLatestData).map(([teamName, data]) => {
      const sales = data.total_sale_bulan || 0
      const target = MONTHLY_TARGET
      const balance = target - sales

      const kpiHarian = workingDaysTotal > 0 ? target / workingDaysTotal : 0
      const kpiMTD = kpiHarian * workingDaysCurrent
      const balanceMTD = kpiMTD - sales

      const leads = data.total_lead_bulan || 0
      const closes = data.total_close_bulan || 0
      const closeRate = leads > 0 ? (closes / leads) * 100 : 0
      const progress = (sales / target) * 100

      return {
        teamName,
        target,
        sales,
        balance,
        balanceMTD,
        kpiMTD,
        progress,
        closeRate,
        leads,
        closes
      }
    })

    // Sort by balance (ascending - team with highest balance first)
    balances.sort((a, b) => b.balance - a.balance)
    setTeamBalances(balances)
  }

  // Use selected month/year for metrics calculation
  const targetDate = new Date(selectedYear, selectedMonth, 15) // Mid-month of selected period
  const powerMetrics = calculatePowerMetrics(orders, marketing, salesTeam, targetDate, MONTHLY_TARGET)

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'from-green-500 to-green-600'
    if (percent >= 75) return 'from-blue-500 to-blue-600'
    if (percent >= 50) return 'from-yellow-500 to-yellow-600'
    return 'from-red-500 to-red-600'
  }

  return (
    <div className="min-h-screen gradient-soft">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">📊</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Balance Monitor</h2>
                <span className="text-xs text-gray-600">Track Setiap Team Sale</span>
              </div>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">← Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Header Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Teams</h3>
                  <p className="text-3xl font-bold text-gray-900">{teamBalances.length}</p>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Target</h3>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(powerMetrics.totalMonthlyTarget)}</p>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Sales</h3>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(powerMetrics.saleMTD)}</p>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Balance</h3>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(powerMetrics.balanceBulanan)}</p>
                </Card>
              </div>

              {/* Date Filter */}
              <Card className="p-4 mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">📅 Bulan:</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-4 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>Januari</option>
                      <option value={1}>Februari</option>
                      <option value={2}>Mac</option>
                      <option value={3}>April</option>
                      <option value={4}>Mei</option>
                      <option value={5}>Jun</option>
                      <option value={6}>Julai</option>
                      <option value={7}>Ogos</option>
                      <option value={8}>September</option>
                      <option value={9}>Oktober</option>
                      <option value={10}>November</option>
                      <option value={11}>Disember</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">📆 Tahun:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-4 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 10 }, (_, i) => now.getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedYear(now.getFullYear())
                      setSelectedMonth(now.getMonth())
                    }}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
                  >
                    Bulan Ini
                  </button>
                </div>
              </Card>

              {/* Controls */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Balance Setiap Team</h1>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`px-4 py-2 rounded-xl transition-colors ${
                      autoRefresh
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {autoRefresh ? '✓ Auto ON' : 'Auto OFF'}
                  </button>
                  <button
                    onClick={loadData}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                  >
                    🔄 Refresh
                  </button>
                  <div className="text-sm text-gray-600">
                    {mounted ? currentTime : '--:--:--'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Team Balance Cards */}
            {teamBalances.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tiada Data Power Metrics</h3>
                <p className="text-gray-600">Sila masukkan data power metrics untuk setiap team di halaman Sales Team</p>
                <Link href="/salesteam" className="mt-4 inline-block">
                  <Button variant="primary">Pergi ke Sales Team</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {teamBalances.map((team, index) => (
                  <motion.div
                    key={team.teamName}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-shadow">
                      {/* Team Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {team.teamName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{team.teamName}</h3>
                            <p className="text-sm text-gray-600">Target: {formatCurrency(team.target)}</p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getProgressColor(team.progress)}`}>
                          <span className="text-white font-bold">{team.progress.toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-600 mb-1">KPI MTD</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(team.kpiMTD)}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                          <p className="text-xs text-gray-600 mb-1">Sales</p>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(team.sales)}</p>
                        </div>
                        <div className={`rounded-xl p-4 ${team.balance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                          <p className="text-xs text-gray-600 mb-1">Balance</p>
                          <p className={`text-lg font-bold ${team.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(Math.abs(team.balance))}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4">
                          <p className="text-xs text-gray-600 mb-1">Close Rate</p>
                          <p className="text-lg font-bold text-blue-600">{team.closeRate.toFixed(1)}%</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4">
                          <p className="text-xs text-gray-600 mb-1">Closes</p>
                          <p className="text-lg font-bold text-purple-600">{team.closes} / {team.leads}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress Bulanan</span>
                          <span className="text-sm text-gray-600">
                            {formatCurrency(team.sales)} / {formatCurrency(team.target)}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${getProgressColor(team.progress)}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(team.progress, 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
                          />
                        </div>
                      </div>

                      {/* Balance MTD */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Balance MTD:</span>
                        <span className={`font-semibold ${team.balanceMTD > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(team.balanceMTD))} {team.balanceMTD > 0 ? '(Behind)' : '(Ahead)'}
                        </span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Working Days Info */}
            {teamBalances.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8"
              >
                <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Maklumat Hari Kerja</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600">{powerMetrics.workingDaysTotal}</div>
                      <p className="text-sm text-gray-600 mt-1">Total Hari Kerja</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{powerMetrics.workingDaysCurrent}</div>
                      <p className="text-sm text-gray-600 mt-1">Hari Berlalu</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {powerMetrics.workingDaysTotal - powerMetrics.workingDaysCurrent}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Hari Berbaki</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{formatCurrency(powerMetrics.kpiHarian)}</div>
                      <p className="text-sm text-gray-600 mt-1">KPI Harian (per team)</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
