import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface OrderData {
  id?: string;
  tarikh: string;
  code_kain: string;
  nombor_po_invoice: string;
  nama_customer: string;
  team_sale: string;
  nombor_phone: string;
  jenis_order: string;
  total_rm: number;
  platform: string;
  createdAt?: any;
  source?: string;
  products?: any[];
  structuredProducts?: any[];
  totalQuantity?: number;
  // Additional fields for enhanced data extraction
  alamat_penghantaran?: string;
  tracking_number?: string;
  payment_method?: string;
  shipping_option?: string;
  quantity?: number;
  unit_price?: number;
}

export interface MarketingData {
  id?: string;
  tarikh: string;
  team_sale: string;
  kos_marketing: number;
  jumlah_leads: number;
  cold_lead: number;
  warm_lead: number;
  hot_lead: number;
  createdAt?: any;
}

export interface AWBOrderData {
  id?: string;
  orderId: string;
  platform: string;
  tarikh: string;
  masa: string;
  tracking: string;
  courier: string;
  status: string;
  cod: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  sku: string;
  quantity: number;
  seller: string;
  createdAt?: any;
  source: 'awb_upload';
}

export interface SalesTeamData {
  id?: string;
  tarikh: string;
  type?: string; // 'lead' or 'power_metrics'

  // For lead data
  nama_sales?: string;
  team_sale?: string;
  team?: string; // Alternative field name
  jumlah_leads?: number;
  cold_lead?: number;
  warm_lead?: number;
  hot_lead?: number;
  followup_time?: string;
  total_lead?: number; // Alternative field name
  cold?: number;
  warm?: number;
  hot?: number;

  // For power_metrics data
  agent_name?: string;
  total_sale_bulan?: number;
  total_close_bulan?: number;
  total_lead_bulan?: number;

  createdAt?: any;
}

export interface FollowUpData {
  id?: string;
  tarikh: string;
  nama_customer: string;
  team_sale: string;
  nombor_phone: string;
  status: string;
  catatan: string;
  next_followup: string;
  createdAt?: any;
}

export interface TeamMember {
  id?: string;
  name: string;
  role?: string;
  status: 'active' | 'inactive';
  createdAt?: any;
}

// Fetch all orders
export async function fetchOrders(startDate?: string, endDate?: string, team?: string): Promise<OrderData[]> {
  try {
    const ordersRef = collection(db, 'orderData');
    let q = query(ordersRef, orderBy('tarikh', 'desc'));

    const querySnapshot = await getDocs(q);
    let orders: OrderData[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data
      } as OrderData);
    });

    // Client-side filtering
    if (startDate || endDate || team) {
      orders = orders.filter(order => {
        let include = true;

        if (startDate && order.tarikh < startDate) include = false;
        if (endDate && order.tarikh > endDate) include = false;
        if (team && order.team_sale !== team) include = false;

        return include;
      });
    }

    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

// Fetch marketing data
export async function fetchMarketingData(startDate?: string, endDate?: string, team?: string): Promise<MarketingData[]> {
  try {
    const marketingRef = collection(db, 'marketingData');
    let q = query(marketingRef, orderBy('tarikh', 'desc'));

    const querySnapshot = await getDocs(q);
    let data: MarketingData[] = [];

    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      data.push({
        id: doc.id,
        ...docData
      } as MarketingData);
    });

    // Client-side filtering
    if (startDate || endDate || team) {
      data = data.filter(item => {
        let include = true;

        if (startDate && item.tarikh < startDate) include = false;
        if (endDate && item.tarikh > endDate) include = false;
        if (team && item.team_sale !== team) include = false;

        return include;
      });
    }

    return data;
  } catch (error) {
    console.error('Error fetching marketing data:', error);
    throw error;
  }
}

