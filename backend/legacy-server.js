import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import wajs from 'whatsapp-web.js';
import qrcode from 'qrcode';

const { Client, LocalAuth } = wajs;


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// CORS: en producción acepta llamadas desde la tienda hachedhe.com.ar
app.use(cors({
    origin: ['http://localhost:5173', 'https://www.hachedhe.com.ar', 'https://hachedhe.com.ar'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Logger de peticiones para debug
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

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

// --- CACHE IN MEMORY ---
let cache = {
    products: { data: null, lastFetch: null },
    categories: { data: null, lastFetch: null }
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// --- API ROUTES ---

// 1. OBTENER PRODUCTOS (REST API NATIVA TIENDANUBE + CACHE)
app.get('/api/products', async (req, res) => {
    try {
        const now = Date.now();
        if (cache.products.data && cache.products.lastFetch && (now - cache.products.lastFetch < CACHE_DURATION)) {
            console.log("📦 Serving products from CACHE");
            return res.json(cache.products.data);
        }

        console.log("📦 Fetching products from Tiendanube API (Cache expired or empty)...");
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
                price: priceVal,
                image: p.images && p.images.length > 0 && p.images[0].src
                    ? p.images[0].src
                    : 'https://cdn-icons-png.flaticon.com/512/1254/1254338.png',
                published: p.published !== false
            };
        }).filter(p => p.id && p.name && p.published);

        // Guardar en cache
        cache.products.data = products;
        cache.products.lastFetch = now;

        console.log(`✅ ${products.length} productos listos y cacheados.`);
        res.json(products);

    } catch (error) {
        console.error("❌ Error API Products:", error.message);
        res.status(500).json({ error: "Fallo al obtener productos" });
    }
});

// 1.5 OBTENER CATEGORÍAS (REST API NATIVA TIENDANUBE + CACHE)
app.get('/api/categories', async (req, res) => {
    try {
        const now = Date.now();
        if (cache.categories.data && cache.categories.lastFetch && (now - cache.categories.lastFetch < CACHE_DURATION)) {
            console.log("📂 Serving categories from CACHE");
            return res.json(cache.categories.data);
        }

        console.log("📂 Fetching categories from Tiendanube API (Cache expired or empty)...");
        const response = await axios.get(`${TN_API}/categories`, { headers: TN_HEADERS });
        const categories = response.data.map(c => ({
            id: String(c.id),
            name: c.name.es || c.name.en || c.name.pt || Object.values(c.name)[0],
            products_count: c.products_count
        }));

        // Guardar en cache
        cache.categories.data = categories;
        cache.categories.lastFetch = now;

        res.json(categories);
    } catch (error) {
        console.error("❌ Error API Categories:", error.message);
        res.status(500).json({ error: "Fallo al obtener categorías" });
    }
});

// 1.7 OBTENER MÉTODOS DE PAGO (Auto-aprendidos)
app.get('/api/payment-methods', async (req, res) => {
    try {
        const doc = await ConfigModel.findOne({ id: 'main' });
        const paymentMethods = doc?.data?.learnedPayments || [];
        res.json(paymentMethods);
    } catch (e) {
        console.error("❌ Error API Payment Methods:", e.message);
        res.status(500).json([]);
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

// ─── TRACKING / ANALYTICS ───
const trackSchema = new mongoose.Schema({
    event: String,       // 'view' | 'added_combo' | 'offer_click' | 'offer_add'
    combo_id: String,
    url: String,
    timestamp: { type: Date, default: Date.now },
    device: String,      // 'mobile' | 'desktop'
    meta: mongoose.Schema.Types.Mixed
});
trackSchema.index({ timestamp: -1 });
trackSchema.index({ event: 1, timestamp: -1 });
const TrackModel = mongoose.model('Track', trackSchema);

// POST /api/track — recibe eventos del storefront (fire-and-forget)
app.post('/api/track', async (req, res) => {
    try {
        const { event, combo_id, url, timestamp, device, meta } = req.body;
        await TrackModel.create({
            event: event || 'unknown',
            combo_id: combo_id || null,
            url: url || '',
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            device: device || 'unknown',
            meta: meta || {}
        });
        res.json({ ok: true });
    } catch (e) {
        console.error('[Track] Error:', e.message);
        res.status(500).json({ ok: false });
    }
});

// GET /api/track/stats — stats agregados para el dashboard del admin
app.get('/api/track/stats', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const [totals, daily] = await Promise.all([
            // Totales por evento
            TrackModel.aggregate([
                { $match: { timestamp: { $gte: since } } },
                { $group: { _id: '$event', count: { $sum: 1 } } }
            ]),
            // Desglose diario
            TrackModel.aggregate([
                { $match: { timestamp: { $gte: since } } },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                            event: '$event'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.date': 1 } }
            ])
        ]);

        const summary = {};
        totals.forEach(t => { summary[t._id] = t.count; });

        // Agrupar daily por fecha
        const dailyMap = {};
        daily.forEach(d => {
            if (!dailyMap[d._id.date]) dailyMap[d._id.date] = {};
            dailyMap[d._id.date][d._id.event] = d.count;
        });

        res.json({
            period: `${days}d`,
            summary,
            daily: Object.entries(dailyMap).map(([date, events]) => ({ date, ...events }))
        });
    } catch (e) {
        console.error('[Track Stats] Error:', e.message);
        res.status(500).json({ error: 'Error aggregating stats' });
    }
});

// 4. TIENDANUBE BUSINESS RULES API (PAGOS & ENVIOS)
app.post('/api/business-rules', async (req, res) => {
    try {
        const { details, totals, products } = req.body;
        if (!details || !details.event) return res.status(400).json({ error: 'Missing event detail' });

        const eventType = details.event;
        console.log(`⚡ [Business Rules] Recibiendo evento: ${eventType}`);

        // Leer DB para ver las reglas configuradas por el admin
        const doc = await ConfigModel.findOne({ id: 'main' });
        const config = doc?.data || {};

        // 🟢 OCULTAMIENTO DE PAGOS (Checkout)
        if (eventType === 'payments/before-filter') {
            // -- Auto-Aprender Métodos de Pago Activos -- //
            try {
                const incomingOptions = details.payment_options || [];
                if (incomingOptions.length > 0) {
                    const currentLearned = config.learnedPayments || [];
                    let hasNew = false;
                    incomingOptions.forEach(opt => {
                        const existing = currentLearned.find(m => m.code === opt.option_id);
                        if (!existing) {
                            currentLearned.push({ label: opt.name || opt.option_id, code: opt.option_id });
                            hasNew = true;
                        }
                    });
                    if (hasNew) {
                        console.log(`🧠 [Business Rules] Nuevos métodos de pago detectados y aprendidos en vivo!`);
                        config.learnedPayments = currentLearned;
                        await ConfigModel.findOneAndUpdate({ id: 'main' }, { data: config }, { upsert: true });
                    }
                }
            } catch (e) { console.error('Error en proceso de aprendizaje:', e); }

            let filteredOptions = [];
            let hiddenIdsMap = new Set();
            const restrictions = config.paymentRestrictions;

            if (restrictions && restrictions.enabled) {
                // REGLA 1: Ticket Alto -> Ocultar Transferencias manuales / Efectivo configurados en la DB
                const subtotal = parseFloat(totals?.subtotal || 0);
                const threshold = parseInt(restrictions.highTicketThreshold || 0);

                if (threshold > 0 && subtotal >= threshold) {
                    console.log(`[Reglas Pagos] Ticket alto ($${subtotal}). Ocultando...`);
                    const methodsToHide = restrictions.hiddenMethodsForHighTicket || [];
                    methodsToHide.forEach(m => hiddenIdsMap.add(m));
                }

                // REGLA 2: Producto Regulado -> Si hay un GiftCard, esconder Mercadopago o efectivo
                const regulatedProducts = restrictions.regulatedProducts || [];
                const hiddenMethodsRegulatedStr = restrictions.hiddenMethodsForRegulated || '';

                const hasRegulated = products?.some(p => regulatedProducts.includes(String(p.product_id)));
                if (hasRegulated && hiddenMethodsRegulatedStr.trim().length > 0) {
                    console.log(`[Reglas Pagos] Producto Regulado detectado en carrito.`);
                    const methodsToHide = hiddenMethodsRegulatedStr.split(',').map(m => m.trim()).filter(Boolean);
                    methodsToHide.forEach(m => hiddenIdsMap.add(m));
                }

                // REGLA 3: Whitelisting VIP -> Esconder de los mortales los "Medios Secretos"
                const vipRaw = restrictions.vipEmailList || '';
                const secretMethods = restrictions.hiddenMethodsForNonVip || [];

                if (secretMethods.length > 0) {
                    const vipList = vipRaw.toLowerCase().split(/[\n,]+/).map(e => e.trim()).filter(Boolean);
                    const customerEmail = details.customer?.email?.toLowerCase() || '';

                    if (!customerEmail || !vipList.includes(customerEmail)) {
                        console.log(`[Reglas Pagos] Cliente No-VIP (${customerEmail || 'invitado'}), bloqueando medios secretos.`);
                        secretMethods.forEach(m => hiddenIdsMap.add(m));
                    } else {
                        console.log(`[Reglas Pagos] ¡Cliente VIP ${customerEmail} detectado! Liberando medios secretos.`);
                    }
                }

                // Generar el Payload final único sin métodos duplicados
                Array.from(hiddenIdsMap).forEach((methodCode, index) => {
                    filteredOptions.push({
                        id: `hide_payment_${index}`,
                        option_id: methodCode
                    });
                });
            }

            return res.json({
                command: 'filter_payments_options',
                detail: { filtered_options: filteredOptions }
            });
        }

        // 🔵 RESTRICCIONES DE ENVIO (Fragilidad)
        if (eventType === 'shipping/before-filter') {
            let filteredOptions = [];
            const shippingRules = config.shippingRules || {};

            if (shippingRules.enabled) {
                // Chequear si el carrito contiene productos frágiles
                const fragilesConfigured = shippingRules.fragileProducts || [];
                const hiddenMethodsStr = shippingRules.hiddenMethods || '';

                const hasFragile = products.some(p => fragilesConfigured.includes(String(p.product_id)));

                if (hasFragile && hiddenMethodsStr.trim().length > 0) {
                    console.log(`[Reglas Envíos] Producto frágil detectado. Ocultando transportes específicos...`);
                    const methodsToHide = hiddenMethodsStr.split(',').map(m => m.trim()).filter(Boolean);

                    methodsToHide.forEach((methodCode, index) => {
                        filteredOptions.push({
                            id: `hide_fragile_${index}`,
                            option_id: methodCode,
                            code: methodCode // TN a veces evalúa por código
                        });
                    });
                }
            }

            return res.json({
                command: 'filter_shipping_options',
                detail: { filtered_options: filteredOptions }
            });
        }

        // 🟣 PRIORIZACION LOCACIONES (Dark Stores)
        if (eventType === 'location/prioritization') {
            const shippingRules = config.shippingRules || {};

            const priorizaciones = [
                { id: "01HRAE6GV84TH5JPPK0A1FNTRF", priority: shippingRules.locationCABA ?? 0 },
                { id: "01HRAEPHCXSGY68V29YJPGTX3M", priority: shippingRules.locationCordoba ?? 1 }
            ];

            return res.json({
                command: 'location_prioritization',
                detail: { location_prioritization: priorizaciones }
            });
        }

        // Default: No intervenir
        res.json({});
    } catch (e) {
        console.error("❌ Error en Business Rules Webhook:", e);
        res.status(500).json({});
    }
});

// ─── WHATSAPP RECOVERY ENDPOINTS ───
let waClient = null;
let waStatus = 'DISCONNECTED'; // DISCONNECTED, QR_READY, CONNECTING, CONNECTED
let waQrCodeDataUrl = null;

app.get('/api/whatsapp/status', (req, res) => {
    res.json({ status: waStatus, qr: waQrCodeDataUrl });
});

app.post('/api/whatsapp/start', async (req, res) => {
    if (waClient && waStatus !== 'DISCONNECTED') {
        return res.json({ success: false, message: 'El cliente ya está inicializado.' });
    }

    console.log("🟡 Iniciando emulador de WhatsApp...");
    waStatus = 'CONNECTING';
    waQrCodeDataUrl = null;

    waClient = new Client({
        authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: true
        }
    });

    waClient.on('qr', async (qr) => {
        console.log('📱 WhatsApp QR Recibido! Esperando escaneo...');
        waStatus = 'QR_READY';
        waQrCodeDataUrl = await qrcode.toDataURL(qr);
    });

    waClient.on('ready', () => {
        console.log('✅ WhatsApp Client listo y conectado!');
        waStatus = 'CONNECTED';
        waQrCodeDataUrl = null;
    });

    waClient.on('disconnected', (reason) => {
        console.log('🔴 WhatsApp se desconectó:', reason);
        waStatus = 'DISCONNECTED';
        waQrCodeDataUrl = null;
        waClient = null;
    });

    waClient.on('auth_failure', () => {
        console.error('🔴 WhatsApp Error de Autenticación');
        waStatus = 'DISCONNECTED';
        waQrCodeDataUrl = null;
        waClient = null;
    });

    try {
        waClient.initialize();
        res.json({ success: true, message: 'Inicialización en proceso' });
    } catch (e) {
        waStatus = 'DISCONNECTED';
        waClient = null;
        console.error("❌ Error iniciando WA:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/whatsapp/stop', async (req, res) => {
    if (waClient) {
        console.log("🟡 Cerrando sesión de WhatsApp...");
        try {
            await waClient.destroy();
        } catch (e) { }
        waClient = null;
    }
    waStatus = 'DISCONNECTED';
    waQrCodeDataUrl = null;
    res.json({ success: true, message: 'Sesión cerrada' });
});

app.post('/api/whatsapp/send-test', async (req, res) => {
    if (!waClient || waStatus !== 'CONNECTED') {
        return res.status(400).json({ error: 'WhatsApp no está conectado. Escanea el código QR primero.' });
    }
    const { phone, message } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ error: 'Falta teléfono o mensaje.' });
    }
    try {
        console.log(`💬 Solicitud de test WA, número original: ${phone}`);
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        // WhatsApp Web JS resolverá el formato exacto del país (ej. quitar el 9 en Argentina)
        const numberDetails = await waClient.getNumberId(cleanPhone);

        if (!numberDetails) {
            console.error(`❌ El número ${cleanPhone} no parece ser válido en WhatsApp.`);
            return res.status(400).json({ error: 'El número ingresado no tiene una cuenta de WhatsApp activa o el formato es inválido.' });
        }

        console.log(`💬 Enviando WhatsApp test al ID verificado: ${numberDetails._serialized}`);
        await waClient.sendMessage(numberDetails._serialized, message);
        res.json({ success: true, message: 'Mensaje de prueba enviado.' });
    } catch (e) {
        console.error("❌ Error enviando mensaje WA:", e);
        res.status(500).json({ error: e.message || 'Error interno al enviar.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SalesBooster Server activo en http://localhost:${PORT}`);
});
