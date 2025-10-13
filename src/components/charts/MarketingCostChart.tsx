'use client'

import { useEffect, useRef } from 'react'
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
import { MarketingData, OrderData } from '@/lib/firestore'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface MarketingCostChartProps {
  marketingData: MarketingData[]
  orderData: OrderData[]
}

export default function MarketingCostChart({ marketingData, orderData }: MarketingCostChartProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null)

  // Group data by team
  const teamData = marketingData.reduce((acc, item) => {
    const team = item.team_sale || 'Unknown'
    if (!acc[team]) {
      acc[team] = {
        totalCost: 0,
        totalLeads: 0,
        totalSales: 0
      }
    }
    acc[team].totalCost += item.kos_marketing || 0
    acc[team].totalLeads += item.jumlah_leads || 0
    return acc
  }, {} as Record<string, { totalCost: number; totalLeads: number; totalSales: number }>)

  // Add sales data
  orderData.forEach(order => {
    const team = order.team_sale || 'Unknown'
    if (teamData[team]) {
      teamData[team].totalSales += order.total_rm || 0
    }
  })

  // Prepare chart data
  const teams = Object.keys(teamData).sort()
  const costs = teams.map(team => teamData[team].totalCost)
  const sales = teams.map(team => teamData[team].totalSales)

  const data = {
    labels: teams,
    datasets: [
      {
        label: 'Marketing Cost (RM)',
        data: costs,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 40
      },
      {
        label: 'Total Sales (RM)',
        data: sales,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 40
      }
    ]
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Inter',
            size: 12,
            weight: '500'
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
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
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              label += 'RM ' + context.parsed.y.toLocaleString('ms-MY', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            }
            return label
          },
          footer: function(tooltipItems) {
            const teamIndex = tooltipItems[0].dataIndex
            const team = teams[teamIndex]
            const roi = teamData[team].totalSales > 0
              ? ((teamData[team].totalSales - teamData[team].totalCost) / teamData[team].totalCost * 100).toFixed(1)
              : '0.0'
            return `ROI: ${roi}%`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
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
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
            weight: '500'
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }

  return (
    <div className="w-full h-full">
      <Bar ref={chartRef} data={data} options={options} />
    </div>
  )
}
