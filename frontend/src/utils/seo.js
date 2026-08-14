import { categoryData } from '../assets/categoryData';

export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/ & /g, '-and-')
    .replace(/&/g, '-and-')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const COMPANIES = [
  {
    id: 'vasudhaa-vastrram',
    name: 'vasudhaa vastrram',
    displayName: 'Vasudhaa Vastrram',
  },
  {
    id: 'anemone-vinkel',
    name: 'anemone vinkel',
    displayName: 'Anemone Vinkel',
  }
];

export const getOriginalNameFromSlug = (slug) => {
  if (!slug) return null;
  const targetSlug = slug.toLowerCase();

  // Check main categories first
  for (const catName of Object.keys(categoryData)) {
    if (slugify(catName) === targetSlug) {
      return { type: 'category', name: catName };
    }
    // Check subcategories
    for (const subName of categoryData[catName].subCategories) {
      if (subName && slugify(subName) === targetSlug) {
        return { type: 'subcategory', name: subName };
      }
    }
  }
  return null;
};

export const getCompanyFromSlug = (slug) => {
  if (!slug) return null;
  const targetSlug = slug.toLowerCase();
  return COMPANIES.find(c => c.id === targetSlug || slugify(c.name) === targetSlug) || null;
};
