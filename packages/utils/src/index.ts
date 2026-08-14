export const DELIVERY_FEE_TELANGANA = 50;
export const DELIVERY_FEE_INDIA = 100;
export const DELIVERY_FEE_INTERNATIONAL = 150;

const INDIA_ALIASES = ['india', 'in', 'bharat', 'ind'];
const TELANGANA_ALIASES = ['telangana', 'tg', 'ts'];

export const createSlug = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/\s+/g, '-');
};

export const getProductUrl = (product: { _id?: string; slug?: string; name?: string } | null | undefined): string => {
  if (!product || !product._id) return '/shop/collection';
  const slugifiedName = createSlug(product.slug || product.name || '');
  return `/product/${slugifiedName}-${product._id}`;
};

export const calculateDeliveryFee = (country = '', state = ''): number => {
  const c = country.trim().toLowerCase();
  const s = state.trim().toLowerCase();
  if (c && !INDIA_ALIASES.includes(c)) return DELIVERY_FEE_INTERNATIONAL;
  if (TELANGANA_ALIASES.includes(s)) return DELIVERY_FEE_TELANGANA;
  return DELIVERY_FEE_INDIA;
};

export const formatCurrency = (amount: number, currencySymbol = '₹'): string => {
  return `${currencySymbol}${amount.toLocaleString('en-IN')}`;
};

export const stemWord = (w: string): string =>
  w
    .replace(/ies$/, 'y')
    .replace(/ves$/, 'f')
    .replace(/ses$|shes$|ches$|xes$|zes$/, 's')
    .replace(/s$/, '')
    .replace(/ing$/, '')
    .replace(/ed$/, '')
    .replace(/er$/, '')
    .replace(/ness$/, '')
    .replace(/tion$/, '');

export const tokenize = (text: string): string[] =>
  text ? text.toLowerCase().split(/[\s,\-_/|&]+/).filter((w) => w.length > 1) : [];

const CATEGORY_TERMS = new Set(['men', 'women', 'jewelry', 'footwear']);

export const wordBound = (text: string, word: string): boolean => {
  try {
    return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
  } catch {
    return text.toLowerCase().includes(word.toLowerCase());
  }
};

export const fuzzyMatch = (source: string, query: string): boolean => {
  if (!source || !query) return false;
  const s = source.toLowerCase();
  const q = query.toLowerCase();

  if (CATEGORY_TERMS.has(q)) {
    return wordBound(s, q);
  }

  if (wordBound(s, q)) return true;

  const ns = s.replace(/[-_\s]/g, '');
  const nq = q.replace(/[-_\s]/g, '');
  if (nq.length > 2 && ns.includes(nq)) return true;

  const qs = stemWord(q);
  if (qs.length > 2) {
    const sourceWords = tokenize(s).map((w) => stemWord(w));
    if (sourceWords.includes(qs)) return true;
  }

  return false;
};
