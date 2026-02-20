import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, '../combos.json');

// ─── TIENDANUBE API CONFIG ───
const TN_STORE_ID = '6325197';
const TN_TOKEN = '347f42c35e2dbe8fab033b243a3b43f52fc9d08b';
const TN_API = `https://api.tiendanube.com/v1/${TN_STORE_ID}`;
const TN_HEADERS = {
    'Authentication': `bearer ${TN_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'SalesBooster/8.0 (direchentt@gmail.com)'
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

// 1. OBTENER PRODUCTOS (SCRAPER MEJORADO)
app.get('/api/products', async (req, res) => {
    try {
        console.log("🕷️ Scraping hachedhe.com.ar (ESM Mode)...");

        // Simular Navegador
        const { data } = await axios.get('https://www.hachedhe.com.ar/productos?per_page=100', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            }
        });

        const $ = cheerio.load(data);
        const products = [];

        // Selectores Específicos Tiendanube
        // JS Item Product es el estándar, pero a veces cambian
        $('.item-product, .js-item-product').each((i, el) => {
            const $el = $(el);
            const id = $el.attr('data-product-id');
            const name = $el.find('.item-name, .product-name, h3').first().text().trim();

            // Imagen: buscar en múltiples atributos, evitando placeholders base64
            let img = null;
            const imgEl = $el.find('img').first();
            const candidates = [
                imgEl.attr('data-src'),
                imgEl.attr('data-srcset')?.split(' ')[0],
                imgEl.attr('src'),
            ];
            for (const c of candidates) {
                if (c && !c.startsWith('data:') && c.length > 10) {
                    img = c.startsWith('//') ? 'https:' + c : c;
                    break;
                }
            }

            // Precio
            const price = $el.find('.item-price, .price').text().trim();

            if (id && name) {
                products.push({ id, name, price, image: img || '' });
            }
        });

        console.log(`✅ ${products.length} productos listos.`);
        res.json(products);

    } catch (error) {
        console.error("❌ Error Scraping:", error.message);
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

app.listen(3001, () => {
    console.log("🚀 SalesBooster Server activo en http://localhost:3001");
});
