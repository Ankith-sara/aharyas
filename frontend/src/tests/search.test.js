

// Search helpers 
const stemWord = (word) =>
    word
        .replace(/ies$/, 'y')
        .replace(/ves$/, 'f')
        .replace(/ses$|shes$|ches$|xes$|zes$/, 's')
        .replace(/s$/, '')
        .replace(/ing$/, '')
        .replace(/ed$/, '')
        .replace(/er$/, '')
        .replace(/ness$/, '')
        .replace(/tion$/, '');

const tokenize = (text) => {
    if (!text) return [];
    return text.toLowerCase().split(/[\s,\-_/|&]+/).filter(w => w.length > 1);
};

const wordBound = (text, word) => {
    try {
        return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
    } catch { return text.toLowerCase().includes(word.toLowerCase()); }
};

const CATEGORY_TERMS = new Set(['men', 'women', 'jewelry', 'footwear']);

const fuzzyMatch = (source, query) => {
    if (!source || !query) return false;
    const s = source.toLowerCase();
    const q = query.toLowerCase();

    // Category terms: strict word-boundary only
    if (CATEGORY_TERMS.has(q)) {
        return wordBound(s, q);
    }

    // Word-boundary match
    if (wordBound(s, q)) return true;

    // Normalization check for hyphen/spaces (coord → co-ord)
    const ns = s.replace(/[-_\s]/g, "");
    const nq = q.replace(/[-_\s]/g, "");
    if (nq.length > 2 && ns.includes(nq)) return true;

    // Stemmed word-boundary match
    const qs = stemWord(q);
    if (qs.length > 2) {
        const sourceWords = tokenize(s).map(w => stemWord(w));
        if (sourceWords.includes(qs)) return true;
    }

    return false;
};

function searchProducts(products, query) {
    if (!query?.trim()) return products;
    const words = tokenize(query);
    if (words.length === 0) return products;

    return products.filter(p => {
        const fields = [p.name, p.category, p.subCategory, p.description, ...(p.tags || [])];
        return words.every(word => fields.some(field => fuzzyMatch(field, word)));
    }).sort((a, b) => {
        const scoreField = (p, word) => {
            if (fuzzyMatch(p.name, word)) return 2;
            if (fuzzyMatch(p.subCategory, word) || fuzzyMatch(p.category, word)) return 1;
            return 0;
        };
        const scoreA = words.reduce((s, w) => s + scoreField(a, w), 0);
        const scoreB = words.reduce((s, w) => s + scoreField(b, w), 0);
        return scoreB - scoreA;
    });
}

const sampleProducts = [
    { _id: '1', name: 'Cotton Kurta', category: 'Men', subCategory: 'Kurtas', description: 'Handwoven cotton kurta' },
    { _id: '2', name: 'Silk Saree', category: 'Women', subCategory: 'Sarees', description: 'Traditional Kanchipuram silk' },
    { _id: '3', name: 'Kondapalli Toy', category: 'Handmade Toys', subCategory: 'Kondapalli Bommalu', description: 'Wooden painted toy from Kondapalli' },
    { _id: '4', name: 'Blue Kurta', category: 'Women', subCategory: 'Kurtis', description: 'Light blue kurti for daily wear' },
];

describe('stemWord', () => {
    test('strips plural -s', () => expect(stemWord('kurtas')).toBe('kurta'));
    test('strips -ing', () => expect(stemWord('weaving')).toBe('weav'));
    test('strips -ed', () => expect(stemWord('painted')).toBe('paint'));
    test('strips -ies → -y', () => expect(stemWord('aries')).toBe('ary'));
    test('leaves short words alone', () => expect(stemWord('silk')).toBe('silk'));
});

describe('tokenize', () => {
    test('splits on spaces', () => expect(tokenize('cotton kurta')).toEqual(['cotton', 'kurta']));
    test('splits on hyphens', () => expect(tokenize('co-ord')).toEqual(['co', 'ord']));
    test('filters single chars', () => expect(tokenize('a b cd')).toEqual(['cd']));
    test('returns empty for null', () => expect(tokenize(null)).toEqual([]));
});

