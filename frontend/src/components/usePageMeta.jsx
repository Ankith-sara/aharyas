import { useEffect } from 'react';

const SITE_NAME = 'Aharyas';
const SITE_URL = 'https://aharyas.com';

const upsertMeta = (attr, value, content) => {
  let el = document.querySelector(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertScript = (id, data) => {
  let tag = document.getElementById(id);
  if (!tag) {
    tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.id = id;
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(data);
  return tag;
};

const removeScript = (id) => {
  const tag = document.getElementById(id);
  if (tag) tag.remove();
};

import { getProductUrl } from '../context/ProductContext';

// Schema builders
export const buildProductSchema = (product) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  image: product.images || [],
  description: product.description || '',
  brand: { '@type': 'Brand', name: SITE_NAME },
  sku: product._id,
  offers: {
    '@type': 'Offer',
    priceCurrency: 'INR',
    price: product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price,
    availability: product.inStock !== false
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    url: `${SITE_URL}${getProductUrl(product)}`,
    seller: { '@type': 'Organization', name: SITE_NAME },
  },
  ...(product.averageRating ? {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount || 1,
    },
  } : {}),
});

export const buildCollectionSchema = ({ title, description, url } = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: title || `${SITE_NAME} — Shop`,
  description: description || '',
  url: url || `${SITE_URL}/shop/collection`,
  isPartOf: { '@type': 'WebSite', url: SITE_URL, name: SITE_NAME },
});

export const buildBreadcrumbSchema = (crumbs = []) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: crumb.name,
    ...(crumb.url ? { item: crumb.url } : {}),
  })),
});

// Hook
const usePageMeta = ({
  title,
  description,
  robots,
  canonical,
  schema,
  breadcrumbs,
  ogImage,
  ogType = 'website',
} = {}) => {

  useEffect(() => {
    const fullTitle = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} | From Rural to Global`;

    document.title = fullTitle;

    const resolvedCanonical = canonical || `${SITE_URL}${window.location.pathname}`;

    if (description) upsertMeta('name', 'description', description);
    if (robots) upsertMeta('name', 'robots', robots);

    // Open Graph Meta Tags
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:title', title || SITE_NAME);
    if (description) upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', resolvedCanonical);
    if (ogImage) upsertMeta('property', 'og:image', ogImage);

    // Twitter Card Meta Tags
    upsertMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
    upsertMeta('name', 'twitter:title', title || SITE_NAME);
    if (description) upsertMeta('name', 'twitter:description', description);
    if (ogImage) upsertMeta('name', 'twitter:image', ogImage);

    // Canonical URL
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', resolvedCanonical);

    let schemaTag = null;
    if (schema) {
      schemaTag = upsertScript('page-schema', schema);
    } else {
      removeScript('page-schema');
    }

    let breadcrumbTag = null;
    if (breadcrumbs && breadcrumbs.length > 0) {
      breadcrumbTag = upsertScript('breadcrumb-schema', buildBreadcrumbSchema(breadcrumbs));
    } else {
      removeScript('breadcrumb-schema');
    }

    return () => {
      if (schemaTag) schemaTag.remove();
      if (breadcrumbTag) breadcrumbTag.remove();
      if (canonicalTag) canonicalTag.remove();
      
      const selectorsToClean = [
        'meta[name="description"]',
        'meta[name="robots"]',
        'meta[property="og:site_name"]',
        'meta[property="og:type"]',
        'meta[property="og:title"]',
        'meta[property="og:description"]',
        'meta[property="og:url"]',
        'meta[property="og:image"]',
        'meta[name="twitter:card"]',
        'meta[name="twitter:title"]',
        'meta[name="twitter:description"]',
        'meta[name="twitter:image"]'
      ];
      selectorsToClean.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) el.remove();
      });
    };
  }, [title, description, robots, canonical, schema, breadcrumbs, ogImage, ogType]);
};

export default usePageMeta;