import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmails, sendAdminEmail, markEmailAsRead, markEmailAsUnread, deleteEmail, Email } from '@/lib/api';
import { Mail, Send, Inbox, ArrowLeft, Loader2, X, Plus, Trash2, Download, RefreshCw, Search, Reply, MailOpen, Mail as MailClosed, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

/** Sanitize HTML to prevent XSS from inbound emails */
function sanitizeHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('script, iframe, object, embed, form').forEach(el => el.remove());
    div.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('on') || attr.value.startsWith('javascript:')) {
                el.removeAttribute(attr.name);
            }
        });
    });
    return div.innerHTML;
}

const formatEmailDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    if (isToday) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const getAvatarColor = (email: string) => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const MailboxManagement = () => {
    const queryClient = useQueryClient();
    const [view, setView] = useState<'inbox' | 'sent'>('inbox');
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [composeData, setComposeData] = useState({
        to: '',
        subject: '',
        message: ''
    });

    const { data: emails = [], isLoading } = useQuery<Email[]>({
        queryKey: ['emails'],
        queryFn: getEmails,
        refetchInterval: 30000
    });



    const sendEmailMutation = useMutation({
        mutationFn: sendAdminEmail,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            setIsComposing(false);
            setComposeData({ to: '', subject: '', message: '' });
            toast.success('Email envoyé avec succès !');
        },
        onError: (err: any) => {
            toast.error(err.message || "Échec de l'envoi de l'email");
        }
    });

    const markReadMutation = useMutation({
        mutationFn: markEmailAsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emails'] })
    });

    const markUnreadMutation = useMutation({
        mutationFn: markEmailAsUnread,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            setSelectedEmail(null);
            toast.success('Marqué comme non lu');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteEmail,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            setSelectedEmail(null);
            toast.success('Email supprimé.');
        }
    });

    const handleExportAndClean = () => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const oldEmails = emails.filter(e => new Date(e.created_at) < sixMonthsAgo);
        
        if (oldEmails.length === 0) {
            toast.info('Aucun email de plus de 6 mois à nettoyer.');
            return;
        }
        
        const headers = ['ID', 'Date', 'Direction', 'De', 'A', 'Sujet', 'Contenu Texte'];
        const csvRows = [headers.join(',')];
        
        oldEmails.forEach(e => {
            const row = [
                e.id,
                e.created_at,
                e.direction,
                `"${e.from_email.replace(/"/g, '""')}"`,
                `"${e.to_email.replace(/"/g, '""')}"`,
                `"${e.subject.replace(/"/g, '""')}"`,
                `"${(e.text_body || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
            ];
            csvRows.push(row.join(','));
        });
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `archive_emails_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        oldEmails.forEach(e => deleteMutation.mutate(e.id));
        toast.success(`${oldEmails.length} emails exportés et supprimés.`);
    };

    const filteredEmails = emails
        .filter(e => view === 'inbox' ? e.direction === 'inbound' : e.direction === 'outbound')
        .filter(e => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                e.subject.toLowerCase().includes(q) ||
                e.from_email.toLowerCase().includes(q) ||
                e.to_email.toLowerCase().includes(q) ||
                (e.text_body || '').toLowerCase().includes(q)
            );
        });

    const unreadCount = emails.filter(e => e.direction === 'inbound' && !e.is_read).length;

    const handleSelectEmail = (email: Email) => {
        setSelectedEmail(email);
        if (!email.is_read && email.direction === 'inbound') {
            markReadMutation.mutate(email.id);
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        sendEmailMutation.mutate({
            to: composeData.to,
            subject: composeData.subject,
            html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${composeData.message}</div>`,
            text: composeData.message
        });
    };

    const handleReply = (email: Email) => {
        setComposeData({
            to: email.from_email,
            subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
            message: ''
        });
        setIsComposing(true);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-wider text-foreground flex items-center gap-3">
                            <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20">
                                <Mail className="w-8 h-8" />
                            </div>
                            Centre de Messagerie
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Gérez vos communications client directement depuis le tableau de bord
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['emails'] })}
                            className="p-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all shadow-sm border border-border"
                            title="Actualiser"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleExportAndClean}
                            className="flex items-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-bold uppercase tracking-wider text-sm hover:bg-secondary/80 transition-all shadow-sm border border-border"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Archiver &gt; 6 mois</span>
                        </button>
                        <button
                            onClick={() => setIsComposing(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold uppercase tracking-wider text-sm glow-button transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)]"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Nouveau Message</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden gap-6">
                    {/* Sidebar */}
                    <div className="w-64 flex flex-col gap-3 shrink-0">
                        {/* Search */}
                        <div className="relative mb-2">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Rechercher un email..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-card/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => { setView('inbox'); setSelectedEmail(null); }}
                                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                                    view === 'inbox' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-foreground'
                                }`}
                            >
                                <div className="flex items-center gap-3 font-bold text-sm">
                                    <Inbox className="w-5 h-5" />
                                    Boîte de réception
                                </div>
                                {unreadCount > 0 && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${view === 'inbox' ? 'bg-background text-primary' : 'bg-primary text-primary-foreground'}`}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            
                            <button
                                onClick={() => { setView('sent'); setSelectedEmail(null); }}
                                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                                    view === 'sent' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-foreground'
                                }`}
                            >
                                <div className="flex items-center gap-3 font-bold text-sm">
                                    <Send className="w-5 h-5" />
                                    Messages envoyés
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 glass-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-xl bg-card/40">
                        {selectedEmail ? (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col h-full bg-background/50"
                            >
                                {/* Detail Header */}
                                <div className="p-6 border-b border-border bg-card flex flex-col gap-4 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <button 
                                            onClick={() => setSelectedEmail(null)}
                                            className="p-2 hover:bg-muted rounded-full transition-colors flex items-center gap-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                            <span className="text-sm font-medium">Retour</span>
                                        </button>
                                        <div className="flex items-center gap-2">
                                            {selectedEmail.direction === 'inbound' && (
                                                <button
                                                    onClick={() => markUnreadMutation.mutate(selectedEmail.id)}
                                                    className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
                                                    title="Marquer comme non lu"
                                                >
                                                    <MailClosed className="w-4 h-4" />
                                                </button>
                                            )}
                                            {selectedEmail.direction === 'inbound' && (
                                                <button
                                                    onClick={() => handleReply(selectedEmail)}
                                                    className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-full transition-colors"
                                                    title="Répondre"
                                                >
                                                    <Reply className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    if (confirm('Voulez-vous vraiment supprimer cet email ?')) {
                                                        deleteMutation.mutate(selectedEmail.id);
                                                    }
                                                }}
                                                className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-colors"
                                                title="Supprimer l'email"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground mb-4">{selectedEmail.subject}</h2>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ${getAvatarColor(selectedEmail.direction === 'inbound' ? selectedEmail.from_email : selectedEmail.to_email)}`}>
                                                    {(selectedEmail.direction === 'inbound' ? selectedEmail.from_email : selectedEmail.to_email)[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-foreground">
                                                        {selectedEmail.direction === 'inbound' ? selectedEmail.from_email : 'Moi'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        à {selectedEmail.direction === 'inbound' ? 'Moi' : selectedEmail.to_email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(selectedEmail.created_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detail Body */}
                                <div className="p-8 overflow-y-auto flex-1 bg-background/30 text-sm md:text-base leading-relaxed">
                                    {selectedEmail.html_body ? (
                                        <div 
                                            className="prose prose-sm md:prose-base prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.html_body) }} 
                                        />
                                    ) : (
                                        <div className="whitespace-pre-wrap font-sans text-foreground/90">
                                            {selectedEmail.text_body || 'Aucun contenu'}
                                        </div>
                                    )}
                                </div>

                                {/* Quick Reply */}
                                {selectedEmail.direction === 'inbound' && (
                                    <div className="p-4 border-t border-border bg-card shrink-0">
                                        <button
                                            onClick={() => handleReply(selectedEmail)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 rounded-xl font-bold text-sm transition-all"
                                        >
                                            <Reply className="w-4 h-4" />
                                            Cliquez ici pour répondre à {selectedEmail.from_email}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="flex-1 overflow-y-auto bg-card/20">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4">
                                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                        <p className="text-sm text-muted-foreground animate-pulse">Chargement de vos emails...</p>
                                    </div>
                                ) : filteredEmails.length > 0 ? (
                                    <div className="flex flex-col">
                                        <AnimatePresence>
                                            {filteredEmails.map(email => (
                                                <motion.button
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    key={email.id}
                                                    onClick={() => handleSelectEmail(email)}
                                                    className={`w-full text-left p-4 border-b border-border/50 hover:bg-muted/60 transition-all flex items-start gap-4 group ${!email.is_read && email.direction === 'inbound' ? 'bg-primary/5 hover:bg-primary/10' : ''}`}
                                                >
                                                    <div className={`w-10 h-10 mt-1 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm transition-transform group-hover:scale-105 ${getAvatarColor(email.direction === 'inbound' ? email.from_email : email.to_email)}`}>
                                                        {(email.direction === 'inbound' ? email.from_email : email.to_email)[0].toUpperCase()}
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className={`truncate text-sm ${!email.is_read && email.direction === 'inbound' ? 'text-foreground font-bold' : 'text-foreground/80 font-medium'}`}>
                                                                {email.direction === 'inbound' ? email.from_email : `À: ${email.to_email}`}
                                                            </span>
                                                            <span className={`text-xs whitespace-nowrap ml-2 ${!email.is_read && email.direction === 'inbound' ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                                                                {formatEmailDate(email.created_at)}
                                                            </span>
                                                        </div>
                                                        <h3 className={`text-sm truncate pr-4 ${!email.is_read && email.direction === 'inbound' ? 'text-foreground font-bold' : 'text-foreground/90'}`}>
                                                            {email.subject || '(Sans sujet)'}
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground truncate opacity-80">
                                                            {email.text_body ? email.text_body.substring(0, 100).replace(/\n/g, ' ') : '...'}
                                                        </p>
                                                    </div>

                                                    {!email.is_read && email.direction === 'inbound' && (
                                                        <div className="w-2.5 h-2.5 mt-2 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                                                    )}
                                                </motion.button>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center h-full text-muted-foreground"
                                    >
                                        <div className="w-24 h-24 mb-6 rounded-full bg-muted flex items-center justify-center shadow-inner">
                                            <MailOpen className="w-10 h-10 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground mb-1">Boîte de réception vide</h3>
                                        <p className="text-sm text-center max-w-sm">
                                            {searchQuery ? 'Aucun message ne correspond à votre recherche.' : "Vous n'avez aucun message dans ce dossier pour le moment."}
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Compose Modal */}
            <AnimatePresence>
                {isComposing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
                        onClick={() => setIsComposing(false)}
                    >
                        <motion.div
                            initial={{ y: 50, scale: 0.95, opacity: 0 }}
                            animate={{ y: 0, scale: 1, opacity: 1 }}
                            exit={{ y: 50, scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-3xl bg-card border border-border shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <Send className="w-5 h-5 text-primary" />
                                    {composeData.subject.startsWith('Re:') ? 'Répondre au message' : 'Nouveau Message'}
                                </h2>
                                <button onClick={() => setIsComposing(false)} className="p-2 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSend} className="p-6 flex flex-col gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        À
                                    </label>
                                    <input 
                                        type="email" 
                                        required 
                                        value={composeData.to}
                                        onChange={e => setComposeData({...composeData, to: e.target.value})}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                                        placeholder="email@client.com"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        Sujet
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={composeData.subject}
                                        onChange={e => setComposeData({...composeData, subject: e.target.value})}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                                        placeholder="Votre demande Yakoub Étanchéité"
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        Message
                                    </label>
                                    <textarea 
                                        required 
                                        rows={12}
                                        value={composeData.message}
                                        onChange={e => setComposeData({...composeData, message: e.target.value})}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all resize-none text-sm leading-relaxed"
                                        placeholder="Rédigez votre message ici..."
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" />
                                        Envoyé depuis team@yakoub-etancheite.com.tn
                                    </p>
                                    <button 
                                        type="submit" 
                                        disabled={sendEmailMutation.isPending}
                                        className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm rounded-xl glow-button disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                                    >
                                        {sendEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {sendEmailMutation.isPending ? 'Envoi...' : 'Envoyer'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default MailboxManagement;
