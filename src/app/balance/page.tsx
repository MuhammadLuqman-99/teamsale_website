'use client'

import { useState, useEffect, useCallback } from 'react'
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

  const loadData = useCallback(async () => {
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
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [loadData])

  // Reload data when date filter changes
  useEffect(() => {
    if (mounted) {
      loadData()
    }
  }, [loadData, mounted])

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
  }, [autoRefresh, loadData])

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

    // Filter power_metrics for selected month and exclude TikTok team
    const powerMetricsData = salesTeamData.filter(item => {
      if (item.type !== 'power_metrics') return false

      // Exclude TikTok team
      const teamName = (item.agent_name || item.team || '').toLowerCase()
      if (teamName.includes('tiktok')) return false

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Main Content - Fullscreen */}
      <main className="h-screen w-screen p-6 flex items-center justify-center">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>

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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-[1800px]">
                {teamBalances.map((team, index) => {
                  // Color scheme for each team
                  const teamColors = [
                    { name: 'from-red-500 to-red-600', text: 'text-red-400', bg: 'bg-gradient-to-br from-gray-900 to-gray-800' },
                    { name: 'from-green-500 to-green-600', text: 'text-green-400', bg: 'bg-gradient-to-br from-gray-900 to-gray-800' },
                    { name: 'from-yellow-500 to-yellow-600', text: 'text-yellow-400', bg: 'bg-gradient-to-br from-gray-900 to-gray-800' },
                    { name: 'from-purple-500 to-purple-600', text: 'text-purple-400', bg: 'bg-gradient-to-br from-gray-900 to-gray-800' },
                  ]
                  const colorScheme = teamColors[index % teamColors.length]

                  return (
                    <motion.div
                      key={team.teamName}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      <Card className={`${colorScheme.bg} border-2 border-teal-500/30 p-12 hover:shadow-2xl transition-all h-full flex flex-col`}>
                        {/* Glow indicator */}
                        <div className="absolute top-6 right-6 w-4 h-4 bg-teal-500 rounded-full animate-pulse shadow-lg shadow-teal-500/50"></div>

                        {/* Team Name - Extra Large */}
                        <div className="text-center mb-8">
                          <h2 className={`text-7xl md:text-8xl font-black ${colorScheme.text} tracking-tight uppercase`}>
                            {team.teamName}
                          </h2>
                          <p className="text-gray-400 text-lg mt-3">Sales Team</p>
                        </div>

                        {/* Sale MTD - Extra Large Display */}
                        <div className="text-center mb-10 flex-grow flex flex-col justify-center">
                          <p className="text-gray-400 text-xl mb-4">Sale MTD</p>
                          <p className="text-6xl md:text-7xl font-bold text-white mb-2">
                            RM {team.sales.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>

                        {/* Bottom Metrics - Larger */}
                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                            <p className="text-gray-400 text-sm mb-2">KPI Harian</p>
                            <p className="text-3xl font-bold text-white">
                              {formatCurrency(team.kpiMTD / powerMetrics.workingDaysCurrent || 0)}
                            </p>
                          </div>
                          <div className={`rounded-xl p-6 border ${
                            team.balanceMTD > 0
                              ? 'bg-red-500/10 border-red-500/30'
                              : 'bg-green-500/10 border-green-500/30'
                          }`}>
                            <p className="text-gray-400 text-sm mb-2">Balance MTD</p>
                            <p className={`text-3xl font-bold ${
                              team.balanceMTD > 0 ? 'text-red-400' : 'text-green-400'
                            }`}>
                              {formatCurrency(Math.abs(team.balanceMTD))}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}

          </>
        )}
      </main>
    </div>
  )
}
