import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeads, updateLeadStatus, updateLead } from '@/lib/api';
import { Phone, Calendar, Home, Building, Droplets, Layers, AlertTriangle, X, DollarSign, Pencil, Check, Loader2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Types
type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost';

const problemIcons: Record<string, React.ReactNode> = {
    roof: <Home className="w-4 h-4" />,
    wall: <Building className="w-4 h-4" />,
    pool: <Droplets className="w-4 h-4" />,
    basement: <Layers className="w-4 h-4" />,
};

const statusColors: Record<string, string> = {
    new: 'bg-[hsl(var(--orange)/0.15)] text-[hsl(var(--orange))] border-[hsl(var(--orange)/0.3)]',
    contacted: 'bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal))] border-[hsl(var(--teal)/0.3)]',
    converted: 'bg-green-500/15 text-green-500 border-green-500/30',
    lost: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
    new: 'Nouveau',
    contacted: 'Contacté',
    converted: 'Converti',
    lost: 'Perdu',
};

const LeadsManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
    const [isEditingLead, setIsEditingLead] = useState(false);
    const [editLeadData, setEditLeadData] = useState({ client_name: '', phone: '', problem_type: '', surface_area: '', message: '' });
    const [isEditSaving, setIsEditSaving] = useState(false);
    const [newLead, setNewLead] = useState({ name: '', phone: '', problem_type: 'roof', surface_area: '', region: '', notes: '', status: 'new' });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<string>('date-desc');

    const { data: leads = [], isLoading } = useQuery({
        queryKey: ['leads'],
        queryFn: getLeads,
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            updateLeadStatus(id, status),
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ['leads'] });
            const previousLeads = queryClient.getQueryData(['leads']);
            
            queryClient.setQueryData(['leads'], (old: any[]) => {
                return (old || []).map(lead => 
                    lead.id === variables.id ? { ...lead, status: variables.status } : lead
                );
            });
            
            return { previousLeads };
        },
        onError: (_err, _variables, context) => {
            queryClient.setQueryData(['leads'], context?.previousLeads);
            toast.error("Erreur lors de la mise à jour du statut.");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
    });

    const addManualLead = async () => {
        if (!newLead.name || !newLead.phone) {
            toast.error("Le nom et le téléphone sont requis.");
            return;
        }
        try {
            const richMessage = `[Région: ${newLead.region || 'Non spécifiée'}]\n\n${newLead.notes || ''}`.trim();

            const { error } = await supabase.from('leads').insert([
                { 
                    client_name: newLead.name,
                    phone: newLead.phone,
                    problem_type: newLead.problem_type,
                    surface_area: newLead.surface_area,
                    message: richMessage,
                    status: newLead.status,
                    created_at: new Date().toISOString() 
                }
            ]);
            if (error) throw error;
            toast.success("Prospect ajouté avec succès !");
            setIsAddLeadOpen(false);
            setNewLead({ name: '', phone: '', problem_type: 'roof', surface_area: '', region: '', notes: '', status: 'new' });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Échec de l'ajout du prospect.");
        }
    };

    // Filter and Sort leads
    const filteredLeads = leads.filter((lead: any) => {
        if (statusFilter && (lead.status || 'new') !== statusFilter) return false;
        
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (lead.client_name && lead.client_name.toLowerCase().includes(q)) ||
            (lead.phone && lead.phone.includes(q)) ||
            (lead.problem_type && lead.problem_type.toLowerCase().includes(q)) ||
            (lead.message && lead.message.toLowerCase().includes(q))
        );
    });

    const sortedLeads = [...filteredLeads].sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortBy === 'date-asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortBy === 'name-asc') return (a.client_name || '').localeCompare(b.client_name || '');
        if (sortBy === 'name-desc') return (b.client_name || '').localeCompare(a.client_name || '');
        return 0;
    });

    const counts = {
        new: leads.filter((l: any) => l.status === 'new' || !l.status).length,
        contacted: leads.filter((l: any) => l.status === 'contacted').length,
        converted: leads.filter((l: any) => l.status === 'converted').length,
        lost: leads.filter((l: any) => l.status === 'lost').length,
        total: leads.length
    };

    const StatusSelect = ({ lead }: { lead: any }) => (
        <select
            onClick={(e) => e.stopPropagation()} // Prevent opening details modal
            value={lead.status || 'new'}
            onChange={(e) => {
                updateStatus.mutate({ id: lead.id, status: e.target.value });
                if (selectedLead?.id === lead.id) {
                    setSelectedLead({ ...selectedLead, status: e.target.value });
                }
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold outline-none cursor-pointer appearance-none text-center min-w-[100px] border ${statusColors[lead.status || 'new']} transition-all hover:brightness-110`}
            style={{ backgroundImage: 'none' }}
        >
            <option value="new">Nouveau</option>
            <option value="contacted">Contacté</option>
            <option value="converted">Converti</option>
            <option value="lost">Perdu</option>
        </select>
    );

    return (
        <DashboardLayout>
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-wider text-foreground">
                            Tableau des Prospects
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Gérez vos leads entrants de manière intelligente et productive.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Rechercher un prospect..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-background border border-border rounded-md px-4 py-2 outline-none focus:border-primary text-sm transition-colors"
                            />
                        </div>
                        <div className="relative w-full sm:w-48">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-background border border-border rounded-md px-4 py-2 outline-none focus:border-primary text-sm transition-colors cursor-pointer"
                            >
                                <option value="date-desc">Plus récents d'abord</option>
                                <option value="date-asc">Plus anciens d'abord</option>
                                <option value="name-asc">Nom (A-Z)</option>
                                <option value="name-desc">Nom (Z-A)</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => setIsAddLeadOpen(true)}
                            className="bg-[hsl(var(--orange))] hover:bg-[hsl(var(--orange)/0.8)] text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all glow-button w-full sm:w-auto justify-center shrink-0"
                        >
                            + Nouveau Prospect
                        </button>
                    </div>
                </div>

                {/* KPI Counters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { id: 'new', label: 'Nouveaux', count: counts.new, color: 'text-[hsl(var(--orange))]', bg: 'bg-[hsl(var(--orange)/0.1)] border-[hsl(var(--orange)/0.2)]' },
                        { id: 'contacted', label: 'Contactés', count: counts.contacted, color: 'text-[hsl(var(--teal))]', bg: 'bg-[hsl(var(--teal)/0.1)] border-[hsl(var(--teal)/0.2)]' },
                        { id: 'converted', label: 'Convertis', count: counts.converted, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
                        { id: 'lost', label: 'Perdus', count: counts.lost, color: 'text-muted-foreground', bg: 'bg-muted/10 border-border' },
                    ].map(stat => {
                        const isActive = statusFilter === stat.id;
                        return (
                            <div 
                                key={stat.id} 
                                onClick={() => setStatusFilter(isActive ? null : stat.id)}
                                className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-200 select-none ${
                                    isActive 
                                    ? stat.bg + ' ring-2 ring-primary/50 scale-[1.02] shadow-lg' 
                                    : stat.bg + ' hover:scale-[1.02] hover:bg-opacity-80 opacity-70 hover:opacity-100'
                                }`}
                            >
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                    {stat.label}
                                    {isActive && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                </span>
                                <span className={`text-3xl font-display font-black mt-2 ${stat.color}`}>{stat.count}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Table / List Container */}
                <div className="flex-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                    {isLoading ? (
                        <div className="p-8 flex justify-center items-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : sortedLeads.length === 0 ? (
                        <div className="p-12 flex flex-col items-center justify-center text-center h-full">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">Aucun prospect</h3>
                            <p className="text-muted-foreground text-sm max-w-md">
                                Vous n'avez pas encore de prospect. Ajoutez-en un manuellement ou attendez qu'un client remplisse le formulaire.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            {/* Desktop Table (Hidden on Mobile) */}
                            <table className="w-full hidden md:table text-left border-collapse">
                                <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Client & Contact</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Projet</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/4">Message</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Statut</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {sortedLeads.map((lead) => (
                                        <tr 
                                            key={lead.id} 
                                            onClick={() => setSelectedLead(lead)}
                                            className="hover:bg-muted/20 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {new Date(lead.created_at).toLocaleDateString()}
                                                <div className="text-[10px] mt-0.5 opacity-70">
                                                    {new Date(lead.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-foreground">{lead.client_name}</div>
                                                <a 
                                                    href={`tel:${lead.phone}`} 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mt-1" 
                                                    dir="ltr"
                                                >
                                                    <Phone className="w-3 h-3" /> {lead.phone}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-foreground">
                                                    <span className="p-1.5 bg-muted rounded-md text-muted-foreground">
                                                        {problemIcons[lead.problem_type] || <AlertTriangle className="w-3 h-3" />}
                                                    </span>
                                                    <span className="capitalize">{lead.problem_type}</span>
                                                    {lead.is_urgent && (
                                                        <span className="flex items-center gap-1 text-[hsl(var(--orange))] font-bold text-[10px] uppercase ml-2 px-1.5 py-0.5 bg-[hsl(var(--orange)/0.1)] rounded">
                                                            Urgent
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs" title={lead.message}>
                                                    {lead.message || <span className="italic opacity-50">Aucun message</span>}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <StatusSelect lead={lead} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile List (Hidden on Desktop) */}
                            <div className="md:hidden flex flex-col divide-y divide-border/50">
                                {sortedLeads.map((lead) => (
                                    <div 
                                        key={lead.id} 
                                        onClick={() => setSelectedLead(lead)}
                                        className="p-4 flex flex-col gap-3 active:bg-muted/20 transition-colors cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-foreground text-base leading-tight">{lead.client_name}</h3>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(lead.created_at).toLocaleDateString()} à {new Date(lead.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                            <StatusSelect lead={lead} />
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <a 
                                                href={`tel:${lead.phone}`} 
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-md text-foreground hover:text-primary" 
                                                dir="ltr"
                                            >
                                                <Phone className="w-3 h-3" /> {lead.phone}
                                            </a>
                                            <span className="inline-flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-md text-foreground capitalize">
                                                {problemIcons[lead.problem_type] || <AlertTriangle className="w-3 h-3" />}
                                                {lead.problem_type}
                                            </span>
                                            {lead.is_urgent && (
                                                <span className="inline-flex items-center gap-1 text-[hsl(var(--orange))] font-bold text-[10px] uppercase px-1.5 py-1 bg-[hsl(var(--orange)/0.1)] rounded-md">
                                                    Urgent
                                                </span>
                                            )}
                                        </div>

                                        {lead.message && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1 bg-muted/20 p-2 rounded-md">
                                                {lead.message}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lead Details Sidebar */}
            <AnimatePresence>
                {selectedLead && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                            onClick={() => setSelectedLead(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <h2 className="text-2xl font-bold font-display tracking-wider">Détails du Prospect</h2>
                                <div className="flex items-center gap-2">
                                    {!isEditingLead && (
                                        <button onClick={() => { setIsEditingLead(true); setEditLeadData({ client_name: selectedLead.client_name, phone: selectedLead.phone, problem_type: selectedLead.problem_type || '', surface_area: selectedLead.surface_area || '', message: selectedLead.message || '' }); }} className="p-2 hover:bg-primary/10 rounded-md text-primary transition-colors" title="Modifier">
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button onClick={() => { setSelectedLead(null); setIsEditingLead(false); }} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {isEditingLead ? (
                                    /* ── EDIT MODE ── */
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom du Client</label>
                                            <input type="text" className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary text-sm" value={editLeadData.client_name} onChange={e => setEditLeadData({...editLeadData, client_name: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Téléphone</label>
                                            <input type="text" dir="ltr" className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary text-sm font-mono" value={editLeadData.phone} onChange={e => setEditLeadData({...editLeadData, phone: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type de Problème</label>
                                            <select className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary text-sm" value={editLeadData.problem_type} onChange={e => setEditLeadData({...editLeadData, problem_type: e.target.value})}>
                                                <option value="roof">Fuite Toiture</option>
                                                <option value="wall">Infiltration Murs</option>
                                                <option value="pool">Problème Piscine</option>
                                                <option value="basement">Humidité Sous-sol</option>
                                                <option value="other">Autre</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Surface (m²)</label>
                                            <input type="text" className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary text-sm" value={editLeadData.surface_area} onChange={e => setEditLeadData({...editLeadData, surface_area: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message / Notes</label>
                                            <textarea className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary text-sm min-h-[100px]" value={editLeadData.message} onChange={e => setEditLeadData({...editLeadData, message: e.target.value})} />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                disabled={isEditSaving}
                                                onClick={async () => {
                                                    setIsEditSaving(true);
                                                    try {
                                                        await updateLead(selectedLead.id, {
                                                            client_name: editLeadData.client_name,
                                                            phone: editLeadData.phone,
                                                            problem_type: editLeadData.problem_type,
                                                            surface_area: editLeadData.surface_area ? Number(editLeadData.surface_area) : null,
                                                            message: editLeadData.message,
                                                        });
                                                        toast.success('Prospect modifié !');
                                                        setSelectedLead({...selectedLead, ...editLeadData, surface_area: editLeadData.surface_area ? Number(editLeadData.surface_area) : null});
                                                        setIsEditingLead(false);
                                                        queryClient.invalidateQueries({ queryKey: ['leads'] });
                                                    } catch (err: any) {
                                                        toast.error(err.message || 'Erreur');
                                                    } finally {
                                                        setIsEditSaving(false);
                                                    }
                                                }}
                                                className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-bold glow-button disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isEditSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                {isEditSaving ? 'Enregistrement...' : 'Enregistrer'}
                                            </button>
                                            <button onClick={() => setIsEditingLead(false)} className="px-5 py-3 rounded-lg hover:bg-muted transition-colors font-bold text-sm text-muted-foreground">
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── VIEW MODE ── */
                                    <>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground mb-1">{selectedLead.client_name}</h3>
                                    <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase tracking-wider border ${statusColors[selectedLead.status || 'new']}`}>
                                        {statusLabels[selectedLead.status || 'new'] || selectedLead.status || 'new'}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-3 p-3 bg-muted/50 rounded-md hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer group">
                                        <div className="p-2 bg-background rounded-full group-hover:bg-primary/20">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Numéro de Téléphone</p>
                                            <p className="font-bold font-mono" dir="ltr">{selectedLead.phone}</p>
                                        </div>
                                    </a>

                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                                        <div className="p-2 bg-background rounded-full">
                                            {problemIcons[selectedLead.problem_type] || <AlertTriangle className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Type de Problème</p>
                                            <p className="font-bold capitalize">{selectedLead.problem_type}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                                        <div className="p-2 bg-background rounded-full">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Date de Création</p>
                                            <p className="font-bold">{new Date(selectedLead.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {selectedLead.surface_area && (
                                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                                            <div className="p-2 bg-background rounded-full">
                                                <Layers className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Surface Estimée</p>
                                                <p className="font-bold">{selectedLead.surface_area} m²</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Message</h4>
                                    <div className="p-4 bg-muted/30 rounded-md border border-border/50 text-sm whitespace-pre-wrap">
                                        {selectedLead.message ? `"${selectedLead.message}"` : <span className="italic text-muted-foreground">Aucun message fourni.</span>}
                                    </div>
                                </div>
                                    </>
                                )}
                            </div>

                            <div className="p-6 border-t border-border bg-muted/10">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Déplacement Rapide</label>
                                <select 
                                    className="w-full bg-background border border-border rounded-md px-4 py-3 font-medium outline-none focus:border-primary"
                                    value={selectedLead.status || 'new'}
                                    onChange={(e) => {
                                        updateStatus.mutate({ id: selectedLead.id, status: e.target.value });
                                        setSelectedLead(prev => ({...prev, status: e.target.value}));
                                    }}
                                >
                                    <option value="new">Nouveau Prospect</option>
                                    <option value="contacted">Contacté</option>
                                    <option value="converted">Converti</option>
                                    <option value="lost">Perdu</option>
                                </select>
                                
                                {selectedLead.status === 'converted' && (
                                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                        <h4 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" /> Suivi Financier
                                        </h4>
                                        <p className="text-xs text-muted-foreground mb-4">Ce prospect est converti. Vous pouvez gérer ses paiements, coûts, marges et factures dans la Trésorerie.</p>
                                        <Link 
                                            to="/dashboard/finance" 
                                            className="w-full flex justify-center items-center gap-2 bg-green-500 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] py-2.5 rounded-md font-bold transition-all text-sm"
                                        >
                                            Ouvrir la Trésorerie
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Manual Add Lead Modal */}
            <AnimatePresence>
                {isAddLeadOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-background/80 backdrop-blur-sm"
                        onClick={() => setIsAddLeadOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.97 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/20 shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold font-display tracking-wider">Ajouter Nouveau Prospect</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Enregistrer manuellement un nouveau prospect</p>
                                </div>
                                <button
                                    onClick={() => setIsAddLeadOpen(false)}
                                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom du Client *</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                                        placeholder="ex: Mohamed Ben Ali"
                                        value={newLead.name}
                                        onChange={e => setNewLead({...newLead, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Numéro de Téléphone *</label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary transition-colors text-sm font-mono"
                                        placeholder="+216 XX XXX XXX"
                                        value={newLead.phone}
                                        onChange={e => setNewLead({...newLead, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type de Problème</label>
                                    <select
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                                        value={newLead.problem_type}
                                        onChange={e => setNewLead({...newLead, problem_type: e.target.value})}
                                    >
                                        <option value="roof">Fuite Toiture / Toit Terrasse</option>
                                        <option value="wall">Infiltration Murs / Façade</option>
                                        <option value="pool">Problème Piscine / Bassin</option>
                                        <option value="basement">Humidité Sous-sol / Cave</option>
                                        <option value="other">Autre Problème</option>
                                    </select>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Région</label>
                                        <input
                                            type="text"
                                            className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                                            placeholder="ex: Tunis, Sousse..."
                                            value={newLead.region}
                                            onChange={e => setNewLead({...newLead, region: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Surface (m²)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                                            placeholder="ex: 120"
                                            value={newLead.surface_area}
                                            onChange={e => setNewLead({...newLead, surface_area: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message / Notes</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary transition-colors text-sm min-h-[100px]"
                                        placeholder="Détails supplémentaires ou demande du client..."
                                        value={newLead.notes}
                                        onChange={e => setNewLead({...newLead, notes: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/10 shrink-0">
                                <button
                                    onClick={() => setIsAddLeadOpen(false)}
                                    className="px-5 py-2.5 rounded-lg hover:bg-muted transition-colors font-bold text-sm text-muted-foreground"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={addManualLead}
                                    className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg glow-button text-sm"
                                >
                                    Sauvegarder
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </DashboardLayout>
    );
};

export default LeadsManagement;
