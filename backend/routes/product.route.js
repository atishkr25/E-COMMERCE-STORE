import express from "express";
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getFeatureProducts,
	getProductBycategory,
	getRecommendedProducts,
    toggleFeaturedProduct 
} from "../controllers/product.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";


const router = express.Router();


router.get('/', protectRoute, adminRoute, getAllProducts);
router.get('/feature', getFeatureProducts);
router.get('/recommendations', getProductBycategory);
router.get('/category/:category', getProductBycategory);
router.post('/', protectRoute, adminRoute, createProduct);
router.patch('/:id', protectRoute, adminRoute, toggleFeaturedProduct);
router.delete('/:id', protectRoute, adminRoute, deleteProduct);
export default router;  