'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { fetchTeamMembers, addTeamMember, migrateExistingTeams, TeamMember } from '@/lib/firestore'

export default function TeamMembersPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('')
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    status: 'active' as 'active' | 'inactive'
  })

  // Load team members
  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      const data = await fetchTeamMembers()
      setMembers(data)
    } catch (error) {
      console.error('Error loading team members:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFeedback('Menambah ahli team...')
    setFeedbackType('success')

    try {
      await addTeamMember({
        name: formData.name,
        role: formData.role || undefined,
        status: formData.status
      })

      setFeedback('Ahli team berjaya ditambah!')
      setFeedbackType('success')

      // Reset form
      setFormData({
        name: '',
        role: '',
        status: 'active'
      })

      // Reload members
      await loadMembers()

      // Hide form after success
      setTimeout(() => {
        setShowForm(false)
        setFeedback('')
        setFeedbackType('')
      }, 2000)
    } catch (error) {
      console.error('Error adding team member:', error)
      setFeedback('Gagal menambah ahli team. Sila cuba lagi.')
      setFeedbackType('error')

      setTimeout(() => {
        setFeedback('')
        setFeedbackType('')
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  const activeMembers = members.filter(m => m.status === 'active')
  const inactiveMembers = members.filter(m => m.status === 'inactive')

  const handleMigrate = async () => {
    setLoading(true)
    setFeedback('Mengimport team sedia ada...')
    setFeedbackType('success')

    try {
      await migrateExistingTeams()
      setFeedback('Team sedia ada berjaya diimport!')
      setFeedbackType('success')

      // Reload members
      await loadMembers()

      setTimeout(() => {
        setFeedback('')
        setFeedbackType('')
      }, 3000)
    } catch (error) {
      console.error('Error migrating teams:', error)
      setFeedback('Gagal mengimport team. Sila cuba lagi.')
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">👥</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
                <span className="text-xs text-gray-600">Urus Ahli Team Sale</span>
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Team Members</h1>
              <p className="text-gray-600">Urus dan tambah ahli team sale</p>
            </div>
            <div className="flex gap-3">
              {members.length === 0 && (
                <Button
                  variant="secondary"
                  onClick={handleMigrate}
                  disabled={loading}
                >
                  📥 Import Team Sedia Ada
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? 'Tutup Borang' : '+ Tambah Ahli Baru'}
              </Button>
            </div>
          </div>

          {/* Migration Feedback */}
          {feedback && feedbackType && !showForm && (
            <Card className={`p-4 mb-6 ${
              feedbackType === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className={`${
                feedbackType === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {feedback}
              </div>
            </Card>
          )}

          {/* Add Member Form */}
          {showForm && (
            <Card className="p-8 mb-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tambah Ahli Team Baru</h2>
                <p className="text-gray-600">Masukkan maklumat ahli team sale</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Nama Ahli Team"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Ahmad, Sarah, John"
                  required
                />

                <Input
                  label="Peranan (Optional)"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="Contoh: Senior Sales, Sales Agent"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Feedback Message */}
                {feedback && feedbackType && (
                  <div className={`p-4 rounded-lg ${
                    feedbackType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {feedback}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    className="flex-1"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Menambah...' : 'Tambah Ahli Team'}
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowForm(false)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Active Members List */}
          <Card className="p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ahli Team Aktif ({activeMembers.length})
              </h2>
              <p className="text-gray-600">Senarai ahli team yang aktif</p>
            </div>

            {activeMembers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-500 mb-4">Tiada ahli team aktif lagi</p>
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  Tambah Ahli Pertama
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{member.name}</h3>
                        {member.role && (
                          <p className="text-sm text-gray-600">{member.role}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Active
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Inactive Members List */}
          {inactiveMembers.length > 0 && (
            <Card className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Ahli Team Tidak Aktif ({inactiveMembers.length})
                </h2>
                <p className="text-gray-600">Senarai ahli team yang tidak aktif</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200 opacity-75"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{member.name}</h3>
                        {member.role && (
                          <p className="text-sm text-gray-600">{member.role}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                        Inactive
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
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
                  <li>• Tambah ahli team baru dengan klik butang &ldquo;Tambah Ahli Baru&rdquo;</li>
                  <li>• Ahli team yang ditambah akan muncul dalam dropdown di borang Sales Team, Orders, dan lain-lain</li>
                  <li>• Set status sebagai &ldquo;Inactive&rdquo; untuk ahli team yang tidak lagi aktif</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
