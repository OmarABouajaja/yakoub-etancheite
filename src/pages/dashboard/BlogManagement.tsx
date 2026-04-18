import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBlogs, createBlog, updateBlog, deleteBlog, Blog } from '@/lib/blog-api';
import { uploadImage } from '@/lib/api';
import MDEditor from '@uiw/react-md-editor';
import { Plus, Edit, Trash2, X, Eye, FileText, Upload, Loader2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const BlogManagement = () => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [currentBlog, setCurrentBlog] = useState<Partial<Blog>>({
        title: '',
        excerpt: '',
        content: '',
        status: 'draft',
        cover_image: '',
        author_name: 'Yakoub Trabelsi',
        meta_keywords: ''
    });
    const [isUploading, setIsUploading] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { url } = await uploadImage(file);
            setCurrentBlog(prev => ({ ...prev, cover_image: url }));
            toast.success("Cover image uploaded successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const { data: blogs = [], isLoading } = useQuery({
        queryKey: ['blogs'],
        queryFn: getBlogs
    });

    const createMutation = useMutation({
        mutationFn: createBlog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
            toast.success("Blog published successfully!");
            setIsEditing(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: (args: { id: string, updates: Partial<Blog> }) => updateBlog(args.id, args.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
            toast.success("Blog updated successfully!");
            setIsEditing(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteBlog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
            toast.success("Blog deleted!");
        }
    });

    const handleSave = () => {
        if (!currentBlog.title || !currentBlog.content) {
            toast.error("Title and Content are required.");
            return;
        }

        if (currentBlog.id) {
            updateMutation.mutate({ id: currentBlog.id, updates: currentBlog });
        } else {
            createMutation.mutate(currentBlog);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-wider text-foreground">
                            Gestion du Blog
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gérez vos articles et votre contenu SEO organique.
                        </p>
                    </div>
                    {!isEditing && (
                        <button 
                            onClick={() => {
                                setCurrentBlog({ title: '', excerpt: '', content: '', status: 'published', cover_image: '' });
                                setIsEditing(true);
                            }}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Nouvel Article
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="glass-card p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h2 className="text-xl font-bold text-foreground">
                                {currentBlog.id ? 'Modifier Article' : 'Écrire un Nouvel Article'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Titre</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-background border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                    value={currentBlog.title}
                                    onChange={(e) => setCurrentBlog(prev => ({...prev, title: e.target.value}))}
                                    placeholder="5 Signes que votre Toiture a besoin d'Étanchéité..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground mb-2 block">Image de Couverture</label>
                                <div className="relative group cursor-pointer w-full h-11">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        disabled={isUploading}
                                    />
                                    <div className="w-full h-full bg-background border border-border rounded-md px-4 py-2 flex items-center justify-between group-hover:border-primary/50 transition-colors">
                                        <span className="text-sm truncate text-muted-foreground">
                                            {currentBlog.cover_image ? currentBlog.cover_image.split('/').pop() : 'Télécharger une image...' }
                                        </span>
                                        {isUploading ? (
                                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                        ) : (
                                            <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        )}
                                    </div>
                                </div>
                                {/* Preview rendered OUTSIDE the fixed-height relative wrapper */}
                                {currentBlog.cover_image && (
                                    <div className="mt-2 w-full aspect-video rounded-md overflow-hidden border border-border">
                                        <img src={currentBlog.cover_image} alt="Cover Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Extrait (Brève description Meta)</label>
                            <textarea 
                                className="w-full bg-background border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary outline-none resize-none h-20"
                                value={currentBlog.excerpt}
                                onChange={(e) => setCurrentBlog(prev => ({...prev, excerpt: e.target.value}))}
                                placeholder="Un bref résumé pour la recherche Google et la liste du blog public..."
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Nom de l'Auteur</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-background border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                    value={currentBlog.author_name || ''}
                                    onChange={(e) => setCurrentBlog(prev => ({...prev, author_name: e.target.value}))}
                                    placeholder="Yakoub Trabelsi"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Mots-clés Meta (séparés par des virgules)</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-background border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                    value={currentBlog.meta_keywords || ''}
                                    onChange={(e) => setCurrentBlog(prev => ({...prev, meta_keywords: e.target.value}))}
                                    placeholder="waterproofing, roof fixing, tunisia"
                                />
                            </div>
                        </div>

                        <div className="space-y-2" data-color-mode="dark">
                            <label className="text-sm font-medium text-foreground">Contenu Markdown</label>
                            <MDEditor
                                value={currentBlog.content || ''}
                                onChange={(val) => setCurrentBlog(prev => ({...prev, content: val || ''}))}
                                height={400}
                            />
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-border justify-end">
                            <div className="flex items-center gap-2 mr-auto">
                                <span className="text-sm text-muted-foreground">Statut :</span>
                                <select 
                                    className="bg-background border border-border rounded-md px-3 py-1 cursor-pointer"
                                    value={currentBlog.status}
                                    onChange={(e) => setCurrentBlog(prev => ({...prev, status: e.target.value as 'draft'|'published'}))}
                                >
                                    <option value="published">Publié</option>
                                    <option value="draft">Brouillon</option>
                                </select>
                            </div>
                            <button 
                                onClick={() => setIsPreviewing(true)}
                                className="px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary/10 font-bold transition-colors ml-4 mr-2"
                            >
                                Aperçu en Direct
                            </button>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 rounded-md border border-border hover:bg-muted font-medium transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-bold hover:bg-primary/90 transition-colors"
                            >
                                {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : "Enregistrer l'Article"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card overflow-hidden">
                        {isLoading ? (
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground text-sm uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Article</th>
                                        <th className="px-6 py-4 font-medium w-32">Statut</th>
                                        <th className="px-6 py-4 font-medium w-32">Date</th>
                                        <th className="px-6 py-4 font-medium w-32 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3].map(i => (
                                        <tr key={i} className="border-b border-border/30">
                                            <td className="px-6 py-4">
                                                <div className="h-5 bg-muted/50 animate-pulse rounded w-3/4 mb-3" />
                                                <div className="h-4 bg-muted/50 animate-pulse rounded w-1/2" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-6 bg-muted/50 animate-pulse rounded-full w-20" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 bg-muted/50 animate-pulse rounded w-24" />
                                            </td>
                                            <td className="px-6 py-4 flex justify-end gap-2">
                                                <div className="h-8 w-8 bg-muted/50 animate-pulse rounded-md" />
                                                <div className="h-8 w-8 bg-muted/50 animate-pulse rounded-md" />
                                                <div className="h-8 w-8 bg-muted/50 animate-pulse rounded-md" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : blogs.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                <FileText className="w-12 h-12 mb-4 opacity-50" />
                                <p>Aucun article trouvé. Créez votre premier article de blog !</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground text-sm uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Article</th>
                                        <th className="px-6 py-4 font-medium w-32">Statut</th>
                                        <th className="px-6 py-4 font-medium w-32">Date</th>
                                        <th className="px-6 py-4 font-medium w-32 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blogs.map(blog => (
                                        <tr key={blog.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-foreground">{blog.title}</div>
                                                <div className="text-sm text-muted-foreground truncate max-w-md">{blog.excerpt}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${blog.status === 'published' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                                                    {blog.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {new Date(blog.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <a href={`/blog/${blog.slug}`} target="_blank" rel="noreferrer" className="inline-block p-2 text-muted-foreground hover:text-primary transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                                <button onClick={() => { setCurrentBlog(blog); setIsEditing(true); }} className="inline-block p-2 text-muted-foreground hover:text-blue-400 transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { if(confirm("Are you sure?")) deleteMutation.mutate(blog.id); }} className="inline-block p-2 text-muted-foreground hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isPreviewing && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed inset-0 bg-background z-50 overflow-y-auto"
                    >
                        <div className="sticky top-0 w-full bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between z-[60]">
                            <h3 className="font-bold flex items-center gap-2"><Eye className="w-5 h-5 text-primary" /> Live Front-End Preview</h3>
                            <button onClick={() => setIsPreviewing(false)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold flex items-center gap-2">
                                <X className="w-4 h-4" /> Close Preview
                            </button>
                        </div>
                        <main className="pt-12 pb-24">
                            <div className="container mx-auto px-4 max-w-4xl">
                                <article>
                                    <header className="mb-12 text-center">
                                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
                                            {currentBlog.title || 'Untitled Article'}
                                        </h1>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-muted-foreground">
                                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-2"/> {new Date().toLocaleDateString()}</span>
                                            {currentBlog.author_name && <span className="flex items-center text-primary font-medium border-l border-border pl-4">Written by {currentBlog.author_name}</span>}
                                        </div>
                                    </header>

                                    {currentBlog.cover_image && (
                                        <div className="rounded-3xl overflow-hidden mb-16 shadow-2xl shadow-black/50 border border-white/5 bg-muted">
                                            <img src={currentBlog.cover_image} alt="Cover" className="w-full h-auto max-h-[600px] object-cover" />
                                        </div>
                                    )}

                                    <div className="prose prose-invert prose-lg max-w-none mx-auto prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl">
                                        <ReactMarkdown>
                                            {currentBlog.content || '*No content yet...*'}
                                        </ReactMarkdown>
                                    </div>
                                </article>
                            </div>
                        </main>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default BlogManagement;
