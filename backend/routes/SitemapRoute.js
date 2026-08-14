import express from 'express';
import ProductModel from '../models/ProductModel.js';

const router = express.Router();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

let _cache = null;

const isStale = () => !_cache || Date.now() - _cache.builtAt > CACHE_TTL_MS;

const createSlug = (name) => {
    if (!name) return "";
    return name
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/\s+/g, "-");
};

const slugify = (text) => {
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

const buildSitemap = async () => {
    const products = await ProductModel.find({}, '_id name slug updatedAt').lean();
    const base = 'https://aharyas.com';
    const today = new Date().toISOString().split('T')[0];

    const categories = ['Women', 'Men', 'Handmade Toys', 'Bags & Purses', 'Daily Essentials', 'Jewelry', 'Footwear'];
    const subcategories = [
        'Tops', 'Dresses', 'Women Co-ord Sets', 'Women Shirts', 'Sarees',
        'Men Shirts', 'Kurtas', 'Men Co-ord Sets', 'Trousers',
        'Kondapalli Bommalu', 'Paintings', 'Cheriyal Masks',
        'Handbags', 'Zardozi Purses',
        'Journals', 'Pens', 'Scented candles', 'Combs', 'Cups', 'Thermal Flask',
        'Earrings', 'Stud Earrings', 'Jhumkas',
        'Women Chappals', 'Men Chappals', 'Women Jutti', 'Women Bantus', 'Men Jutti', 'Men Bantus'
    ];
    const companies = ['vasudhaa-vastrram', 'anemone-vinkel'];

    const staticUrls = [
        { loc: base, priority: '1.0', freq: 'daily' },
        { loc: `${base}/shop/collection`, priority: '0.9', freq: 'daily' },
        { loc: `${base}/about`, priority: '0.7', freq: 'monthly' },
        { loc: `${base}/try-on`, priority: '0.8', freq: 'monthly' },
        { loc: `${base}/sell`, priority: '0.6', freq: 'monthly' },
        { loc: `${base}/contact`, priority: '0.5', freq: 'monthly' },
        { loc: `${base}/faqs`, priority: '0.5', freq: 'monthly' },
        { loc: `${base}/support`, priority: '0.5', freq: 'monthly' },
        { loc: `${base}/assistant`, priority: '0.6', freq: 'monthly' },
        { loc: `${base}/privacypolicy`, priority: '0.4', freq: 'yearly' },
        { loc: `${base}/termsconditions`, priority: '0.4', freq: 'yearly' },
        { loc: `${base}/refundpolicy`, priority: '0.4', freq: 'yearly' },
        { loc: `${base}/shippingpolicy`, priority: '0.4', freq: 'yearly' },
        // Category pages
        ...categories.map((cat) => ({
            loc: `${base}/shop/${slugify(cat)}`,
            priority: '0.8',
            freq: 'daily',
        })),
        // Subcategory pages
        ...subcategories.map((sub) => ({
            loc: `${base}/shop/${slugify(sub)}`,
            priority: '0.8',
            freq: 'daily',
        })),
        // Company pages
        ...companies.map((company) => ({
            loc: `${base}/shop/company/${company}`,
            priority: '0.7',
            freq: 'weekly',
        })),
    ];

    const productUrls = products.map((p) => {
        const slugifiedName = createSlug(p.slug || p.name);
        return {
            loc: `${base}/product/${slugifiedName}-${p._id}`,
            lastmod: (p.updatedAt || new Date()).toISOString().split('T')[0],
            priority: '0.8',
            freq: 'weekly',
        };
    });

    const urlBlock = (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod || today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...productUrls].map(urlBlock).join('\n')}
</urlset>`;

    _cache = { xml, builtAt: Date.now() };
    return xml;
};

// Public sitemap endpoint
router.get('/sitemap.xml', async (req, res) => {
    try {
        const xml = isStale() ? await buildSitemap() : _cache.xml;
        const age = Math.floor((Date.now() - _cache.builtAt) / 1000);
        const maxAge = Math.floor(CACHE_TTL_MS / 1000);

        res.set({
            'Content-Type': 'application/xml; charset=UTF-8',
            'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=3600`,
            'Age': String(age),
        });
        res.send(xml);
    } catch (err) {
        console.error('[SitemapRoute] Failed to generate sitemap:', err);
        res.status(500).set('Content-Type', 'application/xml').send(
            `<?xml version="1.0"?><error>Sitemap temporarily unavailable</error>`
        );
    }
});

// Cache bust
router.post('/sitemap/bust', (req, res) => {
    const secret = req.headers['x-bust-secret'];
    if (!secret || secret !== process.env.HEALTH_SECRET) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    _cache = null;
    res.json({ success: true, message: 'Sitemap cache cleared. Will rebuild on next request.' });
});

export default router;