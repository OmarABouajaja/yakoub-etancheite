import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { motion } from 'framer-motion';
import {
  Home,
  Building,
  Droplets,
  Layers,
  ArrowRight,
  Zap,
  ShieldCheck,
  Award,
  Car,
  Factory,
  FlaskConical,
  Phone,
} from 'lucide-react';

const ServicesSection: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { settings } = useSiteSettings();

  const services = [
    {
      icon: Home,
      title: t('services.roof.title'),
      desc: t('services.roof.desc'),
      color: 'orange' as const,
      problem: isRTL ? 'سطح تاعب؟ يقطر في الشتاء؟' : 'Toit fissuré ? Fuite en hiver ?',
    },
    {
      icon: Building,
      title: t('services.wall.title'),
      desc: t('services.wall.desc'),
      color: 'teal' as const,
      problem: isRTL ? 'دهينة تتقشر كل عام؟' : 'Peinture qui s\'écaille chaque année ?',
    },
    {
      icon: Droplets,
      title: t('services.pool.title'),
      desc: t('services.pool.desc'),
      color: 'water-blue' as const,
      problem: isRTL ? 'مسبح يخسر الماء؟' : 'Piscine qui perd de l\'eau ?',
    },
    {
      icon: Layers,
      title: t('services.basement.title'),
      desc: t('services.basement.desc'),
      color: 'orange' as const,
      problem: isRTL ? 'رطوبة صاعدة وعفن؟' : 'Humidité remontante et moisissures ?',
    },
    {
      icon: ShieldCheck,
      title: t('services.building.title'),
      desc: t('services.building.desc'),
      color: 'teal' as const,
      problem: isRTL ? 'تراس مشقق يتسرب؟' : 'Terrasse ou parking qui fuit ?',
    },
    {
      icon: Car,
      title: t('services.parking.title'),
      desc: t('services.parking.desc'),
      color: 'water-blue' as const,
      problem: isRTL ? 'نداوة في مواقف السيارات؟' : 'Infiltrations dans votre parking ?',
    },
  ];

  const colorClasses = {
    'orange': {
      icon: 'text-[hsl(var(--orange))] bg-[hsl(var(--orange)/0.12)] border-[hsl(var(--orange)/0.3)]',
      problem: 'text-[hsl(var(--orange))] bg-[hsl(var(--orange)/0.08)] border-[hsl(var(--orange)/0.2)]',
      glow: 'hover:shadow-[hsl(var(--orange)/0.15)]',
    },
    'teal': {
      icon: 'text-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.12)] border-[hsl(var(--teal)/0.3)]',
      problem: 'text-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.08)] border-[hsl(var(--teal)/0.2)]',
      glow: 'hover:shadow-[hsl(var(--teal)/0.15)]',
    },
    'water-blue': {
      icon: 'text-[hsl(var(--water-blue))] bg-[hsl(var(--water-blue)/0.12)] border-[hsl(var(--water-blue)/0.3)]',
      problem: 'text-[hsl(var(--water-blue))] bg-[hsl(var(--water-blue)/0.08)] border-[hsl(var(--water-blue)/0.2)]',
      glow: 'hover:shadow-[hsl(var(--water-blue)/0.15)]',
    },
  };

  return (
    <section id="services" className="py-24 relative spray-texture">
      {/* Background accents */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[hsl(var(--orange))] opacity-[0.04] blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[hsl(var(--teal))] opacity-[0.04] blur-[120px] rounded-full" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center w-full mb-4">
            <div className="inline-flex items-center gap-2 tag-style">
              <Zap className="w-3 h-3 text-[hsl(var(--cyan-bright))]" />
              <span className="text-xs">{isRTL ? 'ما نقدمه' : 'CE QUE NOUS OFFRONS'}</span>
            </div>
          </div>
          <h2 className="section-title">{t('services.title')}</h2>
          <p className="section-subtitle mx-auto mt-6 max-w-2xl">{t('services.subtitle')}</p>
        </motion.div>

        {/* Services Grid — asymmetric premium layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service, index) => {
            const colors = colorClasses[service.color];
            const isFeatured = index === 0;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={`relative glass-card urban-border group transition-all duration-500
                  hover:-translate-y-2 hover:shadow-2xl ${colors.glow}
                  bg-card/50 backdrop-blur-xl overflow-hidden
                  ${isFeatured ? 'md:col-span-2 lg:col-span-1 lg:row-span-2' : ''}
                `}
              >
                {/* Subtle hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[hsl(var(--cyan-bright)/0.03)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className={`flex flex-col gap-4 p-6 md:p-7 ${isFeatured ? 'h-full' : ''}`}>

                  {/* Problem callout pill */}
                  <div className={`inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider border ${colors.problem}`}>
                    <Zap className="w-3 h-3 shrink-0" />
                    <span>{service.problem}</span>
                  </div>

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-sm border-2 flex items-center justify-center
                    transition-all duration-500 transform -skew-x-6
                    group-hover:skew-x-0 group-hover:scale-110 shadow-lg ${colors.icon}`}>
                    <service.icon className="w-7 h-7 skew-x-6 group-hover:skew-x-0 transition-transform duration-500" />
                  </div>

                  {/* Title */}
                  <div className="flex-1 mt-1">
                    <h3 className={`font-bold text-foreground mb-3 font-display tracking-wider
                      group-hover:text-[hsl(var(--cyan-bright))] transition-colors duration-300
                      ${isFeatured ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                      {service.desc}
                    </p>
                  </div>

                  {/* Hover CTA */}
                  <div className={`flex items-center gap-2 text-[hsl(var(--cyan-bright))] font-bold uppercase tracking-wider text-xs
                    mt-auto pt-4 border-t border-border/40
                    opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0
                    transition-all duration-500 ${isRTL ? 'flex-row-reverse translate-x-4 group-hover:translate-x-0' : ''}`}>
                    <span>{isRTL ? 'اتصل بنا الآن' : 'Contactez-nous'}</span>
                    <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Derbigum Partner Banner — Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 glass-card relative overflow-hidden border-2 border-[hsl(var(--orange)/0.5)]"
        >
          {/* Decorative background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--orange)/0.06)] via-transparent to-[hsl(var(--teal)/0.06)] pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-[hsl(var(--orange))] opacity-5 blur-[80px] rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 p-6 md:p-9">
            {/* Icon */}
            <div className="w-20 h-20 rounded-sm bg-gradient-to-br from-[hsl(var(--orange))] to-[hsl(var(--teal))] flex items-center justify-center flex-shrink-0 transform -skew-x-3 shadow-xl">
              <Award className="w-10 h-10 text-white skew-x-3" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="inline-block px-3 py-1 mb-3 rounded-sm bg-[hsl(var(--orange)/0.15)] border border-[hsl(var(--orange)/0.4)] text-[hsl(var(--orange))] font-bold text-[10px] uppercase tracking-widest">
                {t('services.derbigum.label')}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2 font-display tracking-wider">
                {t('services.derbigum.title')}
              </h3>
              <p className="text-muted-foreground max-w-2xl text-sm md:text-base">{t('services.derbigum.desc')}</p>
            </div>

            {/* Feature icons + CTA */}
            <div className="flex flex-col items-start md:items-end gap-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                {[Factory, FlaskConical, ShieldCheck].map((Icon, i) => (
                  <div
                    key={i}
                    className="w-11 h-11 rounded-sm bg-muted/60 border border-border flex items-center justify-center text-[hsl(var(--orange))] hover:bg-[hsl(var(--orange)/0.15)] transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                ))}
              </div>
              <a
                href={`tel:${settings.phone_primary}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-[hsl(var(--orange))] text-white font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all shadow-lg"
              >
                <Phone className="w-4 h-4" />
                {isRTL ? `${settings.phone_primary.replace('+216', '').trim()} اتصل` : `Appeler: ${settings.phone_primary.replace('+216', '').trim()}`}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
