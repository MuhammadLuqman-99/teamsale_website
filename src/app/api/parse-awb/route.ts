import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pdfBase64, pdfText } = await request.json()

    if (!pdfBase64 && !pdfText) {
      return NextResponse.json(
        { error: 'PDF data or text is required' },
        { status: 400 }
      )
    }

    // For now, we expect the client to send extracted text
    // This is because pdf parsing in Node.js environment has compatibility issues
    const text = pdfText || ''

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Unable to extract text from PDF' },
        { status: 400 }
      )
    }

    // Debug: Log first 500 chars of text
    console.log('📄 PDF Text Preview:', text.substring(0, 500))

    // Detect platform
    const platform = detectPlatform(text)

    let extractedData = null
    if (platform === 'tiktok') {
      extractedData = parseTikTokShopAWB(text)
    } else if (platform === 'shopee') {
      extractedData = parseShopeeAWB(text)
    } else {
      return NextResponse.json(
        { error: 'Platform tidak dikenali. Pastikan PDF adalah dari TikTok Shop atau Shopee.' },
        { status: 400 }
      )
    }

    if (!extractedData) {
      return NextResponse.json(
        { error: 'Gagal extract data dari PDF. Format mungkin tidak sesuai.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: extractedData })
  } catch (error: any) {
    console.error('Error parsing PDF:', error)
    return NextResponse.json(
      { error: `Error parsing PDF: ${error.message}` },
      { status: 500 }
    )
  }
}

/**
 * Detect platform from PDF content
 */
function detectPlatform(text: string): 'tiktok' | 'shopee' | 'unknown' {
  const lowerText = text.toLowerCase()

  // TikTok Shop detection - check multiple variations
  if (
    lowerText.includes('tiktok') ||
    lowerText.includes('tik tok') ||
    lowerText.includes('tt shop') ||
    lowerText.includes('ttshop') ||
    text.includes('TikTok') ||
    text.includes('TIKTOK')
  ) {
    console.log('✅ Detected: TikTok Shop')
    return 'tiktok'
  }

  // Shopee detection
  if (
    lowerText.includes('shopee') ||
    lowerText.includes('spx') ||
    text.includes('Shopee') ||
    text.includes('SHOPEE')
  ) {
    console.log('✅ Detected: Shopee')
    return 'shopee'
  }

  console.log('❌ Platform unknown. Text preview:', text.substring(0, 200))
  return 'unknown'
}

/**
 * Parse TikTok Shop AWB
 */
function parseTikTokShopAWB(text: string): any {
  try {
    const data: any = {
      platform: 'TikTok Shop'
    }

    // Extract Order ID - look for long digit sequences
    const orderIdMatch = text.match(/(\d{15,20})/)
    if (orderIdMatch) data.orderId = orderIdMatch[1]

    // Extract Date and Time
    const dateMatch = text.match(/(\d{4}[-\/]\d{2}[-\/]\d{2})\s*(\d{1,2}:\d{2})/)
    if (dateMatch) {
      data.tarikh = dateMatch[1].replace(/\//g, '-')
      data.masa = dateMatch[2]
    }

    // Extract Tracking Number (MYPM followed by digits)
    const trackingMatch = text.match(/MYPM\d+/i)
    if (trackingMatch) data.tracking = trackingMatch[0]

    // Extract Courier
    if (text.toLowerCase().includes('pos laju')) {
      data.courier = 'POS Laju'
    } else if (text.toLowerCase().includes('pos malaysia')) {
      data.courier = 'POS Malaysia (Standard)'
    } else if (text.toLowerCase().includes('j&t')) {
      data.courier = 'J&T Express'
    } else {
      data.courier = 'Unknown'
    }

    // Extract Customer Name - usually after "Receiver" or similar
    const nameMatch = text.match(/(?:Receiver|Penerima|Name)[:\s]+([A-Za-z\s]+?)(?:\n|Phone|\()/i)
    if (nameMatch) data.customerName = nameMatch[1].trim()

    // Extract Phone Number
    const phoneMatch = text.match(/[\(]?\+?6?0?1\d[-\s*]*\d+[-\s*]*\d+/i)
    if (phoneMatch) data.customerPhone = phoneMatch[0].replace(/\s/g, '')

    // Extract Address - usually multi-line after name/phone
    const addressMatch = text.match(/(?:Address|Alamat)[:\s]+(.+?)(?=Product|SKU|Qty|$)/is)
    if (addressMatch) {
      data.customerAddress = addressMatch[1]
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Extract Product Name
    const productMatch = text.match(/(?:Product Name|Product|Produk)[:\s]+(.+?)(?=SKU|Qty|Status)/is)
    if (productMatch) {
      data.productName = productMatch[1]
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Extract SKU - look for pattern like "LZ 8-4, XL" or similar
    const skuMatch = text.match(/(?:SKU|Code)[:\s]*([A-Z]{2,}\s*[\d\-]+[^,\n]*(?:,\s*[A-Z]+)?)/i)
    if (skuMatch) data.sku = skuMatch[1].trim()

    // Extract Quantity
    const qtyMatch = text.match(/(?:Qty|Quantity|Kuantiti)[:\s]*(\d+)/i)
    if (qtyMatch) data.quantity = parseInt(qtyMatch[1])
    else data.quantity = 1

    // Extract COD Amount
    const codMatch = text.match(/(?:COD|Cash)[:\s]*([\d.]+\s*(?:MYR|RM)?)/i)
    if (codMatch) {
      data.cod = codMatch[1].includes('MYR') || codMatch[1].includes('RM')
        ? codMatch[1]
        : codMatch[1] + ' MYR'
    } else {
      data.cod = '0 MYR'
    }

    // Extract Status
    if (text.toLowerCase().includes('cashless')) {
      data.status = 'CASHLESS'
    } else if (parseFloat(data.cod) > 0) {
      data.status = 'COD'
    } else {
      data.status = 'CASHLESS'
    }

    // Seller - try to extract or default
    const sellerMatch = text.match(/(?:Seller|Shop|Store)[:\s]+([A-Za-z\s]+)/i)
    if (sellerMatch) data.seller = sellerMatch[1].trim()
    else data.seller = 'TikTok Shop Seller'

    return data
  } catch (error) {
    console.error('Error parsing TikTok Shop AWB:', error)
    return null
  }
}

/**
 * Parse Shopee AWB
 */
function parseShopeeAWB(text: string): any {
  try {
    const data: any = {
      platform: 'Shopee'
    }

    // Extract Order ID
    const orderIdMatch = text.match(/(?:Order|Pesanan)[:\s#]*(\d{10,20})/i)
    if (orderIdMatch) data.orderId = orderIdMatch[1]

    // Extract Date
    const dateMatch = text.match(/(\d{4}[-\/]\d{2}[-\/]\d{2})/)
    if (dateMatch) {
      data.tarikh = dateMatch[1].replace(/\//g, '-')
      data.masa = '00:00' // Shopee might not have time
    }

    // Extract Tracking
    const trackingMatch = text.match(/(?:SPXMY|SPX|MYPM)\d+/i)
    if (trackingMatch) data.tracking = trackingMatch[0]

    // Extract Courier
    if (text.toLowerCase().includes('shopee express')) {
      data.courier = 'Shopee Express'
    } else if (text.toLowerCase().includes('j&t')) {
      data.courier = 'J&T Express'
    } else {
      data.courier = 'Shopee Standard'
    }

    // Extract Customer Info (similar patterns to TikTok)
    const nameMatch = text.match(/(?:Receiver|Name|Penerima)[:\s]+([A-Za-z\s]+?)(?:\n|Phone|\()/i)
    if (nameMatch) data.customerName = nameMatch[1].trim()

    const phoneMatch = text.match(/[\(]?\+?6?0?1\d[-\s*]*\d+[-\s*]*\d+/i)
    if (phoneMatch) data.customerPhone = phoneMatch[0].replace(/\s/g, '')

    const addressMatch = text.match(/(?:Address|Alamat)[:\s]+(.+?)(?=Product|Item|$)/is)
    if (addressMatch) {
      data.customerAddress = addressMatch[1]
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Extract Product
    const productMatch = text.match(/(?:Product|Item|Produk)[:\s]+(.+?)(?=Variation|SKU|Qty)/is)
    if (productMatch) {
      data.productName = productMatch[1]
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Extract SKU
    const skuMatch = text.match(/(?:Variation|SKU)[:\s]*([^\n]+)/i)
    if (skuMatch) data.sku = skuMatch[1].trim()
    else data.sku = 'N/A'

    // Extract Quantity
    const qtyMatch = text.match(/(?:Qty|Quantity|x)[:\s]*(\d+)/i)
    if (qtyMatch) data.quantity = parseInt(qtyMatch[1])
    else data.quantity = 1

    // COD
    data.cod = '0 MYR'
    data.status = 'CASHLESS'

    // Seller
    data.seller = 'Shopee Seller'

    return data
  } catch (error) {
    console.error('Error parsing Shopee AWB:', error)
    return null
  }
}
