/**
 * AWB PDF Parser
 * Extract order data from TikTok Shop and Shopee AWB PDFs
 */

export interface AWBData {
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

/**
 * Extract data from AWB PDF
 * Note: This is a simplified version. For production, you should use a proper PDF parsing library
 * like pdf-parse or pdfjs-dist on the server side via API route
 */
export async function extractAWBData(pdfBase64: string): Promise<AWBData | null> {
  try {
    // For now, this is a placeholder that returns mock data
    // In production, you need to:
    // 1. Send PDF to API route
    // 2. Use pdf-parse library on server
    // 3. Parse text with regex patterns

    // Mock extracted data based on the sample PDF
    const mockData: AWBData = {
      orderId: '580971273482372858',
      platform: 'TikTok Shop',
      tarikh: '2025-10-30',
      masa: '11:48',
      tracking: 'MYPM10653990705',
      courier: 'POS Malaysia (Standard)',
      status: 'CASHLESS',
      cod: '0 MYR',
      customerName: 'Nik Anuar Bin Nik Mat',
      customerPhone: '(+60)11******23',
      customerAddress: 'B2-1-1 Kuarters Staff Iium Jln Gombak, Gombak, Kuala Lumpur, 53100',
      productName: 'DESA MURNI BATIK KEMEJA BATIK READYMADE CODE LZ 7&8',
      sku: 'LZ 8-4, XL',
      quantity: 1,
      seller: 'Batik Malaysia'
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return mockData
  } catch (error) {
    console.error('Error parsing AWB PDF:', error)
    return null
  }
}

/**
 * Parse TikTok Shop AWB
 */
function parseTikTokShopAWB(text: string): AWBData | null {
  try {
    const data: Partial<AWBData> = {
      platform: 'TikTok Shop'
    }

    // Extract Order ID
    const orderIdMatch = text.match(/Order ID[:\s]+(\d+)/)
    if (orderIdMatch) data.orderId = orderIdMatch[1]

    // Extract Date
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/)
    if (dateMatch) {
      data.tarikh = dateMatch[1]
      data.masa = dateMatch[2]
    }

    // Extract Tracking
    const trackingMatch = text.match(/MYPM\d+/)
    if (trackingMatch) data.tracking = trackingMatch[0]

    // Extract Customer Name
    const nameMatch = text.match(/Receiver\s+([A-Za-z\s]+)/)
    if (nameMatch) data.customerName = nameMatch[1].trim()

    // Extract Product
    const productMatch = text.match(/Product Name\s+SKU[^]*?([A-Z\s]+BATIK[^]*?)(?=LZ|$)/)
    if (productMatch) data.productName = productMatch[1].trim()

    // Extract SKU
    const skuMatch = text.match(/LZ\s+[\d-]+,?\s*[A-Z]*/)
    if (skuMatch) data.sku = skuMatch[0]

    // Extract Quantity
    const qtyMatch = text.match(/Qty Total:\s*(\d+)/)
    if (qtyMatch) data.quantity = parseInt(qtyMatch[1])

    // Extract COD
    const codMatch = text.match(/COD:\s*(\d+\s*MYR)/)
    if (codMatch) data.cod = codMatch[1]

    // Status
    data.status = text.includes('CASHLESS') ? 'CASHLESS' : 'COD'
    data.courier = text.includes('POS') ? 'POS Malaysia (Standard)' : 'Unknown'

    return data as AWBData
  } catch (error) {
    console.error('Error parsing TikTok Shop AWB:', error)
    return null
  }
}

/**
 * Parse Shopee AWB
 */
function parseShopeeAWB(text: string): AWBData | null {
  try {
    const data: Partial<AWBData> = {
      platform: 'Shopee'
    }

    // Similar parsing logic for Shopee format
    // TODO: Implement Shopee-specific patterns

    return data as AWBData
  } catch (error) {
    console.error('Error parsing Shopee AWB:', error)
    return null
  }
}

/**
 * Detect platform from PDF content
 */
function detectPlatform(text: string): 'tiktok' | 'shopee' | 'unknown' {
  if (text.includes('TikTok Shop')) return 'tiktok'
  if (text.includes('Shopee')) return 'shopee'
  return 'unknown'
}
