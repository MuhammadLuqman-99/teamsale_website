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

  // Group data by team
  const teamData = salesTeamData.reduce((acc, item) => {
    const team = item.team_sale || 'Unknown'
    if (!acc[team]) {
      acc[team] = {
        cold: 0,
        warm: 0,
        hot: 0,
        total: 0
      }
    }
    acc[team].cold += item.cold_lead || 0
    acc[team].warm += item.warm_lead || 0
    acc[team].hot += item.hot_lead || 0
    acc[team].total += item.jumlah_leads || 0
    return acc
  }, {} as Record<string, { cold: number; warm: number; hot: number; total: number }>)

  // Prepare chart data
  const teams = Object.keys(teamData).sort()
  const coldLeads = teams.map(team => teamData[team].cold)
  const warmLeads = teams.map(team => teamData[team].warm)
  const hotLeads = teams.map(team => teamData[team].hot)

  const data = {
    labels: teams,
    datasets: [
      {
        label: 'Cold Leads',
        data: coldLeads,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8
      },
      {
        label: 'Warm Leads',
        data: warmLeads,
        backgroundColor: 'rgba(251, 191, 36, 0.8)',
        borderColor: 'rgba(251, 191, 36, 1)',
        borderWidth: 2,
        borderRadius: 8
      },
      {
        label: 'Hot Leads',
        data: hotLeads,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
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
          footer: function(tooltipItems) {
            const teamIndex = tooltipItems[0].dataIndex
            const team = teams[teamIndex]
            const total = teamData[team].total
            return `Total: ${total} leads`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
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
