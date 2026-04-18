/**
 * Finance API
 * All financial data operations via Supabase direct client.
 * Currency: TND (Tunisian Dinar)
 */
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeadFinancials {
  id: string;
  client_name: string;
  phone: string;
  problem_type: string;
  status: string;
  payment_status: 'pending' | 'partial' | 'paid';
  revenue: number | null;
  cost_material: number | null;
  cost_transport: number | null;
  created_at: string;
}

export interface Expense {
  id: string;
  category: 'food' | 'salary' | 'transport' | 'material' | 'equipment' | 'other';
  description: string;
  amount: number;
  date: string;
  reference: string | null;
  created_at: string;
}

export interface ExpenseInput {
  category: Expense['category'];
  description: string;
  amount: number;
  date: string;
  reference?: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalLeadCosts: number;       // material + transport of all converted leads
  totalExpenses: number;        // general expenses
  netProfit: number;
  outstandingRevenue: number;   // revenue from leads not yet 'paid'
  convertedLeadsCount: number;
}

export interface MonthlyData {
  month: string;       // "Jan 25"
  revenue: number;
  lead_costs: number;
  expenses: number;
}

// ─── Leads Financial Data ────────────────────────────────────────────────────

/** Fetch all converted leads with their financial fields */
export async function getConvertedLeads(): Promise<LeadFinancials[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('id, client_name, phone, problem_type, status, payment_status, revenue, cost_material, cost_transport, created_at')
    .eq('status', 'converted')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/** Fetch all leads with financial info (for full list view) */
export async function getAllLeadsFinancials(): Promise<LeadFinancials[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('id, client_name, phone, problem_type, status, payment_status, revenue, cost_material, cost_transport, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/** Update financial fields on a lead */
export async function updateLeadFinancials(
  id: string,
  fields: {
    revenue?: number | null;
    cost_material?: number | null;
    cost_transport?: number | null;
    payment_status?: 'pending' | 'partial' | 'paid';
  }
): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update(fields)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ─── Expenses ────────────────────────────────────────────────────────────────

/** Fetch all general expenses */
export async function getExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/** Create a new expense entry */
export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert([input])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Update an existing expense */
export async function updateExpense(id: string, input: Partial<ExpenseInput>): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update(input)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Delete an expense */
export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ─── Aggregated Summary ──────────────────────────────────────────────────────

/** Compute the overall financial summary from live data */
export async function getFinancialSummary(): Promise<FinancialSummary> {
  const [convertedLeads, expenses] = await Promise.all([
    getConvertedLeads(),
    getExpenses(),
  ]);

  const totalRevenue = convertedLeads
    .filter(l => l.payment_status === 'paid')
    .reduce((sum, l) => sum + (l.revenue || 0), 0);

  const outstandingRevenue = convertedLeads
    .filter(l => l.payment_status !== 'paid')
    .reduce((sum, l) => sum + (l.revenue || 0), 0);

  const totalLeadCosts = convertedLeads.reduce(
    (sum, l) => sum + (l.cost_material || 0) + (l.cost_transport || 0),
    0
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    totalRevenue,
    totalLeadCosts,
    totalExpenses,
    netProfit: totalRevenue - totalLeadCosts - totalExpenses,
    outstandingRevenue,
    convertedLeadsCount: convertedLeads.length,
  };
}

/** Generate monthly breakdown for charts (last 6 months) */
export async function getMonthlyData(): Promise<MonthlyData[]> {
  const [allLeads, expenses] = await Promise.all([
    getConvertedLeads(),
    getExpenses(),
  ]);

  const months: MonthlyData[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('fr-TN', { month: 'short', year: '2-digit' });
    const y = d.getFullYear();
    const m = d.getMonth();

    const monthLeads = allLeads.filter(l => {
      const ld = new Date(l.created_at);
      return ld.getFullYear() === y && ld.getMonth() === m;
    });

    const monthExpenses = expenses.filter(e => {
      const ed = new Date(e.date);
      return ed.getFullYear() === y && ed.getMonth() === m;
    });

    months.push({
      month: label,
      revenue: monthLeads
        .filter(l => l.payment_status === 'paid')
        .reduce((s, l) => s + (l.revenue || 0), 0),
      lead_costs: monthLeads.reduce(
        (s, l) => s + (l.cost_material || 0) + (l.cost_transport || 0),
        0
      ),
      expenses: monthExpenses.reduce((s, e) => s + e.amount, 0),
    });
  }

  return months;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatTND(amount: number): string {
  return new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount) + ' TND';
}
