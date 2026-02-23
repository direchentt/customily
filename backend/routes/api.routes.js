import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { ConfigController } from '../controllers/config.controller.js';
import { TrackController } from '../controllers/track.controller.js';
import { RuleController } from '../controllers/rule.controller.js';
import { OAuthController } from '../controllers/oauth.controller.js';

const router = Router();

/* ============================================================
   GLOBAL MIDDLEWARE — Store Identity Strict Mode
============================================================ */

const requireStoreId = (req, res, next) => {
    const rawStoreId = req.headers['x-store-id'];

    if (!rawStoreId) {
        return res.status(400).json({
            ok: false,
            error: 'Missing x-store-id header'
        });
    }

    const storeId = String(rawStoreId).trim();

    if (!storeId || storeId === 'undefined') {
        return res.status(400).json({
            ok: false,
            error: 'Invalid storeId'
        });
    }

    req.storeId = storeId;
    next();
};

/* ============================================================
   HEALTH CHECK
============================================================ */

router.get('/health', async (req, res) => {
    res.json({
        ok: true,
        service: 'hache-sales-booster',
        version: '4.2.0',
        timestamp: Date.now()
    });
});

/* ============================================================
   OAUTH (Tiendanube connection)
============================================================ */

router.get('/oauth/start', OAuthController.start);
router.get('/oauth/callback', OAuthController.callback);

/* ============================================================
   PRODUCTS & CATALOG
============================================================ */

router.get('/products', requireStoreId, ProductController.getProducts);
router.get('/categories', requireStoreId, ProductController.getCategories);
router.post('/create-coupon', requireStoreId, ProductController.createCoupon);

/* ============================================================
   CONFIG
============================================================ */

router.get('/config', requireStoreId, ConfigController.getConfig);

/**
 * PUT = replace full config
 */
router.put('/config', requireStoreId, ConfigController.replaceConfig);

/**
 * PATCH = partial update (merge deep)
 */
router.patch('/config', requireStoreId, ConfigController.patchConfig);

/**
 * POST alias for backward compatibility (Admin uses POST)
 */
router.post('/config', requireStoreId, ConfigController.replaceConfig);

router.get('/payment-methods', requireStoreId, ConfigController.getLearnedPaymentMethods);

/* ============================================================
   RULE ENGINE / SIMULATOR
============================================================ */

router.post('/rules/simulate', requireStoreId, RuleController.simulate);

/* ============================================================
   TRACKING
============================================================ */

router.post('/track', requireStoreId, TrackController.logEvent);
router.get('/track/stats', requireStoreId, TrackController.getStats);

export default router;