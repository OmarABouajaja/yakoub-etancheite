import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject, deleteProject, updateProject, Project, uploadImage } from '@/lib/api';
import { Plus, Trash2, X, Upload, Image as ImageIcon, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const ProjectsManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'roof',
        image_before: '',
        image_after: '',
        gallery_images: [] as string[],
        project_type: 'before_after', // 'before_after' | 'gallery'
    });
    const [isUploading, setIsUploading] = useState({ before: false, after: false, gallery: false });
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after' | 'gallery') => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setIsUploading(prev => ({ ...prev, [type]: true }));
        try {
            if (type === 'gallery') {
                const urls = [];
                for (const file of files) {
                    const { url } = await uploadImage(file);
                    urls.push(url);
                }
                setFormData(prev => ({
                    ...prev,
                    gallery_images: [...prev.gallery_images, ...urls]
                }));
            } else {
                const { url } = await uploadImage(files[0]);
                setFormData(prev => ({
                    ...prev,
                    [type === 'before' ? 'image_before' : 'image_after']: url
                }));
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Échec du téléchargement de l\'image. Vérifiez votre stockage Supabase.');
        } finally {
            setIsUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    const removeGalleryImage = (index: number) => {
        setFormData(prev => {
            const newGallery = [...prev.gallery_images];
            newGallery.splice(index, 1);
            return { ...prev, gallery_images: newGallery };
        });
    };

    const { data: projects = [], isLoading } = useQuery<Project[]>({
        queryKey: ['projects'],
        queryFn: getProjects,
    });

    const addProject = useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setIsModalOpen(false);
            setFormData({ title: '', description: '', category: 'roof', image_before: '', image_after: '', gallery_images: [], project_type: 'before_after' });
        },
    });

    const removeProject = useMutation({
        mutationFn: deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const editProject = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateProject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setIsModalOpen(false);
            setEditingProject(null);
            setFormData({ title: '', description: '', category: 'roof', image_before: '', image_after: '', gallery_images: [], project_type: 'before_after' });
            toast.success('Projet modifié avec succès !');
        },
    });

    const openEditModal = (project: Project) => {
        setEditingProject(project);
        setFormData({
            title: project.title || '',
            description: project.description || '',
            category: project.category || 'roof',
            image_before: project.image_before || '',
            image_after: project.image_after || '',
            gallery_images: project.gallery_images || [],
            project_type: project.project_type || 'before_after',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProject) {
            editProject.mutate({ id: editingProject.id, data: formData });
        } else {
            addProject.mutate(formData);
        }
    };

    const categoryColors: Record<string, string> = {
        roof: 'bg-[hsl(var(--orange)/0.15)] text-[hsl(var(--orange))]',
        wall: 'bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal))]',
        pool: 'bg-[hsl(var(--water-blue)/0.15)] text-[hsl(var(--water-blue))]',
        basement: 'bg-[hsl(var(--orange)/0.15)] text-[hsl(var(--orange))]',
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-wider text-foreground">
                            Gestion du Portfolio
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Gérez vos réalisations et montrez votre expertise. ({projects.length} projets au total)
                        </p>
                    </div>
                    <button
                        onClick={() => { setEditingProject(null); setFormData({ title: '', description: '', category: 'roof', image_before: '', image_after: '', gallery_images: [], project_type: 'before_after' }); setIsModalOpen(true); }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[hsl(var(--orange))] hover:bg-[hsl(var(--orange)/0.8)] text-white rounded-md font-bold uppercase tracking-wider text-sm glow-button transition-all w-full md:w-auto shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                        Ajouter Projet
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div className="flex flex-wrap gap-2">
                        {['roof', 'wall', 'pool', 'basement'].map(cat => {
                            const labels: Record<string, string> = { roof: 'Toiture', wall: 'Mur', pool: 'Piscine', basement: 'Sous-sol' };
                            const isActive = categoryFilter === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(isActive ? null : cat)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        isActive 
                                        ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    {labels[cat]}
                                </button>
                            );
                        })}
                    </div>
                    <div className="w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Rechercher un projet..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-background border border-border rounded-md px-4 py-2 outline-none focus:border-primary text-sm transition-colors"
                        />
                    </div>
                </div>

                {/* Projects Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass-card aspect-video animate-pulse bg-muted" />
                        ))}
                    </div>
                ) : (() => {
                    const filteredProjects = projects.filter((project: Project) => {
                        if (categoryFilter && project.category !== categoryFilter) return false;
                        if (searchQuery.trim()) {
                            const q = searchQuery.toLowerCase();
                            if (!(project.title?.toLowerCase().includes(q) || project.description?.toLowerCase().includes(q))) {
                                return false;
                            }
                        }
                        return true;
                    });

                    if (filteredProjects.length === 0) {
                        return (
                            <div className="glass-card p-12 text-center">
                                <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    Aucun projet ne correspond à vos filtres.
                                </p>
                            </div>
                        );
                    }

                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map((project: Project, index: number) => (
                                <motion.div
                                key={project.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card overflow-hidden group"
                            >
                                {/* Image */}
                                <div className="relative aspect-video bg-muted">
                                    {project.image_after ? (
                                        <img
                                            src={project.image_after}
                                            alt={project.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                        </div>
                                    )}
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 gap-2">
                                        <button
                                            onClick={() => openEditModal(project)}
                                            className="p-2 bg-primary/90 text-primary-foreground rounded-md"
                                            title="Modifier"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => removeProject.mutate(project.id)}
                                            className="p-2 bg-destructive/90 text-destructive-foreground rounded-md"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-foreground">{project.title}</h3>
                                        <span className={`px-2 py-1 text-xs rounded-md ${categoryColors[project.category] || categoryColors.roof}`}>
                                            {project.category}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {project.description}
                                    </p>
                                </div>
                            </motion.div>
                            ))}
                        </div>
                    );
                })()}
            </div>

            {/* Add Project Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-background/80 backdrop-blur-sm"
                        onClick={() => { setIsModalOpen(false); setEditingProject(null); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.97 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/20 shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold font-display tracking-wider">{editingProject ? 'Modifier le Projet' : 'Ajouter Nouveau Projet'}</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">{editingProject ? 'Modifier les détails de ce projet' : 'Télécharger une nouvelle entrée de portfolio'}</p>
                                </div>
                                <button
                                    onClick={() => { setIsModalOpen(false); setEditingProject(null); }}
                                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <form id="add-project-form" onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Titre du Projet *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                required
                                                placeholder="ex: Étanchéité Toiture à Tunis"
                                                className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Catégorie *
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                                            >
                                                <option value="roof">Toiture</option>
                                                <option value="wall">Mur</option>
                                                <option value="pool">Piscine</option>
                                                <option value="basement">Sous-sol</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Description *
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={2}
                                            placeholder="Brève description des travaux réalisés..."
                                            className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary transition-colors text-sm resize-none"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Type d'Affichage du Projet
                                        </label>
                                        <div className="flex gap-6 p-4 rounded-lg bg-muted/20 border border-border">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" value="before_after" checked={formData.project_type === 'before_after'} onChange={(e) => setFormData({...formData, project_type: e.target.value as any})} className="accent-primary w-4 h-4" />
                                                <span className="text-sm font-medium text-foreground">Avant et Après</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" value="gallery" checked={formData.project_type === 'gallery'} onChange={(e) => setFormData({...formData, project_type: e.target.value as any})} className="accent-primary w-4 h-4" />
                                                <span className="text-sm font-medium text-foreground">Galerie de Réalisations</span>
                                            </label>
                                        </div>
                                    </div>

                                    {formData.project_type === 'before_after' ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                                                    Image Avant
                                                </label>
                                                <div className="relative group cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(e, 'before')}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        disabled={isUploading.before}
                                                    />
                                                    <div className={`
                                                        aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/20 transition-all
                                                        group-hover:border-primary/50 group-hover:bg-muted/40
                                                        ${formData.image_before ? 'border-solid border-primary/20' : ''}
                                                    `}>
                                                        {isUploading.before ? (
                                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                        ) : formData.image_before ? (
                                                            <img src={formData.image_before} alt="Before" className="w-full h-full object-cover rounded-md" />
                                                        ) : (
                                                            <>
                                                                <div className="p-3 rounded-full bg-background border border-border/50 mb-2 group-hover:scale-110 transition-transform shadow-sm">
                                                                    <Upload className="w-4 h-4 text-muted-foreground" />
                                                                </div>
                                                                <span className="text-xs text-muted-foreground font-medium">Télécharger Avant</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                                                    Image Après
                                                </label>
                                                <div className="relative group cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(e, 'after')}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        disabled={isUploading.after}
                                                    />
                                                    <div className={`
                                                        aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/20 transition-all
                                                        group-hover:border-primary/50 group-hover:bg-muted/40
                                                        ${formData.image_after ? 'border-solid border-primary/20' : ''}
                                                    `}>
                                                        {isUploading.after ? (
                                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                        ) : formData.image_after ? (
                                                            <img src={formData.image_after} alt="After" className="w-full h-full object-cover rounded-md" />
                                                        ) : (
                                                            <>
                                                                <div className="p-3 rounded-full bg-background border border-border/50 mb-2 group-hover:scale-110 transition-transform shadow-sm">
                                                                    <Upload className="w-4 h-4 text-muted-foreground" />
                                                                </div>
                                                                <span className="text-xs text-muted-foreground font-medium">Télécharger Après</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                                                Images de la Galerie
                                            </label>
                                            <div className="relative group cursor-pointer w-full">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={(e) => handleFileUpload(e, 'gallery')}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    disabled={isUploading.gallery}
                                                />
                                                <div className="h-28 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/20 transition-all group-hover:border-primary/50 group-hover:bg-muted/40">
                                                    {isUploading.gallery ? (
                                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                    ) : (
                                                        <>
                                                            <div className="p-3 rounded-full bg-background border border-border/50 mb-2 group-hover:scale-110 transition-transform shadow-sm">
                                                                <Upload className="w-4 h-4 text-muted-foreground" />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground font-medium">Cliquez ou Déposez les images ici</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {formData.gallery_images.length > 0 && (
                                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-4">
                                                    {formData.gallery_images.map((url, i) => (
                                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-border">
                                                            <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                                            <button 
                                                                type="button"
                                                                onClick={() => removeGalleryImage(i)}
                                                                className="absolute top-1 right-1 p-1.5 bg-destructive/90 text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </form>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/10 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingProject(null); }}
                                    className="px-5 py-2.5 rounded-lg hover:bg-muted transition-colors font-bold text-sm text-muted-foreground"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    form="add-project-form"
                                    disabled={addProject.isPending || editProject.isPending}
                                    className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg glow-button text-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {(addProject.isPending || editProject.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {(addProject.isPending || editProject.isPending) ? 'Enregistrement...' : (editingProject ? 'Modifier le Projet' : 'Enregistrer le Projet')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default ProjectsManagement;
