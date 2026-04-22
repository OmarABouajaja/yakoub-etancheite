import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import ServicesSection from '@/components/ServicesSection';
import { useLanguage } from '@/contexts/LanguageContext';

const ServicesList = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO 
        title={isAr ? "خدماتنا - Yakoub Travaux" : "Nos Services - Yakoub Travaux"} 
        description={isAr 
          ? "خدمات عزل شاملة تشمل الأسطح، والأساسات، والحلول التجارية." 
          : "Services d'étanchéité complets incluant toitures, fondations et solutions commerciales."}
        path="/services"
      />
      <Navbar onQuoteClick={() => window.location.href = '/contact'} />
      
      <main className="flex-grow pt-20">
        <ServicesSection />
      </main>

      <Footer />
    </div>
  );
};

export default ServicesList;
