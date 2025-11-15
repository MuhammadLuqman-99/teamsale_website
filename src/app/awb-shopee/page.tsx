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

      console.log('📄 Shopee PDF Full Text:', fullText)
      console.log('📏 Text length:', fullText.length)

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

      // Order ID - enhanced pattern for Shopee format
      // Pattern: "Order ID: 251113M2SQ0GTF" or just floating order numbers like "251113M2SQ0GTF"
      let match = fullText.match(/Order ID[:\s]*([A-Z0-9]+)/i)
      if (match) {
        data.orderId = match[1].trim()
      } else {
        // Try pattern for 15-digit alphanumeric order codes (like 251113M2SQ0GTF)
        match = fullText.match(/\b\d{6}[A-Z0-9]{7,}\b/g)
        if (match && match.length > 0) {
          data.orderId = match[0].trim()
        }
      }

      // Date - pattern: DD-MM-YYYY at start of text
      match = fullText.match(/(\d{2})-(\d{2})-(\d{4})/)
      if (match) {
        data.tarikh = `${match[3]}-${match[2]}-${match[1]}`
      } else {
        data.tarikh = new Date().toISOString().split('T')[0]
      }

      // Tracking - SPXMY followed by digits and letter
      match = fullText.match(/SPXMY\d+[A-Z]?/i)
      if (match) data.tracking = match[0]

      // Customer Name - pattern: "Name: Nong Chik (Qila)"
      // Extract after "Name:" in Recipient Details section
      match = fullText.match(/Recipient Details[^]*?Name[:\s]+([A-Za-z\s()]+?)(?=Order ID|Address)/i)
      if (match) {
        data.customerName = match[1].trim()
      } else {
        // Fallback: just "Name: XXX"
        match = fullText.match(/Name[:\s]+([A-Za-z\s()]+?)(?=Order|Address|Postcode)/i)
        if (match) data.customerName = match[1].trim()
      }

      // Phone (if available)
      match = fullText.match(/0\d{9,10}/)
      if (match) data.customerPhone = match[0]

      // Address - ENHANCED for fragmented Shopee format
      // Pattern: Address text may be scattered throughout the PDF
      // Example: "TAMAN SENTOSA" and "No.42 JALAN SENTOSA 4, TAMAN SENTOSA, Kupang, Baling, Kedah"

      let addressParts: string[] = []

      // Method 1: Try to get Recipient address (after tracking number, before postcode)
      const recipientPattern = /SPXMY\d+[A-Z]?\s+(.*?)(?=Postcode[:\s]*\d{5})/is
      match = fullText.match(recipientPattern)

      if (match) {
        let addr = match[1]
          // Remove extra SPX tracking if repeated
          .replace(/SPXMY\d+[A-Z]?/gi, '')
          // Remove "Enjoy 15 Days" promo text
          .replace(/Enjoy.*?items!/gi, '')
          // Remove section headers
          .replace(/Recipient Details.*?$/gi, '')
          .replace(/Sender Details.*?$/gi, '')
          // Clean up whitespace
          .replace(/\s+/g, ' ')
          .trim()

        if (addr) addressParts.push(addr)
      }

      // Method 2: Look for specific address patterns
      // Pattern 1: "TAMAN SENTOSA" type location names
      const locationPattern = /[A-Z\s]+(?:TAMAN|KAMPUNG|LOT|PT)[A-Z\s]*/gi
      const locationMatches = fullText.match(locationPattern)
      if (locationMatches) {
        locationMatches.forEach(loc => {
          loc = loc.trim()
          if (loc.length > 3 && !loc.includes('SPXMY') && !loc.includes('ORDER')) {
            if (!addressParts.includes(loc)) addressParts.push(loc)
          }
        })
      }

      // Method 3: Look for street address patterns
      // Pattern: "No.42 JALAN SENTOSA 4" type addresses
      const streetPattern = /No\.?\s*\d+[^,\n]*JALAN[^,\n]*/gi
      const streetMatches = fullText.match(streetPattern)
      if (streetMatches) {
        streetMatches.forEach(street => {
          street = street.trim()
          if (street.length > 5 && !addressParts.includes(street)) {
            addressParts.push(street)
          }
        })
      }

      // Method 4: Look for city/state combinations
      // Pattern: "Kupang, Baling, Kedah" type locations
      const cityPattern = /[A-Z][a-z]+(?:,\s*[A-Z][a-z]+){1,2}/gi
      const cityMatches = fullText.match(cityPattern)
      if (cityMatches) {
        cityMatches.forEach(city => {
          city = city.trim()
          if (!city.includes('Order') && !city.includes('Shopee') && !addressParts.includes(city)) {
            addressParts.push(city)
          }
        })
      }

      // Method 5: Fallback - get everything after "Address:" keyword
      if (addressParts.length === 0) {
        match = fullText.match(/Address[:\s]+(.*?)(?=Name:|Postcode:|Order ID:|$)/is)
        if (match) {
          addressParts.push(match[1].replace(/\s+/g, ' ').trim())
        }
      }

      // Combine all address parts, prioritizing the most complete ones
      if (addressParts.length > 0) {
        // Filter out common non-address items and deduplicate
        const filteredParts = addressParts.filter(part =>
          part &&
          part.length > 2 &&
          !part.includes('Recipient') &&
          !part.includes('Sender') &&
          !part.includes('Order ID') &&
          !part.includes('SPXMY') &&
          !part.includes('Shopee') &&
          !part.includes('Standard') &&
          !part.includes('Express')
        )

        // Join with comma, remove duplicates
        data.customerAddress = [...new Set(filteredParts)].join(', ')
      }

      // Add postcode if found and not already in address
      match = fullText.match(/Postcode[:\s]*(\d{5})/i)
      if (match && !data.customerAddress.includes(match[1])) {
        data.customerAddress += ', ' + match[1]
      }

      // Courier type
      if (fullText.toLowerCase().includes('shopee express')) {
        data.courier = 'Shopee Express'
      } else if (fullText.toLowerCase().includes('standard')) {
        data.courier = 'Shopee Standard'
      }

      // Enhanced debugging
      console.log('🔍 Order ID extraction result:', data.orderId)
      console.log('🔍 Tracking extraction result:', data.tracking)
      console.log('🔍 Address extraction result:', data.customerAddress)
      console.log('🔍 Name extraction result:', data.customerName)
      console.log('✅ Final Shopee extracted data:', data)
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
