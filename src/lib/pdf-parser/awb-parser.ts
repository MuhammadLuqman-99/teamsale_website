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
 * Extracts text using pdfjs on client side, then sends to API for parsing
 */
export async function extractAWBData(pdfBase64: string): Promise<AWBData | null> {
  try {
    // Extract text from PDF using pdfjs (already loaded in ecommerce page)
    const pdfText = await extractTextFromPDF(pdfBase64)

    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error('Tidak dapat extract text dari PDF')
    }

    // Call API route to parse the extracted text
    const response = await fetch('/api/parse-awb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdfBase64, pdfText }),
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

/**
 * Extract text from PDF using pdfjs
 */
async function extractTextFromPDF(pdfBase64: string): Promise<string> {
  try {
    // Check if pdfjs is loaded
    if (typeof window === 'undefined' || !(window as any).pdfjsLib) {
      throw new Error('PDF.js library not loaded')
    }

    const pdfjsLib = (window as any).pdfjsLib

    // Convert base64 to array buffer
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '')
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Load PDF
    const loadingTask = pdfjsLib.getDocument({ data: bytes })
    const pdf = await loadingTask.promise

    // Extract text from all pages
    let fullText = ''
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += pageText + '\n'
    }

    return fullText
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw error
  }
}

