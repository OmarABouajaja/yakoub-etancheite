import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import QuoteWizard from './QuoteWizard';
import { X, Zap } from 'lucide-react';

interface QuoteSectionProps {
  isModal?: boolean;
  onClose?: () => void;
}

const QuoteSection: React.FC<QuoteSectionProps> = ({ isModal = false, onClose }) => {
  const { t, isRTL } = useLanguage();

  if (isModal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-4 px-4 md:items-center md:pt-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-background/90 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg glass-card shadow-2xl z-10 urban-border flex flex-col max-h-[90vh] overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-sm hover:bg-muted transition-colors border border-border z-20"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 tag-style mb-4">
                <Zap className="w-3 h-3 text-[hsl(var(--cyan-bright))]" />
                <span className="text-xs">{isRTL ? 'عرض سريع' : 'DEVIS EXPRESS'}</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground font-display tracking-wider">
                {t('quote.title')}
              </h2>
              <p className="text-muted-foreground mt-2">{t('quote.subtitle')}</p>
            </div>

            <QuoteWizard onClose={onClose} />
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <section id="quote" className="py-24 relative spray-texture">
      {/* Background accents */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-[hsl(var(--steel-blue))] opacity-[0.07] blur-[100px] rounded-full" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[hsl(var(--cyan-bright))] opacity-[0.07] blur-[100px] rounded-full" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card p-8 md:p-12 urban-border"
          >
            <div className="text-center mb-8">
              <div className="flex justify-center w-full mb-4">
                <div className="inline-flex items-center gap-2 tag-style">
                  <Zap className="w-3 h-3 text-[hsl(var(--cyan-bright))]" />
                  <span className="text-xs">{isRTL ? 'طلب عرض' : 'DEMANDE DE DEVIS'}</span>
                </div>
              </div>
              <h2 className="section-title">{t('quote.title')}</h2>
              <p className="section-subtitle mx-auto mt-4">{t('quote.subtitle')}</p>
            </div>

            <QuoteWizard />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default QuoteSection;
