'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { addFollowUpData } from '@/lib/firestore'

export default function FollowUpPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tarikh: new Date().toISOString().split('T')[0],
    nama_customer: '',
    team_sale: '',
    nombor_phone: '',
    status: 'Pending',
    catatan: '',
    next_followup: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await addFollowUpData(formData)

      alert('✅ Data follow-up berjaya disimpan!')

      // Reset form
      setFormData({
        tarikh: new Date().toISOString().split('T')[0],
        nama_customer: '',
        team_sale: '',
        nombor_phone: '',
        status: 'Pending',
        catatan: '',
        next_followup: ''
      })
    } catch (error) {
      console.error('Error saving follow-up data:', error)
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
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">📞</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Follow Up</h2>
                <span className="text-xs text-gray-600">Track Follow-ups</span>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Follow Up Management</h1>
          <p className="text-gray-600 mb-8">Track and manage customer follow-ups</p>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nama Customer"
                  name="nama_customer"
                  value={formData.nama_customer}
                  onChange={handleChange}
                  placeholder="Masukkan nama customer"
                  required
                />
                <Input
                  label="Team Sale"
                  name="team_sale"
                  value={formData.team_sale}
                  onChange={handleChange}
                  placeholder="Masukkan team sale"
                  required
                />
              </div>

              <Input
                label="Nombor Telefon"
                name="nombor_phone"
                value={formData.nombor_phone}
                onChange={handleChange}
                placeholder="01X-XXXXXXX"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Called">Called</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Interested">Interested</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  name="catatan"
                  value={formData.catatan}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan catatan follow-up..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tarikh"
                  name="tarikh"
                  type="date"
                  value={formData.tarikh}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Next Follow Up"
                  name="next_followup"
                  type="date"
                  value={formData.next_followup}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  className="w-full"
                  size="lg"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Menyimpan...' : 'Simpan Follow Up'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
