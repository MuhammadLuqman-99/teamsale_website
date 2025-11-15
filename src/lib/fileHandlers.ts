import { addOrder, OrderData } from './firestore';
import { Timestamp } from 'firebase/firestore';

// PDF.js types
declare const pdfjsLib: any;

// Types for parsed data
interface ParsedProduct {
  sku: string;
  product_name: string;
  base_name: string;
  size: string;
  quantity: number;
  price: number;
  type: string;
}

interface StructuredProduct {
  name: string;
  sku: string;
  totalQty: number;
  type: string;
  products: ParsedProduct[];
  sizeBreakdown: Array<{ size: string; quantity: number }>;
  sizesObject: { [key: string]: number };
}

// Detect CSV source
export function detectCSVSource(csvText: string): string {
  const headers = csvText.split('\n')[0].toLowerCase();

  if (headers.includes('recipient') && headers.includes('order id')) {
    return 'shopee';
  } else if (headers.includes('buyer name') && headers.includes('order number')) {
    return 'tiktok';
  } else if (headers.includes('tarikh') && headers.includes('code_kain')) {
    return 'manual';
  }

  return 'unknown';
}

// Parse CSV file
export function parseCSV(csvText: string, source: string): OrderData[] {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const dataRows = lines.slice(1);
  const orders: OrderData[] = [];

  dataRows.forEach(row => {
    const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length !== headers.length) return;

    const rawData: { [key: string]: string } = {};
    headers.forEach((header, index) => {
      rawData[header] = values[index];
    });

    let order: Partial<OrderData> = {};
    let isValid = true;

    switch (source) {
      case 'shopee':
        order = {
          nama_customer: rawData['Recipient'],
          total_rm: parseFloat(rawData['Order Amount']) || 0,
          jenis_order: rawData['Product Name'],
          nombor_po_invoice: rawData['Order ID'],
          code_kain: rawData['Seller SKU'],
          nombor_phone: rawData['Phone'] || '',
          team_sale: 'Shopee',
          platform: 'Shopee'
        };

        // Extract additional Shopee data
        if (rawData['Created Time']) {
          const [datePart] = rawData['Created Time'].split(' ');
          const [day, month, year] = datePart.split('/');
          order.tarikh = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // Add shipping address if available
        if (rawData['Full Address'] || rawData['Recipient Address']) {
          order.alamat_penghantaran = rawData['Full Address'] || rawData['Recipient Address'];
        }

        // Add tracking number if available
        if (rawData['Tracking Number'] || rawData['Tracking No.']) {
          order.tracking_number = rawData['Tracking Number'] || rawData['Tracking No.'];
        }

        // Add payment method
        if (rawData['Payment Method']) {
          order.payment_method = rawData['Payment Method'];
        }

        // Add shipping option
        if (rawData['Shipping Option']) {
          order.shipping_option = rawData['Shipping Option'];
        }
        break;

      case 'tiktok':
        order = {
          nama_customer: rawData['Buyer Name'],
          total_rm: parseFloat(rawData['Total Price']) || 0,
          jenis_order: rawData['Product Name'],
          nombor_po_invoice: rawData['Order Number'],
          code_kain: rawData['SKU'],
          nombor_phone: rawData['Phone Number'] || '',
          team_sale: 'Tiktok',
          platform: 'Tiktok'
        };

        // Extract additional TikTok data
        if (rawData['Created At']) {
          order.tarikh = new Date(rawData['Created At']).toISOString().split('T')[0];
        }

        // Add shipping address if available
        if (rawData['Shipping Address'] || rawData['Full Address'] || rawData['Receiver Address']) {
          order.alamat_penghantaran = rawData['Shipping Address'] || rawData['Full Address'] || rawData['Receiver Address'];
        }

        // Add tracking number if available
        if (rawData['Tracking Number'] || rawData['Tracking ID']) {
          order.tracking_number = rawData['Tracking Number'] || rawData['Tracking ID'];
        }

        // Add payment method
        if (rawData['Payment Method'] || rawData['Payment Type']) {
          order.payment_method = rawData['Payment Method'] || rawData['Payment Type'];
        }

        // Add quantity if available
        if (rawData['Quantity'] || rawData['Qty']) {
          order.quantity = parseInt(rawData['Quantity'] || rawData['Qty']) || 1;
        }

        // Add unit price if available
        if (rawData['Unit Price'] || rawData['Price Per Item']) {
          order.unit_price = parseFloat(rawData['Unit Price'] || rawData['Price Per Item']) || 0;
        }
        break;

      case 'manual':
        order = {
          tarikh: rawData['tarikh'],
          code_kain: rawData['code_kain'],
          nombor_po_invoice: rawData['nombor_po_invoice'],
          nama_customer: rawData['nama_customer'],
          team_sale: rawData['team_sale'],
          nombor_phone: rawData['nombor_phone'] || '',
          jenis_order: rawData['jenis_order'],
          total_rm: parseFloat(rawData['total_rm']) || 0,
          platform: rawData['platform']
        };
        break;

      default:
        isValid = false;
    }

    if (isValid && order.nombor_po_invoice) {
      order.tarikh = order.tarikh || new Date().toISOString().split('T')[0];
      order.source = `csv_${source}`;
      orders.push(order as OrderData);
    }
  });

  return orders;
}