// Fetch sales team data
export async function fetchSalesTeamData(startDate?: string, endDate?: string, team?: string): Promise<SalesTeamData[]> {
  try {
    const salesRef = collection(db, 'salesTeamData');
    let q = query(salesRef, orderBy('tarikh', 'desc'));

    const querySnapshot = await getDocs(q);
    let data: SalesTeamData[] = [];

    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      data.push({
        id: doc.id,
        ...docData
      } as SalesTeamData);
    });

    console.log('🔍 Raw salesTeamData fetched:', data.length);
    console.log('📊 Data types:', {
      lead: data.filter(d => d.type === 'lead').length,
      power_metrics: data.filter(d => d.type === 'power_metrics').length,
      other: data.filter(d => !d.type).length
    });

    // Client-side filtering
    if (startDate || endDate || team) {
      data = data.filter(item => {
        let include = true;

        // Date filtering
        if (startDate && item.tarikh < startDate) include = false;
        if (endDate && item.tarikh > endDate) include = false;

        // Team filtering - check both type of data
        if (team) {
          if (item.type === 'power_metrics') {
            // For power_metrics, check agent_name or team field
            const agentName = item.agent_name || item.team || '';
            include = include && agentName.toLowerCase() === team.toLowerCase();
          } else if (item.type === 'lead') {
            // For lead data, check team_sale or team field
            const teamName = item.team_sale || item.team || '';
            include = include && teamName.toLowerCase() === team.toLowerCase();
          } else {
            // Fallback: check team_sale
            include = include && (item.team_sale === team || item.team === team);
          }
        }

        return include;
      });

      console.log('✅ Filtered data:', data.length, 'items');
      if (team) {
        console.log(`🎯 Filtered for team "${team}":`, {
          lead: data.filter(d => d.type === 'lead').length,
          power_metrics: data.filter(d => d.type === 'power_metrics').length
        });
      }
    }

    return data;
  } catch (error) {
    console.error('Error fetching sales team data:', error);
    throw error;
  }
}

