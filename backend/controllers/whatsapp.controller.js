import { WhatsappService } from '../services/whatsapp.service.js';

export const WhatsappController = {
    getStatus(req, res) {
        res.json(WhatsappService.getStatus());
    },

    async start(req, res) {
        try {
            await WhatsappService.start();
            res.json({ success: true, message: 'Inicialización en proceso' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async stop(req, res) {
        try {
            await WhatsappService.stop();
            res.json({ success: true, message: 'Sesión cerrada' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async sendTestMessage(req, res) {
        try {
            const { phone, message } = req.body;
            if (!phone || !message) {
                return res.status(400).json({ error: 'Falta teléfono o mensaje.' });
            }
            await WhatsappService.sendTestMessage(phone, message);
            res.json({ success: true, message: 'Mensaje de prueba enviado.' });
        } catch (error) {
            if (error.message.includes('no está conectado') || error.message.includes('inválido')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message || 'Error interno al enviar.' });
            }
        }
    }
};
