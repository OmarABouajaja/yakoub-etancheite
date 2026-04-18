import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type Language = 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
  phone: string;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navbar
    'nav.services': 'Services',
    'nav.portfolio': 'Réalisations',
    'nav.blog': 'Blog',
    'nav.quote': 'Devis Gratuit',
    'nav.contact': 'Contact',
    'nav.cta': 'Demander Devis',

    // Hero
    'hero.title': 'Protection Absolue',
    'hero.subtitle': 'Contre l\'Eau',
    'hero.description': 'Problème de condensation, murs humides ou toit qui fuit en hiver ? On a la solution. La meilleure technologie d\'étanchéité Derbigum — qualité supérieure, savoir-faire professionnel, prix accessibles. Garantie après installation. Toute la Tunisie.',
    'hero.cta.primary': 'Devis Gratuit',
    'hero.cta.secondary': 'Voir Projets',
    'hero.badge': 'Partenaire Officiel Derbigum',

    // Stats
    'stats.projects': 'Projets Réalisés',
    'stats.experience': 'Ans d\'Expérience',
    'stats.guarantee': 'Ans de Garantie',
    'stats.satisfaction': 'Satisfaction',

    // Services
    'services.title': 'Nos Services',
    'services.subtitle': 'Votre toit fuit ? Murs qui suintent ? Condensation partout ? On a la solution — avec garantie après installation.',
    'services.roof.title': 'Étanchéité Toiture-Terrasse',
    'services.roof.desc': 'Votre toit est abîmé, fissuré ou gotite en hiver ? On intervient avec la membrane Derbigum — la meilleure technologie du marché. Résultat garanti, toute la Tunisie.',
    'services.wall.title': 'Impérméabilisation Façades',
    'services.wall.desc': 'Murs qui humiditént, peinture qui sé’écaille chaque année ? Terminons le cycle. Étanchéité des façades avec les technologies d’avant-garde Derbigum. Une seule fois, bien fait.',
    'services.pool.title': 'Étanchéité Piscine & Réservoirs',
    'services.pool.desc': 'Revêtement étanche spécial bassins et réservoirs. Produits les mieux adaptés aux conditions tunisiennes — chaleur, humidité, UV. Qualité et durabilité garanties.',
    'services.basement.title': 'Fondations & Humidité Ascendante',
    'services.basement.desc': 'Vos murs intérieurs sont humides ? Odeur de moisissure ? La protection des fondations stoppe la remontée capillaire définitivement. Matériaux de pointe, dés les usines les plus modernes.',
    'services.building.title': 'Parkings & Toits Plats',
    'services.building.desc': 'Étanchéité des parkings, toits plats et espaces en terrasse. Solutions durables pour toute la République Tunisienne.',
    'services.parking.title': 'Étanchéité Parking',
    'services.parking.desc': 'Protection spécialisée des parkings souterrains et en surface. Revêtements résistants aux charges et aux infiltrations. Produit clé en main.',
    'services.syndic.title': 'Kit Syndic & Gestionnaires',
    'services.syndic.desc': 'Pack complet pour gestionnaires d’immeubles — diagnostic gratuit, devis détaillé et assistance technique après installation. Contactez-nous par message, on répond dans les plus brefs délais.',
    'services.syndic.download': 'Télécharger PDF Officiel',
    'services.derbigum.label': 'Partenaire Officiel',
    'services.derbigum.title': 'Technologie Derbigum',
    'services.derbigum.desc': 'Des usines les plus modernes sur le marché. Des technologies d’avant-garde. Des produits d’étanchéité les mieux adaptés. Assistance technique et garantie après installation.',
    'services.derbigum.cta': 'En savoir plus',

    // Portfolio
    'portfolio.title': 'Nos Réalisations',
    'portfolio.subtitle': 'Découvrez nos projets d\'étanchéité à travers la Tunisie',
    'portfolio.scan': 'Glisser pour Réparer',
    'portfolio.before': 'Avant',
    'portfolio.after': 'Après',

    // Quote Form
    'quote.title': 'Devis Intelligent',
    'quote.subtitle': 'Obtenez une estimation en 3 étapes simples',
    'quote.step1.title': 'Type de Problème',
    'quote.step1.subtitle': 'Sélectionnez la zone concernée',
    'quote.step2.title': 'Détails du Projet',
    'quote.step2.subtitle': 'Précisez la surface et l\'urgence',
    'quote.step3.title': 'Vos Coordonnées',
    'quote.step3.subtitle': 'Pour recevoir votre devis',
    'quote.area': 'Surface',
    'quote.area.more': 'Plus de 500 m²',
    'quote.area.custom': 'Précisez la surface exacte (m²)',
    'quote.urgent': 'Urgent (sous 48h)',
    'quote.name': 'Nom Complet',
    'quote.phone': 'Téléphone',
    'quote.submit': 'Envoyer la Demande',
    'quote.success': 'Demande envoyée avec succès!',
    'quote.next': 'Suivant',
    'quote.prev': 'Retour',
    'quote.problem.roof': 'Toiture',
    'quote.problem.wall': 'Murs',
    'quote.problem.pool': 'Piscine',
    'quote.problem.basement': 'Sous-sol',

    // Weather Alert
    'weather.alert': 'Prévision de pluies ce weekend — Protégez votre toiture maintenant avant les infiltrations. Appelez-nous: 25 589 419',
    'weather.dismiss': 'Fermer',

    // Footer
    'footer.rights': 'Tous droits réservés',
    'footer.address': 'Disponible dans toute la Tunisie',
    'footer.phone': '+216 25 589 419',
    'footer.coverage': 'Toute la République Tunisienne',
    'footer.partner': 'Partenaire Officiel Derbigum',

    // Validation
    'validation.name.required': 'Le nom est requis',
    'validation.phone.required': 'Le téléphone est requis',
    'validation.phone.invalid': 'Numéro tunisien invalide (8 chiffres, commence par 2, 4, 5 ou 9)',
    'validation.problem.required': 'Veuillez sélectionner un type de problème',
    'validation.location.required': 'La région est requise',
  },
  ar: {
    // Navbar
    'nav.services': 'خدماتنا',
    'nav.portfolio': 'إنجازاتنا',
    'nav.blog': 'المدونة',
    'nav.quote': 'عرض أسعار مجاني',
    'nav.contact': 'اتصل بنا',
    'nav.cta': 'طلب عرض أسعار',

    // Hero
    'hero.title': 'حماية مطلقة',
    'hero.subtitle': 'ضد الماء',
    'hero.description': 'عندك مشكلة الندى وتسرب الماء في الدار؟ خايف على صغارك وأثاثك من الرطوبة؟ نوفرلك أحسن تقنية عزل تتحمل كل العوامل الطبيعية. السلعة المضمونة والخدمة المتقونة — شريك رسمي Derbigum.‏',
    'hero.cta.primary': 'عرض أسعار مجاني',
    'hero.cta.secondary': 'مشاهدة المشاريع',
    'hero.badge': 'شريك رسمي Derbigum',

    // Stats
    'stats.projects': 'مشروع منجز',
    'stats.experience': 'سنة خبرة',
    'stats.guarantee': 'سنوات ضمان',
    'stats.satisfaction': 'رضا العملاء',

    // Services
    'services.title': 'خدماتنا',
    'services.subtitle': 'سطح دارك تاعب و مشقق؟ جدران ندية و دهينة تتقشر؟ عندنا الحل الأحسن — بضمان بعد التركيب.',
    'services.roof.title': 'عزل الأسطح والتراسات',
    'services.roof.desc': 'سطح دارك تاعب و مشقق و يعدي للماء في الشتاء؟ ندخلو بتقنية Derbigum العالمية — الحل الدائم مع ضمان بعد التركيب.',
    'services.wall.title': 'عزل وتغليف البنايات',
    'services.wall.desc': 'جدران ندية و دهينة تتقشر كل عام؟ نوقفو هذا الدوران. تغليف نهائي بتقنيات Derbigum المتطورة — مرة واحدة و مضمون.',
    'services.pool.title': 'عزل المسابح والخزانات',
    'services.pool.desc': 'طلاء عازل خاص بالأحواض وخزانات المياه. مواد ملائمة للظروف التونسية — حرارة، رطوبة، أشعة فوق بنفسجية. جودة ومتانة مضمونتان.',
    'services.basement.title': 'الأساسات و الرطوبة الصاعدة',
    'services.basement.desc': 'جدرانك الداخلية رطبة و عندك رايحة عفن؟ حماية الأساسات توقف الرطوبة نهائياً. أحدث المواد من أحدث المصانع في السوق.',
    'services.building.title': 'الأسطح المسطحة والتراسات',
    'services.building.desc': 'عزل الأسطح المسطحة والتراسات ومواقف السيارات. حلول متينة في كامل الجمهورية التونسية.',
    'services.parking.title': 'عزل مواقف السيارات',
    'services.parking.desc': 'حماية متخصصة لمواقف السيارات تحت الأرض والسطح ضد التسربات. طلاءات مقاومة للأحمال الثقيلة.',
    'services.syndic.title': 'باقة المديرين',
    'services.syndic.desc': 'حزمة كاملة لمديري العمارات — تشخيص مجاني، عرض أسعار مفصل، ومساعدة تقنية بعد التركيب. تواصل معنا برسالة، نرد في أسرع وقت، اتصل على الرقم: 25589419',
    'services.syndic.download': 'تحميل PDF الرسمي',
    'services.derbigum.label': 'شريك رسمي',
    'services.derbigum.title': 'تقنية Derbigum',
    'services.derbigum.desc': 'أحدث المصانع في السوق. تقنيات متطورة. منتجات جاهزة للتسليم. مساعدة تقنية وضمان بعد التركيب.',
    'services.derbigum.cta': 'اقرأ المزيد',

    // Portfolio
    'portfolio.title': 'إنجازاتنا',
    'portfolio.subtitle': 'اكتشف مشاريع العزل في جميع أنحاء تونس',
    'portfolio.scan': 'اسحب للإصلاح',
    'portfolio.before': 'قبل',
    'portfolio.after': 'بعد',

    // Quote Form
    'quote.title': 'عرض أسعار ذكي',
    'quote.subtitle': 'احصل على تقدير في 3 خطوات بسيطة',
    'quote.step1.title': 'نوع المشكلة',
    'quote.step1.subtitle': 'حدد المنطقة المعنية',
    'quote.step2.title': 'تفاصيل المشروع',
    'quote.step2.subtitle': 'حدد المساحة والاستعجال',
    'quote.step3.title': 'بياناتك',
    'quote.step3.subtitle': 'لاستلام عرض الأسعار',
    'quote.area': 'المساحة',
    'quote.area.more': 'أكثر من 500 م²',
    'quote.area.custom': 'حدد المساحة بدقة (م²)',
    'quote.urgent': 'مستعجل (خلال 48 ساعة)',
    'quote.name': 'الاسم الكامل',
    'quote.phone': 'الهاتف',
    'quote.submit': 'إرسال الطلب',
    'quote.success': 'تم إرسال الطلب بنجاح!',
    'quote.next': 'التالي',
    'quote.prev': 'رجوع',
    'quote.problem.roof': 'السطح',
    'quote.problem.wall': 'الجدران',
    'quote.problem.pool': 'المسبح',
    'quote.problem.basement': 'الطابق السفلي',

    // Weather Alert
    'weather.alert': 'توقعات بهطول أمطار — سطح دارك تاعب؟ اتصل علينا الآن قبل الشتاء: 25589419',
    'weather.dismiss': 'إغلاق',

    // Footer
    'footer.rights': 'جميع الحقوق محفوظة',
    'footer.address': 'موجودون في كامل الجمهورية التونسية',
    'footer.phone': '+216 25 589 419',
    'footer.coverage': 'كامل الجمهورية التونسية',
    'footer.partner': 'شريك رسمي Derbigum',

    // Validation
    'validation.name.required': 'الاسم مطلوب',
    'validation.phone.required': 'رقم الهاتف مطلوب',
    'validation.phone.invalid': 'رقم تونسي غير صالح (8 أرقام، يبدأ بـ 2، 4، 5 أو 9)',
    'validation.problem.required': 'يرجى اختيار نوع المشكلة',
    'validation.location.required': 'المنطقة مطلوبة',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');
  const [phone, setPhone] = useState('25 589 419');

  useEffect(() => {
    supabase.from('site_settings').select('phone_primary').single()
      .then(({ data }) => {
        if (data?.phone_primary) {
          // Format phone for display (removing prefix if needed, or keeping it)
          const rawPhone = data.phone_primary.replace('+216', '').trim();
          setPhone(rawPhone);
        }
      });
  }, []);

  const t = (key: string): string => {
    let text = translations[language][key] || key;
    // Dynamic replacement for phone placeholder (handles both spaced and non-spaced versions)
    const displayPhone = phone; 
    text = text.replace(/25\s?589\s?419/g, displayPhone);
    return text;
  };

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, phone }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
