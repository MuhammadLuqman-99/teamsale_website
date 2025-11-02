'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Script from 'next/script'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { saveAWBOrders } from '@/lib/firestore'

interface ShopeeOrder {
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

export default function ShopeeAWBPage() {
  const [processing, setProcessing] = useState(false)
  const [extractedOrders, setExtractedOrders] = useState<ShopeeOrder[]>([])
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
    const orders: ShopeeOrder[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.type !== 'application/pdf') {
          setError(`File ${file.name} bukan PDF. Sila upload PDF AWB Shopee sahaja.`)
          continue
        }

        // Read file as base64
        const reader = new FileReader()
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        // Extract using Shopee-specific parser
        const extractedData = await extractShopeeAWB(fileData)
        if (extractedData) {
          orders.push(extractedData)
        }
      }

      setExtractedOrders(orders)
      setSuccess(`Berjaya extract ${orders.length} order Shopee dari ${files.length} PDF!`)
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const extractShopeeAWB = async (pdfBase64: string): Promise<ShopeeOrder | null> => {
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

      console.log('📄 Shopee PDF Text:', fullText.substring(0, 500))

      // Parse Shopee AWB
      const data: ShopeeOrder = {
        platform: 'Shopee',
        orderId: '',
        tarikh: '',
        masa: '00:00',
        tracking: '',
        courier: 'Shopee Standard',
        status: 'CASHLESS',
        cod: '0 MYR',
        customerName: '',
        customerPhone: 'N/A',
        customerAddress: '',
        productName: 'Shopee Order',
        sku: 'N/A',
        quantity: 1,
        seller: 'Shopee Seller'
      }

      // Order ID - pattern: 21060 75450 or similar
      let match = fullText.match(/Order ID[:\s]*(\d[\d\s]{8,20})/i)
      if (match) data.orderId = match[1].replace(/\s/g, '')
      else {
        match = fullText.match(/(\d{5}\s*\d{5,10})/)
        if (match) data.orderId = match[1].replace(/\s/g, '')
      }

      // Date - pattern: 26.10.2025 or DD.MM.YYYY
      match = fullText.match(/(\d{2})\.(\d{2})\.(\d{4})/)
      if (match) {
        data.tarikh = `${match[3]}-${match[2]}-${match[1]}`
      } else {
        // Try MM-YYYY format
        match = fullText.match(/(\d{2})-(\d{4})/)
        if (match) {
          data.tarikh = `${match[2]}-${match[1]}-01`
        } else {
          data.tarikh = new Date().toISOString().split('T')[0]
        }
      }

      // Tracking - SPXMY...
      match = fullText.match(/SPXMY\d+/i)
      if (match) data.tracking = match[0]

      // Customer Name - flexible extraction
      match = fullText.match(/Name[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
      if (match) {
        data.customerName = match[1].trim()
      } else {
        // Try before "Order ID"
        match = fullText.match(/([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+Order/i)
        if (match) data.customerName = match[1].trim()
      }

      // Phone (if available)
      match = fullText.match(/0\d{9,10}/)
      if (match) data.customerPhone = match[0]

      // Address - IMPROVED: Get all text between Address: and Name: or Postcode:
      const addressPattern = /Address[:\s]+([\s\S]+?)(?=Name:|Order ID:|Postcode:|Scan QR)/i
      match = fullText.match(addressPattern)
      if (match) {
        data.customerAddress = match[1]
          .replace(/\s+/g, ' ')
          .trim()
      } else {
        // Fallback: Try to get text before "Name:"
        match = fullText.match(/Address[:\s]+([^\n]+)/i)
        if (match) data.customerAddress = match[1].trim()
      }

      // Add postcode if found
      match = fullText.match(/Postcode[:\s]+(\d{5})/i)
      if (match && !data.customerAddress.includes(match[1])) {
        data.customerAddress += ', ' + match[1]
      }

      // Courier type
      if (fullText.toLowerCase().includes('shopee express')) {
        data.courier = 'Shopee Express'
      } else if (fullText.toLowerCase().includes('standard')) {
        data.courier = 'Shopee Standard'
      }

      console.log('✅ Shopee extracted:', data)
      return data
    } catch (error) {
      console.error('❌ Error extracting Shopee AWB:', error)
      throw error
    }
  }

  const handleSaveOrders = async () => {
    if (extractedOrders.length === 0) return

    const confirm = window.confirm(
      `⚠️ Anda akan save ${extractedOrders.length} order Shopee ke database.\n\nTeruskan?`
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
        setSuccess(`✅ Berjaya save ${result.successCount} Shopee orders!`)
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
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-soft">
                  <span className="text-white font-bold text-lg">🛍️</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Shopee AWB</h2>
                  <span className="text-xs text-gray-600">Upload AWB Shopee</span>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Shopee AWB PDF</h2>
              <p className="text-gray-600">Sistem akan auto-extract Order ID, Nama, Alamat, Tracking dari PDF</p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-orange-300 rounded-xl p-12 text-center hover:border-orange-500 transition-colors mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
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

            {/* Messages */}
            {processing && (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 mb-6">
                <p className="text-orange-800">⏳ Extracting data dari PDF...</p>
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
                    <div key={index} className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                      <div className="flex justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-lg">{order.customerName}</h4>
                          <p className="text-sm text-gray-600">Order: {order.orderId}</p>
                        </div>
                        <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm">
                          Shopee
                        </span>
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

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <span className="ml-2">{order.customerPhone}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Courier:</span>
                          <span className="ml-2">{order.courier}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className="ml-2">{order.status}</span>
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
