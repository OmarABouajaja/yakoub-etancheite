import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle2, Clock,
  Utensils, Users, Truck, Package, Wrench, MoreHorizontal, Plus, X, Edit2,
  Trash2, ChevronDown, ArrowRight, Home, Zap
} from 'lucide-react';
import {
  getFinancialSummary, getConvertedLeads, getExpenses, getMonthlyData,
  createExpense, updateExpense, deleteExpense, updateLeadFinancials,
  formatTND,
  type Expense, type ExpenseInput, type LeadFinancials,
} from '@/lib/finance-api';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['Aperçu', 'Revenus (Prospects)', 'Dépenses'] as const;
type Tab = typeof TABS[number];

const EXPENSE_CATEGORIES: { value: Expense['category']; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'food',      label: 'Nourriture',      icon: Utensils,   color: '#f59e0b' },
  { value: 'salary',    label: 'Salaire',    icon: Users,      color: '#8b5cf6' },
  { value: 'transport', label: 'Transport', icon: Truck,      color: '#3b82f6' },
  { value: 'material',  label: 'Matériel',  icon: Package,    color: '#10b981' },
  { value: 'equipment', label: 'Équipement', icon: Wrench,     color: '#06b6d4' },
  { value: 'rent',      label: 'Loyer',      icon: Home,       color: '#ec4899' },
  { value: 'utilities', label: 'Factures',   icon: Zap,        color: '#eab308' },
  { value: 'other',     label: 'Autre',     icon: MoreHorizontal, color: '#6b7280' },
];

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-orange-500/10 text-orange-500 border-orange-500/50',
  partial: 'bg-blue-500/10 text-blue-500 border-blue-500/50',
  paid: 'bg-green-500/10 text-green-500 border-green-500/50',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  partial: 'Partiel',
  paid: 'Payé',
};

