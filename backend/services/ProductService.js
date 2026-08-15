import imagekit from '../config/imagekit.js';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import productModel from '../models/ProductModel.js';
import logger from '../config/logger.js';
import { cacheGet, CACHE_TTL, KEYS, invalidateOnProductChange } from './CacheService.js';

const MAX_PRODUCT_IMAGES = 6;
const DEFAULT_COMPANY = 'Aharyas';

// Slug helper 
const generateUniqueSlug = async (name, excludeId = null) => {
    const base = slugify(name, { lower: true, strict: true });
    let slug = base;
    let counter = 1;
    while (true) {
        const query = { slug };
        if (excludeId) query._id = { $ne: excludeId };
        const exists = await productModel.findOne(query, '_id').lean();
        if (!exists) return slug;
        counter++;
        slug = `${base}-${counter}`;
    }
};

// Text helpers
export const sanitiseText = (str) =>
    str ? String(str).trim().replace(/<[^>]*>/g, '') : ''; // eslint-disable-line sonarjs/slow-regex -- simple HTML tag stripping

export const parseJsonField = (value) => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const getProductImageFileName = (productName, index, originalPathOrUrl) => {
    const cleanProductName = slugify(productName || 'product', { lower: true, strict: true });
    const ext = path.extname(originalPathOrUrl.split('?')[0]) || '.jpg';
    return `${cleanProductName}_${index}${ext}`;
};

// Image helpers

/**
 * Validate real file content by inspecting magic bytes.
 * Returns true only for JPEG, PNG, GIF, or WEBP headers.
 */
const validateImageContent = async (filePath) => {
    const fd = await fs.promises.open(filePath, 'r');
    try {
        const buf = Buffer.alloc(12);
        await fd.read(buf, 0, 12, 0);

        // JPEG: FF D8 FF
        if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
        // PNG:  89 50 4E 47 0D 0A 1A 0A
        if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
            buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A) return true;
        // GIF:  47 49 46 38 (GIF8)
        if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
        // WEBP: RIFF…WEBP
        if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
            buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true;

        return false;
    } finally {
        await fd.close();
    }
};

const uploadLocalFile = async (filePath, targetFilename) => {
    try {
        // Content-level validation: reject non-image files regardless of extension/MIME
        const isImage = await validateImageContent(filePath);
        if (!isImage) {
            logger.warn(`[ProductService] Rejected upload – invalid image content: ${filePath}`);
            throw Object.assign(
                new Error('Uploaded file is not a valid image (JPEG, PNG, GIF, or WEBP)'),
                { statusCode: 400 },
            );
        }

        const fileData = await fs.promises.readFile(filePath);
        const result = await imagekit.files.upload({
            file: fileData.toString('base64'),
            fileName: targetFilename || path.basename(filePath) || `image_${Date.now()}`,
            folder: 'products'
        });
        return result.url;
    } finally {
        fs.promises.unlink(filePath).catch((err) => {
            console.error('[ProductService] Failed to clean up temp file:', err.message);
        });
    }
};

const uploadRemoteUrl = async (url, targetFilename) => {
    const result = await imagekit.files.upload({
        file: url,
        fileName: targetFilename || `remote_${Date.now()}`,
        folder: 'products'
    });
    return result.url;
};

const deleteRemoteImage = async (url) => {
    if (!url || !url.includes('ik.imagekit.io')) return;
    try {
        const cleanUrl = url.split('?')[0];
        const parts = cleanUrl.split('/');
        const filename = parts[parts.length - 1];
        if (!filename) return;

        const files = await imagekit.assets.list({
            searchQuery: `name = "${filename}"`
        });

        if (files && files.length > 0) {
            const fileId = files[0].fileId;
            await imagekit.files.delete(fileId);
            console.log(`[ProductService] Successfully deleted ImageKit asset: ${filename} (ID: ${fileId})`);
        } else {
            console.log(`[ProductService] Remote ImageKit asset not found for name: ${filename}`);
        }
    } catch (err) {
        console.error('[ProductService] Failed to delete ImageKit asset:', err.message);
    }
};

const resolveProductImages = async ({ productName, files = {}, driveImageUrls = [], directImageUrls = [] }) => {
    const localFiles = [
        files.image1?.[0], files.image2?.[0], files.image3?.[0],
        files.image4?.[0], files.image5?.[0], files.image6?.[0],
    ].filter(Boolean);

    const localTasks = localFiles.map((f, i) => {
        const index = i + 1;
        const targetFilename = getProductImageFileName(productName, index, f.originalname || f.path);
        return uploadLocalFile(f.path, targetFilename).catch(() => null);
    });

    const driveTasks = driveImageUrls.map((u, i) => {
        const index = localFiles.length + i + 1;
        const targetFilename = getProductImageFileName(productName, index, u);
        return uploadRemoteUrl(u, targetFilename).catch(() => null);
    });

    const directTasks = directImageUrls.map((url, i) => {
        if (!url) return Promise.resolve(null);
        if (url.includes('ik.imagekit.io') || url.includes('res.cloudinary.com')) {
            return Promise.resolve(url);
        }
        const index = localFiles.length + driveImageUrls.length + i + 1;
        const targetFilename = getProductImageFileName(productName, index, url);
        return uploadRemoteUrl(url, targetFilename).catch(() => null);
    });

    const [localUrls, driveUrls, directUrls] = await Promise.all([
        Promise.all(localTasks),
        Promise.all(driveTasks),
        Promise.all(directTasks),
    ]);

    return [...localUrls, ...driveUrls, ...directUrls].filter(Boolean).slice(0, MAX_PRODUCT_IMAGES);
};

