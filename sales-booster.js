// SalesBooster V9.0 — Cupones dinámicos via backend, descuento nativo en Tiendanube
// https://github.com/direchentt/customily

(function () {
    'use strict';

    const CONFIG = {
        dbUrl: 'https://raw.githubusercontent.com/direchentt/customily/main/combos.json',
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

    // ─── MAIN ───
    async function init() {
        const product = getMainProduct();
        if (!product) return;

        const combos = await fetchCombos();
        if (!combos || !combos.length) return;

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

    // ─── FETCH COMBOS ───
    async function fetchCombos() {
        try {
            const res = await fetch(CONFIG.dbUrl + '?t=' + Date.now());
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error('[SalesBooster] DB Error:', e);
            return [];
        }
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

    // ─── AUTO-APPLY COUPON ───
    // Estrategia de 2 pasos:
    // 1) En /comprar/?coupon=XXX → guardar en sessionStorage
    // 2) En el checkout (Entrega) → leer sessionStorage y auto-aplicar en el input nativo
    function handleCouponFlow() {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        const urlCoupon = params.get('coupon');

        // PASO 1: Guardar cupón si viene en la URL de /comprar/
        if (urlCoupon) {
            sessionStorage.setItem('sb_coupon', urlCoupon);
            console.log('[SalesBooster] Cupón guardado en session:', urlCoupon);
        }

        // PASO 2: Aplicar en el checkout (la URL del checkout de TN varía pero siempre
        // es diferente: tiene /checkout, /entrega, o un hash raro. Lo detectamos por
        // la presencia del input nativo de TN)
        const coupon = sessionStorage.getItem('sb_coupon');
        if (!coupon) return;

        // Función para inyectar valor en input de React (TN usa React en el checkout)
        const setNativeValue = (el, value) => {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            nativeSetter?.call(el, value);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const tryApplyCoupon = (attempts) => {
            if (attempts <= 0) {
                console.warn('[SalesBooster] No se pudo encontrar el input de cupón tras múltiples intentos');
                return;
            }

            // Selectores exactos confirmados por inspección del DOM de TN
            const input = document.querySelector(
                'input#coupon, input[test-id="coupon"], input[name="coupon"]'
            );

            if (input && input.offsetParent !== null) {
                // Input está visible — llenarlo
                setNativeValue(input, coupon);
                console.log('[SalesBooster] Input de cupón llenado:', coupon);

                // Hacer clic en el botón de aplicar
                setTimeout(() => {
                    const applyBtn = document.querySelector(
                        'button[test-id="apply-coupon-btn"], [data-testid="apply-coupon-btn"]'
                    ) || input.closest('div, form')?.querySelector('button');

                    if (applyBtn) {
                        applyBtn.click();
                        console.log('[SalesBooster] Cupón enviado al checkout:', coupon);
                        sessionStorage.removeItem('sb_coupon'); // limpiar después de aplicar
                    }
                }, 400);

            } else if (input && input.offsetParent === null) {
                // Input existe pero está oculto — hay que abrir el panel de cupón primero
                const revealBtn = document.querySelector(
                    '[data-testid="link-coupon-reveal"], .btn-link'
                );
                if (revealBtn) {
                    revealBtn.click();
                    console.log('[SalesBooster] Abriendo panel de cupón...');
                }
                setTimeout(() => tryApplyCoupon(attempts - 1), 600);

            } else {
                // Aún no cargó el checkout — reintentar
                setTimeout(() => tryApplyCoupon(attempts - 1), 800);
            }
        };

        // Esperar a que React hidrate el checkout y luego aplicar
        setTimeout(() => tryApplyCoupon(12), 2000);
    }

    // ─── BOOT ───
    function boot() {
        // Correr en TODAS las páginas: widget en PDPs + cupón en checkout
        handleCouponFlow();

        // Widget de combo solo en páginas de producto
        const isProductPage = !!document.querySelector(
            'input[name="add_to_cart"], meta[property="product:retailer_item_id"]'
        );
        if (isProductPage) {
            init();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
