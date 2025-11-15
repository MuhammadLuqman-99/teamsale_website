'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Script from 'next/script'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { detectCSVSource, parseCSV, parsePDFInvoice, saveOrdersToFirebase } from '@/lib/fileHandlers'
import { OrderData } from '@/lib/firestore'
import { addOrder, saveAWBOrders } from '@/lib/firestore'
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
  const [uploadMode, setUploadMode] = useState<'file' | 'awb-shopee' | 'awb-tiktok' | 'manual'>('file')
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [extractedAWBOrders, setExtractedAWBOrders] = useState<ExtractedAWBOrder[]>([])
  const [extractedOrders, setExtractedOrders] = useState<OrderData[]>([])
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
    setExtractedOrders([]) // Clear previous extracted orders

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

      // Store extracted orders for preview instead of directly saving
      setExtractedOrders(orders)

      setSuccess(true)
      let message = `✅ ${orders.length} order berjaya diekstrak dari fail ${fileSource}!\n`
      message += `📋 Sila semak preview di bawah dan klik "Save Orders" untuk simpan ke database.`

      setSuccessMessage(message)

    } catch (error: any) {
      setErrorMessage(error.message || 'Ralat semasa memproses fail')
    } finally {
      setProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSaveExtractedOrders = async () => {
    if (extractedOrders.length === 0) return

    const confirm = window.confirm(
      `⚠️ Anda akan save ${extractedOrders.length} order ke database.\n\n` +
      `Pastikan data yang dipaparkan adalah betul.\n\n` +
      `Teruskan?`
    )

    if (!confirm) return

    setProcessing(true)
    setErrorMessage('')
    setSuccess(false)

    try {
      const { successCount, errorCount, createdCount, updatedCount } = await saveOrdersToFirebase(extractedOrders)

      setExtractedOrders([]) // Clear after successful save
      setSuccess(true)
      let message = `✅ ${successCount} order berjaya disimpan!\n`
      if (createdCount > 0) message += `📝 ${createdCount} order baru ditambah\n`
      if (updatedCount > 0) message += `🔄 ${updatedCount} order dikemaskini\n`
      if (errorCount > 0) message += `❌ ${errorCount} order gagal`

      setSuccessMessage(message)

      setTimeout(() => {
        setSuccess(false)
        setSuccessMessage('')
      }, 5000)

    } catch (error: any) {
      setErrorMessage(error.message || 'Gagal menyimpan order')
    } finally {
      setProcessing(false)
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
    let errorMessages: string[] = []

    console.log(`🚀 Starting AWB upload for ${files.length} file(s)`)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(`📁 Processing file ${i + 1}/${files.length}: ${file.name} (${file.size} bytes)`)

        if (file.type !== 'application/pdf') {
          const errorMsg = `File ${file.name} bukan PDF. Sila upload PDF sahaja.`
          console.error(`❌ ${errorMsg}`)
          errorMessages.push(errorMsg)
          continue
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          const errorMsg = `File ${file.name} terlalu besar. Maksimum 10MB.`
          console.error(`❌ ${errorMsg}`)
          errorMessages.push(errorMsg)
          continue
        }

        try {
          // Read file as base64
          console.log(`📖 Reading ${file.name}...`)
          const reader = new FileReader()
          const fileData = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => {
              if (e.target?.result) {
                resolve(e.target.result as string)
              } else {
                reject(new Error('FileReader failed to read file'))
              }
            }
            reader.onerror = () => reject(new Error('FileReader error'))
            reader.readAsDataURL(file)
          })

          console.log(`✅ ${file.name} read successfully. Base64 length: ${fileData.length}`)

          // Extract data from PDF
          console.log(`🔍 Extracting data from ${file.name}...`)
          const extractedData = await extractAWBData(fileData)

          if (extractedData) {
            console.log(`✅ Data extracted from ${file.name}:`, extractedData)
            orders.push(extractedData)
          } else {
            const errorMsg = `Gagal extract data dari ${file.name} - format mungkin tidak sesuai`
            console.error(`❌ ${errorMsg}`)
            errorMessages.push(errorMsg)
          }
        } catch (fileError: any) {
          const errorMsg = `Error processing ${file.name}: ${fileError.message}`
          console.error(`❌ ${errorMsg}`)
          errorMessages.push(errorMsg)
        }
      }

      if (orders.length > 0) {
        setExtractedAWBOrders(orders)
        setSuccess(true)
        let successMsg = `✅ Berjaya extract ${orders.length} order dari ${files.length} PDF AWB!`
        if (errorMessages.length > 0) {
          successMsg += `\n⚠️ ${errorMessages.length} file gagal diproses`
        }
        setSuccessMessage(successMsg)
      } else {
        // No successful extractions
        if (errorMessages.length > 0) {
          setErrorMessage(`Tiada data berjaya diekstrak.\n\n${errorMessages.join('\n')}`)
        } else {
          setErrorMessage('Tiada data dapat diekstrak dari PDF. Sila pastikan PDF adalah dari TikTok Shop atau Shopee.')
        }
      }
    } catch (err: any) {
      console.error('❌ Unexpected error in AWB upload:', err)
      setErrorMessage(`Error tidak dijangka: ${err.message}`)
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
    setErrorMessage('')
    setSuccess(false)

    try {
      // Save AWB orders to Firebase
      const result = await saveAWBOrders(extractedAWBOrders)

      if (result.errorCount > 0) {
        setErrorMessage(
          `${result.successCount} orders berjaya disimpan. ${result.errorCount} gagal.\n` +
          result.errors.join('\n')
        )
      } else {
        setSuccess(true)
        setSuccessMessage(`Berjaya save ${result.successCount} AWB orders ke database!`)
        setExtractedAWBOrders([]) // Clear after successful save

        // Auto hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(false)
          setSuccessMessage('')
        }, 3000)
      }
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setUploadMode('file')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                uploadMode === 'file'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              📁 CSV/PDF Invoice
            </button>
            <button
              onClick={() => setUploadMode('awb-shopee')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                uploadMode === 'awb-shopee'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              🛍️ AWB Shopee
            </button>
            <button
              onClick={() => setUploadMode('awb-tiktok')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                uploadMode === 'awb-tiktok'
                  ? 'bg-gradient-to-r from-black to-pink-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              🎵 AWB TikTok
            </button>
            <button
              onClick={() => setUploadMode('manual')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
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

                  {/* Extracted Orders Preview */}
                  {extractedOrders.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <Card className="bg-gray-50 border-2 border-gray-200">
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                              Extracted Orders ({extractedOrders.length})
                            </h3>
                            <Button
                              onClick={handleSaveExtractedOrders}
                              disabled={processing}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              💾 Save All Orders
                            </Button>
                          </div>

                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {extractedOrders.map((order, index) => (
                              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg text-gray-900">
                                      {order.nama_customer || 'Unknown Customer'}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      Order: {order.nombor_po_invoice || 'N/A'}
                                    </p>
                                  </div>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                    {order.platform || 'Unknown'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                  <div>
                                    <p className="text-xs text-gray-500">Date</p>
                                    <p className="font-semibold text-sm">{order.tarikh || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Total</p>
                                    <p className="font-semibold text-sm">RM {order.total_rm?.toFixed(2) || '0.00'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Team</p>
                                    <p className="font-semibold text-sm">{order.team_sale || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="font-semibold text-sm">{order.nombor_phone || 'N/A'}</p>
                                  </div>
                                </div>

                                <div className="mb-3">
                                  <p className="text-xs text-gray-500 mb-1">Product Details</p>
                                  <p className="text-sm bg-gray-50 p-2 rounded border">
                                    {order.jenis_order || order.code_kain || 'N/A'}
                                  </p>
                                </div>

                                {/* Additional extracted information */}
                                {(order.alamat_penghantaran || order.tracking_number || order.payment_method || order.shipping_option || order.quantity || order.unit_price) && (
                                  <div className="mb-3 p-3 bg-green-50 rounded border border-green-200">
                                    <p className="text-xs text-green-600 font-medium mb-2">📋 Additional Details</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                      {order.tracking_number && (
                                        <div>
                                          <span className="text-gray-600">Tracking:</span>
                                          <span className="ml-1 font-medium">{order.tracking_number}</span>
                                        </div>
                                      )}
                                      {order.payment_method && (
                                        <div>
                                          <span className="text-gray-600">Payment:</span>
                                          <span className="ml-1 font-medium">{order.payment_method}</span>
                                        </div>
                                      )}
                                      {order.shipping_option && (
                                        <div>
                                          <span className="text-gray-600">Shipping:</span>
                                          <span className="ml-1 font-medium">{order.shipping_option}</span>
                                        </div>
                                      )}
                                      {order.quantity && (
                                        <div>
                                          <span className="text-gray-600">Quantity:</span>
                                          <span className="ml-1 font-medium">{order.quantity}</span>
                                        </div>
                                      )}
                                      {order.unit_price && (
                                        <div>
                                          <span className="text-gray-600">Unit Price:</span>
                                          <span className="ml-1 font-medium">RM {order.unit_price.toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                    {order.alamat_penghantaran && (
                                      <div className="mt-2 pt-2 border-t border-green-300">
                                        <p className="text-gray-600 mb-1">Shipping Address:</p>
                                        <p className="text-xs bg-white p-2 rounded border">{order.alamat_penghantaran}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Show products if available (for PDF invoices) */}
                                {order.structuredProducts && order.structuredProducts.length > 0 && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                    <p className="text-xs text-blue-600 font-medium mb-2">
                                      📦 Products ({order.totalQuantity || 0} items)
                                    </p>
                                    <div className="space-y-1">
                                      {order.structuredProducts.map((product: any, pIndex: number) => (
                                        <div key={pIndex} className="text-sm">
                                          <span className="font-medium">{product.name}</span>
                                          <span className="text-gray-600 ml-2">
                                            x{product.totalQty} ({product.type})
                                          </span>
                                          {product.sizeBreakdown && product.sizeBreakdown.length > 0 && (
                                            <div className="text-xs text-gray-500 ml-4">
                                              Sizes: {product.sizeBreakdown.map((s: any) =>
                                                `${s.size}:${s.quantity}`).join(', ')}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ) : uploadMode === 'awb-shopee' ? (
              <motion.div
                key="awb-shopee"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Shopee AWB PDF</h2>
                    <p className="text-gray-600">Upload AWB Shopee untuk auto-extract Order ID, Nama, Alamat, Tracking</p>
                  </div>

                  {/* Shopee Upload - Use same logic as /awb-shopee page */}
                  <div className="border-2 border-dashed border-orange-300 rounded-xl p-12 text-center hover:border-orange-500 transition-colors">
                    <input
                      ref={awbInputRef}
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleAWBUpload}
                      className="hidden"
                      id="shopee-upload"
                      disabled={processing}
                    />
                    <label htmlFor="shopee-upload" className="cursor-pointer">
                      <div className="text-6xl mb-4">🛍️</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {processing ? 'Processing...' : 'Click untuk Upload AWB Shopee'}
                      </h3>
                      <p className="text-gray-600">PDF sahaja</p>
                    </label>
                  </div>

                  {processing && (
                    <div className="mt-6 p-6 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        <div>
                          <p className="font-semibold text-orange-900">Extracting data...</p>
                          <p className="text-sm text-orange-700">Please wait</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="mt-6 p-6 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-green-800">{successMessage}</p>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200">
                      <p className="text-red-800">{errorMessage}</p>
                    </div>
                  )}

                  {extractedAWBOrders.length > 0 && (
                    <div className="mt-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Extracted Orders ({extractedAWBOrders.length})</h3>
                        <Button onClick={handleSaveAWBOrders} disabled={processing}>
                          💾 Save ke Database
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {extractedAWBOrders.map((order, index) => (
                          <div key={index} className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                            <div className="flex justify-between mb-4">
                              <div>
                                <h4 className="font-bold text-lg">{order.customerName}</h4>
                                <p className="text-sm text-gray-600">Order: {order.orderId}</p>
                              </div>
                              <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm">Shopee</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-600">Tracking</p>
                                <p className="font-semibold">{order.tracking}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Date</p>
                                <p className="font-semibold">{order.tarikh}</p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <p className="text-xs text-gray-600 mb-1">Alamat Penghantaran</p>
                              <p className="text-sm bg-white p-3 rounded border">{order.customerAddress}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ) : uploadMode === 'awb-tiktok' ? (
              <motion.div
                key="awb-tiktok"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload TikTok Shop AWB PDF</h2>
                    <p className="text-gray-600">Upload AWB TikTok Shop untuk auto-extract Product, Customer, Alamat, Tracking</p>
                  </div>

                  {/* TikTok Upload */}
                  <div className="border-2 border-dashed border-pink-300 rounded-xl p-12 text-center hover:border-pink-500 transition-colors">
                    <input
                      ref={awbInputRef}
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleAWBUpload}
                      className="hidden"
                      id="tiktok-upload"
                      disabled={processing}
                    />
                    <label htmlFor="tiktok-upload" className="cursor-pointer">
                      <div className="text-6xl mb-4">🎵</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {processing ? 'Processing...' : 'Click untuk Upload AWB TikTok Shop'}
                      </h3>
                      <p className="text-gray-600">PDF sahaja</p>
                    </label>
                  </div>

                  {processing && (
                    <div className="mt-6 p-6 bg-pink-50 rounded-xl border border-pink-200">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                        <div>
                          <p className="font-semibold text-pink-900">Extracting data...</p>
                          <p className="text-sm text-pink-700">Please wait</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="mt-6 p-6 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-green-800">{successMessage}</p>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200">
                      <p className="text-red-800">{errorMessage}</p>
                    </div>
                  )}

                  {extractedAWBOrders.length > 0 && (
                    <div className="mt-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Extracted Orders ({extractedAWBOrders.length})</h3>
                        <Button onClick={handleSaveAWBOrders} disabled={processing}>
                          💾 Save ke Database
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {extractedAWBOrders.map((order, index) => (
                          <div key={index} className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-6">
                            <div className="flex justify-between mb-4">
                              <div>
                                <h4 className="font-bold text-lg">{order.productName}</h4>
                                <p className="text-sm text-gray-600">Order: {order.orderId}</p>
                              </div>
                              <span className="px-3 py-1 bg-gradient-to-r from-black to-pink-500 text-white rounded-full text-sm">TikTok Shop</span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-600">Customer</p>
                                <p className="font-semibold">{order.customerName}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Date & Time</p>
                                <p className="font-semibold">{order.tarikh} {order.masa}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Tracking</p>
                                <p className="font-semibold">{order.tracking}</p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <p className="text-xs text-gray-600 mb-1">Alamat Penghantaran</p>
                              <p className="text-sm bg-white p-3 rounded border">{order.customerAddress}</p>
                            </div>
                          </div>
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
        onError={() => {
          console.error('❌ PDF.js library failed to load')
        }}
        onLoad={() => {
          console.log('✅ PDF.js library loaded successfully')
          if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            console.log('✅ PDF.js worker configured')
          } else {
            console.error('❌ PDF.js not available after load')
          }
        }}
      />
      <Script
        id="pdfjs-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Wait for PDF.js to be available
            function waitForPDFJS() {
              if (typeof pdfjsLib !== 'undefined') {
                console.log('✅ PDF.js detected and configured');
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              } else {
                console.log('⏳ Waiting for PDF.js to load...');
                setTimeout(waitForPDFJS, 100);
              }
            }

            // Start waiting after a short delay to ensure script has time to load
            setTimeout(waitForPDFJS, 500);
          `
        }}
      />
    </div>
  )
}
