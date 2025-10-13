'use client'

import { useRef } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { MarketingData } from '@/lib/firestore'

ChartJS.register(ArcElement, Tooltip, Legend)

interface LeadSourcesChartProps {
  marketingData: MarketingData[]
}

export default function LeadSourcesChart({ marketingData }: LeadSourcesChartProps) {
  const chartRef = useRef<ChartJS<'doughnut'>>(null)

  // Group data by team (as source)
  const sourceData = marketingData.reduce((acc, item) => {
    const source = item.team_sale || 'Unknown'
    if (!acc[source]) {
      acc[source] = 0
    }
    acc[source] += item.jumlah_leads || 0
    return acc
  }, {} as Record<string, number>)

  // Prepare chart data
  const sources = Object.keys(sourceData).sort()
  const leads = sources.map(source => sourceData[source])

  // Generate colors
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // blue
    'rgba(34, 197, 94, 0.8)',    // green
    'rgba(251, 191, 36, 0.8)',   // yellow
    'rgba(239, 68, 68, 0.8)',    // red
    'rgba(168, 85, 247, 0.8)',   // purple
    'rgba(236, 72, 153, 0.8)',   // pink
    'rgba(20, 184, 166, 0.8)',   // teal
    'rgba(249, 115, 22, 0.8)'    // orange
  ]

  const borderColors = colors.map(color => color.replace('0.8', '1'))

  const data = {
    labels: sources,
    datasets: [
      {
        label: 'Leads',
        data: leads,
        backgroundColor: colors.slice(0, sources.length),
        borderColor: borderColors.slice(0, sources.length),
        borderWidth: 2,
        hoverOffset: 10
      }
    ]
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            family: 'Inter',
            size: 12,
            weight: '500'
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: function(chart) {
            const data = chart.data
            if (data.labels && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i] as number
                const total = (data.datasets[0].data as number[]).reduce((a, b) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor?.[i] as string,
                  hidden: false,
                  index: i
                }
              })
            }
            return []
          }
        }
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
            const label = context.label || ''
            const value = context.parsed || 0
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} leads (${percentage}%)`
          }
        }
      }
    },
    cutout: '60%'
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Doughnut ref={chartRef} data={data} options={options} />
    </div>
  )
}
