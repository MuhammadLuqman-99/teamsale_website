'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Script from 'next/script'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { saveAWBOrders } from '@/lib/firestore'

interface TikTokOrder {
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

export default function TikTokAWBPage() {
  const [processing, setProcessing] = useState(false)
  const [extractedOrders, setExtractedOrders] = useState<TikTokOrder[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Clear previous data
    setExtractedOrders([])
    setProcessing(true)
    setError('')
    setSuccess('')
    const orders: TikTokOrder[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.type !== 'application/pdf') {
          setError(`File ${file.name} bukan PDF. Sila upload PDF AWB TikTok Shop sahaja.`)
          continue
        }

        // Read file as base64
        const reader = new FileReader()
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        // Extract using TikTok-specific parser
        const extractedData = await extractTikTokAWB(fileData)
        if (extractedData) {
          orders.push(extractedData)
        }
      }

      setExtractedOrders(orders)
      setSuccess(`Berjaya extract ${orders.length} order TikTok Shop dari ${files.length} PDF!`)
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const extractTikTokAWB = async (pdfBase64: string): Promise<TikTokOrder | null> => {
    try {
      // Extract text using pdfjs
      const pdfjsLib = (window as any).pdfjsLib
      if (!pdfjsLib) throw new Error('PDF.js not loaded')

      const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '')
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const loadingTask = pdfjsLib.getDocument({ data: bytes })
      const pdf = await loadingTask.promise

      let fullText = ''
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(' ')
        fullText += pageText + '\n'
      }

      console.log('📄 TikTok PDF Text:', fullText.substring(0, 500))

      // Parse TikTok Shop AWB
      const data: TikTokOrder = {
        platform: 'TikTok Shop',
        orderId: '',
        tarikh: '',
        masa: '',
        tracking: '',
        courier: '',
        status: 'CASHLESS',
        cod: '0 MYR',
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        productName: '',
        sku: '',
        quantity: 1,
        seller: 'TikTok Seller'
      }

      // Order ID - long digit sequence
      let match = fullText.match(/(\d{15,20})/)
      if (match) data.orderId = match[1]

      // Date & Time
      match = fullText.match(/(\d{4}[-\/]\d{2}[-\/]\d{2})\s*(\d{1,2}:\d{2})/)
      if (match) {
        data.tarikh = match[1].replace(/\//g, '-')
        data.masa = match[2]
      }

      // Tracking
      match = fullText.match(/MYPM\d+/i)
      if (match) data.tracking = match[0]

      // Courier
      if (fullText.toLowerCase().includes('pos laju')) {
        data.courier = 'POS Laju'
      } else if (fullText.toLowerCase().includes('pos malaysia')) {
        data.courier = 'POS Malaysia (Standard)'
      } else if (fullText.toLowerCase().includes('j&t')) {
        data.courier = 'J&T Express'
      } else {
        data.courier = 'Unknown'
      }

      // Customer Name
      match = fullText.match(/(?:Receiver|Penerima|Name)[:\s]+([A-Za-z\s]+?)(?:\n|Phone|\()/i)
      if (match) data.customerName = match[1].trim()

      // Phone
      match = fullText.match(/[\(]?\+?6?0?1\d[-\s*]*\d+[-\s*]*\d+/i)
      if (match) data.customerPhone = match[0].replace(/\s/g, '')

      // Address
      match = fullText.match(/(?:Address|Alamat)[:\s]+(.+?)(?=Product|SKU|Qty|$)/is)
      if (match) {
        data.customerAddress = match[1]
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      }

      // Product Name
      match = fullText.match(/(?:Product Name|Product|Produk)[:\s]+(.+?)(?=SKU|Qty|Status)/is)
      if (match) {
        data.productName = match[1]
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      }

      // SKU
      match = fullText.match(/(?:SKU|Code)[:\s]*([A-Z]{2,}\s*[\d\-]+[^,\n]*(?:,\s*[A-Z]+)?)/i)
      if (match) data.sku = match[1].trim()

      // Quantity
      match = fullText.match(/(?:Qty|Quantity|Kuantiti)[:\s]*(\d+)/i)
      if (match) data.quantity = parseInt(match[1])

      // COD
      match = fullText.match(/(?:COD|Cash)[:\s]*([\d.]+\s*(?:MYR|RM)?)/i)
      if (match) {
        data.cod = match[1].includes('MYR') || match[1].includes('RM')
          ? match[1]
          : match[1] + ' MYR'
      }

      // Status
      if (fullText.toLowerCase().includes('cashless')) {
        data.status = 'CASHLESS'
      } else if (parseFloat(data.cod) > 0) {
        data.status = 'COD'
      }

      console.log('✅ TikTok extracted:', data)
      return data
    } catch (error) {
      console.error('❌ Error extracting TikTok AWB:', error)
      throw error
    }
  }

  const handleSaveOrders = async () => {
    if (extractedOrders.length === 0) return

    const confirm = window.confirm(
      `⚠️ Anda akan save ${extractedOrders.length} order TikTok Shop ke database.\n\nTeruskan?`
    )
    if (!confirm) return

    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      const result = await saveAWBOrders(extractedOrders)

      if (result.errorCount > 0) {
        setError(
          `${result.successCount} orders saved. ${result.errorCount} failed.\n` +
          result.errors.join('\n')
        )
      } else {
        setSuccess(`✅ Berjaya save ${result.successCount} TikTok orders!`)
        setExtractedOrders([])
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" />
      <Script id="pdfjs-worker">{`pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';`}</Script>

      <div className="min-h-screen gradient-soft">
        <nav className="glass sticky top-0 z-50 border-b border-gray-200/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-black via-gray-800 to-pink-500 rounded-2xl flex items-center justify-center shadow-soft">
                  <span className="text-white font-bold text-lg">🎵</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">TikTok Shop AWB</h2>
                  <span className="text-xs text-gray-600">Upload AWB TikTok Shop</span>
                </div>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">← Dashboard</Button>
              </Link>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload TikTok Shop AWB PDF</h2>
              <p className="text-gray-600">Sistem akan auto-extract Order ID, Product, Nama, Alamat, Tracking dari PDF</p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-pink-300 rounded-xl p-12 text-center hover:border-pink-500 transition-colors mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
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

            {/* Messages */}
            {processing && (
              <div className="p-4 bg-pink-50 rounded-xl border border-pink-200 mb-6">
                <p className="text-pink-800">⏳ Extracting data dari PDF...</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200 mb-6">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Extracted Orders */}
            {extractedOrders.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Extracted Orders ({extractedOrders.length})</h3>
                  <Button onClick={handleSaveOrders} disabled={processing}>
                    💾 Save ke Database
                  </Button>
                </div>

                <div className="space-y-4">
                  {extractedOrders.map((order, index) => (
                    <div key={index} className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-6">
                      <div className="flex justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-lg">{order.productName}</h4>
                          <p className="text-sm text-gray-600">Order: {order.orderId}</p>
                        </div>
                        <span className="px-3 py-1 bg-gradient-to-r from-black to-pink-500 text-white rounded-full text-sm">
                          TikTok Shop
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600">Customer</p>
                          <p className="font-semibold">{order.customerName}</p>
                          <p className="text-sm text-gray-600">{order.customerPhone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Date & Time</p>
                          <p className="font-semibold">{order.tarikh}</p>
                          <p className="text-sm text-gray-600">{order.masa}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Tracking</p>
                          <p className="font-semibold">{order.tracking}</p>
                          <p className="text-sm text-gray-600">{order.courier}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-1">Alamat Penghantaran</p>
                        <p className="text-sm bg-white p-3 rounded border">{order.customerAddress}</p>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
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
                  ))}
                </div>
              </div>
            )}
          </Card>
        </main>
      </div>
    </>
  )
}
