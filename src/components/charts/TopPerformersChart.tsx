'use client'

import { useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { SalesTeamData } from '@/lib/firestore'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface TopPerformersChartProps {
  salesTeamData: SalesTeamData[]
}

export default function TopPerformersChart({ salesTeamData }: TopPerformersChartProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null)

  // Filter only power_metrics data and group by team
  const powerMetricsData = salesTeamData.filter(item => item.type === 'power_metrics')

  const teamSales = powerMetricsData.reduce((acc, item) => {
    const team = item.agent_name || item.team || 'Unknown'
    if (!acc[team]) {
      acc[team] = {
        sales: 0,
        close: 0,
        leads: 0
      }
    }
    acc[team].sales += item.total_sale_bulan || 0
    acc[team].close += item.total_close_bulan || 0
    acc[team].leads += item.total_lead_bulan || 0
    return acc
  }, {} as Record<string, { sales: number; close: number; leads: number }>)

  // Sort by sales and get top performers
  const sortedTeams = Object.entries(teamSales)
    .sort((a, b) => b[1].sales - a[1].sales)
    .slice(0, 10) // Top 10

  const teams = sortedTeams.map(([team]) => team)
  const sales = sortedTeams.map(([, data]) => data.sales)
  const close = sortedTeams.map(([, data]) => data.close)
  const leads = sortedTeams.map(([, data]) => data.leads)

  // Generate gradient colors based on ranking
  const backgroundColors = sales.map((_, index) => {
    const ratio = 1 - (index / sales.length)
    if (index === 0) return 'rgba(34, 197, 94, 0.9)' // Gold for #1
    if (index === 1) return 'rgba(59, 130, 246, 0.8)' // Silver for #2
    if (index === 2) return 'rgba(251, 191, 36, 0.8)' // Bronze for #3
    return `rgba(100, 116, 139, ${0.3 + ratio * 0.5})` // Gradient for others
  })

  const borderColors = backgroundColors.map(color => color.replace(/[\d.]+\)$/, '1)'))

  const data = {
    labels: teams,
    datasets: [
      {
        label: 'Total Sales (RM)',
        data: sales,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  }

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            const value = context.parsed.x
            return `Sales: RM ${value.toLocaleString('ms-MY', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`
          },
          afterLabel: function(context) {
            const teamIndex = context.dataIndex
            const closeCount = close[teamIndex]
            const leadCount = leads[teamIndex]
            const conversionRate = leadCount > 0 ? ((closeCount / leadCount) * 100).toFixed(1) : '0.0'
            return [
              `Close: ${closeCount}`,
              `Leads: ${leadCount}`,
              `Conversion: ${conversionRate}%`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11
          },
          callback: function(value) {
            return 'RM ' + value.toLocaleString()
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
            weight: 600
          },
          callback: function(value, index) {
            const label = this.getLabelForValue(value as number)
            // Add medal emoji for top 3
            if (index === 0) return '🥇 ' + label
            if (index === 1) return '🥈 ' + label
            if (index === 2) return '🥉 ' + label
            return label
          }
        }
      }
    }
  }

  return (
    <div className="w-full h-full">
      <Bar ref={chartRef} data={data} options={options} />
    </div>
  )
}