const CHART_COLORS = {
  revenue:    'hsl(142, 71%, 45%)',
  lead_costs: 'hsl(38, 92%, 50%)',
  expenses:   'hsl(0, 72%, 51%)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: 'green' | 'red' | 'orange' | 'blue' | 'purple';
  trend?: number;
}> = ({ label, value, sub, icon: Icon, color, trend }) => {
  const colorMap = {
    green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400',  glow: 'shadow-green-500/10' },
    red:    { bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400',    glow: 'shadow-red-500/10' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', glow: 'shadow-orange-500/10' },
    blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400',   glow: 'shadow-blue-500/10' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/10' },
  };
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 sm:p-6 border ${c.border} shadow-lg ${c.glow}`}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-4">
        <span className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider line-clamp-2 min-h-[30px] sm:min-h-0">{label}</span>
        <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${c.bg}`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${c.text}`} />
        </div>
      </div>
      <p className={`text-xl sm:text-2xl font-bold font-mono truncate ${c.text}`}>{value}</p>
      {sub && <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1 sm:mt-2 text-[9px] sm:text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3" /> : <TrendingDown className="w-2 h-2 sm:w-3 sm:h-3" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </motion.div>
  );
};

// ─── Custom Tooltip for charts ────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card border border-border p-3 text-sm shadow-xl min-w-[160px]">
      <p className="font-bold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono text-foreground">{formatTND(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Expense Form ─────────────────────────────────────────────────────────────

const ExpenseForm: React.FC<{
  initial?: Partial<ExpenseInput>;
  onSave: (data: ExpenseInput) => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ initial, onSave, onCancel, loading }) => {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<ExpenseInput>({
    category: initial?.category || 'other',
    description: initial?.description || '',
    amount: initial?.amount || 0,
    date: initial?.date || today,
    reference: initial?.reference || '',
  });

  const set = (k: keyof ExpenseInput, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || form.amount <= 0) {
      toast.error('La description et un montant valide sont requis.');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Catégorie</label>
        <div className="grid grid-cols-3 gap-2">
          {EXPENSE_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = form.category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => set('category', cat.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-xs font-medium transition-all ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-border/80'
                }`}
              >
                <Icon className="w-4 h-4" style={{ color: active ? undefined : cat.color }} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
        <input
          type="text"
          required
          className="w-full bg-background border border-border rounded-md px-4 py-3 outline-none focus:border-primary text-sm"
          placeholder="ex: Repas ouvriers – Chantier A"
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>

      {/* Amount + Date row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Montant (TND)</label>
          <input
            type="number"
            min="0"
            step="0.001"
            required
            className="w-full bg-background border border-border rounded-md px-4 py-3 outline-none focus:border-primary text-sm font-mono"
            placeholder="0.000"
            value={form.amount || ''}
            onChange={e => set('amount', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</label>
          <input
            type="date"
            className="w-full bg-background border border-border rounded-md px-4 py-3 outline-none focus:border-primary text-sm"
            value={form.date}
            onChange={e => set('date', e.target.value)}
          />
        </div>
      </div>

      {/* Reference */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Référence / Note (optionnel)</label>
        <input
          type="text"
          className="w-full bg-background border border-border rounded-md px-4 py-3 outline-none focus:border-primary text-sm"
          placeholder="N° de reçu, facture, etc."
          value={form.reference || ''}
          onChange={e => set('reference', e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md hover:bg-muted transition-colors text-sm font-bold">
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-md glow-button text-sm disabled:opacity-50"
        >
          {loading ? 'Enregistrement…' : 'Enregistrer la Dépense'}
        </button>
      </div>
    </form>
  );
};

// ─── Lead Finance Editor ───────────────────────────────────────────────────────

const LeadFinancePanel: React.FC<{
  lead: LeadFinancials;
  onClose: () => void;
  onSaved: () => void;
}> = ({ lead, onClose, onSaved }) => {
  const [form, setForm] = useState({
    revenue: lead.revenue ?? '',
    cost_material: lead.cost_material ?? '',
    cost_transport: lead.cost_transport ?? '',
    payment_status: lead.payment_status ?? 'pending',
  });
  const [saving, setSaving] = useState(false);

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const gross = (Number(form.revenue) || 0);
  const costs = (Number(form.cost_material) || 0) + (Number(form.cost_transport) || 0);
  const margin = gross - costs;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLeadFinancials(lead.id, {
        revenue: form.revenue !== '' ? Number(form.revenue) : null,
        cost_material: form.cost_material !== '' ? Number(form.cost_material) : null,
        cost_transport: form.cost_transport !== '' ? Number(form.cost_transport) : null,
        payment_status: form.payment_status as any,
      });
      toast.success('Données financières enregistrées !');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display tracking-wider">Finances du Prospect</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{lead.client_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Revenue */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-3 h-3 text-green-400" /> Paiement Client / Revenus (TND)
            </label>
            <input
              type="number" min="0" step="0.001"
              className="w-full bg-background border border-border rounded-md px-4 py-3 outline-none focus:border-green-500 text-sm font-mono"
              placeholder="0.000"
              value={form.revenue}
              onChange={e => setF('revenue', e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coûts des Travaux (TND)</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="w-3 h-3" /> Matériel
                </label>
                <input
                  type="number" min="0" step="0.001"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 outline-none focus:border-orange-500 text-sm font-mono"
                  placeholder="0.000"
                  value={form.cost_material}
                  onChange={e => setF('cost_material', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Truck className="w-3 h-3" /> Transport
                </label>
                <input
                  type="number" min="0" step="0.001"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 outline-none focus:border-blue-500 text-sm font-mono"
                  placeholder="0.000"
                  value={form.cost_transport}
                  onChange={e => setF('cost_transport', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Aperçu de la Marge en Direct</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Revenus</span>
              <span className="font-mono text-green-400">{formatTND(gross)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Coûts Totaux</span>
              <span className="font-mono text-orange-400">− {formatTND(costs)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
              <span>Marge Nette</span>
              <span className={`font-mono ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatTND(margin)}
              </span>
            </div>
          </div>

          {/* Payment status */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Statut de Paiement</label>
            <div className="grid grid-cols-3 gap-2">
              {(['pending', 'partial', 'paid'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setF('payment_status', s)}
                  className={`py-2 rounded-lg border text-xs font-bold capitalize transition-all ${
                    form.payment_status === s
                      ? PAYMENT_STATUS_STYLES[s] + ' border-opacity-60'
                      : 'border-border text-muted-foreground hover:border-border/80'
                  }`}
                >
                  {s === 'pending' && <Clock className="w-3 h-3 inline mr-1" />}
                  {s === 'partial' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                  {s === 'paid'    && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  {PAYMENT_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-md glow-button disabled:opacity-50 transition-all"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer les Données'}
          </button>
        </div>
      </motion.div>
    </>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const FinanceManagement: React.FC = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('Aperçu');
  const [selectedLead, setSelectedLead] = useState<LeadFinancials | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseFilter, setExpenseFilter] = useState<Expense['category'] | 'all'>('all');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');

  // Queries
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: getFinancialSummary,
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['converted-leads'],
    queryFn: getConvertedLeads,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: getExpenses,
  });

  const { data: monthlyData = [] } = useQuery({
    queryKey: ['monthly-data'],
    queryFn: getMonthlyData,
  });

  // Expense mutations
  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
      qc.invalidateQueries({ queryKey: ['monthly-data'] });
      toast.success('Expense recorded!');
      setShowExpenseForm(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseInput> }) =>
      updateExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
      qc.invalidateQueries({ queryKey: ['monthly-data'] });
      toast.success('Expense updated!');
      setEditingExpense(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
      qc.invalidateQueries({ queryKey: ['monthly-data'] });
      toast.success('Expense deleted.');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Expense breakdown for pie chart
  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
    name: cat.label,
    value: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
    color: cat.color,
  })).filter(c => c.value > 0);

  const filteredExpenses = (expenseFilter === 'all'
    ? expenses
    : expenses.filter(e => e.category === expenseFilter))
    .filter(e => {
       if (!expenseSearchQuery.trim()) return true;
       const q = expenseSearchQuery.toLowerCase();
       return (e.description?.toLowerCase().includes(q) || e.reference?.toLowerCase().includes(q));
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isLoading = summaryLoading || leadsLoading || expensesLoading;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-wider text-foreground">
              Gestion Financière
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Suivez les revenus des chantiers, les coûts des matériaux et de transport, et les dépenses d'exploitation — tout en TND.
            </p>
          </div>
          {activeTab === 'Dépenses' && (
            <button
              onClick={() => { setShowExpenseForm(true); setEditingExpense(null); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-md glow-button text-sm"
            >
              <Plus className="w-4 h-4" /> Ajouter une Dépense
            </button>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl w-fit border border-border">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════════════════ */}
        {activeTab === 'Aperçu' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* KPI Cards */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="glass-card p-4 sm:p-6 h-28 sm:h-36 animate-pulse bg-muted/20" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
                <KpiCard
                  label="Revenus Totaux (Payés)"
                  value={formatTND(summary?.totalRevenue || 0)}
                  sub={`${summary?.convertedLeadsCount || 0} chantiers convertis`}
                  icon={TrendingUp}
                  color="green"
                />
                <KpiCard
                  label="Impayé"
                  value={formatTND(summary?.outstandingRevenue || 0)}
                  sub="Paiements en attente / partiels"
                  icon={Clock}
                  color="orange"
                />
                <KpiCard
                  label="Coûts Totaux"
                  value={formatTND((summary?.totalLeadCosts || 0) + (summary?.totalExpenses || 0))}
                  sub="Coûts chantiers + frais généraux"
                  icon={TrendingDown}
                  color="red"
                />
                <KpiCard
                  label="Bénéfice Net"
                  value={formatTND(summary?.netProfit || 0)}
                  sub="Revenus − tous les coûts"
                  icon={DollarSign}
                  color={(summary?.netProfit || 0) >= 0 ? 'green' : 'red'}
                />
              </div>
            )}

            {/* Charts row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Monthly bar chart */}
              <div className="xl:col-span-2 glass-card p-6">
                <h3 className="font-bold text-lg mb-6 font-display tracking-wider">Aperçu Mensuel (TND)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyData} barGap={4} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={70}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                    <Bar dataKey="revenue"    name="Revenus"    fill={CHART_COLORS.revenue}    radius={[4,4,0,0]} />
                    <Bar dataKey="lead_costs" name="Coûts Chantiers"  fill={CHART_COLORS.lead_costs} radius={[4,4,0,0]} />
                    <Bar dataKey="expenses"   name="Frais Généraux"   fill={CHART_COLORS.expenses}   radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Expense breakdown pie */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-lg mb-4 font-display tracking-wider">Détail des Dépenses</h3>
                {expenseByCategory.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                    Aucune dépense enregistrée.
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {expenseByCategory.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatTND(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1">
                      {expenseByCategory.map(c => (
                        <div key={c.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                            <span className="text-muted-foreground">{c.name}</span>
                          </div>
                          <span className="font-mono font-medium">{formatTND(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Cost breakdown summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-bold font-display tracking-wider">Répartition des Coûts des Chantiers</h3>
                {['material', 'transport'].map(type => {
                  const total = leads.reduce((s, l) =>
                    s + (type === 'material' ? (l.cost_material || 0) : (l.cost_transport || 0)), 0);
                  const label = type === 'material' ? 'Coûts des Matériaux' : 'Coûts de Transport';
                  const totalCosts = (summary?.totalLeadCosts || 0) || 1;
                  const pct = Math.round((total / totalCosts) * 100);
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono font-bold">{formatTND(total)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ background: type === 'material' ? CHART_COLORS.lead_costs : '#3b82f6' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="glass-card p-6 space-y-4">
                <h3 className="font-bold font-display tracking-wider">Accès Rapide</h3>
                <button
                  onClick={() => setActiveTab('Revenus (Prospects)')}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors group"
                >
                  <span className="text-sm font-medium text-green-400">Voir les Chantiers Convertis</span>
                  <ArrowRight className="w-4 h-4 text-green-400 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setActiveTab('Dépenses')}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors group"
                >
                  <span className="text-sm font-medium text-red-400">Gérer les Dépenses</span>
                  <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: REVENUE (LEADS)
        ══════════════════════════════════════════════════ */}
        {activeTab === 'Revenus (Prospects)' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <p className="text-sm text-muted-foreground">
                  Cliquez sur une ligne pour saisir ou mettre à jour les données financières de ce chantier.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead className="bg-muted/40">
                    <tr>
                      {['Client', 'Problème', 'Revenus', 'Matériel', 'Transport', 'Marge Nette', 'Paiement', ''].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leadsLoading ? (
                      Array(4).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array(8).fill(0).map((_, j) => (
                            <td key={j} className="px-5 py-4"><div className="h-4 bg-muted/40 rounded" /></td>
                          ))}
                        </tr>
                      ))
                    ) : leads.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center text-muted-foreground">
                          Aucun prospect converti pour le moment. Déplacez les prospects vers "Converti" dans le tableau des prospects.
                        </td>
                      </tr>
                    ) : leads.map((lead) => {
                      const rev = lead.revenue || 0;
                      const costs = (lead.cost_material || 0) + (lead.cost_transport || 0);
                      const margin = rev - costs;
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-4 font-medium text-foreground">{lead.client_name}</td>
                          <td className="px-5 py-4 text-muted-foreground text-sm capitalize">{lead.problem_type}</td>
                          <td className="px-5 py-4 font-mono text-green-400 font-bold">
                            {rev > 0 ? formatTND(rev) : <span className="text-muted-foreground/50 text-xs">—</span>}
                          </td>
                          <td className="px-5 py-4 font-mono text-orange-400">
                            {lead.cost_material != null ? formatTND(lead.cost_material) : <span className="text-muted-foreground/50 text-xs">—</span>}
                          </td>
                          <td className="px-5 py-4 font-mono text-blue-400">
                            {lead.cost_transport != null ? formatTND(lead.cost_transport) : <span className="text-muted-foreground/50 text-xs">—</span>}
                          </td>
                          <td className={`px-5 py-4 font-mono font-bold ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {rev > 0 || costs > 0 ? formatTND(margin) : <span className="text-muted-foreground/50 text-xs">—</span>}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 text-xs rounded-full border font-bold capitalize whitespace-nowrap ${PAYMENT_STATUS_STYLES[lead.payment_status || 'pending']}`}>
                              {PAYMENT_STATUS_LABELS[lead.payment_status || 'pending']}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {leads.length > 0 && (
                    <tfoot className="border-t-2 border-border bg-muted/20">
                      <tr>
                        <td colSpan={2} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Totaux</td>
                        <td className="px-5 py-3 font-mono font-bold text-green-400">
                          {formatTND(leads.reduce((s, l) => s + (l.revenue || 0), 0))}
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-orange-400">
                          {formatTND(leads.reduce((s, l) => s + (l.cost_material || 0), 0))}
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-blue-400">
                          {formatTND(leads.reduce((s, l) => s + (l.cost_transport || 0), 0))}
                        </td>
                        <td className="px-5 py-3 font-mono font-bold">
                          {formatTND(leads.reduce((s, l) => s + (l.revenue || 0) - (l.cost_material || 0) - (l.cost_transport || 0), 0))}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: EXPENSES
        ══════════════════════════════════════════════════ */}
        {activeTab === 'Dépenses' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-sm">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setExpenseFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  expenseFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                Tout
              </button>
              {EXPENSE_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setExpenseFilter(cat.value)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      expenseFilter === cat.value
                        ? 'text-white border-transparent'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                    style={expenseFilter === cat.value ? { background: cat.color, borderColor: cat.color } : {}}
                  >
                    <Icon className="w-3 h-3" />
                    {cat.label}
                  </button>
                );
              })}
              </div>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Rechercher une dépense..."
                  value={expenseSearchQuery}
                  onChange={e => setExpenseSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-4 py-2 outline-none focus:border-primary text-sm transition-colors"
                />
              </div>
            </div>

            {/* Expenses table */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/40">
                    <tr>
                      {['Catégorie', 'Description', 'Montant', 'Date', 'Référence', ''].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {expensesLoading ? (
                      Array(4).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array(6).fill(0).map((_, j) => (
                            <td key={j} className="px-5 py-4"><div className="h-4 bg-muted/40 rounded" /></td>
                          ))}
                        </tr>
                      ))
                    ) : filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                          Aucune dépense enregistrée. Cliquez sur "Ajouter une Dépense" pour commencer.
                        </td>
                      </tr>
                    ) : filteredExpenses.map(expense => {
                      const cat = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
                      const Icon = cat?.icon || MoreHorizontal;
                      return (
                        <tr key={expense.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md" style={{ background: (cat?.color || '#666') + '22' }}>
                                <Icon className="w-3.5 h-3.5" style={{ color: cat?.color }} />
                              </div>
                              <span className="text-sm font-medium capitalize">{cat?.label || expense.category}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">{expense.description}</td>
                          <td className="px-5 py-4 font-mono font-bold text-red-400">{formatTND(expense.amount)}</td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString('fr-TN')}
                          </td>
                          <td className="px-5 py-4 text-xs text-muted-foreground font-mono">
                            {expense.reference || '—'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setEditingExpense(expense); setShowExpenseForm(true); }}
                                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Supprimer cette dépense ?')) deleteMutation.mutate(expense.id);
                                }}
                                className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {filteredExpenses.length > 0 && (
                    <tfoot className="border-t-2 border-border bg-muted/20">
                      <tr>
                        <td colSpan={2} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</td>
                        <td className="px-5 py-3 font-mono font-bold text-red-400">
                          {formatTND(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
                        </td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Expense Create/Edit Modal ── */}
      <AnimatePresence>
        {showExpenseForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-background/80 backdrop-blur-sm"
            onClick={() => { setShowExpenseForm(false); setEditingExpense(null); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/20 shrink-0">
                <div>
                  <h2 className="text-xl font-bold font-display tracking-wider">
                    {editingExpense ? 'Modifier la Dépense' : 'Nouvelle Dépense'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Enregistrer un coût opérationnel en TND</p>
                </div>
                <button
                  onClick={() => { setShowExpenseForm(false); setEditingExpense(null); }}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <ExpenseForm
                  initial={editingExpense || undefined}
                  loading={createMutation.isPending || updateMutation.isPending}
                  onSave={(data) => {
                    if (editingExpense) {
                      updateMutation.mutate({ id: editingExpense.id, data });
                    } else {
                      createMutation.mutate(data);
                    }
                  }}
                  onCancel={() => { setShowExpenseForm(false); setEditingExpense(null); }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lead Finance Edit Panel ── */}
      <AnimatePresence>
        {selectedLead && (
          <LeadFinancePanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['converted-leads'] });
              qc.invalidateQueries({ queryKey: ['finance-summary'] });
              qc.invalidateQueries({ queryKey: ['monthly-data'] });
            }}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default FinanceManagement;
