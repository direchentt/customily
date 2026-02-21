import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// CORS: en producción acepta llamadas desde la tienda hachedhe.com.ar
app.use(cors({
    origin: ['http://localhost:5173', 'https://www.hachedhe.com.ar', 'https://hachedhe.com.ar'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ─── MONGODB CONNECTION ───
const MONGO_URI = 'mongodb+srv://hugonzalexone_db_user:iG9eBhau7Fa5sks6@customily.ogrptsb.mongodb.net/hache_suite?retryWrites=true&w=majority&appName=customily';

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
}).then(() => console.log('🟢 Conectado a MongoDB Atlas'))
    .catch(err => console.error('🔴 Error conectando a MongoDB:', err));

// Definir Schema y Modelo para la configuración
const configSchema = new mongoose.Schema({
    id: { type: String, default: 'main' },
    data: { type: mongoose.Schema.Types.Mixed }
});

const ConfigModel = mongoose.model('Config', configSchema);

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

// 2. LEER CONFIG COMPLETA DE HACHE SUITE (MongoDB)
app.get('/api/config', async (req, res) => {
    try {
        let doc = await ConfigModel.findOne({ id: 'main' });

        if (!doc) {
            // Si la BD está vacía, intentamos leer el JSON local y guardarlo como estado inicial (Seed)
            const CONFIG_PATH = path.join(__dirname, '../hache-config.json');
            let initialData = {};
            if (fs.existsSync(CONFIG_PATH)) {
                initialData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
            }
            doc = new ConfigModel({ id: 'main', data: initialData });
            await doc.save();
            console.log("🌱 Base de datos inicializada desde archivo local.");
        }
        res.json(doc.data);
    } catch (error) {
        console.error("❌ Error leyendo Mongo:", error);
        res.status(500).json({ error: "Error al leer config de BD" });
    }
});

// 3. GUARDAR CONFIG COMPLETA (MongoDB)
app.post('/api/config', async (req, res) => {
    try {
        // Actualizar o crear si no existe
        await ConfigModel.findOneAndUpdate(
            { id: 'main' },
            { data: req.body },
            { upsert: true, new: true }
        );
        console.log("💾 Hache Suite Config actualizada en MongoDB!");
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error guardando Mongo:", error);
        res.status(500).json({ error: "Error al guardar config en BD" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SalesBooster Server activo en http://localhost:${PORT}`);
});
