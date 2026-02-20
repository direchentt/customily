import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// CORS: en producción acepta llamadas desde la tienda hachedhe.com.ar
app.use(cors({
    origin: ['http://localhost:5173', 'https://www.hachedhe.com.ar', 'https://hachedhe.com.ar'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const DB_PATH = path.join(__dirname, '../combos.json');
const PORT = process.env.PORT || 3001;

// ─── TIENDANUBE API CONFIG ───
const TN_STORE_ID = '6325197';
const TN_TOKEN = '347f42c35e2dbe8fab033b243a3b43f52fc9d08b';
const TN_API = `https://api.tiendanube.com/v1/${TN_STORE_ID}`;
const TN_HEADERS = {
    'Authentication': `bearer ${TN_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'SalesBooster/9.0 (direchentt@gmail.com)'
};

// ─── DRAFT ORDER ENDPOINT ───
// Crea un carrito con descuento nativo via Tiendanube API y devuelve checkout_url
// ─── CREATE COUPON ENDPOINT ───
// Crea un cupón dinámico de un solo uso y devuelve el código para auto-aplicar en checkout
app.post('/api/create-coupon', async (req, res) => {
    try {
        const { discount_percent, combo_id } = req.body;

        if (!discount_percent || discount_percent <= 0) {
            return res.json({ success: false, coupon: null });
        }

        // Código único por combo + timestamp para evitar duplicados
        const ts = Date.now().toString(36).toUpperCase();
        const couponCode = `PACK${(combo_id || 'CB').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8)}${ts}`.slice(0, 20);

        const couponRes = await axios.post(`${TN_API}/coupons`, {
            code: couponCode,
            type: 'percentage',
            value: discount_percent,
            valid: true,
            max_uses: 1,    // Un solo uso
            used_times: 0,
            min_price: 0,
        }, { headers: TN_HEADERS });

        const createdCode = couponRes.data.code;
        console.log(`🎟️ Cupón creado: ${createdCode} (${discount_percent}% OFF, 1 uso)`);

        res.json({ success: true, coupon: createdCode });

    } catch (error) {
        const errData = error.response?.data || error.message;
        console.error('❌ Coupon Error:', JSON.stringify(errData));
        res.json({ success: false, coupon: null, error: errData });
    }
});


// --- API ROUTES ---

// 1. OBTENER PRODUCTOS (REST API NATIVA TIENDANUBE)
app.get('/api/products', async (req, res) => {
    try {
        console.log("📦 Fetching products from Tiendanube API...");
        let allProducts = [];
        let page = 1;
        while (true) {
            try {
                const response = await axios.get(`${TN_API}/products?per_page=200&page=${page}`, { headers: TN_HEADERS });
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
                price: priceVal.replace('.00', ''), // El front-end ya le agrega el $ o formato
                image: p.images && p.images.length > 0 && p.images[0].src
                    ? p.images[0].src
                    : 'https://cdn-icons-png.flaticon.com/512/1254/1254338.png',
                published: p.published !== false
            };
        }).filter(p => p.id && p.name && p.published);

        console.log(`✅ ${products.length} productos listos desde la API.`);
        res.json(products);

    } catch (error) {
        console.error("❌ Error API Products:", error.message);
        res.status(500).json({ error: "Fallo al obtener productos" });
    }
});

// 2. LEER COMBOS (V8: Array format)
app.get('/api/combos', (req, res) => {
    if (fs.existsSync(DB_PATH)) {
        try {
            const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
            // Normalizar: si es objeto viejo (V2/V3), devolver array vacío
            res.json(Array.isArray(data) ? data : []);
        } catch (e) {
            res.json([]);
        }
    } else {
        res.json([]);
    }
});

// 3. GUARDAR COMBOS
app.post('/api/combos', (req, res) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(req.body, null, 2));
        console.log("💾 Combos actualizados!");
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SalesBooster Server activo en http://localhost:${PORT}`);
});
