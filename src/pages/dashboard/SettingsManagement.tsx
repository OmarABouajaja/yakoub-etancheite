import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Save, Loader2, Phone, Mail, MapPin, Share2, BarChart2, Bell, Forward, Send, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

interface SiteSettings {
  phone_primary: string;
  email: string;
  address: string;
  whatsapp_number: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  stat_projects: string;
  stat_experience: string;
  stat_guarantee: string;
  stat_satisfaction: string;
  enable_email_notifications?: boolean;
  notification_email?: string;
  enable_lead_forwarding?: boolean;
  forward_leads_email?: string;
  enable_daily_digest?: boolean;
  daily_digest_email?: string;
  enable_inbound_notifications?: boolean;
  inbound_notification_email?: string;
  enable_inbound_forwarding?: boolean;
  inbound_forward_email?: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  phone_primary: '+21625589419',
  email: '',
  address: 'Tunis — Toute la Tunisie',
  whatsapp_number: '21625589419',
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
  stat_projects: '500+',
  stat_experience: '15',
  stat_guarantee: '10',
  stat_satisfaction: '98%',
  enable_email_notifications: true,
  notification_email: '',
  enable_lead_forwarding: false,
  forward_leads_email: '',
  enable_daily_digest: false,
  daily_digest_email: '',
  enable_inbound_notifications: true,
  inbound_notification_email: '',
  enable_inbound_forwarding: false,
  inbound_forward_email: '',
};

