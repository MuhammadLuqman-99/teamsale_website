'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { addMarketingData } from '@/lib/firestore'

export default function MarketingPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tarikh: new Date().toISOString().split('T')[0],
    team_sale: '',
    kos_marketing: '',
    jumlah_leads: '',
    cold_lead: '',
    warm_lead: '',
    hot_lead: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await addMarketingData({
        tarikh: formData.tarikh,
        team_sale: formData.team_sale,
        kos_marketing: parseFloat(formData.kos_marketing) || 0,
        jumlah_leads: parseInt(formData.jumlah_leads) || 0,
        cold_lead: parseInt(formData.cold_lead) || 0,
        warm_lead: parseInt(formData.warm_lead) || 0,
        hot_lead: parseInt(formData.hot_lead) || 0
      })

      alert('✅ Data marketing berjaya disimpan!')

      // Reset form
      setFormData({
        tarikh: new Date().toISOString().split('T')[0],
        team_sale: '',
        kos_marketing: '',
        jumlah_leads: '',
        cold_lead: '',
        warm_lead: '',
        hot_lead: ''
      })
    } catch (error) {
      console.error('Error saving marketing data:', error)
      alert('❌ Error menyimpan data. Sila cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-soft">
      <nav className="glass sticky top-0 z-50 border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">📈</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Marketing</h2>
                <span className="text-xs text-gray-600">Input Data Iklan</span>
              </div>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Input Data Marketing</h1>
          <p className="text-gray-600 mb-8">Update maklumat kempen marketing dan leads</p>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Team Sale"
                name="team_sale"
                value={formData.team_sale}
                onChange={handleChange}
                placeholder="Masukkan nama team sale"
                required
              />

              <Input
                label="Kos Marketing (RM)"
                name="kos_marketing"
                type="number"
                step="0.01"
                value={formData.kos_marketing}
                onChange={handleChange}
                placeholder="0.00"
                required
              />

              <Input
                label="Jumlah Leads"
                name="jumlah_leads"
                type="number"
                value={formData.jumlah_leads}
                onChange={handleChange}
                placeholder="0"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Cold Leads"
                  name="cold_lead"
                  type="number"
                  value={formData.cold_lead}
                  onChange={handleChange}
                  placeholder="0"
                />
                <Input
                  label="Warm Leads"
                  name="warm_lead"
                  type="number"
                  value={formData.warm_lead}
                  onChange={handleChange}
                  placeholder="0"
                />
                <Input
                  label="Hot Leads"
                  name="hot_lead"
                  type="number"
                  value={formData.hot_lead}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <Input
                label="Tarikh"
                name="tarikh"
                type="date"
                value={formData.tarikh}
                onChange={handleChange}
                required
              />

              <div className="pt-4">
                <Button
                  variant="primary"
                  className="w-full"
                  size="lg"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Menyimpan...' : 'Simpan Data'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
