'use client'

import { ReactNode } from 'react'

interface DarkThemeWrapperProps {
  children: ReactNode
  title: string
  description?: string
}

export default function DarkThemeWrapper({ children, title, description }: DarkThemeWrapperProps) {
  return (
    <div className="min-h-screen gradient-soft dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </div>
        {children}
      </main>
    </div>
  )
}