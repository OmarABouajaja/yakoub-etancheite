import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  onQuoteClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onQuoteClick }) => {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { key: 'services', href: '/#services' },
    { key: 'portfolio', href: '/#portfolio' },
    { key: 'blog', href: '/blog' },
    { key: 'contact', href: '/#contact' },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'ar' : 'fr');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-background/95 backdrop-blur-2xl shadow-lg shadow-black/10 border-b border-border/50'
        : 'bg-background/80 backdrop-blur-xl border-b-2 border-primary/20'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="h-12 w-12 md:h-14 md:w-14 bg-white rounded-md p-0.5 flex items-center justify-center overflow-hidden transform group-hover:scale-105 transition-transform border-2 border-primary/20">
              <img
                src="/logo.png"
                alt="Yakoub Travaux"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground font-bold text-xl font-display tracking-wider">
                YAKOUB
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
                ÉTANCHÉITÉ
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ key, href }) => (
              <a
                key={key}
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors relative group uppercase tracking-wider text-sm font-medium"
              >
                {t(`nav.${key}`)}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all group-hover:w-full" />
              </a>
            ))}

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 transition-all uppercase tracking-wider text-sm"
              aria-label={language === 'fr' ? 'Switch to Arabic' : 'Changer en Français'}
            >
              <Globe className="w-4 h-4 text-secondary" />
              <span className="font-bold text-foreground">
                {language === 'fr' ? 'FR' : 'عربي'}
              </span>
            </button>

            {/* CTA Button */}
            <button
              onClick={onQuoteClick}
              className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-bold glow-button uppercase tracking-wider text-sm"
            >
              {t('nav.cta')}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-md border border-border hover:bg-primary/5 transition-colors"
              aria-label="Toggle language"
            >
              <Globe className="w-5 h-5 text-secondary" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md border border-primary/50 hover:bg-primary/5 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-primary" />
              ) : (
                <Menu className="w-5 h-5 text-primary" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card/95 backdrop-blur-xl border-t border-primary/20"
          >
            <div className="container mx-auto px-4 py-6 space-y-4">
              {navLinks.map(({ key, href }) => (
                <a
                  key={key}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-3 text-foreground hover:text-primary transition-colors uppercase tracking-wider font-medium border-b border-border/30"
                >
                  {t(`nav.${key}`)}
                </a>
              ))}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onQuoteClick();
                }}
                className="w-full py-4 rounded-md bg-primary text-primary-foreground font-bold glow-button uppercase tracking-wider"
              >
                {t('nav.cta')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