//  Pagination / search helpers 
export const paginate = async (Model, query, { page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        Model.find(query).skip(skip).limit(limit).lean(),
        Model.countDocuments(query),
    ]);
    return { data, total, page: Number(page), pages: Math.ceil(total / limit), limit: Number(limit) };
};

export const optimizeImage = (url, width = 600) => {
    if (!url || !url.includes('ik.imagekit.io')) {
        // Fallback for legacy Cloudinary URLs
        if (url && url.includes('res.cloudinary.com')) {
            return url.replace('/upload/', `/upload/w_${width},f_auto/`);
        }
        return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tr=w-${width}`;
};

export const searchProducts = async ({ q, category, minPrice, maxPrice, artisanRegion, sort, page, limit }) => {
    const query = {};
    if (q) query.$text = { $search: q };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (artisanRegion) query.artisanRegion = artisanRegion;

    const sortMap = {
        'price-asc': { price: 1 },
        'price-desc': { price: -1 },
        'newest': { createdAt: -1 },
        'rating': { averageRating: -1 },
        'bestseller': { sold: -1 },
    };

    const sortOption = sortMap[sort] || { createdAt: -1 };
    const p = Number(page) || 1;
    const l = Math.min(Number(limit) || 20, 100);
    const skip = (p - 1) * l;

    const [products, total] = await Promise.all([
        productModel.find(query).sort(sortOption).skip(skip).limit(l).lean(),
        productModel.countDocuments(query),
    ]);

    return { products, total, page: p, pages: Math.ceil(total / l) };
};

export const getAllProducts = async ({ page, limit } = {}) =>
    paginate(productModel, {}, { page, limit });

// Product use-cases 
export const createProduct = async ({ body, files, adminId }) => {
    const name = sanitiseText(body.name);
    const description = sanitiseText(body.description);
    const company = sanitiseText(body.company) || DEFAULT_COMPANY;
    const { price, discount, category, subCategory, bestseller, sizes } = body;

    if (!name)
        throw Object.assign(new Error('Product name is required'), { statusCode: 400 });
    if (!description)
        throw Object.assign(new Error('Product description is required'), { statusCode: 400 });
    if (!price || isNaN(Number(price)) || Number(price) < 0)
        throw Object.assign(new Error('A valid price is required'), { statusCode: 400 });

    const images = await resolveProductImages({
        productName: name,
        files,
        driveImageUrls: parseJsonField(body.driveImageUrls),
        directImageUrls: parseJsonField(body.directImageUrls),
    });

    const slug = await generateUniqueSlug(name);

    const product = await productModel.create({
        name, slug, description,
        price: Number(price),
        discount: Number(discount) || 0,
        category, subCategory,
        bestseller: bestseller === 'true' || bestseller === true,
        sizes: parseJsonField(sizes),
        images, company, adminId,
        date: Date.now(),
    });

    // Invalidate related caches asynchronously (non-blocking / fire-and-forget)
    invalidateOnProductChange(product).catch(err => {
        logger.error(`[Cache] Invalidation error after product create: ${err.message}`);
    });
    logger.info(`[Cache] Triggered background cache invalidation after product create: ${product._id}`);

    return product;
};

export const updateProduct = async ({ productId, body, files, adminId }) => {
    const existing = await productModel.findById(productId);
    if (!existing)
        throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    if (existing.adminId.toString() !== adminId)
        throw Object.assign(new Error('Forbidden: You can only edit your own products.'), { statusCode: 403 });

    const name = sanitiseText(body.name);
    const description = sanitiseText(body.description);
    const company = sanitiseText(body.company);
    const { price, discount, category, subCategory, bestseller, sizes } = body;

    const newImages = await resolveProductImages({
        productName: name || existing.name,
        files,
        driveImageUrls: parseJsonField(body.driveImageUrls),
        directImageUrls: parseJsonField(body.directImageUrls),
    });

    const images = newImages.length > 0 ? newImages : existing.images;

    if (newImages.length > 0 && existing.images && existing.images.length > 0) {
        const orphanedImages = existing.images.filter(img => !newImages.includes(img));
        if (orphanedImages.length > 0) {
            Promise.allSettled(orphanedImages.map(deleteRemoteImage)).catch(() => {});
        }
    }

    const slug = name !== existing.name
        ? await generateUniqueSlug(name, productId)
        : existing.slug || await generateUniqueSlug(name, productId);

    const updated = await productModel.findByIdAndUpdate(
        productId,
        {
            name, slug, description,
            price: Number(price),
            discount: Number(discount) || 0,
            category, subCategory,
            bestseller: bestseller === 'true' || bestseller === true,
            sizes: parseJsonField(sizes),
            images,
            company: company || existing.company || DEFAULT_COMPANY,
        },
        { new: true }
    );

    // Invalidate caches for both old and new product data asynchronously (non-blocking / fire-and-forget)
    Promise.allSettled([
        invalidateOnProductChange(existing),
        invalidateOnProductChange(updated)
    ]).catch(err => {
        logger.error(`[Cache] Invalidation error after product update: ${err.message}`);
    });
    logger.info(`[Cache] Triggered background cache invalidation after product update: ${productId}`);

    return updated;
};

export const getProductsByAdmin = (adminId) =>
    productModel.find({ adminId });

export const getAllProductsPublic = () => {
    const fields = 'name slug description price discount images category subCategory company sizes bestseller visible date sold createdAt updatedAt';
    return cacheGet(
        KEYS.PRODUCTS_ALL,
        () => productModel.find({ visible: { $ne: false } }, fields).lean(),
        CACHE_TTL.PRODUCTS_ALL
    );
};

export const getProductById = async (productId) => {
    if (!productId)
        throw Object.assign(new Error('Product ID is required'), { statusCode: 400 });

    // Increment view count directly without modifying updatedAt timestamp
    await productModel.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } }, { timestamps: false });

    const product = await cacheGet(
        KEYS.PRODUCT_BY_ID(productId),
        () => productModel.findById(productId).lean(),
        CACHE_TTL.PRODUCT
    );
    if (!product)
        throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    return product;
};

export const getProductBySlug = async (slug) => {
    if (!slug)
        throw Object.assign(new Error('Product slug is required'), { statusCode: 400 });

    // Increment view count directly without modifying updatedAt timestamp
    await productModel.findOneAndUpdate({ slug }, { $inc: { viewCount: 1 } }, { timestamps: false });

    const product = await cacheGet(
        KEYS.PRODUCT_BY_SLUG(slug),
        () => productModel.findOne({ slug }).lean(),
        CACHE_TTL.PRODUCT
    );
    if (!product)
        throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    return product;
};

export const deleteProduct = async ({ productId, adminId }) => {
    const product = await productModel.findOne({ _id: productId, adminId });
    if (!product)
        throw Object.assign(new Error('Product not found or not owned by you'), { statusCode: 404 });

    if (product.images && product.images.length > 0) {
        await Promise.allSettled(product.images.map(deleteRemoteImage)).catch(() => {});
    }

    await productModel.findByIdAndDelete(productId);

    // Invalidate caches for deleted product asynchronously (non-blocking / fire-and-forget)
    invalidateOnProductChange(product).catch(err => {
        logger.error(`[Cache] Invalidation error after product delete: ${err.message}`);
    });
    logger.info(`[Cache] Triggered background cache invalidation after product delete: ${productId}`);

    return product;
};

export const getDistinctCompanies = async () => {
    return cacheGet(
        KEYS.COMPANIES,
        async () => {
            const companies = await productModel.distinct('company');
            return companies.sort((a, b) => {
                if (a === 'Independent') return 1;
                if (b === 'Independent') return -1;
                return a.localeCompare(b);
            });
        },
        CACHE_TTL.COMPANIES
    );
};

export const getProductsByCompany = (company) =>
    cacheGet(
        KEYS.PRODUCTS_BY_COMPANY(company),
        () => productModel.find({ company }).sort({ date: -1 }).lean(),
        CACHE_TTL.PRODUCT
    );

export const getMostClickedProductsData = async (limit = 10) => {
    return cacheGet(
        KEYS.MOST_CLICKED(limit),
        () => productModel.find({}).sort({ viewCount: -1 }).limit(limit).lean(),
        CACHE_TTL.HOMEPAGE
    );
};

export const toggleProductVisibility = async ({ productId, adminId }) => {
    const product = await productModel.findOne({ _id: productId, adminId });
    if (!product)
        throw Object.assign(new Error('Product not found or not owned by you'), { statusCode: 404 });

    const newVisibility = product.visible === false;
    const updated = await productModel.findByIdAndUpdate(
        productId,
        { visible: newVisibility },
        { new: true }
    );

    invalidateOnProductChange(updated).catch(err => {
        logger.error(`[Cache] Invalidation error after visibility toggle: ${err.message}`);
    });
    logger.info(`[Cache] Triggered background cache invalidation after visibility toggle: ${productId} -> ${newVisibility}`);

    return updated;
};