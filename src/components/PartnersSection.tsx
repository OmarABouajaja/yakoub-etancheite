import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Award } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  logo_url: string;
}

const PartnersSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          setPartners(data);
        }
      } catch {
        // Silently ignore — section won't render
      }
    };
    fetchPartners();
  }, []);



  // Hidden until real partners are added via Dashboard
  if (partners.length === 0) return null;

  return (
    <section className="py-14 relative bg-background border-y border-primary/20 overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none transform -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-secondary/5 blur-[100px] rounded-full pointer-events-none transform -translate-y-1/2" />

      {/* Label */}
      <div className="flex justify-center mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 tag-style bg-background/50 backdrop-blur-sm">
          <Award className="w-3 h-3 text-[hsl(var(--cyan-bright))]" />
          <span className="text-xs font-bold tracking-wider">{isRTL ? 'المواد المستخدمة' : 'PRODUITS UTILISÉS'}</span>
        </div>
      </div>

      {/* Carousel track — always LTR so the marquee scrolls correctly in both languages */}
      <div className="relative w-full overflow-hidden" dir="ltr">
        {/* Edge fades */}
        <div className="absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Scrolling container — CSS driven marquee */}
        <div className="flex w-max animate-marquee hover:![animation-play-state:paused]" style={{ willChange: 'transform', direction: 'ltr', gap: '0' }}>
          {[...Array(10)].map((_, arrayIdx) => (
            <div key={`set-${arrayIdx}`} className="flex items-center">
              {partners.map((partner) => (
                <div
                  key={`${arrayIdx}-${partner.id}`}
                  className="flex items-center justify-center shrink-0 mx-6 sm:mx-10 md:mx-14"
                >
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    className="h-16 sm:h-20 md:h-24 w-auto object-contain brightness-90 hover:brightness-110 transition-all duration-300"
                    loading="lazy"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