const SettingsManagement = () => {
    const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const savedSettings = useRef<string>('');

    // Guard against accidental navigation when form has unsaved changes
    useUnsavedChanges(isDirty);

    // Track dirty state by comparing with last saved snapshot
    const handleChange = (updater: (prev: SiteSettings) => SiteSettings) => {
        setSettings(prev => {
            const next = updater(prev);
            setIsDirty(JSON.stringify(next) !== savedSettings.current);
            return next;
        });
    };

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                // Try fetching from Supabase first
                const { data, error } = await supabase.from('site_settings').select('*').single();
                if (error) {
                    if (error.code === '42P01') {
                         console.warn("La table site_settings n'existe pas. Utilisation de localStorage.");
                         const localSettings = localStorage.getItem('site_settings');
                         if (localSettings && localSettings !== 'null') {
                             setSettings(JSON.parse(localSettings));
                         } else {
                             setSettings(DEFAULT_SETTINGS);
                         }
                    } else if (error.code === 'PGRST116') {
                        // Empty table, insert defaults
                       await supabase.from('site_settings').insert([DEFAULT_SETTINGS]);
                       setSettings(DEFAULT_SETTINGS);
                    } else {
                        throw error;
                    }
                } else if (data) {
                    setSettings(data as SiteSettings || DEFAULT_SETTINGS);
                    savedSettings.current = JSON.stringify(data || DEFAULT_SETTINGS);
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
                const localSettings = localStorage.getItem('site_settings');
                 if (localSettings && localSettings !== 'null') {
                     setSettings(JSON.parse(localSettings));
                 } else {
                     setSettings(DEFAULT_SETTINGS);
                 }
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
             const { error } = await supabase.from('site_settings').upsert([
                { id: 1, ...settings }
             ]);
             
             if (error) {
                 if (error.code === '42P01') {
                     // Fallback to localStorage if table is missing
                     localStorage.setItem('site_settings', JSON.stringify(settings));
                 } else {
                     throw error;
                 }
             }
             
             toast.success("Paramètres enregistrés avec succès !");
             savedSettings.current = JSON.stringify(settings);
             setIsDirty(false);
        } catch (err: any) {
             console.error(err);
             toast.error(err.message || "Impossible d'enregistrer les paramètres.");
        } finally {
            setIsSaving(false);
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
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-display tracking-wider text-foreground">Paramètres du Site</h1>
                    <p className="text-muted-foreground mt-1 text-sm uppercase tracking-wider">Gérez vos informations de contact globales</p>
                </div>

                <div className="glass-card urban-border overflow-hidden">
                    <div className="p-6 md:p-8 space-y-8">
                        
                        {/* Section 1: Contact Details */}
                        <div>
                            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                                <Phone className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-lg font-display tracking-wider text-foreground">Détails de Contact</h3>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> Téléphone Principal</label>
                                    <input 
                                        type="tel" 
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                        value={settings?.phone_primary || ''}
                                        onChange={(e) => handleChange(prev => ({...prev, phone_primary: e.target.value}))}
                                        dir="ltr"
                                    />
                                    <p className="text-xs text-muted-foreground">Apparaît dans le pied de page et la barre de navigation.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> Email de Support</label>
                                    <input 
                                        type="email" 
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                        value={settings?.email || ''}
                                        onChange={(e) => handleChange(prev => ({...prev, email: e.target.value}))}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> Adresse du Siège Social</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                        value={settings?.address || ''}
                                        onChange={(e) => handleChange(prev => ({...prev, address: e.target.value}))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Social Links */}
                        <div>
                            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                                <Share2 className="w-5 h-5 text-[hsl(var(--orange))]" />
                                <h3 className="font-bold text-lg font-display tracking-wider text-foreground">Réseaux Sociaux et Liens</h3>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Numéro WhatsApp</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-[hsl(var(--orange))] outline-none"
                                        value={settings?.whatsapp_number || ''}
                                        onChange={(e) => handleChange(prev => ({...prev, whatsapp_number: e.target.value}))}
                                        dir="ltr"
                                        placeholder="e.g. 216XXXXXXXX"
                                    />
                                    <p className="text-xs text-muted-foreground">Incluez le code du pays sans le '+' (ex: 21625589419)</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Instagram URL</label>
                                    <input 
                                        type="url" 
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-[hsl(var(--orange))] outline-none"
                                        value={settings?.instagram_url || ''}
                                        onChange={(e) => handleChange(prev => ({...prev, instagram_url: e.target.value}))}
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Facebook URL</label>
                                    <input 
                                        type="url" 
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-[hsl(var(--orange))] outline-none"
                                        value={settings.facebook_url || ''}
                                        onChange={(e) => handleChange(prev => ({...prev, facebook_url: e.target.value}))}
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">TikTok URL</label>
                                    <input 
                                        type="url" 
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-[hsl(var(--orange))] outline-none"
                                        value={(settings as any).tiktok_url || ''}
                                        onChange={(e) => handleChange(prev => ({...prev, tiktok_url: e.target.value} as any))}
                                        dir="ltr"
                                        placeholder="https://www.tiktok.com/@..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Homepage Stats */}
                        <div>
                            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                                <BarChart2 className="w-5 h-5 text-[hsl(var(--cyan-bright))]" />
                                <h3 className="font-bold text-lg font-display tracking-wider text-foreground">Statistiques de la Page d'Accueil</h3>
                            </div>
                            <p className="text-xs text-muted-foreground mb-4">Ces chiffres s'affichent dans la section hero sur la page principale.</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Projets Réalisés</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-center font-bold text-lg"
                                        value={settings?.stat_projects || ''}
                                        onChange={(e) => handleChange(prev => ({...prev, stat_projects: e.target.value}))}
                                        placeholder="500+"
                                    />
                                    <p className="text-xs text-muted-foreground text-center">ex: 500+</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Ans d'Expérience</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-center font-bold text-lg"
                                        value={settings?.stat_experience || ''}
                                        onChange={(e) => handleChange(prev => ({...prev, stat_experience: e.target.value}))}
                                        placeholder="15"
                                    />
                                    <p className="text-xs text-muted-foreground text-center">ex: 15</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Ans de Garantie</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-center font-bold text-lg"
                                        value={settings?.stat_guarantee || ''}
                                        onChange={(e) => handleChange(prev => ({...prev, stat_guarantee: e.target.value}))}
                                        placeholder="10"
                                    />
                                    <p className="text-xs text-muted-foreground text-center">ex: 10</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Satisfaction Client</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-center font-bold text-lg"
                                        value={settings?.stat_satisfaction || ''}
                                        onChange={(e) => handleChange(prev => ({...prev, stat_satisfaction: e.target.value}))}
                                        placeholder="98%"
                                    />
                                    <p className="text-xs text-muted-foreground text-center">ex: 98%</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Notifications & Forwarding */}
                        <div>
                            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                                <Bell className="w-5 h-5 text-green-500" />
                                <h3 className="font-bold text-lg font-display tracking-wider text-foreground">Notifications & Transfert</h3>
                            </div>
                            <p className="text-xs text-muted-foreground mb-5">Configurez les alertes automatiques et le transfert des demandes clients.</p>
                            
                            <div className="space-y-4">
                                {/* Card 1: Lead Notifications */}
                                <div className={`p-5 rounded-xl border transition-all ${settings?.enable_email_notifications !== false ? 'bg-green-500/5 border-green-500/20' : 'bg-background border-border'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${settings?.enable_email_notifications !== false ? 'bg-green-500/10' : 'bg-muted'}`}>
                                                <Bell className={`w-4 h-4 ${settings?.enable_email_notifications !== false ? 'text-green-500' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground text-sm">Alertes Nouveau Prospect</h4>
                                                <p className="text-xs text-muted-foreground">Recevoir un email lorsqu'un client soumet une demande de devis.</p>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={settings?.enable_email_notifications !== false}
                                            onCheckedChange={(checked) => handleChange(prev => ({...prev, enable_email_notifications: checked}))}
                                        />
                                    </div>
                                    {settings?.enable_email_notifications !== false && (
                                        <div className="ml-11 mt-3 space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Envoyer les alertes à</label>
                                            <input 
                                                type="email" 
                                                className="w-full bg-background border border-border rounded-md px-4 py-2.5 focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 outline-none text-sm transition-all"
                                                value={settings?.notification_email || ''}
                                                onChange={(e) => handleChange(prev => ({...prev, notification_email: e.target.value}))}
                                                placeholder="admin@yakoub-etancheite.com.tn (vide = email principal)"
                                            />
                                            <p className="text-[11px] text-muted-foreground">Laissez vide pour utiliser l'email de support ci-dessus.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Card 2: Lead Forwarding */}
                                <div className={`p-5 rounded-xl border transition-all ${settings?.enable_lead_forwarding ? 'bg-blue-500/5 border-blue-500/20' : 'bg-background border-border'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${settings?.enable_lead_forwarding ? 'bg-blue-500/10' : 'bg-muted'}`}>
                                                <Forward className={`w-4 h-4 ${settings?.enable_lead_forwarding ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground text-sm">Transfert Automatique des Prospects</h4>
                                                <p className="text-xs text-muted-foreground">Transférer chaque nouveau prospect vers un email externe (ex: associé, commercial).</p>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={settings?.enable_lead_forwarding || false}
                                            onCheckedChange={(checked) => handleChange(prev => ({...prev, enable_lead_forwarding: checked}))}
                                        />
                                    </div>
                                    {settings?.enable_lead_forwarding && (
                                        <div className="ml-11 mt-3 space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email de transfert</label>
                                            <input 
                                                type="email" 
                                                className="w-full bg-background border border-border rounded-md px-4 py-2.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none text-sm transition-all"
                                                value={settings?.forward_leads_email || ''}
                                                onChange={(e) => handleChange(prev => ({...prev, forward_leads_email: e.target.value}))}
                                                placeholder="commercial@example.com"
                                                required
                                            />
                                            <div className="flex items-center gap-2 text-[11px] text-blue-400 mt-1">
                                                <ArrowRight className="w-3 h-3" />
                                                <span>Chaque nouveau prospect sera automatiquement copié à cette adresse.</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Card 2.5: Inbound Email Notifications */}
                                <div className={`p-5 rounded-xl border transition-all ${settings?.enable_inbound_notifications !== false ? 'bg-amber-500/5 border-amber-500/20' : 'bg-background border-border'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${settings?.enable_inbound_notifications !== false ? 'bg-amber-500/10' : 'bg-muted'}`}>
                                                <Mail className={`w-4 h-4 ${settings?.enable_inbound_notifications !== false ? 'text-amber-500' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground text-sm">Alertes Nouvel Email (Boîte Mail)</h4>
                                                <p className="text-xs text-muted-foreground">Recevoir une notification lorsqu'un client envoie un email à la plateforme.</p>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={settings?.enable_inbound_notifications !== false}
                                            onCheckedChange={(checked) => handleChange(prev => ({...prev, enable_inbound_notifications: checked}))}
                                        />
                                    </div>
                                    {settings?.enable_inbound_notifications !== false && (
                                        <div className="ml-11 mt-3 space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Envoyer l'alerte à</label>
                                            <input 
                                                type="email" 
                                                className="w-full bg-background border border-border rounded-md px-4 py-2.5 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none text-sm transition-all"
                                                value={settings?.inbound_notification_email || ''}
                                                onChange={(e) => handleChange(prev => ({...prev, inbound_notification_email: e.target.value}))}
                                                placeholder="admin@yakoub-etancheite.com.tn (vide = email principal)"
                                            />
                                            <p className="text-[11px] text-muted-foreground">Laissez vide pour utiliser l'email de support ci-dessus.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Card 2.6: Inbound Email Forwarding */}
                                <div className={`p-5 rounded-xl border transition-all ${settings?.enable_inbound_forwarding ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-background border-border'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${settings?.enable_inbound_forwarding ? 'bg-cyan-500/10' : 'bg-muted'}`}>
                                                <Forward className={`w-4 h-4 ${settings?.enable_inbound_forwarding ? 'text-cyan-500' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground text-sm">Transfert des Emails Reçus</h4>
                                                <p className="text-xs text-muted-foreground">Transférer (faire suivre) le contenu des emails reçus vers une adresse externe.</p>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={settings?.enable_inbound_forwarding || false}
                                            onCheckedChange={(checked) => handleChange(prev => ({...prev, enable_inbound_forwarding: checked}))}
                                        />
                                    </div>
                                    {settings?.enable_inbound_forwarding && (
                                        <div className="ml-11 mt-3 space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email de transfert (ex: personnel)</label>
                                            <input 
                                                type="email" 
                                                className="w-full bg-background border border-border rounded-md px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 outline-none text-sm transition-all"
                                                value={settings?.inbound_forward_email || ''}
                                                onChange={(e) => handleChange(prev => ({...prev, inbound_forward_email: e.target.value}))}
                                                placeholder="mon_email_perso@gmail.com"
                                                required
                                            />
                                            <div className="flex items-center gap-2 text-[11px] text-cyan-400 mt-1">
                                                <ArrowRight className="w-3 h-3" />
                                                <span>Chaque message reçu sera automatiquement transféré à cette adresse.</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Card 3: Daily Digest */}
                                <div className={`p-5 rounded-xl border transition-all ${settings?.enable_daily_digest ? 'bg-purple-500/5 border-purple-500/20' : 'bg-background border-border'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${settings?.enable_daily_digest ? 'bg-purple-500/10' : 'bg-muted'}`}>
                                                <Send className={`w-4 h-4 ${settings?.enable_daily_digest ? 'text-purple-500' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground text-sm">Résumé Quotidien</h4>
                                                <p className="text-xs text-muted-foreground">Recevoir un récapitulatif quotidien de l'activité (nouveaux prospects, emails reçus).</p>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={settings?.enable_daily_digest || false}
                                            onCheckedChange={(checked) => handleChange(prev => ({...prev, enable_daily_digest: checked}))}
                                        />
                                    </div>
                                    {settings?.enable_daily_digest && (
                                        <div className="ml-11 mt-3 space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Envoyer le résumé à</label>
                                            <input 
                                                type="email" 
                                                className="w-full bg-background border border-border rounded-md px-4 py-2.5 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm transition-all"
                                                value={settings?.daily_digest_email || ''}
                                                onChange={(e) => handleChange(prev => ({...prev, daily_digest_email: e.target.value}))}
                                                placeholder="directeur@example.com (vide = email principal)"
                                            />
                                            <p className="text-[11px] text-muted-foreground">Le récapitulatif est envoyé chaque matin à 08h00.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-muted/30 p-6 border-t border-border flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-4 focus:ring-primary/20 px-8 py-3 rounded-md font-bold transition-all glow-button flex items-center gap-2 disabled:opacity-50 uppercase tracking-wider text-sm"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Enregistrement...' : 'Enregistrer les Paramètres'}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsManagement;
