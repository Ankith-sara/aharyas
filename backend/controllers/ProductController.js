import {
    createProduct, updateProduct, getProductsByAdmin, getAllProductsPublic,
    getProductById, getProductBySlug, deleteProduct, getDistinctCompanies, getProductsByCompany as fetchProductsByCompany,
    getMostClickedProductsData, toggleProductVisibility,
} from '../services/ProductService.js';
import { getSellerAnalytics } from '../services/OrderService.js';
import { handleError } from './utils.js';
import imagekit from '../config/imagekit.js';
import { revalidateFrontendCache } from '../services/CacheRevalidationService.js';

//  Controllers
const addProduct = async (req, res) => {
    try {
        const product = await createProduct({ body: req.body, files: req.files, adminId: req.user.id });
        revalidateFrontendCache('products');
        res.status(201).json({ success: true, message: 'Product Added Successfully', product });
    } catch (error) {
        handleError(res, error, 'addProduct');
    }
};

const editProduct = async (req, res) => {
    try {
        const product = await updateProduct({ productId: req.params.id, body: req.body, files: req.files, adminId: req.user.id });
        revalidateFrontendCache('products');
        res.json({ success: true, message: 'Product updated successfully', product });
    } catch (error) {
        handleError(res, error, 'editProduct');
    }
};

const listProducts = async (req, res) => {
    try {
        const products = await getProductsByAdmin(req.user.id);
        res.json({ success: true, products });
    } catch (error) {
        handleError(res, error, 'listProducts');
    }
};

const listAllProductsPublic = async (req, res) => {
    try {
        const products = await getAllProductsPublic();
        res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=60');
        res.json({ success: true, products });
    } catch (error) {
        handleError(res, error, 'listAllProductsPublic');
    }
};

const singleProduct = async (req, res) => {
    try {
        const { productId, slug } = req.body;
        let product;
        if (slug) {
            product = await getProductBySlug(slug);
        } else {
            product = await getProductById(productId);
        }
        res.json({ success: true, product });
    } catch (error) {
        handleError(res, error, 'singleProduct');
    }
};

const removeProduct = async (req, res) => {
    try {
        await deleteProduct({ productId: req.params.id, adminId: req.user.id });
        revalidateFrontendCache('products');
        res.json({ success: true, message: 'Product removed successfully' });
    } catch (error) {
        handleError(res, error, 'removeProduct');
    }
};

const getCompanies = async (req, res) => {
    try {
        const companies = await getDistinctCompanies();
        res.json({ success: true, companies });
    } catch (error) {
        handleError(res, error, 'getCompanies');
    }
};

const getProductsByCompany = async (req, res) => {
    try {
        const products = await fetchProductsByCompany(req.params.company);
        res.json({ success: true, products, company: req.params.company });
    } catch (error) {
        handleError(res, error, 'getProductsByCompany');
    }
};

const sellerAnalytics = async (req, res) => {
    try {
        const result = await getSellerAnalytics(req.user.id);
        res.json({ success: true, analytics: result.analytics });
    } catch (error) {
        handleError(res, error, 'sellerAnalytics');
    }
};

const imagekitAuth = (req, res) => {
    try {
        const result = imagekit.helper.getAuthenticationParameters();
        res.json({ ...result, publicKey: process.env.IMAGEKIT_PUBLIC_KEY });
    } catch (error) {
        handleError(res, error, 'imagekitAuth');
    }
};

const getMostClickedProducts = async (req, res) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const products = await getMostClickedProductsData(limit);
        res.json({ success: true, products });
    } catch (error) {
        handleError(res, error, 'getMostClickedProducts');
    }
};

const toggleVisibility = async (req, res) => {
    try {
        const product = await toggleProductVisibility({ productId: req.params.id, adminId: req.user.id });
        res.json({ success: true, message: `Product ${product.visible ? 'shown' : 'hidden'} successfully`, product });
    } catch (error) {
        handleError(res, error, 'toggleVisibility');
    }
};

export {
    listProducts, addProduct, editProduct, listAllProductsPublic, removeProduct,
    singleProduct, getCompanies, getProductsByCompany, sellerAnalytics, imagekitAuth,
    getMostClickedProducts, toggleVisibility,
};