// Parse PDF Invoice (simplified version - full implementation would need PDF.js loaded)
export async function parsePDFInvoice(file: File): Promise<OrderData[]> {
  // Check if PDF.js is loaded
  if (typeof pdfjsLib === 'undefined') {
    throw new Error('PDF.js library not loaded. Please refresh the page and try again.');
  }

  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = '';

        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + ' ';
        }

        if (fullText.trim().length < 10) {
          throw new Error('PDF ini mungkin adalah scan/gambar. Sila gunakan PDF yang mengandungi teks yang boleh dipilih.');
        }

        // Extract data using regex
        const invoiceRegex = /Invoice:\s*#(Inv-[\d-]+)/i;
        const dateRegex = /(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}/;
        const customerRegex = /BILLING ADDRESS:\s*([^\n\r]+?)(?:\s+Jabatan|\s+[A-Z]{2,}|\s*$)/i;
        const contactRegex = /Contact no:\s*([\d-]+)/i;
        const totalPaidRegex = /Total Paid:\s*RM\s*([\d,]+\.?\d*)/i;
        const customerNoteRegex = /Customer Note:\s*\*(\w+)/i;

        const invoiceMatch = fullText.match(invoiceRegex);
        const dateMatch = fullText.match(dateRegex);
        const customerMatch = fullText.match(customerRegex);
        const contactMatch = fullText.match(contactRegex);
        const totalPaidMatch = fullText.match(totalPaidRegex);
        const customerNoteMatch = fullText.match(customerNoteRegex);

        if (!invoiceMatch || !totalPaidMatch) {
          throw new Error('Nombor invoice atau total amount tidak ditemui. Pastikan PDF adalah invoice dari Desa Murni Batik.');
        }

        // Parse products
        const products = parseProductsFromText(fullText);

        // Format date
        let formattedDate = new Date().toISOString().split('T')[0];
        if (dateMatch) {
          const [day, month, year] = dateMatch[1].split('/');
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // Create structured products
        const structuredProducts = createFirestoreCompatibleProducts(products);
        const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
        const uniqueSizes = extractUniqueSizes(products);

        const order: OrderData = {
          nombor_po_invoice: invoiceMatch[1].trim(),
          tarikh: formattedDate,
          nama_customer: customerMatch ? customerMatch[1].trim() : 'Customer dari PDF',
          team_sale: customerNoteMatch ? customerNoteMatch[1].trim() : 'Manual',
          nombor_phone: contactMatch ? contactMatch[1].trim() : '',
          total_rm: parseFloat(totalPaidMatch[1].replace(/,/g, '')),
          platform: 'Website Desa Murni',
          jenis_order: getDominantProductName(structuredProducts),
          code_kain: getDominantSKU(structuredProducts),
          products: products,
          structuredProducts: structuredProducts,
          totalQuantity: totalQuantity,
          source: 'pdf_desa_murni_enhanced'
        };

        resolve([order]);

      } catch (err: any) {
        reject(new Error(`Gagal memproses PDF: ${err.message}`));
      }
    };

    fileReader.onerror = () => {
      reject(new Error('Gagal membaca fail PDF. Pastikan fail tidak rosak.'));
    };

    fileReader.readAsArrayBuffer(file);
  });
}

