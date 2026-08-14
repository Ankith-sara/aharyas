export const categoryData = {
    Women: {
        subCategories: ['', 'Tops', 'Dresses', 'Women Co-ord Sets', 'Women Shirts', 'Sarees'],
        sizes: {
            default: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
            Sarees: [],
        },
    },
    Men: {
        subCategories: ['', 'Men Shirts', 'Kurtas', 'Men Co-ord Sets', 'Trousers'],
        sizes: {
            default: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
        },
    },
    'Handmade Toys': {
        subCategories: ['', 'Kondapalli Bommalu', 'Paintings', 'Cheriyal Masks'],
        sizes: { default: [] },
    },
    'Bags & Purses': {
        subCategories: ['', 'Handbags', 'Zardozi Purses'],
        sizes: { default: [] },
    },
    'Daily Essentials': {
        subCategories: ['', 'Journals', 'Pens', 'Scented candles', 'Combs', 'Cups', 'Thermal Flask'],
        sizes: { default: [] },
    },
    'Jewelry': {
        subCategories: ['', 'Earrings', 'Stud Earrings', 'Jhumkas'],
        sizes: { default: [] },
    },
    'Footwear': {
        subCategories: ['', 'Women Chappals', 'Men Chappals', 'Women Jutti', 'Women Bantus', 'Men Jutti', 'Men Bantus'],
        sizes: {
            default: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
            'Women Chappals': ['4', '5', '6', '7', '8', '9'],
            'Women Jutti': ['3', '4', '5', '6', '7', '8', '9'],
            'Women Bantus': ['4', '5', '6', '7', '8', '9'],
            'Men Chappals': ['6', '7', '8', '9', '10', '11', '12'],
            'Men Jutti': ['6', '7', '8', '9', '10', '11', '12'],
            'Men Bantus': ['6', '7', '8', '9', '10', '11', '12'],
        },
    },
};

export const WASH_CARE_EXCLUDED = new Set([
    'Bags', 'bags', 'Paintings', 'Kondapalli Bommalu',
    'Cheriyal Masks', 'Bird houses', 'Journals',
]);

export const NO_ARTISAN_STORY_CATEGORIES = new Set(['Women', 'Men']);

export const getSizesForSubCategory = (category, subCategory) => {
    const cat = categoryData[category];
    if (!cat) return [];
    return cat.sizes[subCategory] ?? cat.sizes.default ?? [];
};