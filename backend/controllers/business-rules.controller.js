import { ConfigModel } from '../models/Config.model.js';

export const BusinessRulesController = {
    async handleWebhook(req, res) {
        try {
            const { details, totals, products } = req.body;
            if (!details || !details.event) return res.status(400).json({ error: 'Missing event detail' });

            const eventType = details.event;
            console.log(`⚡ [Business Rules] Recibiendo evento: ${eventType}`);

            const doc = await ConfigModel.findOne({ id: 'main' });
            const config = doc?.data || {};

            // 🟢 OCULTAMIENTO DE PAGOS (Checkout)
            if (eventType === 'payments/before-filter') {
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
                    const subtotal = parseFloat(totals?.subtotal || 0);
                    const threshold = parseInt(restrictions.highTicketThreshold || 0);

                    if (threshold > 0 && subtotal >= threshold) {
                        console.log(`[Reglas Pagos] Ticket alto ($${subtotal}). Ocultando...`);
                        const methodsToHide = restrictions.hiddenMethodsForHighTicket || [];
                        methodsToHide.forEach(m => hiddenIdsMap.add(m));
                    }

                    const regulatedProducts = restrictions.regulatedProducts || [];
                    const hiddenMethodsRegulatedStr = restrictions.hiddenMethodsForRegulated || '';

                    const hasRegulated = products?.some(p => regulatedProducts.includes(String(p.product_id)));
                    if (hasRegulated && hiddenMethodsRegulatedStr.trim().length > 0) {
                        console.log(`[Reglas Pagos] Producto Regulado detectado en carrito.`);
                        const methodsToHide = hiddenMethodsRegulatedStr.split(',').map(m => m.trim()).filter(Boolean);
                        methodsToHide.forEach(m => hiddenIdsMap.add(m));
                    }

                    const vipRaw = restrictions.vipEmailList || '';
                    const secretMethods = restrictions.hiddenMethodsForNonVip || [];

                    if (secretMethods.length > 0) {
                        const vipList = vipRaw.toLowerCase().split(/[\\n,]+/).map(e => e.trim()).filter(Boolean);
                        const customerEmail = details.customer?.email?.toLowerCase() || '';

                        if (!customerEmail || !vipList.includes(customerEmail)) {
                            console.log(`[Reglas Pagos] Cliente No-VIP (${customerEmail || 'invitado'}), bloqueando medios secretos.`);
                            secretMethods.forEach(m => hiddenIdsMap.add(m));
                        } else {
                            console.log(`[Reglas Pagos] ¡Cliente VIP ${customerEmail} detectado! Liberando medios secretos.`);
                        }
                    }

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
                    const fragilesConfigured = shippingRules.fragileProducts || [];
                    const hiddenMethodsStr = shippingRules.hiddenMethods || '';

                    const hasFragile = products.some(p => fragilesConfigured.includes(String(p.product_id)));

                    if (hasFragile && hiddenMethodsStr.trim().length > 0) {
                        console.log(`[Reglas Envíos] Producto frágil detectado`);
                        const methodsToHide = hiddenMethodsStr.split(',').map(m => m.trim()).filter(Boolean);

                        methodsToHide.forEach((methodCode, index) => {
                            filteredOptions.push({
                                id: `hide_fragile_${index}`,
                                option_id: methodCode,
                                code: methodCode
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

            // Default
            res.json({});
        } catch (e) {
            console.error("❌ Error en Business Rules Webhook:", e);
            res.status(500).json({});
        }
    }
};
