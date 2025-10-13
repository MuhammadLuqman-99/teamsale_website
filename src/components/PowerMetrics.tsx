'use client'

import { motion } from 'framer-motion'
import { PowerMetrics as PowerMetricsType } from '@/lib/metrics'

interface PowerMetricsProps {
  metrics: PowerMetricsType
  monthlyTarget: number
  filteredTeam?: string
}

export default function PowerMetrics({ metrics, monthlyTarget, filteredTeam }: PowerMetricsProps) {
  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString('ms-MY')}`
  }

  const getStatusColor = (value: number, isBalance: boolean = false) => {
    if (isBalance) {
      return value > 0 ? 'text-red-600' : 'text-green-600'
    }
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500'
    if (percent >= 75) return 'bg-blue-500'
    if (percent >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Power Metrics
          {filteredTeam ? (
            <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
              {filteredTeam}
            </span>
          ) : (
            <span className="text-sm font-medium px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              {metrics.numberOfTeams} Team{metrics.numberOfTeams > 1 ? 's' : ''}
            </span>
          )}
        </h3>
        <p className="text-gray-600">
          {filteredTeam
            ? `Performance metrics for ${filteredTeam} team`
            : `Combined performance tracking for all ${metrics.numberOfTeams} sales team${metrics.numberOfTeams > 1 ? 's' : ''}`}
        </p>
        {!filteredTeam && metrics.numberOfTeams > 1 && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            💡 <strong>Total Target:</strong> RM {formatCurrency(metrics.totalMonthlyTarget)}
            ({metrics.numberOfTeams} teams × RM {formatCurrency(monthlyTarget)} per team)
          </div>
        )}
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* KPI Harian */}
        <motion.div
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-lg">
              Target
            </span>
          </div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">KPI Harian</h4>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.kpiHarian)}</p>
          <p className="text-xs text-gray-600 mt-1">per hari kerja</p>
        </motion.div>

        {/* KPI MTD */}
        <motion.div
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded-lg">
              MTD
            </span>
          </div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">KPI MTD</h4>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.kpiMTD)}</p>
          <p className="text-xs text-gray-600 mt-1">sasaran bulan ini</p>
        </motion.div>

        {/* Sale MTD */}
        <motion.div
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-lg">
              Actual
            </span>
          </div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Sale MTD</h4>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.saleMTD)}</p>
          <p className="text-xs text-gray-600 mt-1">jualan sebenar</p>
        </motion.div>

        {/* Balance Bulanan */}
        <motion.div
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-2 py-1 rounded-lg">
              Balance
            </span>
          </div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Balance Bulanan</h4>
          <p className={`text-2xl font-bold ${getStatusColor(metrics.balanceBulanan, true)}`}>
            {formatCurrency(Math.abs(metrics.balanceBulanan))}
          </p>
          <p className="text-xs text-gray-600 mt-1">perlu dicapai</p>
        </motion.div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600">Gap</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(Math.abs(metrics.balanceMTD))}</p>
          <p className="text-xs text-gray-500">Balance MTD</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600">Sales</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{metrics.bilanganTerjual}</p>
          <p className="text-xs text-gray-500">Unit Terjual</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600">Rate</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{metrics.totalCloseRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Close Rate</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600">Days</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {metrics.workingDaysCurrent} / {metrics.workingDaysTotal}
          </p>
          <p className="text-xs text-gray-500">Hari Kerja</p>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress Bulanan</span>
            <span className="text-sm font-bold text-gray-900">
              {metrics.monthlyProgressPercent.toFixed(1)}% ({formatCurrency(metrics.saleMTD)} / {formatCurrency(metrics.totalMonthlyTarget)})
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${getProgressColor(metrics.monthlyProgressPercent)}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(metrics.monthlyProgressPercent, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress MTD</span>
            <span className="text-sm font-bold text-gray-900">
              {metrics.mtdProgressPercent.toFixed(1)}% ({formatCurrency(metrics.saleMTD)} / {formatCurrency(metrics.kpiMTD)})
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${getProgressColor(metrics.mtdProgressPercent)}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(metrics.mtdProgressPercent, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>
      </div>
    </motion.section>
  )
}
