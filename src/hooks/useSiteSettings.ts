import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface SiteSettings {
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
}

const DEFAULT_SETTINGS: SiteSettings = {
  phone_primary: '+21625589419',
  email: '',
  address: 'Tunis — Toute la Tunisie',
  whatsapp_number: '21625589419',
  instagram_url: 'https://www.instagram.com/yakoub_etanche',
  facebook_url: 'https://www.facebook.com/yakoubetanche',
  tiktok_url: 'https://www.tiktok.com/@yakoub_etanche',
  stat_projects: '500+',
  stat_experience: '15',
  stat_guarantee: '10',
  stat_satisfaction: '98%'
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('*').single();
        if (error) {
           const local = localStorage.getItem('site_settings');
           if (local) setSettings(JSON.parse(local));
        } else if (data) {
           setSettings(data as SiteSettings);
        }
      } catch (err) {
         const local = localStorage.getItem('site_settings');
         if (local) setSettings(JSON.parse(local));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, isLoading };
};
