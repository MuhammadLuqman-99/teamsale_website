'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface FilterSectionProps {
  onFilterApply: (filters: FilterValues) => void
  teams: string[]
}

export interface FilterValues {
  period: string
  startDate: string
  endDate: string
  team: string
  month?: number
  year?: number
}

export default function FilterSection({ onFilterApply, teams }: FilterSectionProps) {
  const now = new Date()
  const [selectedPeriod, setSelectedPeriod] = useState('this-month')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [filterMode, setFilterMode] = useState<'period' | 'custom'>('period')

  const periods = [
    { id: 'today', label: 'Hari Ini' },
    { id: 'this-week', label: 'Minggu Ini' },
    { id: 'this-month', label: 'Bulan Ini' },
    { id: 'this-year', label: 'Tahun Ini' }
  ]

  const months = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ]

  const handleApplyFilter = () => {
    if (filterMode === 'custom') {
      // Calculate date range from selected month/year
      const startDate = new Date(selectedYear, selectedMonth, 1)
      const endDate = new Date(selectedYear, selectedMonth + 1, 0)

      onFilterApply({
        period: '',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        team: selectedTeam,
        month: selectedMonth,
        year: selectedYear
      })
    } else {
      onFilterApply({
        period: selectedPeriod,
        startDate: '',
        endDate: '',
        team: selectedTeam
      })
    }
  }

  const handleReset = () => {
    setSelectedPeriod('this-month')
    setSelectedTeam('')
    setSelectedMonth(now.getMonth())
    setSelectedYear(now.getFullYear())
    setFilterMode('period')
    onFilterApply({
      period: 'this-month',
      startDate: '',
      endDate: '',
      team: ''
    })
  }

  return (
    <motion.section
      className="bg-white rounded-2xl shadow-sm p-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter Data
          </h3>
          <p className="text-sm text-gray-600">Pilih tempoh dan team sale</p>
        </div>
        {/* Filter Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setFilterMode('period')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterMode === 'period'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tempoh Cepat
          </button>
          <button
            onClick={() => setFilterMode('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterMode === 'custom'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pilih Bulan/Tahun
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filterMode === 'period' ? (
          <>
            {/* Period Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempoh
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Sale Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Sale
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Team</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            {/* Month Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Bulan
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📆 Tahun
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 10 }, (_, i) => now.getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Team Sale Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Sale
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Team</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 items-end">
          <motion.button
            onClick={handleApplyFilter}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Tapis
          </motion.button>
          <motion.button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Reset"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.section>
  )
}
