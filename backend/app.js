import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV } from './config/env.js';
import apiRoutes from './routes/api.routes.js';
import { BusinessRulesController } from './controllers/business-rules.controller.js';
import { WhatsappController } from './controllers/whatsapp.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(cors({
    origin: ENV.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-store-id']
}));
app.use(express.json());

// Serve the storefront widget scripts
app.use('/storefront', express.static(path.join(__dirname, '../storefront')));

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Tiendanube Business Rules Webhooks
app.post('/api/business-rules', BusinessRulesController.handleWebhook);

// WhatsApp Recovery API
app.get('/api/whatsapp/status', WhatsappController.getStatus);
app.post('/api/whatsapp/start', WhatsappController.start);
app.post('/api/whatsapp/stop', WhatsappController.stop);
app.post('/api/whatsapp/send-test', WhatsappController.sendTestMessage);

// General API Routes
app.use('/api', apiRoutes);
