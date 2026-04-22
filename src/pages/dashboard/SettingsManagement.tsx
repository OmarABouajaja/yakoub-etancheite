import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Save, Loader2, Phone, Mail, MapPin, Share2, BarChart2, Bell } from 'lucide-react';
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
                         if (localSettings) {
                             setSettings(JSON.parse(localSettings));
                         }
                    } else if (error.code === 'PGRST116') {
                        // Empty table, insert defaults
                       await supabase.from('site_settings').insert([DEFAULT_SETTINGS]);
                       setSettings(DEFAULT_SETTINGS);
                    } else {
                        throw error;
                    }
                } else if (data) {
                    setSettings(data as SiteSettings);
                    savedSettings.current = JSON.stringify(data);
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
                const localSettings = localStorage.getItem('site_settings');
                 if (localSettings) setSettings(JSON.parse(localSettings));
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
                                        value={settings.phone_primary}
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
                                        value={settings.email}
                                        onChange={(e) => handleChange(prev => ({...prev, email: e.target.value}))}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> Adresse du Siège Social</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-background border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                        value={settings.address}
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
                                        value={settings.whatsapp_number}
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
                                        value={settings.instagram_url}
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
                                        value={settings.stat_projects}
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
                                        value={settings.stat_experience}
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
                                        value={settings.stat_guarantee}
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
                                        value={settings.stat_satisfaction}
                                        onChange={(e) => handleChange(prev => ({...prev, stat_satisfaction: e.target.value}))}
                                        placeholder="98%"
                                    />
                                    <p className="text-xs text-muted-foreground text-center">ex: 98%</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Notifications */}
                        <div>
                            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                                <Bell className="w-5 h-5 text-green-500" />
                                <h3 className="font-bold text-lg font-display tracking-wider text-foreground">Notifications Système</h3>
                            </div>
                            
                            <div className="flex items-center justify-between p-6 bg-background border border-border rounded-lg">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-foreground">Alertes Nouveau Prospect</h4>
                                    <p className="text-sm text-muted-foreground">Recevoir un email détaillé lorsqu'un client soumet une demande de devis.</p>
                                </div>
                                <Switch 
                                    checked={settings.enable_email_notifications !== false}
                                    onCheckedChange={(checked) => handleChange(prev => ({...prev, enable_email_notifications: checked}))}
                                />
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
