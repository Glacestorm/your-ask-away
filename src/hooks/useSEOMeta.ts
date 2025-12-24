import { useEffect } from 'react';

export interface SEOMetaProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  canonical?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
}

/**
 * Hook para gestionar meta tags SEO de forma dinámica
 */
export function useSEOMeta({
  title,
  description,
  keywords,
  ogImage = '/og-image.png',
  ogType = 'website',
  canonical,
  noIndex = false,
  structuredData,
}: SEOMetaProps) {
  useEffect(() => {
    // Title
    document.title = `${title} | ObelixCRM`;

    // Meta description
    updateMeta('description', description);

    // Keywords
    if (keywords) {
      updateMeta('keywords', keywords);
    }

    // Open Graph
    updateMeta('og:title', title, 'property');
    updateMeta('og:description', description, 'property');
    updateMeta('og:image', ogImage, 'property');
    updateMeta('og:type', ogType, 'property');
    updateMeta('og:site_name', 'ObelixCRM', 'property');

    // Twitter Card
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);

    // Canonical
    if (canonical) {
      updateLink('canonical', canonical);
    }

    // Robots
    if (noIndex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      updateMeta('robots', 'index, follow');
    }

    // Structured Data (JSON-LD)
    if (structuredData) {
      updateStructuredData(structuredData);
    }

    return () => {
      // Cleanup structured data on unmount
      const existing = document.querySelector('script[data-seo="structured-data"]');
      if (existing) {
        existing.remove();
      }
    };
  }, [title, description, keywords, ogImage, ogType, canonical, noIndex, structuredData]);
}

function updateMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let meta = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function updateLink(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function updateStructuredData(data: Record<string, unknown>) {
  let script = document.querySelector('script[data-seo="structured-data"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-seo', 'structured-data');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    ...data,
  });
}

// Pre-built structured data generators
export const structuredDataGenerators = {
  organization: () => ({
    '@type': 'Organization',
    name: 'ObelixCRM',
    url: 'https://obelixcrm.com',
    logo: 'https://obelixcrm.com/logo.png',
    sameAs: [
      'https://twitter.com/obelixcrm',
      'https://linkedin.com/company/obelixcrm',
    ],
  }),

  product: (product: { name: string; description: string; price: number; currency?: string }) => ({
    '@type': 'Product',
    name: product.name,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'EUR',
      availability: 'https://schema.org/InStock',
    },
  }),

  softwareApplication: (app: { name: string; description: string; category: string }) => ({
    '@type': 'SoftwareApplication',
    name: app.name,
    description: app.description,
    applicationCategory: app.category,
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
  }),

  faq: (faqs: { question: string; answer: string }[]) => ({
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }),

  breadcrumb: (items: { name: string; url: string }[]) => ({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),
};

export default useSEOMeta;
