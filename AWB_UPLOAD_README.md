# AWB Upload Feature

## 📦 Apa itu AWB Upload?

Feature untuk auto-extract data order dari AWB (Air Waybill) PDF yang didownload dari:
- TikTok Shop
- Shopee
- Lazada (coming soon)

## ✨ Features

- ✅ Upload single atau multiple PDF files
- ✅ Auto-extract order data dari PDF
- ✅ Preview extracted data sebelum save
- ✅ Bulk upload untuk process banyak orders sekaligus
- ✅ Integration dengan existing orders system

## 🎯 Data yang Di-Extract

Dari setiap AWB PDF, system akan auto-extract:

### Order Information
- Order ID
- Platform (TikTok Shop / Shopee)
- Tarikh & Masa order
- Tracking number
- Courier info
- Status (COD / Cashless)

### Customer Information
- Nama customer
- Phone number
- Alamat penuh

### Product Information
- Nama produk
- SKU
- Quantity
- Seller info

## 🚀 Cara Guna

### 1. Akses AWB Upload Page
- Login ke dashboard
- Click "AWB Upload" card di Quick Actions
- Atau navigate ke `/awb-upload`

### 2. Upload PDF Files
- Click area upload atau drag & drop PDF files
- Boleh upload multiple files sekaligus
- System akan auto-process semua PDFs

### 3. Review Extracted Data
- System akan display semua extracted orders
- Review untuk ensure data betul
- Edit if necessary (coming soon)

### 4. Save to Database
- Click "Save All to Database"
- Data akan masuk ke Orders collection
- Boleh track dalam Orders page

## 📝 Current Implementation

### Version 1.0 (Basic)
Current implementation menggunakan **mock data** untuk demonstration.

**What works:**
- ✅ Upload UI
- ✅ File validation
- ✅ Display extracted data
- ✅ Preview interface

**What needs production setup:**
- ⏳ Actual PDF parsing (requires server-side processing)
- ⏳ Save to Firebase Firestore
- ⏳ Edit extracted data
- ⏳ Duplicate detection

## 🔧 Production Setup Required

Untuk production, perlu implement:

### 1. Install PDF Parser Library
```bash
npm install pdf-parse
```

### 2. Create API Route for PDF Processing
```typescript
// src/app/api/parse-awb/route.ts
import PDFParser from 'pdf-parse'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('pdf')

  // Parse PDF
  const data = await PDFParser(fileBuffer)
  const extractedData = parseAWBText(data.text)

  return Response.json(extractedData)
}
```

### 3. Update Frontend to Use API
```typescript
// Call API instead of mock
const response = await fetch('/api/parse-awb', {
  method: 'POST',
  body: formData
})
const extractedData = await response.json()
```

### 4. Implement Save to Firestore
```typescript
import { addDoc, collection } from 'firebase/firestore'

async function saveOrder(orderData) {
  await addDoc(collection(db, 'orders'), {
    ...orderData,
    createdAt: new Date(),
    source: 'AWB Upload'
  })
}
```

## 🎨 UI Components

### Upload Area
- Drag & drop zone
- File type validation
- Progress indicator
- Error handling

### Extracted Orders Display
- Card-based layout
- Color-coded by platform
- All essential info visible
- Easy to scan

### Actions
- Save all orders
- Individual order actions (edit/delete - coming soon)
- Export to Excel (coming soon)

## 🔐 Security Considerations

### File Upload Security
- Validate file type (.pdf only)
- File size limit (recommended: 10MB)
- Sanitize extracted data
- Rate limiting on API

### Data Privacy
- Customer data should be encrypted
- Implement proper access control
- Log all data access
- GDPR compliance for international customers

## 📊 Future Enhancements

### Phase 2
- [ ] Real PDF parsing implementation
- [ ] Save to Firestore
- [ ] Edit extracted data
- [ ] Duplicate detection
- [ ] OCR for scanned PDFs

### Phase 3
- [ ] Shopee AWB support
- [ ] Lazada AWB support
- [ ] Bulk edit
- [ ] Export functionality
- [ ] Email notifications

### Phase 4
- [ ] API integration with platforms
- [ ] Auto-download AWBs
- [ ] Scheduled imports
- [ ] Advanced filtering
- [ ] Analytics dashboard

## 🐛 Known Limitations

1. **Mock Data**: Currently using sample data for demo
2. **No Actual PDF Parsing**: Needs server-side implementation
3. **No Save Function**: Database integration pending
4. **TikTok Shop Only**: Other platforms patterns not yet implemented

## 💡 Tips

1. **Organize PDFs**: Rename files dengan format: `[Platform]_[OrderID]_[Date].pdf`
2. **Batch Processing**: Upload multiple PDFs together untuk save time
3. **Verify Data**: Always review extracted data before saving
4. **Backup**: Keep original PDFs as backup

## 🆘 Troubleshooting

### Upload Not Working
- Check file type is .pdf
- Check file size < 10MB
- Check internet connection

### Data Not Extracted
- Ensure PDF is from supported platform
- Check PDF is not password protected
- Verify PDF is text-based (not scanned image)

### Data Incorrect
- Different AWB format may need pattern updates
- Report issues with sample PDF for improvement

## 📞 Support

Untuk issues atau suggestions:
1. Check this README first
2. Contact development team
3. Submit feature requests

---

**Last Updated**: 2025-10-30
**Version**: 1.0.0 (Basic Implementation)