describe('searchProducts', () => {
    test('returns all products for empty query', () => {
        expect(searchProducts(sampleProducts, '')).toHaveLength(4);
    });

    test('finds exact name match', () => {
        const results = searchProducts(sampleProducts, 'silk saree');
        expect(results.map(p => p._id)).toContain('2');
    });

    test('finds by category', () => {
        const results = searchProducts(sampleProducts, 'women');
        expect(results.every(p => p.category === 'Women')).toBe(true);
    });

    test('finds by subcategory', () => {
        const results = searchProducts(sampleProducts, 'sarees');
        expect(results.map(p => p._id)).toContain('2');
    });

    test('finds by description keyword', () => {
        const results = searchProducts(sampleProducts, 'kondapalli');
        expect(results.map(p => p._id)).toContain('3');
    });

    test('multi-word query requires ALL words to match', () => {
        const results = searchProducts(sampleProducts, 'blue kurta');
        expect(results.map(p => p._id)).toContain('4');
        expect(results.map(p => p._id)).not.toContain('2');
    });

    test('name matches rank higher than description matches', () => {
        const results = searchProducts(sampleProducts, 'kurta');
        const ids = results.map(p => p._id);
        expect(ids).toContain('1');
        expect(ids).toContain('4');
        expect(ids).not.toContain('3');
        expect(ids.indexOf('1')).toBeLessThan(ids.indexOf('2') === -1 ? ids.length : ids.indexOf('2'));
    });

    test('returns empty array when no products match', () => {
        expect(searchProducts(sampleProducts, 'zzzunknown')).toHaveLength(0);
    });

    test('men query does not match women category products', () => {
        const results = searchProducts(sampleProducts, 'men');
        expect(results.map(p => p._id)).toContain('1');
        expect(results.map(p => p._id)).not.toContain('2');
        expect(results.map(p => p._id)).not.toContain('4');
    });

    test('men query does not match products with men as substring in name', () => {
        const productsWithSubstring = [
            { _id: '30', name: 'Garment Bag', category: 'Bags & Purses', subCategory: 'Handbags', description: 'A premium garment bag' },
            { _id: '31', name: 'Ornamental Ring', category: 'Jewelry', subCategory: 'Earrings', description: 'Ornamental piece' },
            { _id: '1', name: 'Cotton Kurta', category: 'Men', subCategory: 'Kurtas', description: 'Handwoven cotton kurta' },
        ];
        const results = searchProducts(productsWithSubstring, 'men');
        expect(results.map(p => p._id)).toContain('1');
        expect(results.map(p => p._id)).not.toContain('30');
        expect(results.map(p => p._id)).not.toContain('31');
    });

    test('coord query matches co-ord subcategory products using hyphen normalization', () => {
        const coordProducts = [
            { _id: '10', name: 'Printed Set', category: 'Women', subCategory: 'Women Co-ord Sets', description: 'Matching printed set' }
        ];
        const results = searchProducts(coordProducts, 'coord set');
        expect(results.map(p => p._id)).toContain('10');
    });

    test('matches on tags', () => {
        const tagProducts = [
            { _id: '20', name: 'Artisan Painting', category: 'Handmade Toys', subCategory: 'Paintings', description: 'Cheriyal art painting', tags: ['heritage', 'homedecor'] }
        ];
        const results = searchProducts(tagProducts, 'homedecor');
        expect(results.map(p => p._id)).toContain('20');
    });
});

// fuzzyMatch edge cases 
describe('fuzzyMatch', () => {
    test('returns false for null source', () => expect(fuzzyMatch(null, 'kurta')).toBe(false));
    test('returns false for null query', () => expect(fuzzyMatch('kurta', null)).toBe(false));
    test('matches whole word', () => expect(fuzzyMatch('Kondapalli Bommalu', 'kondapalli')).toBe(true));
    test('matches stemmed form', () => expect(fuzzyMatch('painted wall', 'painting')).toBe(true));
    test('case insensitive', () => expect(fuzzyMatch('Silk Saree', 'SILK')).toBe(true));
    test('men does not match women', () => expect(fuzzyMatch('Women', 'men')).toBe(false));
    test('men does not match garment', () => expect(fuzzyMatch('Garment Bag', 'men')).toBe(false));
    test('men does not match ornament', () => expect(fuzzyMatch('Ornamental Ring', 'men')).toBe(false));
    test('men matches Men category', () => expect(fuzzyMatch('Men', 'men')).toBe(true));
    test('men matches Men Shirts', () => expect(fuzzyMatch('Men Shirts', 'men')).toBe(true));
    test('coord matches co-ord via normalization', () => expect(fuzzyMatch('Women Co-ord Sets', 'coord')).toBe(true));
});