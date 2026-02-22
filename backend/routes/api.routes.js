import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { ConfigController } from '../controllers/config.controller.js';
import { TrackController } from '../controllers/track.controller.js';

const router = Router();

// Products & Categories & Coupons
router.get('/products', ProductController.getProducts);
router.get('/categories', ProductController.getCategories);
router.post('/create-coupon', ProductController.createCoupon);

// Config
router.get('/config', ConfigController.getConfig);
router.post('/config', ConfigController.saveConfig);
router.get('/payment-methods', ConfigController.getLearnedPaymentMethods);

// Tracking
router.post('/track', TrackController.logEvent);
router.get('/track/stats', TrackController.getStats);

export default router;
