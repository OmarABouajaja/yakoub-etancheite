import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeads, updateLeadStatus, updateLead } from '@/lib/api';
import { Phone, Calendar, Home, Building, Droplets, layers, Layers, AlertTriangle, GripVertical, X, DollarSign, Pencil, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
    DndContext, 
    DragOverlay, 
    closestCorners, 
    useSensor, 
    useSensors, 
    PointerSensor, 
    DragStartEvent, 
    DragEndEvent 
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
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

// Sub-components for DND Context
const DraggableLeadCard = ({ lead, isDraggingOverlay = false, onClick }: { lead: any, isDraggingOverlay?: boolean, onClick?: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: lead.id,
        data: { lead },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
    } : undefined;

    if (isDragging && !isDraggingOverlay) {
        return (
            <div ref={setNodeRef} className="glass-card p-4 h-40 opacity-30 border-dashed border-2 border-primary/50 hidden md:block" />
        );
    }

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            onClick={onClick}
            className={`glass-card p-4 space-y-3 cursor-grab active:cursor-grabbing bg-card transition-colors ${isDraggingOverlay ? 'shadow-2xl scale-105 rotate-2' : 'hover:border-primary/50'}`}
        >
            <div className="flex items-start gap-2">
                <div {...listeners} {...attributes} className="hidden md:flex p-1 hover:bg-muted rounded text-muted-foreground cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">{lead.client_name}</h3>
                    <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1 bg-muted/30 px-2 py-0.5 rounded-md transition-colors" dir="ltr">
                        <Phone className="w-3 h-3" /> {lead.phone}
                    </a>
                </div>
            </div>

            <div className="space-y-2 pl-0 md:pl-6 pt-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {problemIcons[lead.problem_type] || <AlertTriangle className="w-3 h-3" />}
                    <span className="capitalize">{lead.problem_type}</span>
                    {lead.is_urgent && (
                        <span className="flex items-center gap-1 text-[hsl(var(--orange))] font-bold ml-auto">
                            <AlertTriangle className="w-3 h-3" /> Urgent
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(lead.created_at).toLocaleDateString()}
                </div>
                {lead.message && (
                    <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2 bg-muted/20 p-2 rounded-md">
                        "{lead.message}"
                    </p>
                )}
            </div>
            
            {/* Mobile quick indicator */}
            <div className="md:hidden pt-2 mt-2 border-t border-border/50 flex justify-center text-[10px] text-muted-foreground font-medium uppercase tracking-wider items-center gap-1">
                <Pencil className="w-3 h-3" /> Appuyez pour gérer ce prospect
            </div>
        </div>
    );
};

const DroppableColumn = ({ id, title, leads, onLeadClick }: { id: LeadStatus, title: string, leads: any[], onLeadClick: (lead: any) => void }) => {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: { status: id }
    });

    return (
        <div className="flex flex-col h-auto max-h-[500px] md:h-[75vh] w-full md:w-full md:max-w-none md:min-w-[280px] shrink-0 mb-6 md:mb-0">
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-bold text-lg text-foreground uppercase tracking-wider">{statusLabels[id] || title}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full font-bold border ${statusColors[id]}`}>
                    {leads.length}
                </span>
            </div>
            
            <div 
                ref={setNodeRef} 
                className={`flex-1 p-3 rounded-xl border border-border/50 bg-black/20 overflow-y-auto space-y-3 transition-colors ${isOver ? 'bg-primary/10 border-primary/50' : ''}`}
            >
                {leads.map(lead => (
                    <DraggableLeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
                ))}
                
                {leads.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                        Déposez ici
                    </div>
                )}
            </div>
        </div>
    );
};

const LeadsManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeLead, setActiveLead] = useState<any | null>(null);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
    const [isEditingLead, setIsEditingLead] = useState(false);
    const [editLeadData, setEditLeadData] = useState({ client_name: '', phone: '', problem_type: '', surface_area: '', message: '' });
    const [isEditSaving, setIsEditSaving] = useState(false);
    const [newLead, setNewLead] = useState({ name: '', phone: '', problem_type: 'roof', surface_area: '', region: '', notes: '', status: 'new' });

    const { data: leads = [], isLoading } = useQuery({
        queryKey: ['leads'],
        queryFn: getLeads,
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            updateLeadStatus(id, status),
        onMutate: async (variables) => {
            // Optimistic update
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
            // Rollback on error
            queryClient.setQueryData(['leads'], context?.previousLeads);
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

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement before drag starts
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveLead(active.data.current?.lead);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveLead(null);

        if (over && over.id) {
            const newStatus = over.id as LeadStatus;
            const leadId = active.id as string;
            const currentStatus = active.data.current?.lead.status;

            if (newStatus !== currentStatus) {
                updateStatus.mutate({ id: leadId, status: newStatus });
            }
        }
    };

    // Group leads by status
    const groupedLeads = {
        new: leads.filter((l: any) => l.status === 'new' || !l.status),
        contacted: leads.filter((l: any) => l.status === 'contacted'),
        converted: leads.filter((l: any) => l.status === 'converted'),
        lost: leads.filter((l: any) => l.status === 'lost'),
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-wider text-foreground">
                            Tableau des Prospects
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Glissez-déposez les prospects pour mettre à jour leur statut.
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsAddLeadOpen(true)}
                        className="bg-[hsl(var(--orange))] hover:bg-[hsl(var(--orange)/0.8)] text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all glow-button"
                    >
                        + Nouveau Prospect
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {[1, 2, 3, 4].map(col => (
                            <div key={col} className="w-[300px] h-[60vh] bg-muted/20 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto overflow-x-hidden md:overflow-x-auto pb-4 custom-scrollbar">
                        <DndContext 
                            sensors={sensors}
                            collisionDetection={closestCorners}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex flex-col md:flex-row gap-6 w-full px-1">
                                <DroppableColumn id="new" title="Nouveau" leads={groupedLeads.new} onLeadClick={setSelectedLead} />
                                <DroppableColumn id="contacted" title="Contacté" leads={groupedLeads.contacted} onLeadClick={setSelectedLead} />
                                <DroppableColumn id="converted" title="Converti" leads={groupedLeads.converted} onLeadClick={setSelectedLead} />
                                <DroppableColumn id="lost" title="Perdu" leads={groupedLeads.lost} onLeadClick={setSelectedLead} />
                            </div>

                            <DragOverlay>
                                {activeLead ? <DraggableLeadCard lead={activeLead} isDraggingOverlay /> : null}
                            </DragOverlay>
                        </DndContext>
                    </div>
                )}
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
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
        </DashboardLayout>
    );
};

export default LeadsManagement;
