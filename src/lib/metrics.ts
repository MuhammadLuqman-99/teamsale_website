import { OrderData, MarketingData, SalesTeamData } from './firestore';

export interface PowerMetrics {
  kpiHarian: number;
  kpiMTD: number;
  saleMTD: number;
  balanceBulanan: number;
  balanceMTD: number;
  bilanganTerjual: number;
  totalCloseRate: number;
  workingDaysTotal: number;
  workingDaysCurrent: number;
  monthlyProgressPercent: number;
  mtdProgressPercent: number;
  numberOfTeams: number;
  totalMonthlyTarget: number;
}

export interface DashboardStats {
  totalSales: number;
  totalSalesCount: number;
  totalLeads: number;
  totalLeadsCount: number;
  leadsPerAgent: number;
  activeTeamSales: number;
  totalOrders: number;
}

const MONTHLY_TARGET = 15000;

// Calculate working days in a month (exclude weekends)
export function calculateWorkingDays(year: number, month: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    // Exclude Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  return workingDays;
}

// Calculate current working day number
export function getCurrentWorkingDay(year: number, month: number, currentDay: number): number {
  let workingDay = 0;

  for (let day = 1; day <= currentDay; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDay++;
    }
  }

  return workingDay;
}

// Calculate dashboard statistics
export function calculateDashboardStats(
  orders: OrderData[],
  marketing: MarketingData[],
  salesTeam: SalesTeamData[]
): DashboardStats {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get power_metrics data for current month
  const powerMetricsData = salesTeam.filter(item => {
    if (item.type !== 'power_metrics') return false;

    // Parse date string directly to avoid timezone issues (YYYY-MM-DD format)
    const dateParts = item.tarikh.split('-');
    const itemYear = parseInt(dateParts[0]);
    const itemMonth = parseInt(dateParts[1]) - 1; // Convert to 0-indexed

    return itemMonth === currentMonth && itemYear === currentYear;
  });

  // Total Sales - prioritize power_metrics data
  let totalSales = 0;
  let totalLeads = 0;
  let totalOrders = 0;
  let totalSalesFromPowerMetrics = 0;

  if (powerMetricsData.length > 0) {
    // Use power_metrics data - find latest entry for each team
    const teamLatestData: { [key: string]: SalesTeamData } = {};

    powerMetricsData.forEach(item => {
      const teamName = item.agent_name || item.team || 'Unknown';

      // Use string comparison for ISO date format (YYYY-MM-DD) to avoid timezone issues
      if (!teamLatestData[teamName] || teamLatestData[teamName].tarikh < item.tarikh) {
        teamLatestData[teamName] = item;
      }
    });

    // Sum up from power_metrics
    Object.values(teamLatestData).forEach(item => {
      totalSalesFromPowerMetrics += item.total_sale_bulan || 0;
      totalLeads += item.total_lead_bulan || 0;
      totalOrders += item.total_close_bulan || 0;  // Total Orders = Total Close
    });

    totalSales = totalSalesFromPowerMetrics;

    console.log('✅ Dashboard Stats from power_metrics:', {
      totalSales,
      totalOrders,
      totalLeads,
      teams: Object.keys(teamLatestData).length
    });
  } else {
    // Fallback to orders
    totalSales = orders.reduce((sum, order) => sum + (order.total_rm || 0), 0);
    totalOrders = orders.length;
  }

  // Total Leads - prioritize power_metrics, fallback to marketing data
  if (totalLeads === 0) {
    totalLeads = marketing.reduce((sum, item) => sum + (item.jumlah_leads || 0), 0);
  }

  // Get lead data from salesTeam
  const leadData = salesTeam.filter(item => item.type === 'lead');
  const leadDataCurrentMonth = leadData.filter(item => {
    // Parse date string directly to avoid timezone issues (YYYY-MM-DD format)
    const dateParts = item.tarikh.split('-');
    const itemYear = parseInt(dateParts[0]);
    const itemMonth = parseInt(dateParts[1]) - 1; // Convert to 0-indexed

    return itemMonth === currentMonth && itemYear === currentYear;
  });

  // If no power_metrics, calculate from lead data
  if (totalLeads === 0 && leadDataCurrentMonth.length > 0) {
    totalLeads = leadDataCurrentMonth.reduce((sum, item) =>
      sum + (item.total_lead || item.jumlah_leads || 0), 0
    );
  }

  // Count unique teams
  const uniqueTeams = new Set<string>();
  if (powerMetricsData.length > 0) {
    powerMetricsData.forEach(item => {
      const teamName = item.agent_name || item.team;
      if (teamName) uniqueTeams.add(teamName);
    });
  } else {
    orders.forEach(o => o.team_sale && uniqueTeams.add(o.team_sale));
    marketing.forEach(m => m.team_sale && uniqueTeams.add(m.team_sale));
    salesTeam.forEach(s => {
      const teamName = s.team || s.team_sale;
      if (teamName) uniqueTeams.add(teamName);
    });
  }

  const numberOfTeams = uniqueTeams.size || 1;

  // Calculate leads per team
  const leadsPerAgent = totalLeads > 0 ? Math.round(totalLeads / numberOfTeams) : 0;

  // Total Sales Count - use totalOrders which comes from power_metrics total_close_bulan
  const totalSalesCount = totalOrders;
  const totalLeadsCount = leadDataCurrentMonth.length || marketing.length;

  console.log('📊 Dashboard Stats Summary:', {
    totalSales,
    totalOrders,
    totalSalesCount,
    totalLeads,
    numberOfTeams
  });

  return {
    totalSales,
    totalSalesCount,
    totalLeads,
    totalLeadsCount,
    leadsPerAgent,
    activeTeamSales: numberOfTeams,
    totalOrders
  };
}

