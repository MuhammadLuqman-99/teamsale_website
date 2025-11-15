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

    console.log('🔍 Parsing Shopee AWB...')
    console.log('📄 Full text (COMPLETE):', text)
    console.log('📄 Text length:', text.length, 'chars')

    // Extract Order ID - enhanced for format like 251113M2SQ0GTF
    // Try multiple patterns in order of specificity
    let orderIdMatch = text.match(/Order ID[:\s]*([A-Z0-9]{10,15})(?!\d)/i)
    if (!orderIdMatch) {
      // Try with spaces: "Order ID : 251113M2SQ0GTF" or scattered text
      orderIdMatch = text.match(/Order\s+ID[:\s]+([A-Z0-9]{10,15})(?!\d)/i)
    }
    if (!orderIdMatch) {
      // Try pattern for 15-digit alphanumeric order codes (like 251113M2SQ0GTF)
      // Format: DDMMYY + 7-9 alphanumeric chars
      orderIdMatch = text.match(/\b(\d{6}[A-Z0-9]{7,9})\b/i)
    }
    if (!orderIdMatch) {
      // Try finding alphanumeric starting with 6 digits, NOT ending with tracking suffix
      // Match pattern like 251113M2SQ0GTF but NOT 05826637837B (which is part of SPXMY tracking)
      orderIdMatch = text.match(/\b((?:25|24|23)\d{4}[A-Z0-9]{6,9})\b/i)
    }
    if (!orderIdMatch) {
      // Try 15-digit numeric only (old format) - not starting with 0
      orderIdMatch = text.match(/(?:Order ID[:\s]*)?\b([1-9]\d{14})\b/)
    }

    if (orderIdMatch) {
      let orderId = orderIdMatch[1].replace(/\s/g, '')
      // Additional validation to avoid tracking numbers
      // Order IDs should be 13-15 chars, tracking suffixes are usually shorter
      if (orderId.length >= 10 &&
          !orderId.match(/^0\d+[A-Z]$/) &&
          !orderId.startsWith('SPXMY') &&
          !text.match(new RegExp(`SPXMY.*${orderId}`))) {
        data.orderId = orderId
        console.log('✅ Order ID found:', data.orderId)
      } else {
        data.orderId = 'N/A'
        console.log('❌ Order ID appears to be tracking suffix, ignored:', orderId)
      }
    } else {
      data.orderId = 'N/A'
      console.log('❌ Order ID not found')
    }

    // Extract Date - handle different formats
    let dateMatch = text.match(/(\d{2})-(\d{2})-(\d{4})/) // DD-MM-YYYY
    if (dateMatch) {
      data.tarikh = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
      data.masa = '00:00'
    } else {
      dateMatch = text.match(/(\d{2})\.(\d{2})\.(\d{4})/) // DD.MM.YYYY
      if (dateMatch) {
        data.tarikh = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
        data.masa = '00:00'
      } else {
        dateMatch = text.match(/Ship By Date[:\s]*(\d{2})-(\d{2})-(\d{4})/i)
        if (dateMatch) {
          data.tarikh = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
          data.masa = '00:00'
        } else {
          // Default to current date
          const today = new Date()
          data.tarikh = today.toISOString().split('T')[0]
          data.masa = '00:00'
        }
      }
    }

    // Extract Tracking
    const trackingMatch = text.match(/SPXMY\d+/i)
    if (trackingMatch) data.tracking = trackingMatch[0]

    // Extract Courier
    if (text.toLowerCase().includes('spx express') || text.toLowerCase().includes('shopee express')) {
      data.courier = 'SPX Express'
    } else if (text.toLowerCase().includes('j&t')) {
      data.courier = 'J&T Express'
    } else if (text.toLowerCase().includes('standard')) {
      data.courier = 'Shopee Standard'
    } else {
      data.courier = 'Shopee Logistics'
    }

    // Extract Customer Name from "Recipient Details" or scattered text
    // Pattern 1: Look for "Name:" after "Recipient Details"
    let nameMatch = text.match(/Recipient Details[^]*?Name[:\s]+([A-Za-z][A-Za-z\s]{1,50}?)(?=\s+Address[:\s]|Postcode[:\s]|\d{5})/i)

    if (!nameMatch) {
      // Pattern 2: For addresses like "Kuarters Warden, Asrama Smk Kuala Krai" - extract first part as name if it looks like a person
      nameMatch = text.match(/Buyer Details\s*\(FWD\)[^\n]*?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),/i)
    }

    if (!nameMatch) {
      // Pattern 3: Look for capitalized name before "Address:" or postcode
      nameMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s+(?:Address|No\.\s*\d+|\d{5})/i)
    }

    if (!nameMatch) {
      // Pattern 4: Generic Name: label
      nameMatch = text.match(/Name[:\s]+([A-Za-z][A-Za-z\s]{2,30})(?=\s+Address|Order ID|\d{5})/i)
    }

    if (nameMatch) {
      data.customerName = nameMatch[1].trim()
      console.log('✅ Customer Name found:', data.customerName)
    } else {
      // For institutional/organization addresses, use first part as "name"
      const buyerDetails = text.match(/Buyer Details\s*\(FWD\)[^\n]*?\s+([^,]+),/i)
      if (buyerDetails) {
        data.customerName = buyerDetails[1].trim()
        console.log('✅ Using institutional name:', data.customerName)
      } else {
        data.customerName = 'N/A'
        console.log('❌ Customer Name not found')
      }
    }

    // Extract Phone - look for Malaysian phone numbers
    const phoneMatch = text.match(/(?:Phone|Tel|Telefon|HP)[:\s]*([+]?60\d{9,10})|([+]?60\d{9,10})/i)
    if (phoneMatch) {
      data.customerPhone = (phoneMatch[1] || phoneMatch[2]).replace(/\s/g, '')
      console.log('✅ Phone found:', data.customerPhone)
    } else {
      data.customerPhone = 'N/A'
      console.log('❌ Phone not found')
    }

    // Extract Address from "Recipient Details" or "Buyer Details" section or scattered text
    // Enhanced for fragmented format like TAMAN SENTOSA + No.42 JALAN SENTOSA 4, TAMAN SENTOSA, Kupang, Baling, Kedah

    let addressParts: string[] = []

    // Pattern 1: From "Buyer Details (FWD)" - extract the full address text
    let addressMatch = text.match(/Buyer Details\s*\(FWD\)[^\n]*?\s+([^,]+,\s*[^,]+,\s*\d{5},\s*[^,]+,\s*[^,]+)/i)
    if (addressMatch) addressParts.push(addressMatch[1])

    if (!addressMatch) {
      // Pattern 2: Alternative Buyer Details pattern - extract everything after "Buyer Details (FWD)"
      addressMatch = text.match(/Buyer Details\s*\(FWD\)[^\n]*?\s+([^,]+[^]*?)(?=\s*(?:NDD|N\s*D\s*D|SPXMY|Enjoy|HVI))/is)
      if (addressMatch) addressParts.push(addressMatch[1])
    }

    if (!addressMatch) {
      // Pattern 3: From Recipient Details
      addressMatch = text.match(/Recipient Details[^]*?Address[:\s]+(.+?)(?=\s*Postcode[:\s]*\d{5}|Enjoy|Scan)/is)
      if (addressMatch) addressParts.push(addressMatch[1])
    }

    // Pattern 4: Extract TAMAN/KAMPUNG/LOT location names (fragmented format)
    const locationMatches = text.match(/\b(TAMAN|KAMPUNG|LOT|PT)\s+[A-Z\s]+/gi)
    if (locationMatches) {
      locationMatches.forEach(loc => {
        const cleanLoc = loc.trim()
        if (cleanLoc.length > 3 && !addressParts.includes(cleanLoc)) {
          addressParts.push(cleanLoc)
        }
      })
    }

    // Pattern 5: Extract street addresses with "No." format
    const streetMatches = text.match(/No\.?\s*\d+[^,\n]*JALAN[^,\n]*/gi)
    if (streetMatches) {
      streetMatches.forEach(street => {
        const cleanStreet = street.trim()
        if (cleanStreet.length > 5 && !addressParts.includes(cleanStreet)) {
          addressParts.push(cleanStreet)
        }
      })
    }

    // Pattern 6: Extract city/state combinations (like "Kupang, Baling, Kedah")
    const cityMatches = text.match(/[A-Z][a-z]+(?:,\s*[A-Z][a-z]+){1,2}/gi)
    if (cityMatches) {
      cityMatches.forEach(city => {
        const cleanCity = city.trim()
        if (!cleanCity.includes('Order') && !cleanCity.includes('Shopee') && !addressParts.includes(cleanCity)) {
          addressParts.push(cleanCity)
        }
      })
    }

    // Pattern 7: Malaysian address with "No." format (fallback)
    if (addressParts.length === 0) {
      addressMatch = text.match(/\b(No\.\s*\d+,?\s+[^,]+,\s+[^,]+,\s+[^,]+,\s+[A-Z][a-z]+)\b/i)
      if (addressMatch) addressParts.push(addressMatch[1])
    }

    // Pattern 8: Address: label pattern (fallback)
    if (addressParts.length === 0) {
      addressMatch = text.match(/Address[:\s]+(.+?)(?=\s*Postcode[:\s]*\d{5})/is)
      if (addressMatch) addressParts.push(addressMatch[1])
    }

    // Pattern 9: Between Buyer/Seller Details and tracking (fallback)
    if (addressParts.length === 0) {
      addressMatch = text.match(/(?:Buyer Details|Seller Details)[^]*?(No\.\s*\d+[^]*?)(?=SPXMY|Enjoy|Postcode)/is)
      if (addressMatch) addressParts.push(addressMatch[1])
    }

    // Pattern 10: Relaxed - text after Address: (fallback)
    if (addressParts.length === 0) {
      addressMatch = text.match(/Address[:\s]+([^\n]{10,200})/is)
      if (addressMatch) addressParts.push(addressMatch[1])
    }

    // Process address parts if we found any
    if (addressParts.length > 0) {
      // Filter and clean address parts
      const filteredParts = addressParts.filter(part =>
        part &&
        part.length > 2 &&
        !part.includes('Recipient') &&
        !part.includes('Sender') &&
        !part.includes('Order ID') &&
        !part.includes('SPXMY') &&
        !part.includes('Shopee') &&
        !part.includes('Standard') &&
        !part.includes('Express') &&
        !part.includes('Enjoy') &&
        !part.includes('items!')
      )

      // If we have individual address parts, combine them
      if (filteredParts.length > 1) {
        // Clean each part
        const cleanedParts = filteredParts.map(part =>
          part
            .replace(/Name[:\s]+[A-Za-z\s]+/gi, '') // Remove any "Name:" labels
            .replace(/Order ID[:\s]+[A-Z0-9]+/gi, '') // Remove Order ID if mixed in
            .replace(/Postcode[:\s]+\d{5}/gi, '') // Remove Postcode label
            .replace(/SPXMY\d+[A-Z]?/gi, '') // Remove tracking numbers
            .replace(/Enjoy.*?items!/gi, '') // Remove promo text
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        ).filter(part => part.length > 2)

        // Remove duplicates and join
        const uniqueParts = [...new Set(cleanedParts)]
        data.customerAddress = uniqueParts.join(', ')
        console.log('✅ Address assembled from parts:', data.customerAddress)
      } else {
        // Single address part
        let addr = filteredParts[0]
          .replace(/Name[:\s]+[A-Za-z\s]+/gi, '') // Remove any "Name:" labels
          .replace(/Order ID[:\s]+[A-Z0-9]+/gi, '') // Remove Order ID if mixed in
          .replace(/Postcode[:\s]+\d{5}/gi, '') // Remove Postcode label
          .replace(/SPXMY\d+[A-Z]?/gi, '') // Remove tracking numbers
          .replace(/Enjoy.*?items!/gi, '') // Remove promo text
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        // Clean up if address starts with labels
        addr = addr.replace(/^(Name|Order ID|Postcode|Address)[:\s]+/i, '')
        // Remove trailing unwanted text
        addr = addr.replace(/\s*(Postcode|Enjoy|Scan|Track|powered|delivery).*$/i, '')

        // Only accept if address is reasonable length
        if (addr.length >= 10 && addr.length <= 300) {
          data.customerAddress = addr
          console.log('✅ Address found:', data.customerAddress)
        } else {
          data.customerAddress = 'Address too short or invalid'
          console.log('❌ Address invalid length:', addr.length, 'chars')
        }
      }
    } else {
      // Fallback: Try to extract from the full text using a more relaxed pattern
      console.log('📄 Trying fallback address extraction...')
      const fallbackMatch = text.match(/Buyer Details[^]*?([A-Za-z][^,]*,\s*[^,]*,\s*\d{5}[^]*?)(?=\s*NDD|\s*SPXMY|\s*Enjoy|\s*HVI)/i)

      if (fallbackMatch) {
        let fallbackAddr = fallbackMatch[1]
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        data.customerAddress = fallbackAddr
        console.log('✅ Fallback address found:', data.customerAddress)
      } else {
        data.customerAddress = 'Address not found'
        console.log('❌ Address not found even with fallback')
        console.log('📄 Text sample for debug:', text.substring(0, 800))
      }
    }

    // Extract Postcode - look for "Postcode: 71700" or just 5 digits near address
    const postcodeMatch = text.match(/Postcode[:\s]*(\d{5})/i)
    if (postcodeMatch) {
      const postcode = postcodeMatch[1]
      // Add postcode to address if not already included
      if (!data.customerAddress.includes(postcode)) {
        data.customerAddress += `, ${postcode}`
      }
      console.log('✅ Postcode found:', postcode)
    } else {
      console.log('❌ Postcode not found')
    }

    // Product Name - may not be in Shopee AWB
    data.productName = 'Shopee Order'

    // SKU
    data.sku = 'N/A'

    // Quantity
    const qtyMatch = text.match(/Qty[:\s]*(\d+)/i)
    if (qtyMatch) data.quantity = parseInt(qtyMatch[1])
    else data.quantity = 1

    // Weight
    const weightMatch = text.match(/Weight[:\s]*\(kg\)[:\s]*([0-9.]+)/i)
    if (weightMatch) {
      data.weight = weightMatch[1] + ' kg'
    }

    // COD & Status
    data.cod = '0 MYR'
    data.status = 'CASHLESS'

    // Seller
    data.seller = 'Shopee Seller'

    console.log('✅ Shopee data parsed:', data)

    return data
  } catch (error) {
    console.error('Error parsing Shopee AWB:', error)
    return null
  }
}
