import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Award, MapPin, Phone, Star, Factory, FlaskConical, ShieldCheck, Banknote, Map } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const AboutUs = () => {
  const { language } = useLanguage();
  const { settings } = useSiteSettings();
  const isAr = language === 'ar';

  const values = [
    {
      icon: Award,
      fr: { title: 'Partenaire Officiel Derbigum', desc: 'Nous utilisons exclusivement des produits Derbigum, leader mondial de l\'étanchéité, garantissant qualité et durabilité sur chaque chantier.' },
      ar: { title: 'شريك رسمي Derbigum', desc: 'نستخدم حصرياً منتجات Derbigum، الرائدة عالمياً في العزل، لضمان الجودة والمتانة في كل مشروع.' },
    },
    {
      icon: Shield,
      fr: { title: 'Garantie Après Installation', desc: 'Assistance technique et garantie complète après chaque installation. Votre tranquillité d\'esprit est notre priorité.' },
      ar: { title: 'ضمان بعد التركيب', desc: 'مساعدة تقنية وضمان كامل بعد كل تركيب. راحة بالك هي أولويتنا.' },
    },
    {
      icon: MapPin,
      fr: { title: 'Toute la Tunisie 🇹🇳', desc: 'Nous intervenons dans toute la République Tunisienne. Contactez-nous où que vous soyez.' },
      ar: { title: 'كامل الجمهورية التونسية 🇹🇳', desc: 'نتدخل في كامل أرجاء الجمهورية التونسية. اتصل بنا أينما كنت.' },
    },
    {
      icon: Phone,
      fr: { title: 'Contact Direct', desc: `Appelez-nous au ${settings.phone_primary} ou envoyez-nous un message. Nous répondons rapidement à toutes vos demandes.` },
      ar: { title: 'تواصل مباشر', desc: `اتصل بنا على ${settings.phone_primary} أو أرسل لنا رسالة. نردّ بسرعة على جميع طلباتكم.` },
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title={isAr ? "معلومات عنا" : "À Propos — Yakoub Travaux"}
        description={isAr
          ? `شريك رسمي Derbigum في تونس. أحسن خدمات عزل وتغليف البنايات بمواد عالية الجودة وضمان. الهاتف: ${settings.phone_primary}`
          : `Partenaire officiel Derbigum en Tunisie. Étanchéité et imperméabilisation professionnelles avec garantie. Tel: ${settings.phone_primary}`
        }
      />
      <Navbar onQuoteClick={() => window.location.href = '/contact'} />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto space-y-10"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-[hsl(var(--cyan-bright)/0.5)] bg-[hsl(var(--cyan-bright)/0.08)] text-[hsl(var(--cyan-bright))] font-bold text-xs uppercase tracking-wider mb-2">
                <Star className="w-3.5 h-3.5" /> {isAr ? 'شريك رسمي Derbigum' : 'Partenaire Officiel Derbigum'}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                {isAr ? "عن شركتنا" : "Notre Entreprise"}
              </h1>
              <p className="text-xl text-muted-foreground">
                {isAr
                  ? "أحسن خدمات بمواد عالية الجودة، صنعة احترافية وأسعار في المتناول."
                  : "Meilleurs services avec des matériaux de haute qualité, un savoir-faire professionnel et des prix accessibles."}
              </p>
            </div>

            {/* Main Description */}
            <div className="glass-card urban-border p-8 rounded-2xl space-y-6">
              <p className="text-lg leading-relaxed text-foreground/80">
                {isAr
                  ? 'نقدم لكم أحسن خدمات العزل والتغليف بمواد عالية الجودة وصنعة احترافية وأسعار في المتناول. شركاؤنا العالميون Derbigum يضمنون لنا أحدث التقنيات وأفضل المنتجات في السوق.'
                  : 'Chez Yakoub Travaux, nous offrons les meilleurs services d\'étanchéité et d\'imperméabilisation avec des matériaux de haute qualité, un savoir-faire professionnel et des prix accessibles. Notre partenariat avec Derbigum nous garantit les technologies d\'avant-garde et les meilleurs produits du marché.'}
              </p>
              <p className="text-lg leading-relaxed text-slate-300">
                {isAr
                  ? 'إوقيت تحمي سطح دارك بأحسن جودة — الحل مع العالمية Derbigum. نحن موجودون في كامل الجمهورية التونسية لخدمتكم.'
                  : 'Protégez votre maison des infiltrations d\'eau avec notre service d\'étanchéité professionnel. Nous sommes présents dans toute la République Tunisienne pour vous servir.'}
              </p>

              <h3 className="text-2xl font-bold mt-4 text-foreground font-display tracking-wider">
                {isAr ? 'ما يميّزنا' : 'Pourquoi Nous Choisir ?'}
              </h3>
              <ul className="space-y-4 text-foreground/80 mt-6">
                {(isAr ? [
                  { icon: Factory, text: 'مصانع حديثة — أحدث المواد في السوق' },
                  { icon: FlaskConical, text: 'تقنيات متطورة — منتجات جاهزة للتسليم' },
                  { icon: ShieldCheck, text: 'ضمان بعد التركيب — مساعدة تقنية متواصلة' },
                  { icon: Banknote, text: 'أسعار في المتناول — جودة بلا تنازلات' },
                  { icon: Map, text: 'كامل الجمهورية التونسية — موجودون في كل مكان' },
                ] : [
                  { icon: Factory, text: 'Usines les plus modernes — Matériaux de pointe' },
                  { icon: FlaskConical, text: 'Technologies d\'avant-garde — Produits clé en main' },
                  { icon: ShieldCheck, text: 'Garantie après installation — Assistance technique complète' },
                  { icon: Banknote, text: 'Prix accessibles — Qualité sans compromis' },
                  { icon: Map, text: 'Toute la Tunisie — Présents partout' },
                ]).map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <item.icon className="w-5 h-5 text-[hsl(var(--cyan-bright))] shrink-0 mt-0.5" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Value Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((v, i) => {
                const content = isAr ? v.ar : v.fr;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card urban-border p-6 rounded-2xl flex gap-4 items-start hover:-translate-y-1 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-sm bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                      <v.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{content.title}</h4>
                      <p className="text-sm text-slate-400">{content.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="text-center pb-12">
              <a
                href={`tel:${settings.phone_primary}`}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-md bg-primary text-primary-foreground font-bold text-lg glow-button transition-all transform hover:-translate-y-1"
                dir="ltr"
              >
                <Phone className="w-5 h-5" />
                {settings.phone_primary}
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
