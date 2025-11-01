'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { extractAWBData } from '@/lib/pdf-parser/awb-parser'

interface ExtractedOrder {
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

export default function AWBUploadPage() {
  const [uploading, setUploading] = useState(false)
  const [extractedOrders, setExtractedOrders] = useState<ExtractedOrder[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')
    setSuccess('')
    const orders: ExtractedOrder[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.type !== 'application/pdf') {
          setError(`File ${file.name} bukan PDF. Sila upload PDF sahaja.`)
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

      setExtractedOrders(orders)
      setSuccess(`Berjaya extract ${orders.length} order dari ${files.length} PDF!`)
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveOrders = async () => {
    // TODO: Save to Firebase
    alert('Feature save to database akan ditambah!')
  }

  return (
    <div className="min-h-screen gradient-soft">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">📄</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AWB Upload</h2>
                <span className="text-xs text-gray-600">Auto-Extract Order Data</span>
              </div>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">← Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload AWB PDF</h1>
          <p className="text-gray-600 mb-8">Upload AWB dari TikTok Shop atau Shopee untuk auto-extract data order</p>

          {/* Upload Section */}
          <Card className="p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload PDF Files</h2>
              <p className="text-gray-600">Boleh upload multiple PDF sekaligus</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
                disabled={uploading}
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {uploading ? 'Processing...' : 'Click to Upload PDF'}
                </h3>
                <p className="text-gray-600">
                  Atau drag & drop PDF files sini
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Support: TikTok Shop AWB, Shopee AWB
                </p>
              </label>
            </div>

            {/* Messages */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {success}
              </div>
            )}
          </Card>

          {/* Extracted Orders */}
          {extractedOrders.length > 0 && (
            <Card className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Extracted Orders ({extractedOrders.length})</h2>
                  <p className="text-gray-600">Review data sebelum save ke database</p>
                </div>
                <Button variant="primary" onClick={handleSaveOrders}>
                  💾 Save All to Database
                </Button>
              </div>

              <div className="space-y-4">
                {extractedOrders.map((order, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{order.productName}</h3>
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
                        <p className="text-xs text-gray-600 mb-1">Tarikh & Masa</p>
                        <p className="font-semibold text-gray-900">{order.tarikh}</p>
                        <p className="text-sm text-gray-600">{order.masa}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Tracking</p>
                        <p className="font-semibold text-gray-900">{order.tracking}</p>
                        <p className="text-sm text-gray-600">{order.courier}</p>
                      </div>
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
            </Card>
          )}

          {/* Info Card */}
          <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Cara Guna</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>1. Upload AWB PDF dari TikTok Shop atau Shopee</li>
                  <li>2. System akan auto-extract semua data order</li>
                  <li>3. Review data yang extracted</li>
                  <li>4. Click &quot;Save All&quot; untuk save ke database</li>
                  <li>5. Data akan muncul dalam Orders page</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
