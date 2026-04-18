import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, X, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';


interface Testimonial {
  id: string;
  client_name: string;
  content: string;
  rating: number;
  city?: string;
  created_at: string;
}

const TestimonialsManagement = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentTestimonial, setCurrentTestimonial] = useState<Partial<Testimonial>>({
        client_name: '',
        content: '',
        rating: 5,
        city: ''
    });

    const fetchTestimonials = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('testimonials')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                // If the table doesn't exist yet, just mock it locally for now
                if (error.code === '42P01') {
                   console.log("No testimonials table in DB yet.");
                   setTestimonials([]);
                } else {
                    throw error;
                }
            } else {
                setTestimonials(data || []);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch testimonials.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const handleSave = async () => {
        if (!currentTestimonial.client_name || !currentTestimonial.content) {
            toast.error("Veuillez remplir le nom du client et le contenu.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (currentTestimonial.id) {
                const { error } = await supabase
                    .from('testimonials')
                    .update({
                        client_name: currentTestimonial.client_name,
                        content: currentTestimonial.content,
                        rating: currentTestimonial.rating,
                        city: currentTestimonial.city
                    })
                    .eq('id', currentTestimonial.id);
                if (error) throw error;
                toast.success("Témoignage mis à jour avec succès");
            } else {
                const { error } = await supabase
                    .from('testimonials')
                    .insert([{
                        client_name: currentTestimonial.client_name,
                        content: currentTestimonial.content,
                        rating: currentTestimonial.rating,
                        city: currentTestimonial.city,
                        created_at: new Date().toISOString()
                    }]);
                if (error) throw error;
                toast.success("Témoignage créé avec succès");
            }
            setIsEditing(false);
            setCurrentTestimonial({ client_name: '', content: '', rating: 5, city: '' });
            fetchTestimonials();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Impossible d'enregistrer le témoignage. Avez-vous créé la table dans Supabase ?");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer ce témoignage ?')) return;
        
        try {
            const { error } = await supabase.from('testimonials').delete().eq('id', id);
            if (error) throw error;
            toast.success("Témoignage supprimé");
            fetchTestimonials();
        } catch (err) {
            console.error(err);
            toast.error("Impossible de supprimer le témoignage.");
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-wider text-foreground">Gestion des Témoignages</h1>
                        <p className="text-muted-foreground mt-1 text-sm uppercase tracking-wider">Gérez ce que disent vos clients</p>
                    </div>
                    <button
                        onClick={() => {
                            setCurrentTestimonial({ client_name: '', content: '', rating: 5, city: '' });
                            setIsEditing(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all glow-button"
                    >
                        <Plus className="w-4 h-4" /> Ajouter un Avis
                    </button>
                </div>

                {/* Testimonials Table */}
                <div className="glass-card overflow-hidden urban-border">
                    {isLoading ? (
                        <table className="w-full text-left">
                            <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground text-sm uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider">Avis du Client</th>
                                    <th className="px-6 py-4 font-bold tracking-wider w-32">Évaluation</th>
                                    <th className="px-6 py-4 font-bold tracking-wider w-32 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3].map(i => (
                                    <tr key={i} className="border-b border-border/30">
                                        <td className="px-6 py-4">
                                            <div className="h-5 bg-muted/50 animate-pulse rounded w-1/4 mb-3" />
                                            <div className="h-4 bg-muted/50 animate-pulse rounded w-3/4" />
                                        </td>
                                        <td className="px-6 py-4"><div className="h-6 bg-muted/50 animate-pulse rounded w-20" /></td>
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            <div className="h-8 w-8 bg-muted/50 animate-pulse rounded-md" />
                                            <div className="h-8 w-8 bg-muted/50 animate-pulse rounded-md" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : testimonials.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                            <Star className="w-12 h-12 mb-4 opacity-50" />
                            <p className="font-bold text-lg text-foreground font-display tracking-wider">Aucun témoignage trouvé</p>
                            <p className="text-sm">Cliquez sur 'Ajouter un Avis' pour créer votre premier témoignage.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 border-b border-border text-muted-foreground text-sm uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Avis du Client</th>
                                        <th className="px-6 py-4 font-bold w-32">Évaluation</th>
                                        <th className="px-6 py-4 font-bold w-32 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {testimonials.map((test) => (
                                        <tr key={test.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-foreground font-display tracking-wider mb-1 flex items-center gap-2">
                                                    {test.client_name}
                                                    {test.city && <span className="text-xs text-[hsl(var(--cyan-bright))]">• {test.city}</span>}
                                                </div>
                                                <div className="text-sm text-muted-foreground line-clamp-2">"{test.content}"</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(test.rating) ? 'fill-[hsl(var(--cyan-bright))] text-[hsl(var(--cyan-bright))]' : 'text-muted'}`} />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setCurrentTestimonial(test); setIsEditing(true); }}
                                                        className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(test.id)}
                                                        className="p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-md transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Add/Edit Modal ── */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-background/80 backdrop-blur-sm"
                        onClick={() => setIsEditing(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.97 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/20">
                                <div>
                                    <h2 className="text-xl font-bold font-display tracking-wider">
                                        {currentTestimonial.id ? 'Modifier le Témoignage' : 'Nouveau Témoignage'}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Saisie de l'avis client</p>
                                </div>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom du Client *</label>
                                        <input
                                            type="text"
                                            className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary outline-none transition-colors text-sm"
                                            value={currentTestimonial.client_name}
                                            onChange={(e) => setCurrentTestimonial(prev => ({...prev, client_name: e.target.value}))}
                                            placeholder="e.g. Sami L."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ville / Emplacement</label>
                                        <input
                                            type="text"
                                            className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary outline-none transition-colors text-sm"
                                            value={currentTestimonial.city || ''}
                                            onChange={(e) => setCurrentTestimonial(prev => ({...prev, city: e.target.value}))}
                                            placeholder="e.g. Sousse"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Évaluation</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setCurrentTestimonial(prev => ({...prev, rating: star}))}
                                                className={`p-2 rounded-lg transition-all ${currentTestimonial.rating && currentTestimonial.rating >= star ? 'bg-[hsl(var(--cyan-bright))/0.15] scale-110' : 'bg-muted hover:bg-muted/80'}`}
                                            >
                                                <Star className={`w-6 h-6 transition-colors ${currentTestimonial.rating && currentTestimonial.rating >= star ? 'fill-[hsl(var(--cyan-bright))] text-[hsl(var(--cyan-bright))]' : 'text-muted-foreground'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contenu de l'Avis *</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary outline-none transition-colors text-sm resize-none h-32"
                                        value={currentTestimonial.content}
                                        onChange={(e) => setCurrentTestimonial(prev => ({...prev, content: e.target.value}))}
                                        placeholder="Service très professionnel, je recommande vivement..."
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/10">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-5 py-2.5 rounded-lg hover:bg-muted transition-colors font-bold text-sm text-muted-foreground"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg glow-button text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer le Témoignage'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};


export default TestimonialsManagement;
