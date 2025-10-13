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

interface LeadPerformanceChartProps {
  salesTeamData: SalesTeamData[]
}

export default function LeadPerformanceChart({ salesTeamData }: LeadPerformanceChartProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null)

  // Filter only power_metrics data and group by team
  const powerMetricsData = salesTeamData.filter(item => item.type === 'power_metrics')

  const teamData = powerMetricsData.reduce((acc, item) => {
    const team = item.agent_name || item.team || 'Unknown'
    if (!acc[team]) {
      acc[team] = {
        totalLeads: 0,
        totalSales: 0,
        totalClose: 0
      }
    }
    // Use power metrics data
    acc[team].totalLeads += item.total_lead_bulan || 0
    acc[team].totalSales += item.total_sale_bulan || 0
    acc[team].totalClose += item.total_close_bulan || 0
    return acc
  }, {} as Record<string, { totalLeads: number; totalSales: number; totalClose: number }>)

  // Prepare chart data
  const teams = Object.keys(teamData).sort()
  const totalLeads = teams.map(team => teamData[team].totalLeads)
  const totalClose = teams.map(team => teamData[team].totalClose)

  const data = {
    labels: teams,
    datasets: [
      {
        label: 'Total Leads',
        data: totalLeads,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8
      },
      {
        label: 'Total Close',
        data: totalClose,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderRadius: 8
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
            weight: 500
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
          footer: function(tooltipItems) {
            const teamIndex = tooltipItems[0].dataIndex
            const team = teams[teamIndex]
            const sales = teamData[team].totalSales
            return `Sales: RM ${sales.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11
          },
          stepSize: 10
        }
      },
      x: {
        stacked: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
            weight: 500
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
