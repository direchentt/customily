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
app.post('/api/draft-order', async (req, res) => {
    try {
        const { products, discount_percent } = req.body;
        // products: [{ variant_id, quantity, price }]
        // discount_percent: número (ej: 20)

        if (!products || products.length === 0) {
            return res.status(400).json({ error: 'No products provided' });
        }

        // Calcular descuento total
        const subtotal = products.reduce((sum, p) => sum + (parseFloat(p.price) * p.quantity), 0);
        const discountAmount = (subtotal * discount_percent / 100).toFixed(2);

        const body = {
            products: products.map(p => ({
                variant_id: p.variant_id,
                quantity: p.quantity
            })),
            promotional_discount: {
                applies_to: 'total',
                type: 'percentage',
                value: discount_percent,
                discount_value: discountAmount
            }
        };

        console.log(`📦 Creating Draft Order: ${products.length} products, ${discount_percent}% OFF ($${discountAmount} off)`);

        const response = await axios.post(`${TN_API}/draft_orders`, body, { headers: TN_HEADERS });
        const draftOrder = response.data;

        console.log(`✅ Draft Order created: ${draftOrder.id} | Checkout: ${draftOrder.checkout_url}`);

        res.json({
            success: true,
            checkout_url: draftOrder.checkout_url,
            draft_order_id: draftOrder.id,
            total: draftOrder.total,
            discount: draftOrder.discount
        });

    } catch (error) {
        const errData = error.response?.data || error.message;
        console.error('❌ Draft Order Error:', JSON.stringify(errData));
        res.status(500).json({ error: 'Failed to create draft order', details: errData });
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
