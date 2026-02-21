// SalesBooster V9.0 — Cupones dinámicos via backend, descuento nativo en Tiendanube
// https://github.com/direchentt/customily

(function () {
    'use strict';

    const CONFIG = {
        dbUrl: 'https://raw.githubusercontent.com/direchentt/customily/main/hache-config.json',
        // Backend en producción (Render)
        backendUrl: 'https://salesbooster-hachedhe.onrender.com',
        cartEndpoint: '/comprar/',
        injectAfterSelectors: ['.js-product-form', '#product_form', '.js-addtocart', '.product-buy-container'],
    };

    // ─── UTILS ───
    const parsePrice = (v) => {
        if (typeof v === 'number') return v;
        return parseFloat(String(v).replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
    };
    const fmt = (n) => Math.floor(n).toLocaleString('es-AR');

    let GLOBAL_CONFIG = null;

    async function fetchConfig() {
        if (GLOBAL_CONFIG) return GLOBAL_CONFIG;
        try {
            const res = await fetch(CONFIG.dbUrl + '?t=' + Date.now());
            GLOBAL_CONFIG = await res.json();
            return GLOBAL_CONFIG;
        } catch (e) {
            console.error('[HacheSuite] Config Error:', e);
            return null;
        }
    }

    // ─── BUNDLES (COMBOS) MAIN ───
    function initBundles(combos) {
        if (!combos || !combos.length) return;
        const product = getMainProduct();
        if (!product) return;

        // Encontrar el combo cuyo trigger contiene el producto actual
        const combo = combos.find(c =>
            Array.isArray(c.triggers) && c.triggers.includes(String(product.id))
        );

        if (!combo) return;
        renderWidget(product, combo);
    }

    // ─── PRODUCT DETECTION ───
    function getMainProduct() {
        let id = null;

        const input = document.querySelector('input[name="add_to_cart"]');
        if (input) id = input.value;

        if (!id) {
            const meta = document.querySelector('meta[property="product:retailer_item_id"]');
            if (meta) id = meta.content;
        }

        if (!id) {
            const el = document.querySelector('[data-product-id]');
            if (el) id = el.getAttribute('data-product-id');
        }

        if (!id) return null;

        const variantInput = document.querySelector('input[name="variant_id"], select[name="variant_id"]');

        return {
            id: String(id),
            variantId: variantInput ? variantInput.value : null,
            img: document.querySelector('.js-product-slide-link img, .js-main-image, .swiper-slide-active img')?.src || '',
            price: parsePrice(document.querySelector('#price_display, .price-display, .js-price-display')?.innerText || '0'),
            name: document.querySelector('.js-product-name, h1')?.innerText?.trim() || ''
        };
    }



    // ─── RENDER WIDGET ───
    function renderWidget(main, combo) {
        // combo.products = TODOS los productos del pack (incluyendo el que está en la página)
        const products = combo.products || [];
        if (products.length === 0) return;

        const discount = parseInt(combo.discount) || 0;

        // Calcular totales SIN sumar main por separado (ya está en products)
        const totalPack = products.reduce((s, p) => s + parsePrice(p.price), 0);
        const discountedTotal = Math.floor(totalPack * (1 - discount / 100));
        const savings = totalPack - discountedTotal;

        // Identificar los productos del pack que NO son el actual (para no duplicar visualmente)
        const mainId = String(main.id);
        const partnerProducts = products.filter(p => String(p.id) !== mainId);
        // Si están todos en partnerProducts (el principal no está en la lista), incluirlo
        const allForDisplay = partnerProducts.length < products.length
            ? [{ id: main.id, name: main.name, price: String(main.price), image: main.img }, ...partnerProducts]
            : products;

        const couponCode = combo.coupon || null;

        const widget = document.createElement('div');
        widget.className = 'sb-widget';
        widget.id = 'sb-combo-widget';

        widget.innerHTML = `
            ${combo.badge ? `<div class="sb-badge">${combo.badge}</div>` : ''}
            <div class="sb-title">${combo.label || '🔥 MEJOR JUNTOS'}</div>

            <div class="sb-products">
                ${allForDisplay.map((p, i) => `
                    ${i > 0 ? '<div class="sb-separator">+</div>' : ''}
                    <div class="sb-product-item">
                        <img src="${p.image || p.img || ''}" alt="${p.name}" class="sb-product-img" />
                        <div class="sb-product-name">${p.name}</div>
                        <div class="sb-product-price">$${fmt(parsePrice(p.price))}</div>
                    </div>
                `).join('')}
            </div>

            <div class="sb-pricing">
                <div class="sb-pricing-left">
                    <div class="sb-price-row">
                        <span class="sb-label">Total sin descuento:</span>
                        <span class="sb-price-original">$${fmt(totalPack)}</span>
                    </div>
                    <div class="sb-price-row">
                        <span class="sb-label">Total Pack (${discount}% OFF):</span>
                        <span class="sb-price-final">$${fmt(discountedTotal)}</span>
                    </div>
                </div>
                <div class="sb-savings-badge">
                    Ahorrás<br/><strong>$${fmt(savings)}</strong>
                </div>
            </div>

            <button class="sb-cta" id="sb-cta-btn">
                <span class="sb-cta-text">🛒 AGREGAR PACK Y PAGAR CON ${discount}% OFF</span>
                <span class="sb-cta-loading" style="display:none">⏳ Agregando pack...</span>
            </button>
            <div class="sb-disclaimer">${couponCode ? 'Descuento aplicado automáticamente al ir al checkout.' : 'Todos los productos se agregan al carrito.'}</div>
            <div class="sb-success" style="display:none"></div>
        `;

        // Inyección
        let injected = false;
        for (const sel of CONFIG.injectAfterSelectors) {
            const target = document.querySelector(sel);
            if (target) {
                target.parentElement.insertBefore(widget, target.nextSibling);
                injected = true;
                break;
            }
        }
        if (!injected) {
            (document.querySelector('.js-product-detail') || document.body).appendChild(widget);
        }

        widget.querySelector('#sb-cta-btn').addEventListener('click', function (e) {
            e.preventDefault();
            // Pasar allForDisplay para asegurarse de agregar TANTO el producto principal COMO los extras
            addComboToCart(allForDisplay, widget, combo);
        });

        injectStyles();
    }

    // ─── ADD TO CART (todos los productos del combo + cupón estático) ───
    async function addComboToCart(products, widget, combo) {
        const btn = widget.querySelector('#sb-cta-btn');
        const textEl = widget.querySelector('.sb-cta-text');
        const loadEl = widget.querySelector('.sb-cta-loading');
        const successEl = widget.querySelector('.sb-success');
        const disclaimer = widget.querySelector('.sb-disclaimer');

        btn.disabled = true;
        textEl.style.display = 'none';
        loadEl.style.display = 'inline';

        try {
            // Leer variant_id del producto actual (puede cambiar si el usuario seleccionó talla)
            const variantInput = document.querySelector('input[name="variant_id"], select[name="variant_id"]');
            const currentVariantId = variantInput?.value;
            const currentProductId = document.querySelector('input[name="add_to_cart"]')?.value;

            // Agregar TODOS los productos del combo al carrito en secuencia
            // Tiendanube requiere el header X-Requested-With para responder con JSON en /comprar/
            for (const p of products) {
                const params = new URLSearchParams({ add_to_cart: p.id, quantity: 1 });
                // Si el producto a agregar es el que el usuario está viendo, le adjuntamos su variante elegida
                if (String(p.id) === String(currentProductId) && currentVariantId) {
                    params.append('variant_id', currentVariantId);
                } else if (p.variant_id) {
                    params.append('variant_id', p.variant_id);
                }

                const resp = await fetch(CONFIG.cartEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: params.toString()
                });

                let respData = null;
                try { respData = await resp.json(); } catch (e) { }
                console.log(`[SalesBooster] Add product ${p.id}:`, respData);
            }

            // Mostrar éxito
            loadEl.style.display = 'none';
            btn.style.display = 'none';
            if (disclaimer) disclaimer.style.display = 'none';
            successEl.style.display = 'block';

            // Mostrar loading de cupón
            successEl.style.display = 'block';
            successEl.innerHTML = `⏳ Aplicando descuento...`;

            const discount = combo.discount || 0;
            const staticCoupon = combo.coupon || null;

            if (discount > 0) {
                // Intentar crear cupón dinámico via backend
                let finalCoupon = staticCoupon;
                try {
                    const couponResp = await fetch(`${CONFIG.backendUrl}/api/create-coupon`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ discount_percent: discount, combo_id: combo.id })
                    });
                    const couponData = await couponResp.json();
                    if (couponData.success && couponData.coupon) {
                        finalCoupon = couponData.coupon;
                        console.log('[SalesBooster] Cupón dinámico creado:', finalCoupon);
                    }
                } catch (e) {
                    console.warn('[SalesBooster] Backend no disponible, usando cupón estático si existe:', e.message);
                }

                if (finalCoupon) {
                    successEl.innerHTML = `✅ ¡Pack listo! Aplicando ${discount}% OFF...`;
                    setTimeout(() => {
                        // Redirigir al checkout con el cupón pre-cargado en la URL
                        window.location.href = `${CONFIG.cartEndpoint}?coupon=${encodeURIComponent(finalCoupon)}`;
                    }, 800);
                } else {
                    // Sin cupón: ir al carrito simple
                    successEl.innerHTML = `✅ ¡Pack agregado al carrito!`;
                    setTimeout(() => { window.location.href = CONFIG.cartEndpoint; }, 800);
                }
            } else {
                successEl.innerHTML = `✅ ¡Pack agregado al carrito!<br>Yendo al carrito...`;
                setTimeout(() => { window.location.href = CONFIG.cartEndpoint; }, 800);
            }

        } catch (e) {
            console.warn('[SalesBooster] Error:', e.message);
            loadEl.style.display = 'none';
            textEl.style.display = 'inline';
            textEl.textContent = '⚠️ Error al agregar. Intentá de nuevo.';
            btn.disabled = false;
        }
    }


    // ─── STYLES ───
    function injectStyles() {
        if (document.getElementById('sb-styles')) return;

        const css = `
        #sb-combo-widget {
            position: relative;
            margin: 24px 0;
            padding: 20px;
            border-radius: 12px;
            background: #fff;
            border: 1.5px solid #e5e7eb;
            box-shadow: 0 4px 16px rgba(0,0,0,0.07);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            clear: both;
            box-sizing: border-box;
            overflow: visible;
        }

        .sb-badge {
            position: absolute;
            top: -10px; left: 16px;
            background: linear-gradient(135deg, #f59e0b, #ef4444);
            color: white;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 3px 10px;
            border-radius: 20px;
        }

        .sb-title {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #111;
            margin-bottom: 16px;
        }

        /* PRODUCTS ROW */
        .sb-products {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }

        .sb-product-item {
            flex: 1;
            min-width: 70px;
            max-width: 120px;
            text-align: center;
        }

        .sb-product-img {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            border-radius: 8px;
            border: 1.5px solid #f0f0f0;
            display: block;
            margin-bottom: 6px;
        }

        .sb-product-name {
            font-size: 10px;
            font-weight: 600;
            color: #374151;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-bottom: 2px;
        }

        .sb-product-price {
            font-size: 11px;
            font-weight: 700;
            color: #111;
        }

        .sb-separator {
            font-size: 20px;
            font-weight: 900;
            color: #d1d5db;
            flex-shrink: 0;
        }

        /* PRICING */
        .sb-pricing {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: #f9fafb;
            border-radius: 8px;
            padding: 12px 14px;
            margin-bottom: 14px;
        }

        .sb-pricing-left { flex: 1; }

        .sb-price-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
        }
        .sb-price-row:last-child { margin-bottom: 0; }

        .sb-label { font-size: 11px; color: #6b7280; }
        .sb-price-original { font-size: 12px; text-decoration: line-through; color: #9ca3af; }
        .sb-price-final { font-size: 16px; font-weight: 800; color: #16a34a; }

        .sb-savings-badge {
            background: linear-gradient(135deg, #16a34a, #15803d);
            color: white;
            text-align: center;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 600;
            flex-shrink: 0;
            line-height: 1.4;
        }
        .sb-savings-badge strong { font-size: 14px; display: block; }

        /* CTA */
        .sb-cta {
            width: 100%;
            padding: 13px;
            background: #111;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 800;
            font-family: inherit;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
            margin-bottom: 8px;
        }
        .sb-cta:hover:not(:disabled) { background: #374151; }
        .sb-cta:active:not(:disabled) { transform: scale(0.99); }
        .sb-cta:disabled { opacity: 0.6; cursor: not-allowed; }

        .sb-disclaimer {
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
        }

        .sb-success {
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            font-size: 13px;
            font-weight: 600;
            color: #16a34a;
        }
        .sb-success a { color: #16a34a; }

        /* MOBILE */
        @media (max-width: 600px) {
            #sb-combo-widget { padding: 16px; }

            .sb-products { gap: 6px; }
            .sb-product-item { min-width: 60px; max-width: 90px; }
            .sb-product-name { font-size: 9px; }
            .sb-separator { font-size: 16px; }

            .sb-pricing { flex-direction: column; align-items: stretch; gap: 10px; }
            .sb-savings-badge { text-align: left; display: flex; align-items: center; gap: 8px; }
            .sb-savings-badge strong { font-size: 16px; }
        }
        `;

        const style = document.createElement('style');
        style.id = 'sb-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ─── AUTO-APPLY COUPON EN EL CARRITO (/comprar/) ───
    // Nuestro script NO corre en /checkout/v3/ (TN lo bloquea).
    // Pero SÍ corre en /comprar/. Aplicamos el cupón ahí antes
    // de que el usuario haga clic en "Iniciar Compra".
    function handleCouponFlow() {
        const params = new URLSearchParams(window.location.search);
        const coupon = params.get('coupon');
        if (!coupon) return;

        console.log('[SalesBooster] Cupón detectado, aplicando en carrito:', coupon);

        // Función para inyectar valor en inputs de React (TN usa un SPA)
        const setNativeValue = (el, value) => {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            nativeSetter?.call(el, value);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const tryApplyOnCart = (attempts) => {
            if (attempts <= 0) {
                console.warn('[SalesBooster] No se pudo aplicar el cupón en el carrito');
                return;
            }

            // 1. Buscar el input de cupón (si ya está visible)
            const input = document.querySelector('input#coupon, input[test-id="coupon"], input[name="coupon"]');

            if (input) {
                // Input visible → llenarlo y enviar
                setNativeValue(input, coupon);
                console.log('[SalesBooster] Input encontrado, llenando:', coupon);
                setTimeout(() => {
                    const applyBtn = document.querySelector('button[test-id="apply-coupon-btn"]')
                        || input.closest('div, form')?.querySelector('button');
                    if (applyBtn) {
                        applyBtn.click();
                        console.log('[SalesBooster] ✅ Cupón aplicado en carrito:', coupon);
                    }
                }, 400);
                return;
            }

            // 2. Input no visible → buscar el link que lo revela y hacer clic
            const allElements = [...document.querySelectorAll('*')];
            const revealLink = allElements.find(el => {
                const txt = el.textContent?.trim().toLowerCase();
                return (txt === 'agregar cupón de descuento' || txt === 'agregar cupon de descuento')
                    && el.children.length === 0; // nodo hoja de texto exacto
            }) || allElements.find(el => {
                const txt = el.textContent?.trim().toLowerCase();
                return txt?.includes('cupón') && txt?.includes('agregar');
            });

            if (revealLink) {
                revealLink.click();
                console.log('[SalesBooster] Clic en link de cupón para revelar input');
                setTimeout(() => tryApplyOnCart(attempts - 1), 1000);
            } else {
                // El carrito todavía no cargó → reintentar
                setTimeout(() => tryApplyOnCart(attempts - 1), 700);
            }
        };

        // Esperar a que el SPA del carrito cargue completamente
        setTimeout(() => tryApplyOnCart(15), 2500);
    }

    // ─── OFERTAS ESTRATÉGICAS (SMART OFFERS) ───
    function initSmartOffers(offers) {
        if (!offers || !offers.length) return;

        // CSS
        if (!document.getElementById('hache-offer-styles')) {
            const style = document.createElement('style');
            style.id = 'hache-offer-styles';
            style.innerHTML = `
                .hache-smart-offer { margin: 15px 0; padding: 15px; background: #fdfdfd; border-radius: 12px; border: 1px solid #ebebeb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                .hache-smart-offer.in-minicart { margin: 15px; }
                .hache-offer-title { font-size: 13px; font-weight: 600; color: #111; margin-bottom: 12px; }
                .hache-offer-row { display: flex; align-items: center; gap: 12px; }
                .hache-offer-img { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; }
                .hache-offer-info { flex: 1; min-width: 0; }
                .hache-offer-name { font-size: 13px; font-weight: 500; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .hache-offer-price { font-size: 13px; font-weight: 700; color: #333; margin-top: 2px; }
                .hache-offer-btn { background: #111; color: #fff; border: none; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; white-space: nowrap; }
                .hache-offer-btn:hover { background: #333; transform: scale(1.02); }
                .hache-offer-btn.adding { background: #aaa; cursor: wait; }
            `;
            document.head.appendChild(style);
        }

        const injectOffer = (offer, context, containerEl) => {
            const product = offer.offerProduct;
            if (!product || !product.id) return;

            const existing = document.getElementById('hache-offer-' + offer.id + '-' + context);
            if (existing) return; // Ya inyectado en este contexto

            // Verificar si el producto ya está en el HTML del carrito/contenedor para no ofrecerlo (Ej carrito)
            if (containerEl.innerHTML && (containerEl.innerHTML.includes(product.id) || containerEl.innerHTML.includes(product.name))) return;

            const div = document.createElement('div');
            div.className = 'hache-smart-offer ' + (context === 'minicart' ? 'in-minicart' : '');
            div.id = 'hache-offer-' + offer.id + '-' + context;
            div.innerHTML = `
                <div class="hache-offer-title">${offer.title || 'COMPLETÁ TU RUTINA:'}</div>
                <div class="hache-offer-row">
                    <img src="${product.image}" class="hache-offer-img" />
                    <div class="hache-offer-info">
                        <div class="hache-offer-name">${product.name}</div>
                        <div class="hache-offer-price">$${fmt(parsePrice(product.price))}</div>
                    </div>
                    <button class="hache-offer-btn" id="btn-offer-${offer.id}">Agregar</button>
                </div>
            `;

            if (context === 'minicart' || context === 'cart') {
                const cartList = containerEl.querySelector('.js-ajax-cart-list');
                const submitBtn = containerEl.querySelector('.js-ajax-cart-submit, [data-component="cart.checkout-button"]');
                if (cartList && cartList.nextElementSibling) cartList.parentNode.insertBefore(div, cartList.nextElementSibling);
                else if (submitBtn && submitBtn.parentNode) submitBtn.parentNode.insertBefore(div, submitBtn);
                else containerEl.appendChild(div);
            } else if (context === 'pdp') {
                containerEl.parentNode.insertBefore(div, containerEl.nextSibling);
            }

            const btn = div.querySelector('#btn-offer-' + offer.id);
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                btn.classList.add('adding');
                btn.innerText = 'Agregando...';

                try {
                    if (window.LS && window.LS.addToCart) {
                        window.LS.addToCart(product.id, product.variant_id || product.id, 1);
                    } else {
                        const params = new URLSearchParams({ add_to_cart: product.id, quantity: 1 });
                        if (product.variant_id) params.append('variant_id', product.variant_id);
                        await fetch('/comprar/', { method: 'POST', body: params });
                        window.location.reload();
                    }
                } catch (err) {
                    window.location.reload();
                }
            });
        };

        const processMinicart = () => {
            const cartPanel = document.querySelector('.js-ajax-cart-panel, .js-ajax-cart-list, #modal-cart, .cart-sliding, #ajax-cart');
            if (!cartPanel) return;

            offers.forEach(offer => {
                if (!offer.placements?.includes('minicart')) return;
                // Revisar triggers (SI no hay gatillos -> se muestra siempre. SI hay, chequear si alguno está en el carrito)
                let show = true;
                if (offer.triggers && offer.triggers.length > 0) {
                    show = false;
                    const html = cartPanel.innerHTML;
                    for (const t of offer.triggers) {
                        if (html.includes(t)) { show = true; break; }
                    }
                }
                if (show) injectOffer(offer, 'minicart', cartPanel);
            });
        };

        const processPDP = () => {
            const mainProduct = getMainProduct();
            if (!mainProduct) return;
            const container = document.querySelector('.js-product-form, #product_form, .js-addtocart, .product-buy-container');
            if (!container) return;

            offers.forEach(offer => {
                if (!offer.placements?.includes('pdp')) return;
                let show = true;
                if (offer.triggers && offer.triggers.length > 0) {
                    show = offer.triggers.includes(String(mainProduct.id));
                }
                if (show) injectOffer(offer, 'pdp', container);
            });
        };

        processPDP();
        processMinicart();

        const obs = new MutationObserver(() => {
            if (document.querySelector('#modal-cart.modal-show, #ajax-cart.active, .cart-sliding')) {
                processMinicart();
            }
        });
        obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    }

    // ─── BARRA DE ENVÍO GRATIS ───
    function initShippingBar(configBar) {
        if (!configBar || !configBar.enabled) return;

        // CSS
        if (!document.getElementById('hache-shipping-styles')) {
            const style = document.createElement('style');
            style.id = 'hache-shipping-styles';
            // Variante 1, 2 o 3 (Simple progress)
            const bgClass = configBar.style === 2 ? 'border-radius: 8px;' : (configBar.style === 3 ? 'border-radius: 20px;' : '');

            style.innerHTML = `
                .hache-sbar-wrap { margin: 15px 0; padding: 12px 15px; font-family: -apple-system, sans-serif; background: #fff; border: 1px solid #e5e5e5; display: flex; flex-direction: column; align-items: center; justify-content: center; ${bgClass} }
                .hache-sbar-wrap.in-minicart { margin: 10px 15px; border-left: 0; border-right: 0;}
                .hache-sbar-txt { font-size: 13px; font-weight: 500; color: #111; margin-bottom: 8px; text-align: center; }
                .hache-sbar-txt b { font-weight: 700; color: ${configBar.color || '#000'}; }
                .hache-sbar-track { width: 100%; height: 6px; background: #eee; border-radius: 10px; overflow: hidden; }
                .hache-sbar-fill { height: 100%; background: ${configBar.color || '#000'}; transition: width 0.4s ease; }
                .hache-sbar-success { color: #10b981; font-weight: 700; }
            `;
            document.head.appendChild(style);
        }

        const threshold = configBar.threshold || 100000;

        const updateBar = async () => {
            // Intenta leer LS.cart sino fetch (o HTML scrap como ultimo recurso)
            let subtotal = 0;
            try {
                if (window.LS && window.LS.cart && window.LS.cart.subtotal) {
                    subtotal = parsePrice(window.LS.cart.subtotal);
                } else {
                    const el = document.querySelector('.js-cart-subtotal, .js-ajax-cart-total');
                    if (el) subtotal = parsePrice(el.innerText);
                }
            } catch (e) { }

            let pct = Math.min((subtotal / threshold) * 100, 100);
            let faltante = threshold - subtotal;
            let msg = '';
            let isSuccess = false;

            if (subtotal === 0) {
                msg = configBar.msgInitial || `Sumá $${fmt(faltante)} para envío gratis`;
                msg = msg.replace('{faltante}', `<b>$${fmt(faltante)}</b>`);
            } else if (subtotal < threshold) {
                msg = configBar.msgProgress || `Estás a $${fmt(faltante)} del envío gratis`;
                msg = msg.replace('{faltante}', `<b>$${fmt(faltante)}</b>`);
            } else {
                msg = `<span class="hache-sbar-success">${configBar.msgSuccess || '¡Tenés envío gratis!'}</span>`;
                isSuccess = true;
            }

            // Inyectar en minicart
            if (configBar.placements?.includes('minicart')) {
                const cartPanel = document.querySelector('.js-ajax-cart-panel, .js-ajax-cart-list, #modal-cart, .cart-sliding');
                if (cartPanel) {
                    let bar = document.getElementById('hache-sbar-minicart');
                    if (!bar) {
                        bar = document.createElement('div');
                        bar.id = 'hache-sbar-minicart';
                        bar.className = 'hache-sbar-wrap in-minicart';
                        bar.innerHTML = `<div class="hache-sbar-txt">${msg}</div><div class="hache-sbar-track"><div class="hache-sbar-fill" style="width: ${pct}%"></div></div>`;
                        cartPanel.insertBefore(bar, cartPanel.firstChild);
                    } else {
                        bar.querySelector('.hache-sbar-txt').innerHTML = msg;
                        bar.querySelector('.hache-sbar-fill').style.width = pct + '%';
                    }
                }
            }

            // Inyectar en PDP
            if (configBar.placements?.includes('pdp')) {
                const pdpContainer = document.querySelector('.js-product-form, #product_form, .product-buy-container');
                if (pdpContainer) {
                    let bar = document.getElementById('hache-sbar-pdp');
                    if (!bar) {
                        bar = document.createElement('div');
                        bar.id = 'hache-sbar-pdp';
                        bar.className = 'hache-sbar-wrap';
                        bar.innerHTML = `<div class="hache-sbar-txt">${msg}</div><div class="hache-sbar-track"><div class="hache-sbar-fill" style="width: ${pct}%"></div></div>`;
                        pdpContainer.insertBefore(bar, pdpContainer.firstChild);
                    }
                    // Aca en PDP quizas sumar el precio del producto actual al subtotal simulando el progreso
                }
            }
        };

        updateBar();

        const obs = new MutationObserver(() => { updateBar(); });
        obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    }

    // ─── BOOT ───
    async function boot() {
        const conf = await fetchConfig();
        if (!conf) return;

        // 1. Iniciar Ofertas Estratégicas
        if (conf.smartOffers && conf.smartOffers.length > 0) {
            initSmartOffers(conf.smartOffers);
        }

        // 2. Iniciar Barra de Envíos
        if (conf.shippingBar && conf.shippingBar.enabled) {
            initShippingBar(conf.shippingBar);
        }

        // 3. Iniciar Bundles (Solo en página de producto)
        const isProductPage = !!document.querySelector(
            'input[name="add_to_cart"], meta[property="product:retailer_item_id"]'
        );
        if (isProductPage && conf.bundles) {
            initBundles(conf.bundles);
        }

        // 4. Flujo automático de Cupones (Cart page)
        handleCouponFlow();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
