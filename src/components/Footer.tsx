import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Phone, Mail, Zap, Facebook, Instagram, MessageCircle, Star, Code } from 'lucide-react';

// TikTok SVG — not in lucide-react
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.58a8.2 8.2 0 004.79 1.53V6.66a4.85 4.85 0 01-1.02.03z"/>
  </svg>
);
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Footer: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { settings } = useSiteSettings();
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-card border-t-2 border-primary/30 spray-texture relative">
      {/* Background accent */}
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[hsl(var(--orange))] opacity-5 blur-[150px] rounded-full" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-sm bg-gradient-to-br from-primary to-secondary flex items-center justify-center transform -skew-x-6">
                <span className="text-primary-foreground font-bold text-3xl font-display skew-x-6">Y</span>
              </div>
              <div>
                <span className="text-3xl font-bold text-foreground font-display tracking-wider block">
                  YAKOUB
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-[0.4em]">
                  Travaux
                </span>
              </div>
            </div>
            <p className="text-muted-foreground max-w-md mb-4 leading-relaxed">
              {isRTL
                ? 'أحسن خدمات بمواد عالية الجودة وصنعة احترافية وأسعار في المتناول. موجودون في كامل الجمهورية التونسية.'
                : 'Meilleurs services avec des matériaux de haute qualité, un savoir-faire professionnel et des prix accessibles. Disponible dans toute la Tunisie.'}
            </p>
            {/* Derbigum Partner Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-5 rounded-sm border border-[hsl(var(--orange)/0.5)] bg-[hsl(var(--orange)/0.08)] text-[hsl(var(--orange))] font-bold text-xs uppercase tracking-wider">
              <Star className="w-3.5 h-3.5" />
              <span>{t('footer.partner')}</span>
            </div>
            <div className="flex gap-3">
              {[
                { name: 'facebook', href: settings.facebook_url || '#', icon: Facebook },
                { name: 'instagram', href: settings.instagram_url || '#', icon: Instagram },
                { name: 'whatsapp', href: `https://wa.me/${settings.whatsapp_number}`, icon: MessageCircle },
                { name: 'tiktok', href: settings.tiktok_url || '#', icon: TikTokIcon },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center hover:bg-[hsl(var(--cyan-bright))/0.2] transition-all border border-border hover:border-[hsl(var(--cyan-bright))] hover:text-[hsl(var(--cyan-bright))] transform hover:-skew-x-3 text-foreground shadow-lg"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-foreground font-bold mb-6 font-display tracking-wider text-xl">
              {isRTL ? 'روابط سريعة' : 'LIENS RAPIDES'}
            </h4>
            <ul className="space-y-4">
              {[
                { key: 'services', href: '/#services' },
                { key: 'portfolio', href: '/#portfolio' },
                { key: 'quote', href: '/#quote' },
              ].map(({ key, href }) => (
                <li key={key}>
                  <a
                    href={href}
                    className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider text-sm font-medium flex items-center gap-2 group"
                  >
                    <span className="w-2 h-2 bg-primary/50 group-hover:bg-primary transition-colors" />
                    {t(`nav.${key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-foreground font-bold mb-6 font-display tracking-wider text-xl">
              {t('nav.contact').toUpperCase()}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground">{settings.address}</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-secondary/10 border border-secondary/30 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-secondary" />
                </div>
                <a
                  href={`tel:${settings.phone_primary}`}
                  className="text-muted-foreground hover:text-primary transition-colors font-bold"
                  dir="ltr"
                >
                  {settings.phone_primary}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-accent/10 border border-accent/30 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-accent" />
                </div>
                <span className="text-muted-foreground">{settings.email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col items-center gap-8">
            <p className="text-muted-foreground text-sm uppercase tracking-wider text-center">
              © {currentYear} Yakoub Travaux. {t('footer.rights')}.
            </p>
            
            {/* Developer Banner */}
            <a 
              href="https://www.linkedin.com/in/omar-abouajaja" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-muted/20 border border-border/50 hover:bg-muted/40 hover:border-primary/40 transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center p-2 transform group-hover:scale-110 transition-transform">
                <Code className="w-full h-full text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-bold leading-none mb-1">Developed by</span>
                <span className="text-sm text-foreground font-bold group-hover:text-primary transition-colors">Omar Abouajaja</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