// Calculate power metrics
export function calculatePowerMetrics(
  orders: OrderData[],
  marketing: MarketingData[],
  salesTeam: SalesTeamData[],
  targetDate?: Date,
  singleTeamTarget: number = MONTHLY_TARGET
): PowerMetrics {
  const now = targetDate || new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate();

  // Calculate working days
  const workingDaysTotal = calculateWorkingDays(year, month);
  const workingDaysCurrent = getCurrentWorkingDay(year, month, currentDay);

  // Filter power_metrics data for current month
  const powerMetricsData = salesTeam.filter(item => {
    if (item.type !== 'power_metrics') return false;

    // Parse date string directly to avoid timezone issues (YYYY-MM-DD format)
    const dateParts = item.tarikh.split('-');
    const itemYear = parseInt(dateParts[0]);
    const itemMonth = parseInt(dateParts[1]) - 1; // Convert to 0-indexed

    return itemMonth === month && itemYear === year;
  });

  console.log('📊 Power Metrics Data:', {
    total: salesTeam.length,
    powerMetrics: powerMetricsData.length,
    currentMonth: `${month + 1}/${year}`,
    targetDate: targetDate ? targetDate.toISOString() : 'now',
    powerMetricsDetails: powerMetricsData.map(d => ({
      team: d.agent_name || d.team,
      tarikh: d.tarikh,
      sale: d.total_sale_bulan,
      close: d.total_close_bulan,
      lead: d.total_lead_bulan
    }))
  });

  // Calculate Sales MTD from power_metrics data (preferred) or orders (fallback)
  let saleMTD = 0;
  let bilanganTerjual = 0;
  let totalLeads = 0;
  let numberOfTeams = 0;

  if (powerMetricsData.length > 0) {
    // Use power_metrics data - find latest entry for each team
    const teamLatestData: { [key: string]: SalesTeamData } = {};

    powerMetricsData.forEach(item => {
      const teamName = item.agent_name || item.team || 'Unknown';

      // Use string comparison for ISO date format (YYYY-MM-DD) to avoid timezone issues
      if (!teamLatestData[teamName] || teamLatestData[teamName].tarikh < item.tarikh) {
        teamLatestData[teamName] = item;
      }
    });

    // Count number of unique teams
    numberOfTeams = Object.keys(teamLatestData).length;

    // Sum up the latest values
    Object.values(teamLatestData).forEach(item => {
      saleMTD += item.total_sale_bulan || 0;
      bilanganTerjual += item.total_close_bulan || 0;
      totalLeads += item.total_lead_bulan || 0;
    });

    console.log('✅ Using power_metrics data:', {
      teams: numberOfTeams,
      saleMTD,
      bilanganTerjual,
      totalLeads
    });
  } else {
    // Fallback to orders and marketing data
    console.log('⚠️ No power_metrics data found, using fallback calculation');
    saleMTD = orders.reduce((sum, order) => sum + (order.total_rm || 0), 0);
    bilanganTerjual = orders.reduce((sum, order) => sum + (order.totalQuantity || 1), 0);
    totalLeads = marketing.reduce((sum, item) => sum + (item.jumlah_leads || 0), 0);

    // Count unique teams from all data sources
    const uniqueTeams = new Set<string>();
    orders.forEach(o => o.team_sale && uniqueTeams.add(o.team_sale));
    marketing.forEach(m => m.team_sale && uniqueTeams.add(m.team_sale));
    salesTeam.forEach(s => (s.team || s.team_sale) && uniqueTeams.add(s.team || s.team_sale || ''));
    numberOfTeams = uniqueTeams.size;
  }

  // Calculate total monthly target (per team target × number of teams)
  const totalMonthlyTarget = singleTeamTarget * (numberOfTeams || 1);

  // Calculate KPI Harian (Daily Target) - based on total target
  const kpiHarian = workingDaysTotal > 0 ? totalMonthlyTarget / workingDaysTotal : 0;

  // Calculate KPI MTD (Target up to current working day)
  const kpiMTD = kpiHarian * workingDaysCurrent;

  // Calculate Balance MTD (Gap to target MTD)
  const balanceMTD = kpiMTD - saleMTD;

  // Calculate Balance Bulanan (Gap to monthly target)
  const balanceBulanan = totalMonthlyTarget - saleMTD;

  // Calculate Total Close Rate
  const totalCloseRate = totalLeads > 0 ? (bilanganTerjual / totalLeads) * 100 : 0;

  // Calculate Progress Percentages
  const monthlyProgressPercent = (saleMTD / totalMonthlyTarget) * 100;
  const mtdProgressPercent = kpiMTD > 0 ? (saleMTD / kpiMTD) * 100 : 0;

  return {
    kpiHarian: Math.round(kpiHarian),
    kpiMTD: Math.round(kpiMTD),
    saleMTD: Math.round(saleMTD),
    balanceBulanan: Math.round(balanceBulanan),
    balanceMTD: Math.round(balanceMTD),
    bilanganTerjual,
    totalCloseRate: Math.round(totalCloseRate * 10) / 10,
    workingDaysTotal,
    workingDaysCurrent,
    monthlyProgressPercent: Math.round(monthlyProgressPercent * 10) / 10,
    mtdProgressPercent: Math.round(mtdProgressPercent * 10) / 10,
    numberOfTeams: numberOfTeams || 1,
    totalMonthlyTarget: Math.round(totalMonthlyTarget)
  };
}

