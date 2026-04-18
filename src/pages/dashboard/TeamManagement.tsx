import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, Shield, User, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor';
  created_at: string;
}

const TeamManagement = () => {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentMember, setCurrentMember] = useState<Partial<TeamMember>>({
        name: '',
        email: '',
        role: 'editor'
    });

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42P01') {
                   console.log("No team_members table in DB yet.");
                   setMembers([]);
                } else {
                    throw error;
                }
            } else {
                setMembers(data || []);
            }
        } catch (err) {
            console.error(err);
            toast.error("Impossible de récupérer les membres de l'équipe.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleSave = async () => {
        if (!currentMember.name || !currentMember.email) {
            toast.error("Veuillez remplir le nom et l'email.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (currentMember.id) {
                const { error } = await supabase
                    .from('team_members')
                    .update({
                        name: currentMember.name,
                        email: currentMember.email,
                        role: currentMember.role
                    })
                    .eq('id', currentMember.id);
                if (error) throw error;
                toast.success("Membre de l'équipe mis à jour avec succès");
            } else {
                const { error } = await supabase
                    .from('team_members')
                    .insert([{
                        name: currentMember.name,
                        email: currentMember.email,
                        role: currentMember.role,
                        created_at: new Date().toISOString()
                    }]);
                if (error) throw error;
                toast.success("Membre ajouté avec succès !");
            }
            setIsEditing(false);
            setCurrentMember({ name: '', email: '', role: 'editor' });
            fetchMembers();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Impossible d'enregistrer le membre de l'équipe. Avez-vous créé la table team_members ?");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment retirer ce membre de l'équipe ? Son accès sera révoqué.")) return;
        
        try {
            const { error } = await supabase.from('team_members').delete().eq('id', id);
            if (error) throw error;
            toast.success("Membre de l'équipe retiré");
            fetchMembers();
        } catch (err) {
            console.error(err);
            toast.error("Impossible de retirer le membre de l'équipe.");
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-wider text-foreground">Gestion de l'Équipe</h1>
                        <p className="text-muted-foreground mt-1 text-sm uppercase tracking-wider">Gérez les accès et rôles de votre personnel</p>
                    </div>
                    {!isEditing && (
                        <button 
                            onClick={() => {
                                setCurrentMember({ name: '', email: '', role: 'editor' });
                                setIsEditing(true);
                            }}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all glow-button"
                        >
                            <Plus className="w-4 h-4" /> Inviter un Membre
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="glass-card p-6 md:p-8 space-y-6 urban-border">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h2 className="text-xl font-bold text-foreground font-display tracking-wider">
                                {currentMember.id ? "Modifier le Membre de l'Équipe" : 'Inviter un Nouveau Membre'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-foreground uppercase tracking-wider">Nom Complet</label>
                                <div className="relative">
                                    <User className="w-5 h-5 absolute left-3 top-3.5 text-muted-foreground" />
                                    <input 
                                        type="text" 
                                        className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                        value={currentMember.name}
                                        onChange={(e) => setCurrentMember(prev => ({...prev, name: e.target.value}))}
                                        placeholder="Ali B."
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-foreground uppercase tracking-wider">Adresse Email</label>
                                <input 
                                    type="email" 
                                    className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                    value={currentMember.email}
                                    onChange={(e) => setCurrentMember(prev => ({...prev, email: e.target.value}))}
                                    placeholder="membre@email.com"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-foreground uppercase tracking-wider block mb-2">Rôle d'Accès</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setCurrentMember(prev => ({...prev, role: 'admin'}))}
                                        className={`p-4 rounded-md border text-left transition-all ${currentMember.role === 'admin' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                                    >
                                        <Shield className={`w-6 h-6 mb-2 ${currentMember.role === 'admin' ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <h4 className="font-bold text-foreground">Administrateur</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Accès complet aux prospects, portfolio, blog et paramètres.</p>
                                    </button>
                                    <button
                                        onClick={() => setCurrentMember(prev => ({...prev, role: 'editor'}))}
                                        className={`p-4 rounded-md border text-left transition-all ${currentMember.role === 'editor' ? 'border-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.1)]' : 'border-border hover:border-[hsl(var(--teal)/0.5)]'}`}
                                    >
                                        <User className={`w-6 h-6 mb-2 ${currentMember.role === 'editor' ? 'text-[hsl(var(--teal))]' : 'text-muted-foreground'}`} />
                                        <h4 className="font-bold text-foreground">Éditeur</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Accès limité. Peut gérer uniquement le contenu des Prospects et du Blog.</p>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-border">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 rounded-md border border-border hover:bg-muted font-bold transition-colors uppercase tracking-wider text-sm"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-bold transition-all glow-button flex items-center gap-2 disabled:opacity-50 uppercase tracking-wider text-sm"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer le Membre'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card overflow-hidden urban-border">
                        {isLoading ? (
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 border-b border-border text-muted-foreground text-sm uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Membre du Personnel</th>
                                        <th className="px-6 py-4 font-bold">Rôle</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2].map(i => (
                                        <tr key={i} className="border-b border-border/30">
                                            <td className="px-6 py-4"><div className="h-5 bg-muted/50 animate-pulse rounded w-1/3 mb-2" /></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-muted/50 animate-pulse rounded w-16" /></td>
                                            <td className="px-6 py-4 flex justify-end"><div className="h-8 w-16 bg-muted/50 animate-pulse rounded-md" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : members.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                <Shield className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-bold text-lg text-foreground font-display tracking-wider">Aucun membre dans l'équipe</p>
                                <p className="text-sm">Vous êtes la seule personne à avoir accès. Cliquez sur 'Inviter un Membre' pour ajouter du personnel.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/50 border-b border-border text-muted-foreground text-sm uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Membre du Personnel</th>
                                            <th className="px-6 py-4 font-bold">Rôle</th>
                                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {members.map((member) => (
                                            <tr key={member.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-foreground font-display tracking-wider mb-1 flex items-center gap-2">
                                                      {member.name} 
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">{member.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-md uppercase font-bold tracking-wider ${
                                                        member.role === 'admin' 
                                                            ? 'bg-primary/10 text-primary' 
                                                            : 'bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal))]'
                                                    }`}>
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => {
                                                                setCurrentMember(member);
                                                                setIsEditing(true);
                                                            }}
                                                            className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors"
                                                            title="Modifier l'Accès"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(member.id)}
                                                            className="p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-md transition-colors"
                                                            title="Révoquer l'Accès"
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
                )}
            </div>
        </DashboardLayout>
    );
};

export default TeamManagement;
