'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { addSalesTeamData, fetchActiveTeamMembers, TeamMember } from '@/lib/firestore'

export default function SalesTeamPage() {
  const [activeTab, setActiveTab] = useState<'lead' | 'metrics'>('lead')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'warning' | ''>('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  // Load team members
  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    try {
      const members = await fetchActiveTeamMembers()
      setTeamMembers(members)
    } catch (error) {
      console.error('Error loading team members:', error)
    }
  }

  // Lead Form Data
  const [leadForm, setLeadForm] = useState({
    tarikh: new Date().toISOString().split('T')[0],
    masa: new Date().toTimeString().split(' ')[0].substring(0, 5),
    team: '',
    total_lead: '',
    cold: '',
    warm: '',
    hot: ''
  })

  // Power Metrics Form Data
  const [metricsForm, setMetricsForm] = useState({
    tarikh: new Date().toISOString().split('T')[0],
    team: '',
    total_lead_bulan: '',
    total_close_bulan: '',
    total_sale_bulan: ''
  })

  // Lead Form Validation
  const validateLeadNumbers = () => {
    const totalLead = parseInt(leadForm.total_lead) || 0
    const cold = parseInt(leadForm.cold) || 0
    const warm = parseInt(leadForm.warm) || 0
    const hot = parseInt(leadForm.hot) || 0
    const totalColdWarmHot = cold + warm + hot

    if (totalLead > 0 && totalColdWarmHot > 0) {
      if (totalColdWarmHot !== totalLead) {
        setFeedback(`Jumlah: Cold (${cold}) + Warm (${warm}) + Hot (${hot}) = ${totalColdWarmHot} ≠ Total Lead (${totalLead})`)
        setFeedbackType('warning')
        return false
      } else {
        setFeedback(`✓ Jumlah betul: ${totalColdWarmHot} = Total Lead`)
        setFeedbackType('success')
        return true
      }
    }
    setFeedback('')
    setFeedbackType('')
    return true
  }

  // Handle Lead Form Change
  const handleLeadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLeadForm(prev => ({ ...prev, [name]: value }))

    // Trigger validation after state update
    setTimeout(() => {
      if (['total_lead', 'cold', 'warm', 'hot'].includes(name)) {
        validateLeadNumbers()
      }
    }, 0)
  }

  // Handle Metrics Form Change
  const handleMetricsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setMetricsForm(prev => ({ ...prev, [name]: value }))
  }

  // Submit Lead Form
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const totalLead = parseInt(leadForm.total_lead)
    const cold = parseInt(leadForm.cold)
    const warm = parseInt(leadForm.warm)
    const hot = parseInt(leadForm.hot)
    const totalColdWarmHot = cold + warm + hot

    // Validation: Check if Cold + Warm + Hot = Total Lead
    if (totalColdWarmHot !== totalLead) {
      setFeedback(`Jumlah Cold (${cold}) + Warm (${warm}) + Hot (${hot}) = ${totalColdWarmHot} tidak sama dengan Total Lead (${totalLead}). Sila betulkan.`)
      setFeedbackType('error')
      setTimeout(() => {
        setFeedback('')
        setFeedbackType('')
      }, 5000)
      return
    }

    setLoading(true)
    setFeedback('Menghantar data lead...')
    setFeedbackType('success')

    try {
      await addSalesTeamData({
        tarikh: leadForm.tarikh,
        masa: leadForm.masa,
        team: leadForm.team,
        total_lead: totalLead,
        cold: cold,
        warm: warm,
        hot: hot,
        type: 'lead'
      } as any)

      setFeedback('Data lead berjaya dihantar!')
      setFeedbackType('success')

      // Reset form
      setLeadForm({
        tarikh: new Date().toISOString().split('T')[0],
        masa: new Date().toTimeString().split(' ')[0].substring(0, 5),
        team: '',
        total_lead: '',
        cold: '',
        warm: '',
        hot: ''
      })

      setTimeout(() => {
        setFeedback('')
        setFeedbackType('')
      }, 3000)
    } catch (error) {
      console.error('Error adding lead document:', error)
      setFeedback('Gagal menghantar data lead. Sila cuba lagi.')
      setFeedbackType('error')

      setTimeout(() => {
        setFeedback('')
        setFeedbackType('')
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  // Submit Power Metrics Form
  const handleMetricsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFeedback('Menghantar power metrics...')
    setFeedbackType('success')

    try {
      await addSalesTeamData({
        tarikh: metricsForm.tarikh,
        agent_name: metricsForm.team,
        team: metricsForm.team,
        total_lead_bulan: parseInt(metricsForm.total_lead_bulan),
        total_close_bulan: parseInt(metricsForm.total_close_bulan),
        total_sale_bulan: parseFloat(metricsForm.total_sale_bulan),
        type: 'power_metrics'
      } as any)

      setFeedback('Power metrics berjaya dihantar!')
      setFeedbackType('success')

      // Reset form
      setMetricsForm({
        tarikh: new Date().toISOString().split('T')[0],
        team: '',
        total_lead_bulan: '',
        total_close_bulan: '',
        total_sale_bulan: ''
      })

      setTimeout(() => {
        setFeedback('')
        setFeedbackType('')
      }, 3000)
    } catch (error) {
      console.error('Error adding metrics document:', error)
      setFeedback('Gagal menghantar power metrics. Sila cuba lagi.')
      setFeedbackType('error')

      setTimeout(() => {
        setFeedback('')
        setFeedbackType('')
      }, 3000)
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
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">👥</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sales Team</h2>
                <span className="text-xs text-gray-600">Input Data Team Sale</span>
              </div>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Input Data Sales Team</h1>
          <p className="text-gray-600 mb-8">Update maklumat leads dan prestasi team sale</p>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('lead')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'lead'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              📊 Borang Lead
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'metrics'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              ⚡ Power Metrics
            </button>
          </div>

          {/* Lead Form */}
          {activeTab === 'lead' && (
            <Card className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Borang Lead</h2>
                <p className="text-gray-600">Masukkan data lead harian untuk team sale</p>
              </div>

              <form onSubmit={handleLeadSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tarikh"
                    name="tarikh"
                    type="date"
                    value={leadForm.tarikh}
                    onChange={handleLeadChange}
                    required
                  />
                  <Input
                    label="Masa"
                    name="masa"
                    type="time"
                    value={leadForm.masa}
                    onChange={handleLeadChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Sale <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="team"
                    value={leadForm.team}
                    onChange={(e) => handleLeadChange(e as any)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Pilih Team Sale</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  {teamMembers.length === 0 && (
                    <p className="mt-2 text-sm text-amber-600">
                      Tiada ahli team. <Link href="/team-members" className="underline font-semibold">Tambah ahli team</Link>
                    </p>
                  )}
                </div>

                <Input
                  label="Total Lead"
                  name="total_lead"
                  type="number"
                  value={leadForm.total_lead}
                  onChange={handleLeadChange}
                  placeholder="0"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Cold Lead"
                    name="cold"
                    type="number"
                    value={leadForm.cold}
                    onChange={handleLeadChange}
                    placeholder="0"
                    required
                  />
                  <Input
                    label="Warm Lead"
                    name="warm"
                    type="number"
                    value={leadForm.warm}
                    onChange={handleLeadChange}
                    placeholder="0"
                    required
                  />
                  <Input
                    label="Hot Lead"
                    name="hot"
                    type="number"
                    value={leadForm.hot}
                    onChange={handleLeadChange}
                    placeholder="0"
                    required
                  />
                </div>

                {/* Feedback Message */}
                {feedback && feedbackType && (
                  <div className={`p-4 rounded-lg ${
                    feedbackType === 'success' ? 'bg-green-50 text-green-700' :
                    feedbackType === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {feedback}
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    variant="primary"
                    className="w-full"
                    size="lg"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Menghantar...' : 'Hantar Data Lead'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Power Metrics Form */}
          {activeTab === 'metrics' && (
            <Card className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Power Metrics</h2>
                <p className="text-gray-600">Masukkan data prestasi bulanan team sale</p>
              </div>

              <form onSubmit={handleMetricsSubmit} className="space-y-6">
                <Input
                  label="Tarikh"
                  name="tarikh"
                  type="date"
                  value={metricsForm.tarikh}
                  onChange={handleMetricsChange}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Sale <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="team"
                    value={metricsForm.team}
                    onChange={(e) => handleMetricsChange(e as any)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Pilih Team Sale</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  {teamMembers.length === 0 && (
                    <p className="mt-2 text-sm text-amber-600">
                      Tiada ahli team. <Link href="/team-members" className="underline font-semibold">Tambah ahli team</Link>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Total Lead Bulan"
                    name="total_lead_bulan"
                    type="number"
                    value={metricsForm.total_lead_bulan}
                    onChange={handleMetricsChange}
                    placeholder="0"
                    required
                  />
                  <Input
                    label="Total Close Bulan"
                    name="total_close_bulan"
                    type="number"
                    value={metricsForm.total_close_bulan}
                    onChange={handleMetricsChange}
                    placeholder="0"
                    required
                  />
                  <Input
                    label="Total Sale Bulan (RM)"
                    name="total_sale_bulan"
                    type="number"
                    step="0.01"
                    value={metricsForm.total_sale_bulan}
                    onChange={handleMetricsChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Feedback Message */}
                {feedback && feedbackType && (
                  <div className={`p-4 rounded-lg ${
                    feedbackType === 'success' ? 'bg-green-50 text-green-700' :
                    feedbackType === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {feedback}
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    variant="primary"
                    className="w-full"
                    size="lg"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Menghantar...' : 'Hantar Power Metrics'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Info Card */}
          <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Panduan Penggunaan</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Borang Lead:</strong> Untuk input data lead harian. Pastikan Cold + Warm + Hot = Total Lead</li>
                  <li>• <strong>Power Metrics:</strong> Untuk input prestasi bulanan team (total lead, close, dan sales)</li>
                  <li>• Data akan dipaparkan dalam Dashboard dengan filter team yang sesuai</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