// Filter data by date range
export function filterByDateRange<T extends { tarikh: string }>(
  data: T[],
  startDate?: string,
  endDate?: string
): T[] {
  if (!startDate && !endDate) return data;

  return data.filter(item => {
    if (startDate && item.tarikh < startDate) return false;
    if (endDate && item.tarikh > endDate) return false;
    return true;
  });
}

// Get date ranges for quick filters
export function getQuickDateRange(period: string): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  let startDate: Date;
  let endDate: Date = now;

  switch (period) {
    case 'today':
      startDate = new Date(year, month, day);
      endDate = new Date(year, month, day);
      break;

    case 'yesterday':
      startDate = new Date(year, month, day - 1);
      endDate = new Date(year, month, day - 1);
      break;

    case 'this-week':
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
      startDate = new Date(year, month, day - diff);
      break;

    case 'last-week':
      const lastWeekDay = day - 7;
      const lastWeekDayOfWeek = new Date(year, month, lastWeekDay).getDay();
      const lastWeekDiff = lastWeekDayOfWeek === 0 ? 6 : lastWeekDayOfWeek - 1;
      startDate = new Date(year, month, lastWeekDay - lastWeekDiff);
      endDate = new Date(year, month, lastWeekDay + (6 - lastWeekDiff));
      break;

    case 'this-month':
      startDate = new Date(year, month, 1);
      break;

    case 'last-month':
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
      break;

    case 'this-year':
      startDate = new Date(year, 0, 1);
      break;

    case 'last-year':
      startDate = new Date(year - 1, 0, 1);
      endDate = new Date(year - 1, 11, 31);
      break;

    default:
      startDate = new Date(year, month, 1);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

// Format currency
export function formatCurrency(amount: number): string {
  return `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
