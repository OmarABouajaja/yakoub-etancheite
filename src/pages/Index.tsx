import React, { useState, lazy, Suspense } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';
import StickyWhatsApp from '@/components/StickyWhatsApp';
import { AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import SEO from '@/components/SEO';

// Lazy loading heavy below-the-fold components for extreme Performance
const ServicesSection = lazy(() => import('@/components/ServicesSection'));
const PartnersSection = lazy(() => import('@/components/PartnersSection'));
const PortfolioSection = lazy(() => import('@/components/PortfolioSection'));
const Testimonials = lazy(() => import('@/components/Testimonials'));
const BlogPreviewSection = lazy(() => import('@/components/BlogPreviewSection'));
const QuoteSection = lazy(() => import('@/components/QuoteSection'));

const Index = () => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const { settings } = useSiteSettings();

  const handleOpenQuote = () => {
    setIsQuoteModalOpen(true);
  };

  const handleCloseQuote = () => {
    setIsQuoteModalOpen(false);
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background">
        <SEO 
          title="Accueil" 
          description="Yakoub Travaux — Experts en étanchéité depuis 15 ans en Tunisie. Toitures, terrasses, façades. Devis gratuit et garantie." 
        />
        {/* Sticky Navbar */}
        <Navbar onQuoteClick={handleOpenQuote} />

        {/* Main Content */}
        <main>
          {/* Hero with Rain Canvas */}
          <HeroSection onQuoteClick={handleOpenQuote} />

          <Suspense fallback={<div className="h-40 w-full flex items-center justify-center pointer-events-none"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>}>
              {/* Services Bento Grid */}
              <ServicesSection />

              {/* Infinite Scrolling Partners Marquee */}
              <PartnersSection />

              {/* Portfolio with Before/After Sliders */}
              <PortfolioSection />

              {/* Testimonials */}
              <Testimonials />

              {/* Blog Preview Carousel — only shown when published posts exist */}
              <BlogPreviewSection />

              {/* Quote Form Section */}
              <QuoteSection />
          </Suspense>
        </main>

        {/* Footer */}
        <Footer />

        {/* Sticky WhatsApp Button - Always visible fallback contact */}
        <StickyWhatsApp phoneNumber={settings.whatsapp_number || "+21625589419"} />

        {/* Quote Modal */}
        <AnimatePresence>
          {isQuoteModalOpen && (
            <QuoteSection isModal onClose={handleCloseQuote} />
          )}
        </AnimatePresence>
      </div>
    </LanguageProvider>
  );
};

export default Index;

