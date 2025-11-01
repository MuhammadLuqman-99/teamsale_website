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
 * Sends PDF to API route for server-side processing with pdf-parse
 */
export async function extractAWBData(pdfBase64: string): Promise<AWBData | null> {
  try {
    // Call API route to parse PDF on server side
    const response = await fetch('/api/parse-awb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdfBase64 }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to parse PDF')
    }

    const result = await response.json()
    return result.data as AWBData
  } catch (error: any) {
    console.error('Error parsing AWB PDF:', error)
    throw new Error(error.message || 'Failed to extract data from PDF')
  }
}

