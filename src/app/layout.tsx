import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'KilangDM - Sistem Pengurusan Data Perniagaan',
  description: 'Platform lengkap untuk memantau prestasi eCommerce, Marketing, dan Sales Team dengan dashboard yang powerful dan mudah digunakan.',
  keywords: 'KilangDM, business data management, ecommerce analytics, marketing dashboard, sales team performance',
  authors: [{ name: 'KilangDM Team' }],
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ms" className={inter.variable}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
