import wajs from 'whatsapp-web.js';
import qrcode from 'qrcode';

const { Client, LocalAuth } = wajs;

let waClient = null;
let waStatus = 'DISCONNECTED'; // DISCONNECTED, QR_READY, CONNECTING, CONNECTED
let waQrCodeDataUrl = null;

export const WhatsappService = {
    getStatus() {
        return { status: waStatus, qr: waQrCodeDataUrl };
    },

    async start() {
        if (waClient && waStatus !== 'DISCONNECTED') {
            throw new Error('El cliente ya está inicializado.');
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
        } catch (e) {
            waStatus = 'DISCONNECTED';
            waClient = null;
            console.error("❌ Error iniciando WA:", e);
            throw e;
        }
    },

    async stop() {
        if (waClient) {
            console.log("🟡 Cerrando sesión de WhatsApp...");
            try {
                await waClient.destroy();
            } catch (e) { }
            waClient = null;
        }
        waStatus = 'DISCONNECTED';
        waQrCodeDataUrl = null;
    },

    async sendTestMessage(phone, message) {
        if (!waClient || waStatus !== 'CONNECTED') {
            throw new Error('WhatsApp no está conectado. Escanea el código QR primero.');
        }

        console.log(`💬 Solicitud de test WA, número original: ${phone}`);
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        // WhatsApp Web JS resolverá el formato exacto del país (ej. quitar el 9 en Argentina)
        const numberDetails = await waClient.getNumberId(cleanPhone);

        if (!numberDetails) {
            console.error(`❌ El número ${cleanPhone} no parece ser válido en WhatsApp.`);
            throw new Error('El número ingresado no tiene una cuenta de WhatsApp activa o el formato es inválido.');
        }

        console.log(`💬 Enviando WhatsApp test al ID verificado: ${numberDetails._serialized}`);
        await waClient.sendMessage(numberDetails._serialized, message);
    }
};
