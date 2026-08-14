import express from 'express'
import { listProducts, addProduct, removeProduct, singleProduct, editProduct, listAllProductsPublic, getCompanies, getProductsByCompany, sellerAnalytics, imagekitAuth, getMostClickedProducts, toggleVisibility } from '../controllers/ProductController.js';
import adminAuth from '../middlewares/adminAuth.js';
import upload from '../middlewares/multer.js';
import { publicLimiter } from '../middlewares/rateLimiter.js';
import { validateMongoId } from '../middlewares/validate.js';

const productRouter = express.Router();

productRouter.get('/imagekit-auth', imagekitAuth);
productRouter.post('/add', adminAuth, upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }, { name: 'image5', maxCount: 1 }, { name: 'image6', maxCount: 1 }]), addProduct);
productRouter.put('/edit/:id', adminAuth, validateMongoId, upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }, { name: 'image5', maxCount: 1 }, { name: 'image6', maxCount: 1 }]), editProduct);
productRouter.get('/list', adminAuth, listProducts);
productRouter.get('/all', publicLimiter, listAllProductsPublic);
productRouter.get('/companies', publicLimiter, getCompanies);
productRouter.get('/company/:company', publicLimiter, getProductsByCompany);
productRouter.post('/single', publicLimiter, singleProduct);
productRouter.delete('/remove/:id', adminAuth, validateMongoId, removeProduct);
productRouter.get('/analytics', adminAuth, sellerAnalytics);
productRouter.get('/most-clicked', adminAuth, getMostClickedProducts);
productRouter.patch('/toggle-visibility/:id', adminAuth, validateMongoId, toggleVisibility);

export default productRouter;