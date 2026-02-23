/**
 * Hache Sales Booster V4.0 — Deterministic Logic Engine
 * Source of Truth: Backend API
 */

(function () {
    'use strict';

    const ENGINE_CONFIG = {
        apiBase: 'https://salesbooster-hachedhe.onrender.com/api',
        selectors: ['.js-product-form', '#product_form', '.js-addtocart', '.product-buy-container', '.js-ajax-cart-container'],
        retryMax: 2,
        debug: true
    };

    let CURRENT_STATE = {
        config: null,
        cart: null,
        storeId: null
    };

    const Logger = {
        log: (msg, data = '') => ENGINE_CONFIG.debug && console.log(`%c[HACHE] ${msg}`, 'background: #4f46e5; color: #fff; padding: 2px 5px; border-radius: 3px;', data),
        error: (msg, err = '') => console.error(`[HACHE ERROR] ${msg}`, err)
    };

    const HacheCart = {
        /**
         * Fetch current cart with cache buster
         */
        get: async () => {
            const res = await fetch(`/cart.json?t=${Date.now()}`, { cache: 'no-store' });
            return res.json();
        },

        /**
         * Deterministic sequential add-to-cart
         */
        addSequential: async (items) => {
            Logger.log('Iniciando proceso determinístico de agregado...', items);

            for (const item of items) {
                let success = false;
                let attempts = 0;

                while (!success && attempts <= ENGINE_CONFIG.retryMax) {
                    attempts++;
                    Logger.log(`Intento ${attempts} para variante: ${item.variantId}`);

                    try {
                        const response = await fetch('/cart/add.json', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'X-Requested-With': 'XMLHttpRequest'
                            },
                            body: new URLSearchParams({
                                variant_id: item.variantId,
                                quantity: item.qty || 1
                            }),
                            credentials: 'same-origin'
                        });

                        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

                        // VALIDACIÓN DETERMINÍSTICA: ¿Realmente se agregó?
                        const freshCart = await HacheCart.get();
                        const exists = freshCart.items.find(i => String(i.variant_id) === String(item.variantId));

                        if (exists) {
                            success = true;
                            Logger.log(`Agregado exitoso: ${item.variantId}`);
                        } else {
                            Logger.log(`Validación fallida: El item no aparece en el carrito. Reintentando...`);
                            if (attempts > ENGINE_CONFIG.retryMax) throw new Error("Retry limit reached for item validation");
                        }
                    } catch (err) {
                        Logger.error(`Fallo crítico agregando ${item.variantId}`, err);
                        if (attempts > ENGINE_CONFIG.retryMax) {
                            HacheCart.notifyUI('error', 'No se pudieron agregar todos los productos.');
                            return false;
                        }
                    }
                }
            }

            const finalCart = await HacheCart.get();
            HacheCart.syncUI(finalCart);
            return true;
        },

        syncUI: (cart) => {
            Logger.log('Sincronizando UI del tema...', cart);
            // 1. Dispatch DOM Events
            const events = ['cart:updated', 'cart:refresh', 'added_to_cart'];
            events.forEach(name => {
                document.dispatchEvent(new CustomEvent(name, { detail: cart, bubbles: true }));
            });

            // 2. jQuery support (Tiendanube native)
            const jq = window.jQuery || window.jQueryNuvem || window.$;
            if (jq) {
                jq(document).trigger('cart:updated', [cart]);
            }

            // 3. Hint for the theme
            if (window.LS) window.LS.cart = cart;
        },

        notifyUI: (type, msg) => {
            alert(msg); // Placeholder for a nice toast logic
        }
    };

    /**
     * Resolve and Cache Config
     */
    async function init() {
        try {
            // 1. Resolve Store ID
            const storeId = window.LS?.storeId || document.querySelector('script[data-store-id]')?.getAttribute('data-store-id');
            if (!storeId) {
                Logger.error('Store ID no encontrado. Abortando inicialización.');
                return;
            }
            CURRENT_STATE.storeId = storeId;

            // 2. Load Config (with local fallback)
            let config;
            try {
                const res = await fetch(`${ENGINE_CONFIG.apiBase}/campaigns`, {
                    headers: { 'x-store-id': storeId },
                    signal: AbortSignal.timeout(5000)
                });
                config = await res.json();
                localStorage.setItem(`hache_config_${storeId}`, JSON.stringify(config));
                Logger.log('Configuración cargada desde API.');
            } catch (err) {
                const cached = localStorage.getItem(`hache_config_${storeId}`);
                if (cached) {
                    config = JSON.parse(cached);
                    Logger.log('Servidor offline. Usando configuración cacheada.');
                } else {
                    throw new Error("No hay configuración disponible (API offline & No cache)");
                }
            }

            CURRENT_STATE.config = config;
            run();

        } catch (e) {
            Logger.error('Fallo en inicialización de Hache', e);
        }
    }

    /**
     * Decision engine execution
     */
    async function run() {
        const cart = await HacheCart.get();
        CURRENT_STATE.cart = cart;

        const container = document.querySelector('.hache-injection-point');
        if (container) container.remove(); // Cleanup

        // Evaluation Logic (V4 Simple Match)
        const candidates = CURRENT_STATE.config.filter(camp => {
            if (camp.status !== 'active') return false;

            const cartTotal = cart.total_price / 100;
            const metTotal = cartTotal >= (camp.logic.conditions.minTotal || 0);

            // Basic trigger match
            let metTriggers = true;
            if (camp.logic.conditions.triggers?.length > 0) {
                metTriggers = camp.logic.conditions.triggers.some(t =>
                    cart.items.some(i => String(i.product_id) === String(t.id))
                );
            }

            return camp.logic.conditions.logic === 'OR' ? (metTotal || metTriggers) : (metTotal && metTriggers);
        }).sort((a, b) => b.logic.priority - a.logic.priority);

        if (candidates.length > 0) {
            renderExperience(candidates[0]); // Solo la mejor prioridad por ahora
        }
    }

    function renderExperience(camp) {
        Logger.log('Renderizando experiencia:', camp.name);
        const { visuals, content, type, logic } = camp;

        const host = document.createElement('div');
        host.className = 'hache-experience-v4';
        const shadow = host.attachShadow({ mode: 'open' });

        const theme = visuals.tokens || { primaryColor: '#4f46e5', borderRadius: 12, backgroundColor: '#fff' };

        shadow.innerHTML = `
            <style>
                :host { display: block; margin: 20px 0; }
                .card { 
                    background: ${theme.backgroundColor}; border-radius: ${theme.borderRadius}px;
                    padding: 20px; border: 1.5px solid ${theme.primaryColor}15;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05); font-family: system-ui, -apple-system, sans-serif;
                    display: flex; flex-direction: column; gap: 12px;
                }
                .badge { align-self: start; background: ${theme.primaryColor}15; color: ${theme.primaryColor}; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
                h3 { margin: 0; font-size: 18px; font-weight: 800; color: #1e293b; }
                p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; }
                .cta { 
                    background: ${theme.primaryColor}; color: white; border: none; padding: 14px; 
                    border-radius: 10px; font-weight: 700; cursor: pointer; transition: transform 0.1s;
                    text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;
                }
                .cta:active { transform: scale(0.97); }
                .cta:disabled { opacity: 0.6; cursor: not-allowed; }
            </style>
            <div class="card">
                ${content.badge ? `<div class="badge">${content.badge}</div>` : ''}
                <h3>${content.title}</h3>
                <p>${content.subtitle}</p>
                <button class="cta" id="go">${content.cta || 'Agregar'}</button>
            </div>
        `;

        shadow.getElementById('go').onclick = async (e) => {
            const btn = e.target;
            btn.disabled = true;
            btn.innerText = 'PROCESANDO...';

            let itemsToAdd = [];
            if (type === 'bundle') {
                itemsToAdd = logic.config.products.map(p => ({ variantId: p.variantId || p.id, qty: 1 }));
            } else if (type === 'gift') {
                itemsToAdd = [{ variantId: logic.config.product.variantId || logic.config.product.id, qty: 1 }];
            }

            const success = await HacheCart.addSequential(itemsToAdd);
            if (success) {
                btn.innerText = '¡LISTO!';
                setTimeout(() => run(), 2000);
            } else {
                btn.innerText = 'REINTENTAR';
                btn.disabled = false;
            }
        };

        // Placement logic
        const target = document.querySelector(ENGINE_CONFIG.selectors.join(','));
        if (target) target.parentNode.insertBefore(host, target.nextSibling);
    }

    // Event Listeners
    document.addEventListener('cart:updated', () => {
        Logger.log('Carrito detectado como actualizado. Revalidando motor...');
        setTimeout(run, 600);
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
