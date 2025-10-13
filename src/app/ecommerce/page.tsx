'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { detectCSVSource, parseCSV, parsePDFInvoice, saveOrdersToFirebase } from '@/lib/fileHandlers'
import { addOrder } from '@/lib/firestore'

export default function EcommercePage() {
  const [uploadMode, setUploadMode] = useState<'file' | 'manual'>('file')
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual form state
  const [formData, setFormData] = useState({
    tarikh: new Date().toISOString().split('T')[0],
    nama_customer: '',
    total_rm: '',
    platform: '',
    nombor_po_invoice: '',
    code_kain: '',
    nombor_phone: '',
    jenis_order: '',
    team_sale: 'Manual'
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    setProcessing(true)
    setErrorMessage('')
    setSuccess(false)

    try {
      let orders
      let fileSource = 'unknown'

      if (file.type === 'application/pdf') {
        fileSource = 'PDF Invoice'
        orders = await parsePDFInvoice(file)
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const fileText = await file.text()
        fileSource = detectCSVSource(fileText)

        if (fileSource === 'unknown') {
          throw new Error('Format CSV tidak dikenali. Pastikan ia adalah fail dari Shopee, TikTok, atau templat manual.')
        }

        orders = parseCSV(fileText, fileSource)
      } else {
        throw new Error('Format fail tidak disokong. Sila muat naik fail CSV atau PDF sahaja.')
      }

      if (!orders || orders.length === 0) {
        throw new Error('Tiada data order yang sah ditemui dalam fail.')
      }

      const { successCount, errorCount } = await saveOrdersToFirebase(orders)

      setSuccess(true)
      setSuccessMessage(`${successCount} order dari fail ${fileSource} telah disimpan. ${errorCount > 0 ? `Gagal: ${errorCount}.` : ''}`)

      setTimeout(() => {
        setSuccess(false)
        setSuccessMessage('')
      }, 5000)

    } catch (error: any) {
      setErrorMessage(error.message || 'Ralat semasa memproses fail')
    } finally {
      setProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setErrorMessage('')

    try {
      await addOrder({
        ...formData,
        total_rm: parseFloat(formData.total_rm) || 0,
        source: 'manual_form'
      })

      setSuccess(true)
      setSuccessMessage('Order berjaya dihantar!')

      // Reset form
      setFormData({
        tarikh: new Date().toISOString().split('T')[0],
        nama_customer: '',
        total_rm: '',
        platform: '',
        nombor_po_invoice: '',
        code_kain: '',
        nombor_phone: '',
        jenis_order: '',
        team_sale: 'Manual'
      })

      setTimeout(() => {
        setSuccess(false)
        setSuccessMessage('')
      }, 3000)

    } catch (error: any) {
      setErrorMessage(error.message || 'Gagal menghantar order')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen gradient-soft">
      <nav className="glass sticky top-0 z-50 border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">🛒</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">eCommerce</h2>
                <span className="text-xs text-gray-600">Input Data Jualan</span>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Input Order Baru</h1>
          <p className="text-gray-600 mb-8">Masukkan maklumat order dari eCommerce platform</p>

          {/* Mode Selector */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                uploadMode === 'file'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              📁 Upload File (CSV/PDF)
            </button>
            <button
              onClick={() => setUploadMode('manual')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                uploadMode === 'manual'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              ✍️ Manual Input
            </button>
          </div>

          <AnimatePresence mode="wait">
            {uploadMode === 'file' ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-8">
                  {/* File Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                      dragActive
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Upload CSV or PDF Invoice
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supported: Shopee CSV, TikTok CSV, Desa Murni PDF Invoice
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".csv,.pdf"
                      onChange={handleFileInput}
                    />
                  </div>

                  {/* Processing Indicator */}
                  {processing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <div>
                          <p className="font-semibold text-blue-900">Processing your file...</p>
                          <p className="text-sm text-blue-700">Please wait while we extract the data</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-6 bg-green-50 rounded-xl border border-green-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">Success!</p>
                          <p className="text-sm text-green-700">{successMessage}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-red-900">Error</p>
                          <p className="text-sm text-red-700">{errorMessage}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="manual"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-8">
                  <form onSubmit={handleManualSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Tarikh Order"
                        type="date"
                        value={formData.tarikh}
                        onChange={(e) => setFormData({ ...formData, tarikh: e.target.value })}
                        required
                      />
                      <Input
                        label="Nombor PO/Invoice"
                        placeholder="e.g., PO-001"
                        value={formData.nombor_po_invoice}
                        onChange={(e) => setFormData({ ...formData, nombor_po_invoice: e.target.value })}
                        required
                      />
                    </div>

                    <Input
                      label="Nama Pelanggan"
                      placeholder="Masukkan nama pelanggan"
                      value={formData.nama_customer}
                      onChange={(e) => setFormData({ ...formData, nama_customer: e.target.value })}
                      required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Nombor Telefon"
                        placeholder="0123456789"
                        value={formData.nombor_phone}
                        onChange={(e) => setFormData({ ...formData, nombor_phone: e.target.value })}
                      />
                      <Input
                        label="Team Sale"
                        placeholder="e.g., Wiyah, Team A"
                        value={formData.team_sale}
                        onChange={(e) => setFormData({ ...formData, team_sale: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Platform"
                        placeholder="e.g., Shopee, Lazada, Website"
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        required
                      />
                      <Input
                        label="Jenis Order"
                        placeholder="e.g., Baju Kurung"
                        value={formData.jenis_order}
                        onChange={(e) => setFormData({ ...formData, jenis_order: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Code Kain"
                        placeholder="e.g., BZL01AA"
                        value={formData.code_kain}
                        onChange={(e) => setFormData({ ...formData, code_kain: e.target.value })}
                      />
                      <Input
                        label="Jumlah Order (RM)"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.total_rm}
                        onChange={(e) => setFormData({ ...formData, total_rm: e.target.value })}
                        required
                      />
                    </div>

                    <div className="pt-4">
                      <Button
                        variant="primary"
                        className="w-full"
                        size="lg"
                        disabled={processing}
                      >
                        {processing ? 'Menyimpan...' : 'Simpan Order'}
                      </Button>
                    </div>

                    {success && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 bg-green-50 rounded-xl border border-green-200 text-center"
                      >
                        <p className="text-green-700 font-medium">{successMessage}</p>
                      </motion.div>
                    )}

                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 bg-red-50 rounded-xl border border-red-200 text-center"
                      >
                        <p className="text-red-700 font-medium">{errorMessage}</p>
                      </motion.div>
                    )}
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* PDF.js Library */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof pdfjsLib !== 'undefined') {
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
          `
        }}
      />
    </div>
  )
}
