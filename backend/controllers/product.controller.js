import { TiendanubeService } from '../services/tiendanube.service.js';

export const ProductController = {
    async getProducts(req, res) {
        try {
            const allProducts = await TiendanubeService.getProducts();

            const limit = parseInt(req.query.limit, 10) || 50;
            const page = parseInt(req.query.page, 10) || 1;

            const total = allProducts.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;

            const products = allProducts.slice(offset, offset + limit);

            res.json({
                products,
                total,
                page,
                totalPages
            });
        } catch (error) {
            console.error("❌ Error API Products:", error.message);
            res.status(500).json({ error: "Fallo al obtener productos" });
        }
    },

    async getCategories(req, res) {
        try {
            const categories = await TiendanubeService.getCategories();
            res.json(categories);
        } catch (error) {
            console.error("❌ Error API Categories:", error.message);
            res.status(500).json({ error: "Fallo al obtener categorías" });
        }
    },

    async createCoupon(req, res) {
        try {
            const coupon = await TiendanubeService.createCoupon(req.body);
            if (!coupon) {
                return res.json({ success: false, coupon: null });
            }
            res.json({ success: true, coupon });
        } catch (error) {
            res.json({ success: false, coupon: null, error: error.message });
        }
    }
};
