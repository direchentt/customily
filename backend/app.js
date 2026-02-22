import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import apiRoutes from './routes/api.routes.js';
import { BusinessRulesController } from './controllers/business-rules.controller.js';
import { WhatsappController } from './controllers/whatsapp.controller.js';

export const app = express();

app.use(cors({
    origin: ENV.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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
