import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, Trash2, Shield, User, X, Loader2, Mail, KeyRound, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor';
  created_at: string;
}

const TeamManagement = () => {
    const { user } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // tracks which member is being acted on

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
                // Update existing member (name & role only)
                const { error } = await supabase
                    .from('team_members')
                    .update({
                        name: currentMember.name,
                        role: currentMember.role
                    })
                    .eq('id', currentMember.id);
                if (error) throw error;
                toast.success("Membre mis à jour avec succès");
            } else {
                // Add new member to team_members table
                const { error } = await supabase
                    .from('team_members')
                    .insert([{
                        name: currentMember.name,
                        email: currentMember.email,
                        role: currentMember.role,
                        created_at: new Date().toISOString()
                    }]);
                if (error) throw error;

                // Send invitation email via Cloudflare function
                try {
                    await fetch('/api/invite-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: currentMember.email, name: currentMember.name, role: currentMember.role })
                    });
                } catch {
                    // Non-critical: member was added, invitation email may not have sent
                    console.warn('Invitation email could not be sent via API');
                }

                toast.success("Membre ajouté ! Un email d'invitation a été envoyé.");
            }
            setIsEditing(false);
            setCurrentMember({ name: '', email: '', role: 'editor' });
            fetchMembers();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Impossible d'enregistrer le membre.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (member: TeamMember) => {
        if (member.email === user?.email) {
            toast.error("Vous ne pouvez pas supprimer votre propre compte.");
            return;
        }
        if (!confirm(`Retirer ${member.name} de l'équipe ? Son accès sera révoqué.`)) return;

        try {
            const { error } = await supabase.from('team_members').delete().eq('id', member.id);
            if (error) throw error;
            toast.success(`${member.name} a été retiré de l'équipe.`);
            fetchMembers();
        } catch (err) {
            console.error(err);
            toast.error("Impossible de retirer le membre.");
        }
    };

    const handleSendPasswordReset = async (member: TeamMember) => {
        const key = `reset-${member.id}`;
        setActionLoading(key);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(member.email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) throw error;
            toast.success(`Email de réinitialisation envoyé à ${member.email}`);
        } catch (err: any) {
            toast.error(err.message || "Impossible d'envoyer l'email de réinitialisation.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleResendInvite = async (member: TeamMember) => {
        const key = `invite-${member.id}`;
        setActionLoading(key);
        try {
            const res = await fetch('/api/invite-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: member.email, name: member.name, role: member.role })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok && data.error) throw new Error(data.error);
            toast.success(`Invitation renvoyée à ${member.email}`);
        } catch (err: any) {
            toast.error(err.message || "Impossible de renvoyer l'invitation.");
        } finally {
            setActionLoading(null);
        }
    };

    const isSelf = (member: TeamMember) => member.email === user?.email;

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

                {/* Connected Account Banner */}
                {user && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-md border border-primary/30 bg-primary/5 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">Connecté en tant que <span className="font-bold text-foreground">{user.email}</span></span>
                    </div>
                )}

                <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                        className="glass-card p-6 md:p-8 space-y-6 urban-border"
                    >
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h2 className="text-xl font-bold text-foreground font-display tracking-wider">
                                {currentMember.id ? "Modifier le Membre" : 'Inviter un Nouveau Membre'}
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
                                    disabled={!!currentMember.id}
                                    className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={currentMember.email}
                                    onChange={(e) => setCurrentMember(prev => ({...prev, email: e.target.value}))}
                                    placeholder="membre@email.com"
                                />
                                {currentMember.id && <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié. Utilisez les actions rapides pour renvoyer des emails.</p>}
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
                                        <p className="text-xs text-muted-foreground mt-1">Accès limité. Peut gérer uniquement les Prospects et le Blog.</p>
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
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="table"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="glass-card overflow-hidden urban-border"
                    >
                        {isLoading ? (
                            <div className="p-8 flex items-center justify-center gap-3 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span>Chargement de l'équipe...</span>
                            </div>
                        ) : members.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                <Shield className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-bold text-lg text-foreground font-display tracking-wider">Aucun membre dans l'équipe</p>
                                <p className="text-sm">Cliquez sur 'Inviter un Membre' pour ajouter du personnel.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Membre du Personnel</th>
                                            <th className="px-6 py-4 font-bold">Rôle</th>
                                            <th className="px-6 py-4 font-bold text-right">Actions Admin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {members.map((member) => (
                                            <tr
                                                key={member.id}
                                                className={`transition-colors group ${isSelf(member) ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30'}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-foreground font-display tracking-wider mb-0.5 flex items-center gap-2">
                                                        {member.name}
                                                        {isSelf(member) && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase tracking-wider">Vous</span>
                                                        )}
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
                                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                        {/* Edit Name/Role */}
                                                        <button
                                                            onClick={() => { setCurrentMember(member); setIsEditing(true); }}
                                                            className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors"
                                                            title="Modifier le nom / rôle"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        {/* Send Password Reset */}
                                                        <button
                                                            onClick={() => handleSendPasswordReset(member)}
                                                            disabled={actionLoading === `reset-${member.id}`}
                                                            className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-md transition-colors disabled:opacity-50"
                                                            title="Envoyer email réinitialisation mot de passe"
                                                        >
                                                            {actionLoading === `reset-${member.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                                        </button>
                                                        {/* Resend Invite */}
                                                        <button
                                                            onClick={() => handleResendInvite(member)}
                                                            disabled={actionLoading === `invite-${member.id}`}
                                                            className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-md transition-colors disabled:opacity-50"
                                                            title="Renvoyer l'invitation"
                                                        >
                                                            {actionLoading === `invite-${member.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                        </button>
                                                        {/* Delete — blocked for self */}
                                                        {!isSelf(member) && (
                                                            <button
                                                                onClick={() => handleDelete(member)}
                                                                className="p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-md transition-colors"
                                                                title="Révoquer l'accès"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1.5"><Edit className="w-3.5 h-3.5" /> Modifier nom / rôle</span>
                    <span className="flex items-center gap-1.5 text-amber-500"><KeyRound className="w-3.5 h-3.5" /> Réinitialiser mot de passe</span>
                    <span className="flex items-center gap-1.5 text-blue-400"><Send className="w-3.5 h-3.5" /> Renvoyer invitation</span>
                    <span className="flex items-center gap-1.5 text-destructive"><Trash2 className="w-3.5 h-3.5" /> Révoquer l'accès</span>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TeamManagement;
