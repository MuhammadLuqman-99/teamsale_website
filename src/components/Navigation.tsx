'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-soft"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white font-bold text-lg">K</span>
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              KilangDM
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Ciri-ciri
            </Link>
            <Link
              href="#about"
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Tentang
            </Link>
            <Link href="/dashboard">
              <motion.button
                className="btn-apple-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Masuk Dashboard
              </motion.button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg
              className="w-6 h-6 text-gray-900"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            className="md:hidden mt-4 space-y-3 pb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Link
              href="#features"
              className="block py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Ciri-ciri
            </Link>
            <Link
              href="#about"
              className="block py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Tentang
            </Link>
            <Link href="/dashboard" onClick={() => setIsOpen(false)}>
              <button className="w-full btn-apple-primary">
                Masuk Dashboard
              </button>
            </Link>
          </motion.div>
        )}
      </div>
    </header>
  )
}
