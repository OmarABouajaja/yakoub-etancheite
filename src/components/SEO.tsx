import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

const SITE_URL = 'https://yakoub-etancheite.com.tn';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-preview.png`;

interface SEOProps {
  title: string;
  description?: string;
  name?: string;
  type?: string;
  keywords?: string;
  author?: string;
  image?: string;
  path?: string;
  noIndex?: boolean;
  schema?: boolean;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
  };
}

export default function SEO({ 
  title, 
  description = "Yakoub Travaux — Experts en étanchéité depuis 15 ans en Tunisie. Toitures, terrasses, piscines, façades. Devis gratuit et garantie 10 ans.", 
  name = "Yakoub Travaux", 
  type = "website",
  keywords = "étanchéité, waterproofing, isolation, derbigum, tunisie, toiture, façade, piscine, عزل مائي",
  author = "Yakoub Travaux",
  image,
  path = '',
  noIndex = false,
  schema = true,
  article,
}: SEOProps) {
  const { phone } = useLanguage();
  
  const fullUrl = `${SITE_URL}${path}`;
  const fullImage = image 
    ? (image.startsWith('http') ? image : `${SITE_URL}${image}`)
    : DEFAULT_OG_IMAGE;
  const fullTitle = `${title} | Yakoub Travaux`;

  // JSON-LD structured data — LocalBusiness + WebSite
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#business`,
    "name": "Yakoub Travaux",
    "alternateName": "يعقوب للعزل المائي",
    "image": `${SITE_URL}/og-preview.png`,
    "logo": `${SITE_URL}/logo.png`,
    "description": description,
    "telephone": phone || "+21625589419",
    "email": "yakoub.etanche@gmail.com",
    "url": SITE_URL,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "",
      "addressLocality": "Tunis",
      "addressRegion": "Tunis",
      "addressCountry": "TN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 36.8065,
      "longitude": 10.1815
    },
    "areaServed": {
      "@type": "Country",
      "name": "Tunisia"
    },
    "priceRange": "$$",
    "currenciesAccepted": "TND",
    "paymentAccepted": "Cash, Bank Transfer",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "08:00",
        "closes": "18:00"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/yakoubetanche",
      "https://www.instagram.com/yakoub_etanche",
      "https://www.tiktok.com/@yakoub_etanche"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Services d'Étanchéité",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": { "@type": "Service", "name": "Étanchéité Toiture" }
        },
        {
          "@type": "Offer",
          "itemOffered": { "@type": "Service", "name": "Étanchéité Terrasse" }
        },
        {
          "@type": "Offer",
          "itemOffered": { "@type": "Service", "name": "Étanchéité Piscine" }
        },
        {
          "@type": "Offer",
          "itemOffered": { "@type": "Service", "name": "Imperméabilisation Façade" }
        }
      ]
    }
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Yakoub Travaux",
    "url": SITE_URL,
    "description": "Expert en étanchéité en Tunisie depuis 15 ans",
    "inLanguage": ["fr-TN", "ar-TN"],
    "publisher": { "@id": `${SITE_URL}/#business` }
  };

  const articleSchema = article ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": fullImage,
    "datePublished": article.publishedTime,
    "dateModified": article.modifiedTime || article.publishedTime,
    "author": { "@type": "Organization", "name": article.author || "Yakoub Travaux" },
    "publisher": {
      "@type": "Organization",
      "name": "Yakoub Travaux",
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/logo.png` }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": fullUrl }
  } : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords} />
      {author && <meta name='author' content={author} />}
      {noIndex && <meta name='robots' content='noindex, nofollow' />}
      <link rel="canonical" href={fullUrl} />
      
      {/* Facebook / OpenGraph */}
      <meta property="og:type" content={article ? 'article' : type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:secure_url" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${title} — Yakoub Travaux`} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={name} />
      <meta property="og:locale" content="fr_TN" />

      {/* Article-specific OG */}
      {article?.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
      {article?.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
      {article?.section && <meta property="article:section" content={article.section} />}
      
      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@YakoubTravaux" />
      <meta name="twitter:creator" content="@YakoubTravaux" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={`${title} — Yakoub Travaux`} />

      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      )}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(webSiteSchema)}
        </script>
      )}
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
    </Helmet>
  );
}
