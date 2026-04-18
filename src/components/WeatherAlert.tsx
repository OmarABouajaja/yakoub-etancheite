import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, CloudRain, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WeatherAlert: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { t, isRTL } = useLanguage();

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 border-b-2 border-primary/30"
      >
        <div className="container mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-1">
                <CloudRain className="w-5 h-5 text-secondary" />
                <Zap className="w-4 h-4 text-[hsl(var(--cyan-bright))]" />
              </div>
              <p className="text-sm text-foreground font-medium">{t('weather.alert')}</p>
            </div>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-sm hover:bg-primary/20 transition-colors border border-border flex-shrink-0"
              aria-label={t('weather.dismiss')}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WeatherAlert;
