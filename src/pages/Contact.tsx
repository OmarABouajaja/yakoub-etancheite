import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import QuoteSection from '@/components/QuoteSection';
import { useLanguage } from '@/contexts/LanguageContext';

const Contact = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO 
        title={isAr ? "اتصل بنا - Yakoub Travaux" : "Contactez-Nous - Yakoub Travaux"} 
        description={isAr 
          ? "تواصل مع شركة Yakoub للحصول على استشارة أو عرض أسعار مجاني لجميع أعمال العزل." 
          : "Contactez Yakoub Travaux d'Étanchéité pour un devis gratuit ou une consultation sur vos travaux."}
        path="/contact"
      />
      <Navbar onQuoteClick={() => window.scrollTo(0, document.body.scrollHeight)} />
      
      <main className="flex-grow pt-8">
        <QuoteSection />
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