// Helper functions
function parseProductsFromText(text: string): ParsedProduct[] {
  const products: ParsedProduct[] = [];

  // Enhanced regex for product lines
  const productLineRegex = /(BZ[LP]\d{2}[A-Z]{2})\s+(.+?)\s*-\s*\(Size:\s*([^)]+)\)\s+(\d+)\s+RM\s*([\d,]+\.?\d*)/g;

  let match;
  while ((match = productLineRegex.exec(text)) !== null) {
    const [, sku, productName, size, quantity, price] = match;

    products.push({
      sku: sku.trim(),
      product_name: `${productName.trim()} - (Size: ${size.trim()})`,
      base_name: productName.trim(),
      size: size.trim(),
      quantity: parseInt(quantity),
      price: parseFloat(price.replace(/,/g, '')),
      type: sku.includes('BZP') ? 'Pre-Order' : 'Ready Stock'
    });
  }

  return products;
}

function createFirestoreCompatibleProducts(products: ParsedProduct[]): StructuredProduct[] {
  const productGroups: { [key: string]: any } = {};

  products.forEach(product => {
    const baseName = product.base_name || product.product_name;

    if (!productGroups[baseName]) {
      productGroups[baseName] = {
        name: baseName,
        sku: product.sku,
        totalQty: 0,
        sizes: {},
        type: product.type,
        products: []
      };
    }

    const group = productGroups[baseName];
    group.totalQty += product.quantity;
    group.products.push(product);

    if (group.sizes[product.size]) {
      group.sizes[product.size] += product.quantity;
    } else {
      group.sizes[product.size] = product.quantity;
    }
  });

  return Object.values(productGroups).map(group => ({
    name: group.name,
    sku: group.sku,
    totalQty: group.totalQty,
    type: group.type,
    products: group.products,
    sizeBreakdown: Object.entries(group.sizes)
      .map(([size, qty]) => ({ size, quantity: qty as number }))
      .sort((a, b) => sortSizes(a.size, b.size)),
    sizesObject: group.sizes
  }));
}

function extractUniqueSizes(products: ParsedProduct[]): string[] {
  const sizes = new Set<string>();
  products.forEach(product => {
    if (product.size && product.size !== 'Unknown') {
      sizes.add(product.size);
    }
  });

  return Array.from(sizes).sort(sortSizes);
}

function sortSizes(a: string, b: string): number {
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  const indexA = sizeOrder.indexOf(a);
  const indexB = sizeOrder.indexOf(b);

  if (indexA !== -1 && indexB !== -1) {
    return indexA - indexB;
  }

  return a.localeCompare(b);
}

function getDominantProductName(structuredProducts: StructuredProduct[]): string {
  if (structuredProducts.length === 0) return 'Mixed Products';

  const dominant = structuredProducts.reduce((max, current) =>
    current.totalQty > max.totalQty ? current : max
  );

  return dominant.name;
}

function getDominantSKU(structuredProducts: StructuredProduct[]): string {
  if (structuredProducts.length === 0) return 'MIXED';

  const dominant = structuredProducts.reduce((max, current) =>
    current.totalQty > max.totalQty ? current : max
  );

  return dominant.sku;
}

// Save orders to Firebase (with upsert logic - update if exists, create if not)
export async function saveOrdersToFirebase(orders: OrderData[]): Promise<{
  successCount: number;
  errorCount: number;
  createdCount: number;
  updatedCount: number;
}> {
  // Use upsertOrders for bulk operation
  const { upsertOrders } = await import('./firestore');
  const result = await upsertOrders(orders);

  const createdCount = result.createdCount;
  const updatedCount = result.updatedCount;
  const errorCount = result.errorCount;
  const successCount = createdCount + updatedCount;

  if (result.errors.length > 0) {
    console.error('Errors during bulk upsert:', result.errors);
  }

  return { successCount, errorCount, createdCount, updatedCount };
}
