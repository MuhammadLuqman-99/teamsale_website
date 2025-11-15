import { OrderData } from './firestore'

// Enhanced export functions
export const exportToExcel = (orders: OrderData[], filename?: string) => {
  const headers = [
    'Tarikh',
    'Customer Name',
    'PO/Invoice',
    'Team Sale',
    'Phone',
    'Product Details',
    'SKU',
    'Total (RM)',
    'Platform',
    'Tracking Number',
    'Payment Method',
    'Shipping Address',
    'Quantity',
    'Unit Price (RM)'
  ]

  const csvData = orders.map(order => [
    order.tarikh || '',
    order.nama_customer || '',
    order.nombor_po_invoice || '',
    order.team_sale || '',
    order.nombor_phone || '',
    order.jenis_order || '',
    order.code_kain || '',
    order.total_rm || 0,
    order.platform || '',
    order.tracking_number || '',
    order.payment_method || '',
    order.alamat_penghantaran || '',
    order.quantity || '',
    order.unit_price || ''
  ])

  const csvContent = [
    headers.join(','),
    ...csvData.map(row =>
      row.map(cell => {
        // Handle cells with commas by wrapping in quotes
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"` // Escape quotes
        }
        return cell
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `orders_export_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export const exportToPDF = async (orders: OrderData[], filename?: string) => {
  try {
    // Dynamic import of jspdf for PDF export
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    // Add custom font support for Malay characters
    doc.setFont('helvetica')

    // Title
    doc.setFontSize(16)
    doc.text('Orders Report', 20, 20)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString('ms-MY')}`, 20, 30)

    // Table headers
    const headers = [
      'Date',
      'Customer',
      'Invoice',
      'Team',
      'Platform',
      'Total'
    ]

    let yPosition = 50
    const cellWidth = 30
    const startX = 20

    // Draw headers
    headers.forEach((header, index) => {
      doc.text(header, startX + (index * cellWidth), yPosition)
    })

    yPosition += 10
    doc.line(startX, yPosition, 200, yPosition) // Underline headers
    yPosition += 7

    // Table data
    doc.setFontSize(8)
    orders.forEach((order, index) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }

      const row = [
        order.tarikh || '',
        (order.nama_customer || '').substring(0, 15), // Truncate long names
        order.nombor_po_invoice || '',
        order.team_sale || '',
        order.platform || '',
        `RM${order.total_rm?.toFixed(2) || '0.00'}`
      ]

      row.forEach((cell, cellIndex) => {
        doc.text(cell, startX + (cellIndex * cellWidth), yPosition)
      })

      yPosition += 7
    })

    // Save the PDF
    doc.save(filename || `orders_export_${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    // Fallback to CSV export
    exportToExcel(orders, filename?.replace('.pdf', '.csv'))
    alert('PDF export failed. CSV export downloaded instead.')
  }
}

export const exportFilteredData = (orders: OrderData[], filters: any, filename?: string) => {
  const filterInfo = Object.entries(filters)
    .filter(([_, value]) => value !== '' && value !== 'all')
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')

  const baseFilename = filename || `filtered_orders_${new Date().toISOString().split('T')[0]}`
  const finalFilename = filterInfo ? `${baseFilename}_(${filterInfo.replace(/[:\s,]/g, '_')})` : baseFilename

  exportToExcel(orders, finalFilename)
}

// Date range export utility
export const exportDateRange = (orders: OrderData[], startDate: string, endDate: string, filename?: string) => {
  const filteredOrders = orders.filter(order => {
    if (!order.tarikh) return false
    return order.tarikh >= startDate && order.tarikh <= endDate
  })

  const dateRange = `${startDate}_to_${endDate}`
  const baseFilename = filename || `orders_${dateRange}`
  exportToExcel(filteredOrders, baseFilename)
}

// Export by team
export const exportByTeam = (orders: OrderData[], teamName: string, filename?: string) => {
  const teamOrders = orders.filter(order =>
    order.team_sale?.toLowerCase() === teamName.toLowerCase()
  )

  const teamFilename = filename || `${teamName}_orders_${new Date().toISOString().split('T')[0]}`
  exportToExcel(teamOrders, teamFilename)
}

// Export by platform
export const exportByPlatform = (orders: OrderData[], platform: string, filename?: string) => {
  const platformOrders = orders.filter(order =>
    order.platform?.toLowerCase() === platform.toLowerCase()
  )

  const platformFilename = filename || `${platform}_orders_${new Date().toISOString().split('T')[0]}`
  exportToExcel(platformOrders, platformFilename)
}