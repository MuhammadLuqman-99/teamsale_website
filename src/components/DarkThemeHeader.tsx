'use client'

import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

interface DarkThemeHeaderProps {
  title: string
  subtitle?: string
  icon?: string
  backHref?: string
  showThemeToggle?: boolean
}

export default function DarkThemeHeader({
  title,
  subtitle,
  icon,
  backHref = '/dashboard',
  showThemeToggle = true
}: DarkThemeHeaderProps) {
  return (
    <nav className="glass sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={backHref} className="flex items-center space-x-3">
            {icon && (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">{icon}</span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
              {subtitle && (
                <span className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {showThemeToggle && <ThemeToggle />}
            <Link href={backHref}>
              <button className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                ← Back
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}