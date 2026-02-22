import axios from 'axios';
import { ENV } from '../config/env.js';
import { CacheService } from './cache.service.js';

export const TiendanubeService = {
    async createCoupon({ discount_percent, combo_id }) {
        if (!discount_percent || discount_percent <= 0) {
            return null;
        }

        const ts = Date.now().toString(36).toUpperCase();
        const couponCode = `PACK${(combo_id || 'CB').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8)}${ts}`.slice(0, 20);

        try {
            const couponRes = await axios.post(`${ENV.TN_API}/coupons`, {
                code: couponCode,
                type: 'percentage',
                value: discount_percent,
                valid: true,
                max_uses: 1,
                used_times: 0,
                min_price: 0,
            }, { headers: ENV.TN_HEADERS });

            const createdCode = couponRes.data.code;
            console.log(`🎟️ Cupón creado: ${createdCode} (${discount_percent}% OFF, 1 uso)`);
            return createdCode;
        } catch (error) {
            const errData = error.response?.data || error.message;
            console.error('❌ Coupon Error:', JSON.stringify(errData));
            throw error;
        }
    },

    async getProducts() {
        const cachedProducts = CacheService.get('products');
        if (cachedProducts) {
            console.log("📦 Serving products from CACHE");
            return cachedProducts;
        }

        console.log("📦 Fetching products from Tiendanube API (Cache expired or empty)...");
        let allProducts = [];
        let page = 1;

        while (true) {
            try {
                const response = await axios.get(`${ENV.TN_API}/products?per_page=200&page=${page}`, { headers: ENV.TN_HEADERS });
                if (response.data.length === 0) break;
                allProducts = allProducts.concat(response.data);
                page++;
            } catch (err) {
                if (err.response && err.response.status === 404) break;
                throw err;
            }
        }

        const products = allProducts.map(p => {
            const variant = p.variants && p.variants.length > 0 ? p.variants[0] : null;
            const priceVal = variant && variant.price ? String(variant.price) : '0';
            return {
                id: String(p.id),
                variant_id: variant ? String(variant.id) : null,
                name: p.name.es || p.name.en || p.name.pt || Object.values(p.name)[0],
                price: priceVal,
                image: p.images && p.images.length > 0 && p.images[0].src
                    ? p.images[0].src
                    : 'https://cdn-icons-png.flaticon.com/512/1254/1254338.png',
                published: p.published !== false
            };
        }).filter(p => p.id && p.name && p.published);

        CacheService.set('products', products);
        console.log(`✅ ${products.length} productos listos y cacheados.`);
        return products;
    },

    async getCategories() {
        const cachedCategories = CacheService.get('categories');
        if (cachedCategories) {
            console.log("📂 Serving categories from CACHE");
            return cachedCategories;
        }

        console.log("📂 Fetching categories from Tiendanube API (Cache expired or empty)...");
        const response = await axios.get(`${ENV.TN_API}/categories`, { headers: ENV.TN_HEADERS });
        const categories = response.data.map(c => ({
            id: String(c.id),
            name: c.name.es || c.name.en || c.name.pt || Object.values(c.name)[0],
            products_count: c.products_count
        }));

        CacheService.set('categories', categories);
        return categories;
    }
};
