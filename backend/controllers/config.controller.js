import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfigModel } from '../models/Config.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ConfigController = {
    async getConfig(req, res) {
        try {
            let doc = await ConfigModel.findOne({ id: 'main' });

            if (!doc) {
                // Si la BD está vacía, intentamos leer el JSON local y guardarlo como estado inicial (Seed)
                const CONFIG_PATH = path.join(__dirname, '../../../hache-config.json');
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
    },

    async saveConfig(req, res) {
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
