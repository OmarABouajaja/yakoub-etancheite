import { useQuery } from '@tanstack/react-query';
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
  enable_email_notifications?: boolean;
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

async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const { data, error } = await supabase.from('site_settings').select('*').single();
    if (error) {
      // Fallback to localStorage cache
      const local = localStorage.getItem('site_settings');
      if (local) return JSON.parse(local);
      return DEFAULT_SETTINGS;
    }
    // Cache locally for offline/fallback
    localStorage.setItem('site_settings', JSON.stringify(data));
    return data as SiteSettings;
  } catch {
    const local = localStorage.getItem('site_settings');
    if (local) return JSON.parse(local);
    return DEFAULT_SETTINGS;
  }
}

export const useSiteSettings = () => {
  const { data: settings = DEFAULT_SETTINGS, isLoading, refetch } = useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes — avoid re-fetch on every mount
    gcTime: 30 * 60 * 1000,   // 30 minutes garbage collection
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { settings, isLoading, refetch };
};
