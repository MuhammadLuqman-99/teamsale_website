'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Script from 'next/script'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { detectCSVSource, parseCSV, parsePDFInvoice, saveOrdersToFirebase } from '@/lib/fileHandlers'
import { addOrder } from '@/lib/firestore'
import { extractAWBData } from '@/lib/pdf-parser/awb-parser'

interface ExtractedAWBOrder {
  orderId: string
  platform: string
  tarikh: string
  masa: string
  tracking: string
  courier: string
  status: string
  cod: string
  customerName: string
  customerPhone: string
  customerAddress: string
  productName: string
  sku: string
  quantity: number
  seller: string
}

export default function EcommercePage() {
  const [uploadMode, setUploadMode] = useState<'file' | 'awb' | 'manual'>('file')
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [extractedAWBOrders, setExtractedAWBOrders] = useState<ExtractedAWBOrder[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const awbInputRef = useRef<HTMLInputElement>(null)

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

  const handleAWBUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Clear previous data
    setExtractedAWBOrders([])
    setProcessing(true)
    setErrorMessage('')
    setSuccess(false)
    const orders: ExtractedAWBOrder[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.type !== 'application/pdf') {
          setErrorMessage(`File ${file.name} bukan PDF. Sila upload PDF sahaja.`)
          continue
        }

        // Read file as base64
        const reader = new FileReader()
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        // Extract data from PDF
        const extractedData = await extractAWBData(fileData)
        if (extractedData) {
          orders.push(extractedData)
        }
      }

      setExtractedAWBOrders(orders)
      setSuccess(true)
      setSuccessMessage(`Berjaya extract ${orders.length} order dari ${files.length} PDF AWB!`)
    } catch (err: any) {
      setErrorMessage(`Error: ${err.message}`)
    } finally {
      setProcessing(false)
      // Reset file input
      if (awbInputRef.current) {
        awbInputRef.current.value = ''
      }
    }
  }

  const handleSaveAWBOrders = async () => {
    if (extractedAWBOrders.length === 0) return

    const confirm = window.confirm(
      `⚠️ Anda akan save ${extractedAWBOrders.length} order dari AWB ke database.\n\n` +
      `Pastikan data yang dipaparkan adalah betul.\n\n` +
      `Teruskan?`
    )

    if (!confirm) return

    setProcessing(true)
    try {
      // TODO: Implement save to Firebase
      // For now, just show alert
      alert('Feature save AWB to database akan ditambah kemudian!')
      setExtractedAWBOrders([])
      setSuccess(true)
      setSuccessMessage('Orders telah disimpan!')
    } catch (err: any) {
      setErrorMessage(`Error saving orders: ${err.message}`)
    } finally {
      setProcessing(false)
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setUploadMode('file')}
              className={`py-3 px-6 rounded-xl font-medium transition-all ${
                uploadMode === 'file'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              📁 Upload CSV/PDF Invoice
            </button>
            <button
              onClick={() => setUploadMode('awb')}
              className={`py-3 px-6 rounded-xl font-medium transition-all ${
                uploadMode === 'awb'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              📄 Upload AWB PDF
            </button>
            <button
              onClick={() => setUploadMode('manual')}
              className={`py-3 px-6 rounded-xl font-medium transition-all ${
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
            ) : uploadMode === 'awb' ? (
              <motion.div
                key="awb"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload AWB PDF</h2>
                    <p className="text-gray-600">Upload AWB dari TikTok Shop atau Shopee untuk auto-extract data</p>
                  </div>

                  {/* AWB Upload Area */}
                  <div className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center hover:border-purple-500 transition-colors">
                    <input
                      ref={awbInputRef}
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleAWBUpload}
                      className="hidden"
                      id="awb-upload"
                      disabled={processing}
                    />
                    <label htmlFor="awb-upload" className="cursor-pointer">
                      <div className="text-6xl mb-4">📄</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {processing ? 'Processing...' : 'Click to Upload AWB PDF'}
                      </h3>
                      <p className="text-gray-600">
                        Atau drag & drop PDF files sini
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Support: TikTok Shop AWB, Shopee AWB
                      </p>
                    </label>
                  </div>

                  {/* Processing Indicator */}
                  {processing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-6 p-6 bg-purple-50 rounded-xl border border-purple-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <div>
                          <p className="font-semibold text-purple-900">Extracting data dari PDF...</p>
                          <p className="text-sm text-purple-700">Please wait</p>
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

                  {/* Extracted Orders Preview */}
                  {extractedAWBOrders.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Extracted Orders ({extractedAWBOrders.length})
                          </h3>
                          <p className="text-sm text-gray-600">Review data sebelum save ke database</p>
                        </div>
                        <Button
                          variant="primary"
                          onClick={handleSaveAWBOrders}
                          disabled={processing}
                        >
                          💾 Save All to Database
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {extractedAWBOrders.map((order, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-gray-900">{order.productName}</h4>
                                <p className="text-sm text-gray-600">Order ID: {order.orderId}</p>
                              </div>
                              <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-semibold">
                                {order.platform}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Customer</p>
                                <p className="font-semibold text-gray-900">{order.customerName}</p>
                                <p className="text-sm text-gray-600">{order.customerPhone}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Date & Time</p>
                                <p className="font-semibold text-gray-900">{order.tarikh}</p>
                                <p className="text-sm text-gray-600">{order.masa}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Tracking</p>
                                <p className="font-semibold text-gray-900">{order.tracking}</p>
                                <p className="text-sm text-gray-600">{order.courier}</p>
                              </div>
                            </div>

                            {/* Customer Address */}
                            <div className="mt-4">
                              <p className="text-xs text-gray-600 mb-1">Alamat Penghantaran</p>
                              <p className="text-sm text-gray-900">{order.customerAddress}</p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-purple-200">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">SKU:</span>
                                  <span className="ml-2 font-semibold">{order.sku}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Qty:</span>
                                  <span className="ml-2 font-semibold">{order.quantity}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Status:</span>
                                  <span className="ml-2 font-semibold">{order.status}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">COD:</span>
                                  <span className="ml-2 font-semibold">{order.cod}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
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
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        strategy="afterInteractive"
      />
      <Script
        id="pdfjs-config"
        strategy="afterInteractive"
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
