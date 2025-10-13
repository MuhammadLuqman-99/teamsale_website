'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: string
  className?: string
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  className = '',
}: StatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600',
  }

  return (
    <motion.div
      className={`card-apple p-6 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} flex items-center justify-center text-white shadow-soft`}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center space-x-2">
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-sm text-gray-500">dari bulan lepas</span>
        </div>
      )}
    </motion.div>
  )
}
