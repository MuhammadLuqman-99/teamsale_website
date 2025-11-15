'use client'

import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import { OrderData } from '@/lib/firestore'

interface TeamsTabProps {
  orders: OrderData[]
  filteredOrders: OrderData[]
}

interface TeamStats {
  name: string
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  platforms: Record<string, number>
  topProducts: Array<{ name: string; count: number }>
}

export default function TeamsTab({ orders, filteredOrders }: TeamsTabProps) {
  const teamStats = useMemo(() => {
    const stats: Record<string, TeamStats> = {}

    filteredOrders.forEach(order => {
      const teamName = order.team_sale
      if (!stats[teamName]) {
        stats[teamName] = {
          name: teamName,
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          platforms: {},
          topProducts: []
        }
      }

      stats[teamName].totalOrders++
      stats[teamName].totalRevenue += order.total_rm || 0

      // Track platform distribution
      const platform = order.platform
      if (!stats[teamName].platforms[platform]) {
        stats[teamName].platforms[platform] = 0
      }
      stats[teamName].platforms[platform]++
    })

    // Calculate average order value
    Object.values(stats).forEach(team => {
      team.averageOrderValue = team.totalRevenue / team.totalOrders
    })

    return Object.values(stats)
  }, [filteredOrders])

  const topTeams = useMemo(() => {
    return [...teamStats]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [teamStats])

  const totalRevenue = useMemo(() => {
    return teamStats.reduce((sum, t) => sum + t.totalRevenue, 0)
  }, [teamStats])

  return (
    <div className="space-y-6">
      {/* Team Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Total Teams</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-50">{teamStats.length}</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              RM {totalRevenue.toLocaleString('ms-MY', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Top Team</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {topTeams[0]?.name || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-500">
              {topTeams[0] && `RM ${topTeams[0].totalRevenue.toLocaleString('ms-MY', { minimumFractionDigits: 0 })}`}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Avg Team Revenue</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              RM {(totalRevenue / teamStats.length || 0).toLocaleString('ms-MY', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </Card>
      </div>

      {/* Team Performance Leaderboard */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">🏆 Team Performance Leaderboard</h3>
        <div className="space-y-3">
          {topTeams.map((team, index) => (
            <div key={team.name} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mr-4 text-lg ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                    index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                    'bg-gradient-to-r from-blue-400 to-blue-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900 dark:text-slate-200">{team.name}</p>
                    <div className="flex gap-4 text-xs text-gray-600 dark:text-slate-400 mt-1">
                      <span>📦 {team.totalOrders} orders</span>
                      <span>💰 Avg: RM {team.averageOrderValue.toFixed(2)}</span>
                      <span>📊 {((team.totalRevenue / totalRevenue) * 100).toFixed(1)}% of total</span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-200">
                    RM {team.totalRevenue.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Platform Distribution */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Platform Distribution:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(team.platforms).map(([platform, count]) => (
                    <span
                      key={platform}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium"
                    >
                      {platform}: {count} orders
                    </span>
                  ))}
                </div>
              </div>

              {/* Performance Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                    style={{ width: `${(team.totalRevenue / topTeams[0].totalRevenue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Comparison Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">👔 Team Comparison</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">Detailed performance metrics</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Avg Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Market Share</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
              {topTeams.map((team, index) => {
                const marketShare = (team.totalRevenue / totalRevenue) * 100
                const avgRevenue = totalRevenue / teamStats.length
                const performance = (team.totalRevenue / avgRevenue) * 100

                return (
                  <tr key={team.name} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-200">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
                        {team.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-slate-200">{team.totalOrders}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-slate-200">
                      RM {team.totalRevenue.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                      RM {team.averageOrderValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-slate-200 mr-2">
                          {marketShare.toFixed(1)}%
                        </span>
                        <div className="w-20 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${marketShare}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        performance >= 100
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                      }`}>
                        {performance >= 100 ? '✅' : '⚠️'} {performance.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
