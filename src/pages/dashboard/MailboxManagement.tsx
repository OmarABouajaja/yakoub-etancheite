import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmails, sendAdminEmail, markEmailAsRead, deleteEmail, Email } from '@/lib/api';
import { Mail, Send, Inbox, ArrowLeft, Loader2, X, Plus, Trash2, Download, RefreshCw, Search, Reply } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

/** Sanitize HTML to prevent XSS from inbound emails */
function sanitizeHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    // Remove script tags and event handlers
    div.querySelectorAll('script, iframe, object, embed, form').forEach(el => el.remove());
    div.querySelectorAll('*').forEach(el => {
        // Remove all on* event handler attributes
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('on') || attr.value.startsWith('javascript:')) {
                el.removeAttribute(attr.name);
            }
        });
    });
    return div.innerHTML;
}

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
        refetchInterval: 30000 // auto-refresh every 30s
    });

    // Supabase Realtime subscription for instant inbox updates
    useEffect(() => {
        const channel = supabase
            .channel('emails-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'emails',
            }, () => {
                // Invalidate and refetch emails on new insert
                queryClient.invalidateQueries({ queryKey: ['emails'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
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

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['emails'] });
        toast.success('Boîte mail rafraîchie');
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-wider text-foreground flex items-center gap-3">
                            <Mail className="w-8 h-8 text-primary" />
                            Boîte Mail
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            team@yakoub-etancheite.com.tn
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            title="Rafraîchir"
                            className="flex items-center gap-2 px-3 py-3 bg-secondary text-secondary-foreground rounded-md font-bold uppercase tracking-wider text-sm hover:opacity-90 transition-opacity"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleExportAndClean}
                            title="Exporter en CSV et supprimer les emails > 6 mois"
                            className="flex items-center gap-2 px-3 py-3 bg-secondary text-secondary-foreground rounded-md font-bold uppercase tracking-wider text-sm hover:opacity-90 transition-opacity"
                        >
                            <Download className="w-5 h-5" />
                            <span className="hidden sm:inline">Archiver &gt; 6 mois</span>
                        </button>
                        <button
                            onClick={() => setIsComposing(true)}
                            className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-md font-bold uppercase tracking-wider text-sm glow-button"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Nouveau Message</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden gap-6">
                    {/* Sidebar */}
                    <div className="w-64 flex flex-col gap-2 shrink-0">
                        {/* Search */}
                        <div className="relative mb-2">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <button
                            onClick={() => { setView('inbox'); setSelectedEmail(null); }}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                                view === 'inbox' ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:border-primary/50 text-foreground'
                            }`}
                        >
                            <div className="flex items-center gap-3 font-bold">
                                <Inbox className="w-5 h-5" />
                                Boîte de réception
                            </div>
                            {unreadCount > 0 && (
                                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        
                        <button
                            onClick={() => { setView('sent'); setSelectedEmail(null); }}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                                view === 'sent' ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:border-primary/50 text-foreground'
                            }`}
                        >
                            <div className="flex items-center gap-3 font-bold">
                                <Send className="w-5 h-5" />
                                Messages envoyés
                            </div>
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 glass-card border border-border rounded-xl flex flex-col overflow-hidden">
                        {selectedEmail ? (
                            <div className="flex flex-col h-full">
                                <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-4 shrink-0">
                                    <button 
                                        onClick={() => setSelectedEmail(null)}
                                        className="p-2 hover:bg-muted rounded-full transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-bold truncate">{selectedEmail.subject}</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {selectedEmail.direction === 'inbound' ? 'De: ' : 'À: '} 
                                            <span className="text-foreground">{selectedEmail.direction === 'inbound' ? selectedEmail.from_email : selectedEmail.to_email}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="text-xs text-muted-foreground hidden sm:block">
                                            {new Date(selectedEmail.created_at).toLocaleString()}
                                        </div>
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
                                <div className="p-6 overflow-y-auto flex-1 bg-background/50">
                                    {selectedEmail.html_body ? (
                                        <div 
                                            className="prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.html_body) }} 
                                        />
                                    ) : (
                                        <div className="whitespace-pre-wrap font-sans text-foreground/90">
                                            {selectedEmail.text_body || 'Aucun contenu'}
                                        </div>
                                    )}
                                </div>
                                {/* Quick Reply Bar for inbound emails */}
                                {selectedEmail.direction === 'inbound' && (
                                    <div className="p-4 border-t border-border bg-muted/10 shrink-0">
                                        <button
                                            onClick={() => handleReply(selectedEmail)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary/20 transition-colors"
                                        >
                                            <Reply className="w-4 h-4" />
                                            Répondre à {selectedEmail.from_email.split('@')[0]}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : filteredEmails.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {filteredEmails.map(email => (
                                            <button
                                                key={email.id}
                                                onClick={() => handleSelectEmail(email)}
                                                className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-center gap-4 ${!email.is_read && email.direction === 'inbound' ? 'bg-primary/5' : ''}`}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                    {email.direction === 'inbound' ? <Inbox className="w-6 h-6 text-primary" /> : <Send className="w-6 h-6 text-muted-foreground" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`truncate font-medium ${!email.is_read && email.direction === 'inbound' ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                                                            {email.direction === 'inbound' ? email.from_email : email.to_email}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                            {new Date(email.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <h3 className={`text-sm truncate ${!email.is_read && email.direction === 'inbound' ? 'text-foreground font-bold' : 'text-foreground'}`}>
                                                        {email.subject}
                                                    </h3>
                                                </div>
                                                {!email.is_read && email.direction === 'inbound' && (
                                                    <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <Mail className="w-16 h-16 mb-4 opacity-20" />
                                        <p>{searchQuery ? 'Aucun résultat trouvé' : 'Aucun email trouvé'}</p>
                                    </div>
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                        onClick={() => setIsComposing(false)}
                    >
                        <motion.div
                            initial={{ y: 50, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 50, scale: 0.95 }}
                            className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                                <h2 className="font-bold text-lg">
                                    {composeData.subject.startsWith('Re:') ? 'Répondre' : 'Nouveau Message'}
                                </h2>
                                <button onClick={() => setIsComposing(false)} className="p-2 hover:bg-muted rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSend} className="p-6 flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">À</label>
                                    <input 
                                        type="email" 
                                        required 
                                        value={composeData.to}
                                        onChange={e => setComposeData({...composeData, to: e.target.value})}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                                        placeholder="client@exemple.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Sujet</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={composeData.subject}
                                        onChange={e => setComposeData({...composeData, subject: e.target.value})}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                                        placeholder="Votre devis Yakoub Travaux"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Message</label>
                                    <textarea 
                                        required 
                                        rows={10}
                                        value={composeData.message}
                                        onChange={e => setComposeData({...composeData, message: e.target.value})}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary resize-none"
                                        placeholder="Bonjour..."
                                    />
                                </div>
                                <div className="flex justify-end pt-4 border-t border-border mt-2">
                                    <button 
                                        type="submit" 
                                        disabled={sendEmailMutation.isPending}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg glow-button disabled:opacity-50"
                                    >
                                        {sendEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Envoyer
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
