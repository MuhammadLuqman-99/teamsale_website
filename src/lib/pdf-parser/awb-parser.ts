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
    if (typeof window === 'undefined') {
      throw new Error('Running on server side - PDF extraction must be done on client')
    }

    const pdfjsLib = (window as any).pdfjsLib
    if (!pdfjsLib) {
      console.error('❌ PDF.js not loaded. Checking global scope...')
      console.log('Window object keys:', Object.keys(window).filter(k => k.includes('pdf')))
      throw new Error('PDF.js library not loaded. Pastikan library loaded di page.')
    }

    console.log('📚 PDF.js version:', pdfjsLib.version)
    console.log('📚 PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc)

    // Validate base64 input
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      throw new Error('Invalid PDF data - base64 string expected')
    }

    // Convert base64 to array buffer
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '')
    console.log('🔍 Base64 data length:', base64Data.length)

    let binaryString: string
    try {
      binaryString = atob(base64Data)
    } catch (base64Error) {
      console.error('❌ Base64 decode error:', base64Error)
      throw new Error('Invalid base64 data - cannot decode')
    }

    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    console.log('📄 PDF size:', bytes.length, 'bytes')

    // Validate PDF data - check for PDF signature
    if (bytes.length < 4 || bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
      console.warn('⚠️ PDF signature not found - may not be a valid PDF')
      // Don't throw error yet, try to process anyway
    }

    // Load PDF with more error handling
    let pdf: any
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: bytes,
        // Disable password handling for now
        password: undefined
      })

      // Add progress listener
      loadingTask.onProgress = (progress: any) => {
        console.log(`📖 Loading PDF: ${Math.round(progress.loaded / progress.total * 100)}%`)
      }

      pdf = await loadingTask.promise
    } catch (pdfLoadError) {
      console.error('❌ PDF loading error:', pdfLoadError)
      throw new Error(`Failed to load PDF: ${pdfLoadError.message || 'Invalid PDF format'}`)
    }

    console.log('📑 PDF loaded successfully. Pages:', pdf.numPages)

    if (pdf.numPages === 0) {
      throw new Error('PDF has no pages')
    }

    // Extract text from all pages with better error handling
    let fullText = ''
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        console.log(`📖 Processing page ${pageNum}/${pdf.numPages}...`)
        const page = await pdf.getPage(pageNum)

        console.log(`📐 Page ${pageNum} size: ${page.view[2]} x ${page.view[3]}`)

        const textContent = await page.getTextContent()
        console.log(`📝 Page ${pageNum} text items:`, textContent.items.length)

        if (textContent.items.length === 0) {
          console.warn(`⚠️ Page ${pageNum} has no extractable text`)
        }

        const pageText = textContent.items.map((item: any) => {
          return item.str || ''
        }).join(' ')

        fullText += pageText + '\n'
        console.log(`📝 Page ${pageNum} text length:`, pageText.length)

        if (pageText.length > 0) {
          console.log(`📄 Page ${pageNum} preview:`, pageText.substring(0, 150))
        }
      } catch (pageError) {
        console.error(`❌ Error processing page ${pageNum}:`, pageError)
        // Continue with other pages
        continue
      }
    }

    console.log('✅ Total extracted text length:', fullText.length)

    if (fullText.length === 0) {
      console.warn('⚠️ No text extracted from PDF - may be image-based PDF')
      throw new Error('No extractable text found in PDF - may be a scanned/image PDF')
    }

    console.log('📄 Full text preview (first 500 chars):', fullText.substring(0, 500))

    return fullText
  } catch (error) {
    console.error('❌ Error extracting text from PDF:', error)
    throw error
  }
}