// Add order
export async function addOrder(orderData: Omit<OrderData, 'id'>): Promise<string> {
  try {
    const ordersRef = collection(db, 'orderData');
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
}

// Update existing order
export async function updateOrder(orderId: string, orderData: Partial<OrderData>): Promise<void> {
  try {
    const orderRef = doc(db, 'orderData', orderId);
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

// Find order by invoice number
export async function findOrderByInvoice(invoiceNumber: string): Promise<OrderData | null> {
  try {
    const ordersRef = collection(db, 'orderData');
    const q = query(ordersRef, where('nombor_po_invoice', '==', invoiceNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as OrderData;
  } catch (error) {
    console.error('Error finding order by invoice:', error);
    throw error;
  }
}

// Upsert order (update if exists, create if not)
export async function upsertOrder(orderData: Omit<OrderData, 'id'>): Promise<{
  action: 'created' | 'updated';
  orderId: string;
}> {
  try {
    // Check if order with this invoice number already exists
    const existingOrder = await findOrderByInvoice(orderData.nombor_po_invoice);

    if (existingOrder && existingOrder.id) {
      // Update existing order
      await updateOrder(existingOrder.id, orderData);
      return {
        action: 'updated',
        orderId: existingOrder.id
      };
    } else {
      // Create new order
      const newOrderId = await addOrder(orderData);
      return {
        action: 'created',
        orderId: newOrderId
      };
    }
  } catch (error) {
    console.error('Error upserting order:', error);
    throw error;
  }
}

// Bulk upsert orders
export async function upsertOrders(
  orders: Omit<OrderData, 'id'>[]
): Promise<{
  createdCount: number;
  updatedCount: number;
  errorCount: number;
  errors: string[];
}> {
  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const order of orders) {
    try {
      const result = await upsertOrder(order);
      if (result.action === 'created') {
        createdCount++;
      } else {
        updatedCount++;
      }
    } catch (error: any) {
      errorCount++;
      errors.push(`Failed to save order ${order.nombor_po_invoice}: ${error.message}`);
    }
  }

  return { createdCount, updatedCount, errorCount, errors };
}

// Add marketing data
export async function addMarketingData(data: Omit<MarketingData, 'id'>): Promise<string> {
  try {
    const marketingRef = collection(db, 'marketingData');
    const docRef = await addDoc(marketingRef, {
      ...data,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding marketing data:', error);
    throw error;
  }
}

// Add sales team data
export async function addSalesTeamData(data: Omit<SalesTeamData, 'id'>): Promise<string> {
  try {
    const salesRef = collection(db, 'salesTeamData');
    const docRef = await addDoc(salesRef, {
      ...data,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding sales team data:', error);
    throw error;
  }
}

// Add follow up data
export async function addFollowUpData(data: Omit<FollowUpData, 'id'>): Promise<string> {
  try {
    const followUpRef = collection(db, 'followUpData');
    const docRef = await addDoc(followUpRef, {
      ...data,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding follow-up data:', error);
    throw error;
  }
}

// Get unique teams
export async function getUniqueTeams(): Promise<string[]> {
  try {
    const [orders, marketing, sales] = await Promise.all([
      fetchOrders(),
      fetchMarketingData(),
      fetchSalesTeamData()
    ]);

    const teams = new Set<string>();

    orders.forEach(o => o.team_sale && teams.add(o.team_sale));
    marketing.forEach(m => m.team_sale && teams.add(m.team_sale));
    sales.forEach(s => s.team_sale && teams.add(s.team_sale));

    return Array.from(teams).sort();
  } catch (error) {
    console.error('Error fetching unique teams:', error);
    return [];
  }
}

// Fetch all team members
export async function fetchTeamMembers(): Promise<TeamMember[]> {
  try {
    const teamRef = collection(db, 'teamMembers');
    const q = query(teamRef, orderBy('name', 'asc'));

    const querySnapshot = await getDocs(q);
    const members: TeamMember[] = [];

    querySnapshot.forEach((doc) => {
      members.push({
        id: doc.id,
        ...doc.data()
      } as TeamMember);
    });

    return members;
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
}

// Add team member
export async function addTeamMember(data: Omit<TeamMember, 'id'>): Promise<string> {
  try {
    const teamRef = collection(db, 'teamMembers');
    const docRef = await addDoc(teamRef, {
      ...data,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding team member:', error);
    throw error;
  }
}

// Get active team members only
export async function fetchActiveTeamMembers(): Promise<TeamMember[]> {
  try {
    const members = await fetchTeamMembers();
    return members.filter(m => m.status === 'active');
  } catch (error) {
    console.error('Error fetching active team members:', error);
    return [];
  }
}

// Migrate existing team names to teamMembers collection
export async function migrateExistingTeams(): Promise<void> {
  try {
    // Get unique team names from existing data
    const uniqueTeams = await getUniqueTeams();

    // Get existing team members
    const existingMembers = await fetchTeamMembers();
    const existingNames = new Set(existingMembers.map(m => m.name));

    // Add teams that don't exist in teamMembers collection
    for (const teamName of uniqueTeams) {
      if (!existingNames.has(teamName)) {
        await addTeamMember({
          name: teamName,
          status: 'active'
        });
        console.log(`✅ Migrated team: ${teamName}`);
      }
    }

    console.log('🎉 Migration completed!');
  } catch (error) {
    console.error('Error migrating teams:', error);
    throw error;
  }
}

/**
 * Add AWB order to Firestore
 */
export async function addAWBOrder(orderData: Omit<AWBOrderData, 'id' | 'createdAt' | 'source'>): Promise<string> {
  try {
    const awbOrdersCollection = collection(db, 'awb_orders');
    const docRef = await addDoc(awbOrdersCollection, {
      ...orderData,
      source: 'awb_upload',
      createdAt: Timestamp.now()
    });

    console.log('✅ AWB Order added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding AWB order:', error);
    throw error;
  }
}

/**
 * Save multiple AWB orders to Firestore
 */
export async function saveAWBOrders(orders: Omit<AWBOrderData, 'id' | 'createdAt' | 'source'>[]): Promise<{
  successCount: number;
  errorCount: number;
  errors: string[];
}> {
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const order of orders) {
    try {
      await addAWBOrder(order);
      successCount++;
    } catch (error: any) {
      errorCount++;
      errors.push(`Failed to save order ${order.orderId}: ${error.message}`);
    }
  }

  return { successCount, errorCount, errors };
}

/**
 * Get all AWB orders
 */
export async function getAWBOrders(): Promise<AWBOrderData[]> {
  try {
    const awbOrdersCollection = collection(db, 'awb_orders');
    const q = query(awbOrdersCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AWBOrderData[];
  } catch (error) {
    console.error('Error getting AWB orders:', error);
    throw error;
  }
}
