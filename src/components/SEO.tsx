import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOProps {
  title: string;
  description?: string;
  name?: string;
  type?: string;
  keywords?: string;
  author?: string;
  image?: string;
  schema?: boolean;
}

export default function SEO({ 
  title, 
  description = "Yakoub Travaux — Experts en étanchéité depuis 15 ans en Tunisie. Toitures, terrasses, piscines, façades. Devis gratuit et garantie 10 ans.", 
  name = "Yakoub Travaux", 
  type = "website",
  keywords = "étanchéité, waterproofing, isolation, derbigum, tunisie, toiture, façade, piscine",
  author = "Yakoub Travaux",
  image = "/logo.jpg",
  schema = true
}: SEOProps) {
  const { phone } = useLanguage();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // JSON-LD structured data for Local Business (great for SEO & Ads)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Yakoub Travaux",
    "image": `${currentUrl.split('/')[0]}//${currentUrl.split('/')[2]}/logo.jpg`,
    "description": description,
    "telephone": phone,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Tunis",
      "addressRegion": "Tunis",
      "addressCountry": "TN"
    },
    "priceRange": "$$",
    "url": currentUrl.split('/')[0] + "//" + currentUrl.split('/')[2]
  };

  return (
    <Helmet>
      <title>{title} | Yakoub Travaux</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords} />
      {author && <meta name='author' content={author} />}
      
      {/* Facebook / OpenGraph tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={`${title} | Yakoub Travaux`} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={name} />
      
      {/* Twitter tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:title" content={`${title} | Yakoub Travaux`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
