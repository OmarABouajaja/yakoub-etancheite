import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import RainCanvas from './RainCanvas';
import { Shield, ChevronDown, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HeroSectionProps {
  onQuoteClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onQuoteClick }) => {
  const { t, isRTL } = useLanguage();

  const [stats, setStats] = useState([
    { value: '500+', label: t('stats.projects') },
    { value: '15',   label: t('stats.experience') },
    { value: '10',   label: t('stats.guarantee') },
    { value: '98%',  label: t('stats.satisfaction') },
  ]);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('stat_projects, stat_experience, stat_guarantee, stat_satisfaction')
      .single()
      .then(({ data }) => {
        if (data) {
          setStats([
            { value: data.stat_projects   || '500+', label: t('stats.projects') },
            { value: data.stat_experience || '15',   label: t('stats.experience') },
            { value: data.stat_guarantee  || '10',   label: t('stats.guarantee') },
            { value: data.stat_satisfaction || '98%', label: t('stats.satisfaction') },
          ]);
        }
      });
  }, [t]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden spray-texture">
      {/* Rain Canvas Background */}
      <RainCanvas />

      {/* Graffiti Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 opacity-20 rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--steel-blue)) 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 right-10 w-80 h-80 opacity-20 rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--cyan-bright)) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-10 rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--water-blue)) 0%, transparent 70%)' }} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-8"
          >
            <span className="inline-flex items-center gap-2 tag-style">
              <Zap className="w-4 h-4 text-[hsl(var(--orange))]" />
              <span className="text-foreground">
                {isRTL ? 'خبراء العزل المائي' : 'Experts en Étanchéité'}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border-2 border-[hsl(var(--orange))] bg-[hsl(var(--orange)/0.10)] font-bold text-sm uppercase tracking-wider text-[hsl(var(--orange))]">
              <Shield className="w-4 h-4" />
              {t('hero.badge')}
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl lg:text-9xl font-bold text-foreground mb-2 font-display tracking-wider animate-glitch"
          >
            {t('hero.title')}
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-gradient mb-8 font-display tracking-wider"
          >
            {t('hero.subtitle')}
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
          >
            {t('hero.description')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              onClick={onQuoteClick}
              className="px-10 py-5 rounded-sm bg-primary text-primary-foreground font-bold text-lg glow-button w-full sm:w-auto"
            >
              {t('hero.cta.primary')}
            </button>
            <a
              href="#portfolio"
              className="px-10 py-5 rounded-sm urban-border text-foreground font-bold text-lg uppercase tracking-wider hover:scale-105 transition-all w-full sm:w-auto text-center"
            >
              {t('hero.cta.secondary')}
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                className={`bento-card text-center py-6 border-t-4 ${index % 2 === 0 ? 'border-[hsl(var(--steel-blue))]' : 'border-[hsl(var(--cyan-bright))]'}`}
              >
                <div className="stat-number mb-2">{stat.value}</div>
                <div className="text-muted-foreground text-sm uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>


    </section>
  );
};

export default HeroSection;
