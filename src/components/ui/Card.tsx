'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  hover?: boolean
  glass?: boolean
  className?: string
}

export default function Card({
  children,
  hover = true,
  glass = false,
  className = '',
  ...props
}: CardProps) {
  const baseClasses = glass ? 'glass' : 'card-apple'
  const hoverClasses = hover ? '' : 'hover:shadow-soft hover:transform-none'

  return (
    <motion.div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
