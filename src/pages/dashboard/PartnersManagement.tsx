import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Loader2, Image as ImageIcon, Upload, Award, Pencil, X, Check } from 'lucide-react';
import { uploadImage } from '@/lib/api';
import { toast } from 'sonner';

interface Partner {
    id: string;
    name: string;
    logo_url: string;
}

const PartnersManagement: React.FC = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // New Partner Form
    const [newName, setNewName] = useState('');
    const [newLogoUrl, setNewLogoUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editLogoUrl, setEditLogoUrl] = useState('');
    const [isEditUploading, setIsEditUploading] = useState(false);
    const [isEditSaving, setIsEditSaving] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { url } = await uploadImage(file);
            setNewLogoUrl(url);
            toast.success("Image téléchargée !");
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Échec de l\'upload de l\'image. Réessayez.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsEditUploading(true);
        try {
            const { url } = await uploadImage(file);
            setEditLogoUrl(url);
            toast.success("Nouvelle image téléchargée !");
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Échec de l\'upload. Réessayez.');
        } finally {
            setIsEditUploading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('partners')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42P01') {
                    console.warn("La table partners n'existe pas encore. Veuillez la créer.");
                } else {
                    throw error;
                }
            } else {
                setPartners(data || []);
            }
        } catch (err: any) {
            console.error('Error fetching partners:', err);
            toast.error(err.message || 'Impossible de récupérer les partenaires');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPartner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newLogoUrl) {
            toast.error("Veuillez fournir le nom et l'URL du logo");
            return;
        }

        setIsSaving(true);
        try {
            const { data, error } = await supabase
                .from('partners')
                .insert([{ name: newName, logo_url: newLogoUrl }])
                .select()
                .single();

            if (error) throw error;

            toast.success('Produit ajouté avec succès !');
            setPartners([data, ...partners]);
            setNewName('');
            setNewLogoUrl('');
        } catch (err: any) {
            console.error('Error adding partner:', err);
            toast.error(err.message || "Impossible d'ajouter le produit. La table est-elle créée ?");
        } finally {
            setIsSaving(false);
        }
    };

    const startEditing = (partner: Partner) => {
        setEditingId(partner.id);
        setEditName(partner.name);
        setEditLogoUrl(partner.logo_url);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
        setEditLogoUrl('');
    };

    const handleSaveEdit = async (id: string) => {
        if (!editName || !editLogoUrl) {
            toast.error("Le nom et le logo sont requis.");
            return;
        }

        setIsEditSaving(true);
        try {
            const { error } = await supabase
                .from('partners')
                .update({ name: editName, logo_url: editLogoUrl })
                .eq('id', id);

            if (error) throw error;

            toast.success('Produit modifié avec succès !');
            setPartners(partners.map(p => p.id === id ? { ...p, name: editName, logo_url: editLogoUrl } : p));
            setEditingId(null);
        } catch (err: any) {
            console.error('Error updating partner:', err);
            toast.error(err.message || 'Impossible de modifier le produit');
        } finally {
            setIsEditSaving(false);
        }
    };

    const handleDeletePartner = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;

        try {
            const { error } = await supabase
                .from('partners')
                .delete()
                .eq('id', id);

            if (error) throw error;
            
            toast.success('Produit supprimé avec succès');
            setPartners(partners.filter(p => p.id !== id));
            if (editingId === id) setEditingId(null);
        } catch (err: any) {
            console.error('Error deleting partner:', err);
            toast.error('Impossible de supprimer le produit');
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-display tracking-wider text-foreground">Matériaux & Produits</h1>
                    <p className="text-muted-foreground mt-1 text-sm uppercase tracking-wider">Gérez les logos des produits affichés dans le carrousel rotatif</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Add New Partner */}
                    <div className="lg:col-span-1">
                        <div className="glass-card urban-border p-6 md:p-8 sticky top-24">
                            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                                <Plus className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-lg font-display tracking-wider text-foreground">Ajouter un Produit</h3>
                            </div>
                            
                            <form onSubmit={handleAddPartner} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Nom du Produit / Marque</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g. Derbigum"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Logo du Produit (PNG/JPG)</label>
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="logoUpload"
                                            disabled={isUploading}
                                        />
                                        <label 
                                            htmlFor="logoUpload"
                                            className="w-full flex flex-col items-center justify-center gap-2 bg-background border border-border rounded-md px-4 py-8 cursor-pointer hover:border-primary transition-colors border-dashed"
                                        >
                                            {isUploading ? (
                                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                            ) : newLogoUrl ? (
                                                <img src={newLogoUrl} alt="Aperçu" className="max-h-16 object-contain" />
                                            ) : (
                                                <>
                                                    <Upload className="w-6 h-6 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground font-medium text-center">Cliquez pour importer une image</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isSaving || isUploading || !newLogoUrl || !newName}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-4 focus:ring-primary/20 px-4 py-3 rounded-md font-bold transition-all glow-button flex justify-center items-center gap-2 disabled:opacity-50 mt-6"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ajouter Produit'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Active Partners List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                            <Award className="w-5 h-5 text-[hsl(var(--cyan-bright))]" />
                            <h3 className="font-bold text-lg font-display tracking-wider text-foreground">Produits Actifs ({partners.length})</h3>
                        </div>

                        {partners.length === 0 ? (
                            <div className="glass-card p-12 text-center border border-dashed border-primary/30">
                                <ImageIcon className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
                                <h4 className="text-lg font-bold text-foreground mb-1">Aucun Produit Trouvé</h4>
                                <p className="text-muted-foreground text-sm">Ajoutez votre premier logo de produit pour remplir le carrousel.</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {partners.map((partner) => (
                                    <div key={partner.id} className="glass-card p-4 urban-border flex flex-col items-center group relative mt-4">
                                        {/* Action buttons */}
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            {editingId === partner.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSaveEdit(partner.id)}
                                                        disabled={isEditSaving || isEditUploading}
                                                        className="p-2 bg-green-500/15 text-green-400 rounded-md hover:bg-green-500 hover:text-white transition-colors disabled:opacity-50"
                                                        title="Enregistrer"
                                                    >
                                                        {isEditSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="p-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
                                                        title="Annuler"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => startEditing(partner)}
                                                        className="p-2 bg-primary/10 text-primary rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeletePartner(partner.id)}
                                                        className="p-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Card content */}
                                        {editingId === partner.id ? (
                                            /* ── Edit Mode ── */
                                            <div className="w-full space-y-4 pt-8">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nom</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Logo</label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleEditFileUpload}
                                                        className="hidden"
                                                        id={`editUpload-${partner.id}`}
                                                        disabled={isEditUploading}
                                                    />
                                                    <label
                                                        htmlFor={`editUpload-${partner.id}`}
                                                        className="w-full flex flex-col items-center justify-center gap-1 bg-background border border-border rounded-md p-4 cursor-pointer hover:border-primary transition-colors border-dashed"
                                                    >
                                                        {isEditUploading ? (
                                                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                                        ) : (
                                                            <>
                                                                <img src={editLogoUrl} alt="Aperçu" className="max-h-12 object-contain" />
                                                                <span className="text-xs text-muted-foreground mt-1">Cliquez pour changer</span>
                                                            </>
                                                        )}
                                                    </label>
                                                </div>
                                            </div>
                                        ) : (
                                            /* ── Display Mode ── */
                                            <>
                                                <div className="h-24 w-full flex items-center justify-center p-4 bg-white/5 rounded-sm mb-4">
                                                    <img 
                                                        src={partner.logo_url} 
                                                        alt={partner.name} 
                                                        className="max-h-full max-w-full object-contain" 
                                                    />
                                                </div>
                                                <h4 className="font-bold font-display tracking-wider text-lg">{partner.name}</h4>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PartnersManagement;
