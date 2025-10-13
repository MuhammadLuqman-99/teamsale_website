'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const features = [
  {
    icon: '📊',
    color: 'from-blue-500 to-blue-600',
    title: 'Dashboard Komprehensif',
    description: 'Pantau semua metrik penting dalam satu tempat dengan visualisasi data yang menarik.',
  },
  {
    icon: '🛒',
    color: 'from-green-500 to-green-600',
    title: 'Pengurusan eCommerce',
    description: 'Jejak jualan, pesanan, dan AOV dari semua saluran ecommerce anda.',
  },
  {
    icon: '📈',
    color: 'from-purple-500 to-purple-600',
    title: 'Analitik Marketing',
    description: 'Monitor ROAS, spend, impressions dan klik untuk optimasi kempen anda.',
  },
  {
    icon: '👥',
    color: 'from-yellow-500 to-yellow-600',
    title: 'Prestasi Sales Team',
    description: 'Jejak leads, close rate, dan prestasi individual setiap ahli pasukan jualan.',
  },
  {
    icon: '⚡',
    color: 'from-red-500 to-red-600',
    title: 'Data Masa Nyata',
    description: 'Maklumat terkini disinkronkan secara automatik dari Firebase.',
  },
  {
    icon: '🔍',
    color: 'from-indigo-500 to-indigo-600',
    title: 'Penapisan Lanjutan',
    description: 'Filter data mengikut tarikh, team sale, atau jenis data untuk analisis yang lebih tepat.',
  },
]

const quickLinks = [
  {
    href: '/dashboard',
    icon: '📊',
    color: 'from-blue-500 to-blue-600',
    title: 'Dashboard',
    description: 'Paparan keseluruhan',
  },
  {
    href: '/ecommerce',
    icon: '🛒',
    color: 'from-green-500 to-green-600',
    title: 'eCommerce',
    description: 'Input data jualan',
  },
  {
    href: '/marketing',
    icon: '📈',
    color: 'from-purple-500 to-purple-600',
    title: 'Marketing',
    description: 'Input data iklan',
  },
  {
    href: '/salesteam',
    icon: '👥',
    color: 'from-yellow-500 to-yellow-600',
    title: 'Sales Team',
    description: 'Input data team sale',
  },
]

const stats = [
  { label: 'Cloud-based', value: '100%' },
  { label: 'Data Updates', value: 'Real-time' },
  { label: 'Accessible', value: '24/7' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 gradient-soft">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Sistem Pengurusan Data Perniagaan
            </motion.h2>
            <motion.p
              className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Platform lengkap untuk memantau prestasi eCommerce, Marketing, dan Sales Team anda.
              Dapatkan insight mendalam dengan dashboard yang powerful dan mudah digunakan.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link href="/dashboard">
                <motion.button
                  className="btn-apple-primary text-lg px-8 py-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Mulakan Sekarang
                </motion.button>
              </Link>
              <Link href="#features">
                <motion.button
                  className="btn-apple-secondary text-lg px-8 py-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ketahui Lebih Lanjut
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Ciri-ciri Utama
            </h3>
            <p className="text-gray-600 text-lg md:text-xl">
              Semua yang anda perlukan untuk menguruskan data perniagaan
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="card-apple p-8 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-soft group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h4 className="text-xl font-semibold mb-3 text-gray-900">
                  {feature.title}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Akses Pantas
            </h3>
            <p className="text-gray-600 text-lg md:text-xl">
              Terus ke bahagian yang anda perlukan
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <Link key={index} href={link.href}>
                <motion.div
                  className={`card-apple bg-gradient-to-br ${link.color} p-8 text-center text-white cursor-pointer group`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                    {link.icon}
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{link.title}</h4>
                  <p className="text-sm opacity-90">{link.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <h3 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Tentang KilangDM
              </h3>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                KilangDM adalah platform pengurusan data perniagaan yang direka khas untuk membantu syarikat
                memantau dan menganalisis prestasi dari pelbagai saluran - eCommerce, Marketing, dan Sales Team.
                Dengan antara muka yang intuitif dan analitik yang mendalam, anda boleh membuat keputusan yang
                lebih baik untuk mengembangkan perniagaan anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center card-apple p-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-3">
                    {stat.value}
                  </div>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
