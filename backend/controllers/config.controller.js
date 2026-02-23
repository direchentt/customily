import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfigModel } from '../models/Config.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_CONFIG = {
    general: { storeId: '', apiBase: '', theme: 'dark' },
    shippingBar: { enabled: false, threshold: 0, msgInitial: '', msgProgress: '', msgSuccess: '', placements: [], style: 1, color: '#000000' },
    minicartUpsell: { enabled: false, title: '', products: [], discount: 0 },
    whatsappRecovery: { enabled: false, delayMinutes: 30, template: '' },
    bundles: [],
    smartOffers: [],
    cartGifts: { enabled: false, giftProducts: [], thresholds: [] },
    learnedPayments: []
};

// Helper for deep merge
function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && !Array.isArray(source[key]) && key in target && target[key] !== null) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}

export const ConfigController = {
    async getConfig(req, res) {
        try {
            let doc = await ConfigModel.findOne({ id: 'main' });

            let finalData = {};
            if (!doc) {
                const CONFIG_PATH = path.join(__dirname, '../../../hache-config.json');
                let initialData = {};
                if (fs.existsSync(CONFIG_PATH)) {
                    try {
                        initialData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
                    } catch (e) {
                        console.error("Error parsing seed config", e);
                    }
                }

                finalData = deepMerge(deepMerge({}, DEFAULT_CONFIG), initialData);

                doc = new ConfigModel({ id: 'main', data: finalData });
                await doc.save();
                console.log("🌱 Base de datos inicializada desde local.");
            } else {
                finalData = deepMerge(deepMerge({}, DEFAULT_CONFIG), doc.data || {});
            }
            res.json(finalData);
        } catch (error) {
            console.error("❌ Error leyendo Mongo:", error);
            res.status(500).json({ error: "Error al leer config de BD" });
        }
    },

    async patchConfig(req, res) {
        try {
            let doc = await ConfigModel.findOne({ id: 'main' });
            let currentData = doc ? doc.data : deepMerge({}, DEFAULT_CONFIG);

            let newData = deepMerge(currentData, req.body);

            await ConfigModel.findOneAndUpdate(
                { id: 'main' },
                { data: newData },
                { upsert: true, new: true }
            );
            console.log("🧩 Config actualizada via PATCH!");
            res.json({ success: true, data: newData });
        } catch (error) {
            console.error("❌ Error guardando Mongo (PATCH):", error);
            res.status(500).json({ error: "Error al guardar config en BD via PATCH" });
        }
    },

    async replaceConfig(req, res) {
        try {
            const finalData = deepMerge(deepMerge({}, DEFAULT_CONFIG), req.body);
            await ConfigModel.findOneAndUpdate(
                { id: 'main' },
                { data: finalData },
                { upsert: true, new: true }
            );
            console.log("💾 Config total reemplazada en MongoDB!");
            res.json({ success: true, data: finalData });
        } catch (error) {
            console.error("❌ Error guardando Mongo (PUT):", error);
            res.status(500).json({ error: "Error al reemplazar config en BD" });
        }
    },

    async getLearnedPaymentMethods(req, res) {
        try {
            const doc = await ConfigModel.findOne({ id: 'main' });
            const paymentMethods = doc?.data?.learnedPayments || [];
            res.json(paymentMethods);
        } catch (e) {
            console.error("❌ Error API Payment Methods:", e.message);
            res.status(500).json([]);
        }
    }
};
