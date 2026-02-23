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
                const res = await fetch(`${ENGINE_CONFIG.apiBase}/config`, {
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

        document.querySelectorAll('.hache-experience-v4').forEach(e => e.remove());

        const config = CURRENT_STATE.config;
        if (!config) return;

        const productId = window.LS?.product?.id ? String(window.LS.product.id) : null;
        let rendered = false;

        // 1. Check Bundles (PDP)
        if (config.modules?.bundlesEnabled !== false && config.bundles && config.bundles.length > 0) {
            const activeBundle = config.bundles.find(b => productId && b.triggers && b.triggers.includes(productId));
            if (activeBundle) {
                renderBundle(activeBundle);
                rendered = true;
            }
        }

        // 2. Check Smart Offers (Cart / PDP)
        if (!rendered && config.modules?.offersEnabled !== false && config.smartOffers && config.smartOffers.length > 0) {
            const cartTotal = cart.total_price / 100;
            // Also check if any trigger is in cart or active PDP
            const activeOffer = config.smartOffers.find(offer => {
                const metTotal = cartTotal >= (offer.cartMinValue || 0);
                let metTriggers = true;
                if (offer.triggers && offer.triggers.length > 0) {
                    const inCart = cart.items.some(i => offer.triggers.includes(String(i.product_id)));
                    const inPDP = productId && offer.triggers.includes(productId);
                    metTriggers = inCart || inPDP;
                }
                return metTotal && metTriggers;
            });

            if (activeOffer) {
                renderOffer(activeOffer);
            }
        }
    }

    function injectIntoDOM(host) {
        const target = document.querySelector(ENGINE_CONFIG.selectors.join(','));
        if (target) target.parentNode.insertBefore(host, target.nextSibling);
    }

    function renderBundle(bundle) {
        Logger.log('Renderizando Bundle:', bundle.label);
        const host = document.createElement('div');
        host.className = 'hache-experience-v4';
        const shadow = host.attachShadow({ mode: 'open' });

        const theme = { primaryColor: '#000', borderRadius: 8, backgroundColor: '#f9f9f9' };

        // Products HTML
        let productsHtml = '';
        let itemsToAdd = [];
        if (bundle.products && bundle.products.length > 0) {
            bundle.products.forEach(p => {
                const priceMatch = p.price ? p.price : 0;
                productsHtml += `<div class="p-item"><img src="${p.image}" width="40" height="40" style="border-radius:4px;object-fit:cover;"> <div class="p-info"><strong>${p.name}</strong> <span>+$${parseFloat(priceMatch).toLocaleString()}</span></div></div>`;
                if (p.variant_id) itemsToAdd.push({ variantId: p.variant_id, qty: 1 });
            });
        }

        shadow.innerHTML = `
            <style>
                :host { display: block; margin: 20px 0; }
                .card { background: ${theme.backgroundColor}; border-radius: ${theme.borderRadius}px; padding: 20px; border: 1px solid #ddd; font-family: system-ui, sans-serif; }
                h3 { margin: 0 0 15px 0; font-size: 16px; font-weight: 700; color: #111; text-transform:uppercase; letter-spacing:1px; }
                .p-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; }
                .p-item { display: flex; align-items: center; gap: 10px; }
                .p-info { display: flex; flex-direction: column; font-size: 13px; }
                .p-info span { color: #666; font-size:12px;}
                .cta { background: ${theme.primaryColor}; color: white; border: none; width: 100%; padding: 14px; border-radius: 6px; font-weight: 700; cursor: pointer; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; transition: opacity 0.2s;}
                .cta:hover { opacity:0.8;}
                .cta:disabled { opacity: 0.5; pointer-events:none;}
            </style>
            <div class="card">
                <h3>${bundle.label || 'Llevá también:'}</h3>
                <div class="p-list">${productsHtml}</div>
                <button class="cta" id="go">${bundle.ctaText || 'AGREGAR COMBO'}</button>
            </div>
        `;

        shadow.getElementById('go').onclick = async (e) => {
            const btn = e.target;
            btn.disabled = true;
            btn.innerText = 'PROCESANDO...';
            const success = await HacheCart.addSequential(itemsToAdd);
            if (success) {
                btn.innerText = '¡AGREGADO!';
                setTimeout(() => run(), 2000);
            } else {
                btn.innerText = 'REINTENTAR';
                btn.disabled = false;
            }
        };

        injectIntoDOM(host);
    }

    function renderOffer(offer) {
        Logger.log('Renderizando Oferta:', offer.title);
        const host = document.createElement('div');
        host.className = 'hache-experience-v4';
        const shadow = host.attachShadow({ mode: 'open' });

        const theme = { primaryColor: '#000', borderRadius: 8, backgroundColor: offer.style === 'dark' ? '#111' : '#fff', textColor: offer.style === 'dark' ? '#fff' : '#111' };
        const op = offer.offerProduct;
        if (!op) return;

        shadow.innerHTML = `
            <style>
                :host { display: block; margin: 20px 0; }
                .card { background: ${theme.backgroundColor}; color: ${theme.textColor}; border-radius: ${theme.borderRadius}px; padding: 15px; border: 2px dashed #ddd; font-family: system-ui, sans-serif; display:flex; flex-direction:column; gap:10px; }
                .badge { align-self: start; background: #eab308; color: #000; font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
                h3 { margin: 0; font-size: 14px; font-weight: 800; text-transform:uppercase;}
                .prod-row { display:flex; gap:15px; align-items:center; }
                .prod-info { flex:1; display:flex; flex-direction:column; }
                .prod-name { font-size: 14px; font-weight:600;}
                .prod-price { font-size: 13px; color: ${offer.style === 'dark' ? '#ccc' : '#666'};}
                .cta { background: ${theme.primaryColor}; color: white; border: none; padding: 10px 15px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px; }
                .cta:disabled { opacity: 0.5; }
            </style>
            <div class="card">
                ${offer.badge ? `<div class="badge">${offer.badge}</div>` : ''}
                <h3>${offer.title || 'Te recomendamos'}</h3>
                <div class="prod-row">
                    <img src="${op.image}" width="60" height="60" style="border-radius:6px;object-fit:cover;">
                    <div class="prod-info">
                        <span class="prod-name">${op.name}</span>
                        <span class="prod-price">$${parseFloat(op.price || 0).toLocaleString()}</span>
                    </div>
                    <button class="cta" id="go">SUMAR</button>
                </div>
            </div>
        `;

        shadow.getElementById('go').onclick = async (e) => {
            const btn = e.target;
            btn.disabled = true;
            btn.innerText = '...';
            const success = await HacheCart.addSequential([{ variantId: op.variant_id, qty: 1 }]);
            if (success) {
                btn.innerText = '✓';
                setTimeout(() => run(), 2000);
            } else {
                btn.innerText = 'SUMAR';
                btn.disabled = false;
            }
        };

        injectIntoDOM(host);
    }

    // Event Listeners
    document.addEventListener('cart:updated', () => {
        Logger.log('Carrito detectado como actualizado. Revalidando motor...');
        setTimeout(run, 600);
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
