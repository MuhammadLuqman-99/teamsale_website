'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { SalesTeamData } from '@/lib/firestore'
import { formatCurrency } from '@/lib/metrics'

interface SalesTrendChartProps {
  salesTeamData: SalesTeamData[]
  chartType?: 'line' | 'bar' | 'area'
}

export default function SalesTrendChart({ salesTeamData, chartType = 'area' }: SalesTrendChartProps) {
  const chartData = useMemo(() => {
    console.log('🔍 SalesTrendChart - Total salesTeamData:', salesTeamData.length)

    // Filter only power_metrics data
    const powerMetrics = salesTeamData.filter(item => item.type === 'power_metrics')

    console.log('📊 SalesTrendChart - Power metrics found:', powerMetrics.length)
    console.log('📊 SalesTrendChart - Power metrics data:', powerMetrics)

    if (powerMetrics.length === 0) {
      console.log('⚠️ SalesTrendChart - No power metrics data available')
      return []
    }

    // Group by date and team
    const groupedByDate: { [key: string]: { [team: string]: number } } = {}

    powerMetrics.forEach(item => {
      const date = item.tarikh
      const team = item.agent_name || item.team || 'Unknown'
      const sales = item.total_sale_bulan || 0

      if (!groupedByDate[date]) {
        groupedByDate[date] = {}
      }

      // Sum up sales for same team on same date
      if (!groupedByDate[date][team]) {
        groupedByDate[date][team] = 0
      }
      groupedByDate[date][team] += sales
    })

    // Get all unique teams
    const allTeams = Array.from(
      new Set(powerMetrics.map(item => item.agent_name || item.team || 'Unknown'))
    ).sort()

    // Convert to array format for recharts
    const chartArray = Object.keys(groupedByDate)
      .sort()
      .map(date => {
        const dataPoint: any = { date }
        let totalForDate = 0

        allTeams.forEach(team => {
          const value = groupedByDate[date][team] || 0
          dataPoint[team] = value
          totalForDate += value
        })

        dataPoint.total = totalForDate
        return dataPoint
      })

    return chartArray
  }, [salesTeamData])

  // Get team names for rendering lines
  const teams = useMemo(() => {
    const powerMetrics = salesTeamData.filter(item => item.type === 'power_metrics')
    return Array.from(
      new Set(powerMetrics.map(item => item.agent_name || item.team || 'Unknown'))
    ).sort()
  }, [salesTeamData])

  // Color palette for teams
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-sm" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="font-semibold" style={{ color: entry.color }}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="font-medium">No Power Metrics Data Available</p>
          <p className="text-sm mt-1">Teams need to update their monthly power metrics</p>
        </div>
      </div>
    )
  }

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => `RM ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          {teams.map((team, index) => (
            <Bar
              key={team}
              dataKey={team}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {teams.map((team, index) => (
              <linearGradient key={team} id={`color-${team}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => `RM ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          {teams.map((team, index) => (
            <Area
              key={team}
              type="monotone"
              dataKey={team}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              fill={`url(#color-${team})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  // Default: Line chart
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
          tickFormatter={(value) => `RM ${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          iconType="circle"
        />
        {teams.map((team, index) => (
          <Line
            key={team}
            type="monotone"
            dataKey={team}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
