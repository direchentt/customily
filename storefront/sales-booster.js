// SalesBooster V9.0 — Cupones dinámicos via backend, descuento nativo en Tiendanube
// https://github.com/direchentt/customily

(function () {
    'use strict';

    const CONFIG = {
        // Leyendo en vivo la base de datos de MongoDB a través de tu Backend en Render
        dbUrl: 'https://salesbooster-hachedhe.onrender.com/api/config',
        // Backend en producción (Render)
        backendUrl: 'https://salesbooster-hachedhe.onrender.com',
        cartEndpoint: '/comprar/',
        injectAfterSelectors: ['.js-product-form', '#product_form', '.js-addtocart', '.product-buy-container'],
    };

    const IS_PDP = window.location.pathname.includes('/productos/') || window.location.pathname.includes('/p/') || !!document.querySelector('meta[property="product:retailer_item_id"]');

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
        const products = combo.products || [];
        if (products.length === 0) return;

        const colors = combo.colors || {};
        const bgColor = colors.bg || '#ffffff';
        const borderColor = colors.border || '#e5e7eb';
        const titleColor = colors.titleColor || '#111111';
        const btnBg = colors.btnBg || '#111111';
        const btnText = colors.btnText || '#ffffff';
        const successColor = colors.successColor || '#16a34a';
        const ctaText = combo.ctaText || '🛒 AGREGAR TODO AL CARRITO';
        const displayMode = combo.displayMode || 'pack';

        const mainId = String(main.id);
        const partnerProducts = products.filter(p => String(p.id) !== mainId);
        const allForDisplay = partnerProducts.length < products.length
            ? [{ id: main.id, name: main.name, price: String(main.price), compare_at_price: null, image: main.img }, ...partnerProducts]
            : products;

        // ─── HELPER: renderizar bloque de un producto ───
        const renderProductCard = (p, showBtn) => {
            const price = parsePrice(p.price);
            const compareAt = p.compare_at_price ? parsePrice(p.compare_at_price) : null;
            const hasDiscount = compareAt && compareAt > price;
            const discountPct = hasDiscount ? Math.round((1 - price / compareAt) * 100) : 0;

            return `
                <div class="sb-product-item">
                    <div class="sb-product-img-wrap">
                        <img src="${p.image || p.img || ''}" alt="${p.name}" class="sb-product-img" />
                        ${hasDiscount ? `<div class="sb-product-badge">-${discountPct}%</div>` : ''}
                    </div>
                    <div class="sb-product-info">
                        <div class="sb-product-name">${p.name}</div>
                        <div class="sb-product-prices">
                            ${hasDiscount ? `<span class="sb-price-crossed" style="color:${successColor}">$${fmt(compareAt)}</span>` : ''}
                            <span class="sb-price-current">$${fmt(price)}</span>
                        </div>
                    </div>
                    ${showBtn ? `<button class="sb-btn-individual" data-pid="${p.id}" data-vid="${p.variant_id || ''}" style="background:${btnBg};color:${btnText};flex-shrink:0;">Agregar</button>` : ''}
                </div>
            `;
        };


        // ─── MODO: Pack completo ───
        const renderPackMode = () => {
            const totalOriginal = allForDisplay.reduce((s, p) => {
                const cp = p.compare_at_price ? parsePrice(p.compare_at_price) : parsePrice(p.price);
                return s + cp;
            }, 0);
            const totalFinal = allForDisplay.reduce((s, p) => s + parsePrice(p.price), 0);
            const savings = totalOriginal - totalFinal;
            const hasSavings = savings > 0;

            return `
                <div class="sb-products ${allForDisplay.length === 1 ? 'sb-single' : ''}">
                    ${allForDisplay.map((p, i) => `
                        ${i > 0 ? '<div class="sb-separator">+</div>' : ''}
                        ${renderProductCard(p, false)}
                    `).join('')}
                </div>
                ${hasSavings ? `
                <div class="sb-pricing">
                    <div class="sb-pricing-left">
                        <div class="sb-price-row">
                            <span class="sb-label">Total sin descuento:</span>
                            <span class="sb-price-original">$${fmt(totalOriginal)}</span>
                        </div>
                        <div class="sb-price-row">
                            <span class="sb-label">Total Pack:</span>
                            <span class="sb-price-final" style="color:${successColor}">$${fmt(totalFinal)}</span>
                        </div>
                    </div>
                    <div class="sb-savings-badge" style="background:${successColor}">Ahorrás<br/><strong>$${fmt(savings)}</strong></div>
                </div>` : ''}
                <button class="sb-cta" id="sb-cta-btn" style="background:${btnBg};color:${btnText}">
                    <span class="sb-cta-text">${ctaText}</span>
                    <span class="sb-cta-loading" style="display:none">⏳ Agregando...</span>
                </button>
                <div class="sb-disclaimer">Todos los productos se agregan al carrito.</div>
                <div class="sb-success" style="display:none"></div>
            `;
        };

        // ─── MODO: Individuales ───
        const renderIndividualMode = () => `
            <div class="sb-products ${partnerProducts.length === 1 ? 'sb-single' : ''}">
                ${partnerProducts.map(p => renderProductCard(p, true)).join('')}
            </div>
            <div class="sb-success" style="display:none"></div>
        `;

        const widget = document.createElement('div');
        widget.className = 'sb-widget';
        widget.id = 'sb-combo-widget';
        widget.style.cssText = `background:${bgColor};border-color:${borderColor};`;

        widget.innerHTML = `
            ${combo.badge ? `<div class="sb-badge">${combo.badge}</div>` : ''}
            <div class="sb-title" style="color:${titleColor}">${combo.label || '🔥 MEJOR JUNTOS'}</div>
            ${displayMode === 'individual' ? renderIndividualMode() : renderPackMode()}
        `;

        // Inyección en DOM
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

        // Listeners según modo
        if (displayMode === 'pack') {
            const btn = widget.querySelector('#sb-cta-btn');
            if (btn) btn.addEventListener('click', e => { e.preventDefault(); addComboToCart(allForDisplay, widget, combo); });
        } else {
            widget.querySelectorAll('.sb-btn-individual').forEach(btn => {
                btn.addEventListener('click', async e => {
                    e.preventDefault();
                    if (btn.disabled) return;
                    btn.disabled = true;
                    const prevText = btn.innerText;
                    btn.innerText = '⏳...';
                    const pid = btn.dataset.pid;
                    const vid = btn.dataset.vid;
                    try {
                        const params = new URLSearchParams({ add_to_cart: pid, quantity: 1 });
                        if (vid) params.append('variant_id', vid);
                        await fetch(CONFIG.cartEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' }, body: params.toString() });
                        btn.innerText = '✅ Agregado!';
                        btn.style.background = successColor;
                        setTimeout(() => { btn.innerText = prevText; btn.style.background = btnBg; btn.disabled = false; }, 2500);
                    } catch (err) {
                        btn.innerText = prevText; btn.disabled = false;
                    }
                });
            });
        }

        injectStyles(successColor, btnBg, btnText);
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
    function injectStyles(successColor, btnBg, btnText) {
        if (document.getElementById('sb-styles')) return;

        const css = `
        #sb-combo-widget {
            position: relative;
            margin: 24px 0;
            padding: 24px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0,0,0,0.06);
            box-shadow: 0 12px 32px -12px rgba(0,0,0,0.12), 0 4px 12px -4px rgba(0,0,0,0.06);
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
            clear: both;
            box-sizing: border-box;
            overflow: visible;
        }

        .sb-badge {
            position: absolute;
            top: -12px; left: 20px;
            background: linear-gradient(135deg, #111, #333);
            color: white;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 4px 14px;
            border-radius: 24px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }

        .sb-title {
            font-size: 16px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: -0.2px;
            color: #111;
            margin-bottom: 20px;
        }

        /* PRODUCTS */
        .sb-products {
            display: flex;
            flex-direction: column;
            gap: 0;
            margin-bottom: 20px;
            border: 1px solid rgba(0,0,0,0.05);
            border-radius: 14px;
            background: #fff;
            overflow: hidden;
        }

        .sb-products .sb-separator { display: none; }

        .sb-product-item {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 16px;
            padding: 14px 16px;
            border-bottom: 1px solid rgba(0,0,0,0.04);
            background: transparent;
            transition: background 0.2s ease;
        }
        .sb-product-item:hover { background: #fafafa; }
        .sb-product-item:last-child { border-bottom: none; }

        /* Single product mode */
        .sb-products.sb-single .sb-product-item {
            padding: 20px;
        }
        .sb-products.sb-single .sb-product-img-wrap {
            width: 86px;
            height: 86px;
        }
        .sb-products.sb-single .sb-product-img {
            width: 86px;
            height: 86px;
        }

        .sb-product-img-wrap {
            position: relative;
            flex-shrink: 0;
            width: 76px;
            height: 76px;
        }

        .sb-product-img {
            width: 76px;
            height: 76px;
            object-fit: cover;
            border-radius: 10px;
            border: 1px solid rgba(0,0,0,0.08);
            display: block;
            background: #f9f9f9;
        }

        .sb-product-badge {
            position: absolute;
            top: -6px; left: -6px;
            background: #ef4444;
            color: #fff;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 6px;
            border-radius: 8px;
            line-height: 1;
            box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
        }

        .sb-product-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .sb-product-name {
            font-size: 14px;
            font-weight: 600;
            color: #111;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.3;
        }

        .sb-product-prices {
            display: flex;
            flex-direction: row;
            align-items: baseline;
            gap: 6px;
        }

        .sb-price-crossed {
            font-size: 12px;
            font-weight: 500;
            text-decoration: line-through;
            opacity: 0.4;
        }

        .sb-price-current {
            font-size: 15px;
            font-weight: 800;
            color: #111;
        }

        .sb-btn-individual {
            flex-shrink: 0;
            padding: 8px 18px;
            border: none;
            border-radius: 24px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
        }
        .sb-btn-individual:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .sb-btn-individual:active:not(:disabled) { transform: scale(0.97); }
        .sb-btn-individual:disabled { opacity: 0.5; cursor: not-allowed; }


        .sb-separator {
            font-size: 20px;
            font-weight: 900;
            color: #d1d5db;
            flex-shrink: 0;
            align-self: center;
        }

        /* PRICING */
        .sb-pricing {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            background: #fafafa;
            border: 1px solid rgba(0,0,0,0.04);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
        }

        .sb-pricing-left { flex: 1; }

        .sb-price-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
        }
        .sb-price-row:last-child { margin-bottom: 0; }

        .sb-label { font-size: 12px; font-weight: 500; color: #666; }
        .sb-price-original { font-size: 13px; text-decoration: line-through; color: #a1a1aa; }
        .sb-price-final { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; }

        .sb-savings-badge {
            color: white;
            text-align: center;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 700;
            flex-shrink: 0;
            line-height: 1.4;
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
        }
        .sb-savings-badge strong { font-size: 16px; display: block; }

        /* CTA */
        .sb-cta {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 800;
            font-family: inherit;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            margin-bottom: 12px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .sb-cta:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
        .sb-cta:active:not(:disabled) { transform: translateY(0) scale(0.99); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .sb-cta:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        .sb-disclaimer {
            text-align: center;
            font-size: 12px;
            color: #888;
            font-weight: 500;
        }

        .sb-success {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            padding: 14px;
            text-align: center;
            font-size: 14px;
            font-weight: 700;
            color: #15803d;
        }
        .sb-success a { color: #16a34a; }

        /* MOBILE */
        @media (max-width: 600px) {
            #sb-combo-widget { padding: 20px; }
            .sb-products { gap: 0; }
            .sb-product-item { padding: 12px; gap: 12px; }
            .sb-product-img-wrap, .sb-product-img { width: 64px; height: 64px; }
            .sb-product-name { font-size: 13px; }
            .sb-price-current { font-size: 14px; }
            .sb-pricing { flex-direction: column; align-items: stretch; gap: 12px; }
            .sb-savings-badge { text-align: left; display: flex; align-items: center; justify-content: center; gap: 10px; }
            .sb-savings-badge strong { font-size: 18px; }
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

        // Encontrar estilo principal (usamos el default si no hay config de diseño)
        const gTheme = GLOBAL_CONFIG?.general?.theme || 'light';
        const isDark = gTheme === 'dark';

        // CSS Principal (Micro-animaciones y soporte temas)
        if (!document.getElementById('hache-offer-styles')) {
            const style = document.createElement('style');
            style.id = 'hache-offer-styles';
            style.innerHTML = `
                /* ANIMATIONS */
                @keyframes slideUpFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                
                /* BASE WRAPPER */
                .hache-smart-offer { margin: 16px 0; padding: 18px; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif; animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
                .hache-smart-offer:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); }
                .hache-smart-offer.in-minicart { margin: 12px 16px; }
                
                /* LIGHT THEME (Premium) */
                .hache-smart-offer.theme-light { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border: 1px solid rgba(0,0,0,0.08); }
                .hache-smart-offer.theme-light .hache-offer-title { color: #444; }
                .hache-smart-offer.theme-light .hache-offer-name { color: #111; }
                .hache-smart-offer.theme-light .hache-offer-price { color: #111; }
                .hache-smart-offer.theme-light .hache-offer-btn { background: #111; color: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
                .hache-smart-offer.theme-light .hache-offer-btn:hover { background: #000; box-shadow: 0 6px 14px rgba(0,0,0,0.2); }
                
                /* DARK THEME (Premium) */
                .hache-smart-offer.theme-dark { background: #111; border: 1px solid #222; box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
                .hache-smart-offer.theme-dark .hache-offer-title { color: #aaa; }
                .hache-smart-offer.theme-dark .hache-offer-name { color: #fff; }
                .hache-smart-offer.theme-dark .hache-offer-price { color: #fff; }
                .hache-smart-offer.theme-dark .hache-offer-btn { background: #fff; color: #111; box-shadow: 0 4px 10px rgba(255,255,255,0.1); }
                .hache-smart-offer.theme-dark .hache-offer-btn:hover { background: #f0f0f0; }
                
                /* GLOW THEME (Attention) */
                .hache-smart-offer.theme-glow { background: linear-gradient(145deg, #111, #1a1a2e); border: 1px solid transparent; background-clip: padding-box; position: relative; }
                .hache-smart-offer.theme-glow::before { content: ''; position: absolute; top: -2px; right: -2px; bottom: -2px; left: -2px; z-index: -1; border-radius: 18px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #ff6b6b); animation: borderGlow 4s ease infinite; background-size: 300% 300%; }
                .hache-smart-offer.theme-glow .hache-offer-title { color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
                .hache-smart-offer.theme-glow .hache-offer-name { color: #fff; }
                .hache-smart-offer.theme-glow .hache-offer-price { color: #4ecdc4; }
                .hache-smart-offer.theme-glow .hache-offer-btn { background: #fff; color: #1a1a2e; box-shadow: 0 4px 14px rgba(255,255,255,0.15); }
                
                @keyframes borderGlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

                /* INNER STRUCT */
                .hache-offer-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
                .hache-offer-row { display: flex; align-items: center; gap: 14px; }
                .hache-offer-img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 1px solid rgba(0,0,0,0.06); background: #f4f4f4; flex-shrink: 0; }
                .hache-offer-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
                .hache-offer-name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; }
                .hache-offer-price { font-size: 15px; font-weight: 900; }
                .hache-offer-btn { border: none; padding: 10px 18px; border-radius: 24px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); white-space: nowrap; font-family: inherit; }
                .hache-offer-btn:hover { transform: translateY(-1px); }
                .hache-offer-btn.adding { background: #9ca3af !important; color: #fff !important; cursor: wait; transform: scale(0.98); box-shadow: none !important; }
            `;
            document.head.appendChild(style);
        }

        const injectOffer = (offer, context, containerEl) => {
            const product = offer.offerProduct;
            if (!product || !product.id) return;

            const existing = document.getElementById('hache-offer-' + offer.id + '-' + context);
            if (existing) return;

            // Si el producto ya está en el carrito visible, no lo ofertes de vuelta
            if (containerEl.innerHTML && (containerEl.innerHTML.includes(product.id) || containerEl.innerHTML.includes(product.name))) return;

            const div = document.createElement('div');
            const offerTheme = offer.style || (isDark ? 'dark' : 'light');
            const offerDomId = 'hache-offer-' + offer.id + '-' + context;
            div.className = `hache-smart-offer theme-${offerTheme} ${context === 'minicart' ? 'in-minicart' : ''}`;
            div.id = offerDomId;

            let customCss = '';
            if (offerTheme === 'custom' && offer.colors) {
                div.style.background = offer.colors.bg || '#ffffff';
                div.style.border = `1px solid ${offer.colors.bg || '#ffffff'}`;
                customCss = `
                    <style>
                        #${offerDomId} .hache-offer-title { color: ${offer.colors.text || '#000'} !important; }
                        #${offerDomId} .hache-offer-name { color: ${offer.colors.text || '#000'} !important; }
                        #${offerDomId} .hache-offer-price { color: ${offer.colors.text || '#000'} !important; }
                        #${offerDomId} .hache-offer-btn { background: ${offer.colors.btnBg || '#000'} !important; color: ${offer.colors.btnText || '#fff'} !important; }
                    </style>
                `;
            }

            const titleIcon = offerTheme === 'glow' ? '✨' : '⚡';

            div.innerHTML = `
                ${customCss}
                <div class="hache-offer-title"><span>${titleIcon}</span> ${offer.title || 'COMPLETÁ TU RUTINA'}</div>
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
                // Intentar inyectar dentro del .modal-body del carrito de Tiendanube
                const modalBody = containerEl.querySelector('.modal-body, .js-ajax-cart-list, .cart-body');
                const submitBtn = containerEl.querySelector('.js-ajax-cart-submit, [data-component="cart.checkout-button"], .cart-footer');
                if (modalBody) modalBody.insertAdjacentElement('afterbegin', div);
                else if (submitBtn && submitBtn.parentNode) submitBtn.parentNode.insertBefore(div, submitBtn);
                else containerEl.appendChild(div);
            } else if (context === 'pdp') {
                containerEl.parentNode.insertBefore(div, containerEl.nextSibling);
            } else if (context === 'popup') {
                containerEl.appendChild(div);
            }

            const btn = div.querySelector('#btn-offer-' + offer.id);
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (btn.classList.contains('adding')) return;
                btn.classList.add('adding');
                btn.innerText = 'Agregando...';

                try {
                    // Agregar vía fetch AJAX (no navega a /comprar/)
                    const params = new URLSearchParams({ add_to_cart: product.id, quantity: 1 });
                    if (product.variant_id) params.append('variant_id', product.variant_id);

                    const resp = await fetch('/comprar/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: params.toString()
                    });

                    // Tiendanube responde JSON si X-Requested-With está presente
                    let data = null;
                    try { data = await resp.json(); } catch (_) { }

                    // Disparar evento nativo de TN para actualizar el mini-cart sin recargar página
                    document.dispatchEvent(new CustomEvent('cart:updated'));
                    if (window.jQuery) {
                        window.jQuery(document).trigger('added_to_cart');
                        window.jQuery(document).trigger('cart.loaded');
                    }

                    btn.classList.remove('adding');
                    btn.innerText = '✅ Agregado!';
                    setTimeout(() => { btn.innerText = 'Agregar'; }, 3000);

                } catch (err) {
                    console.error('[SalesBooster] Error agregando offer:', err);
                    btn.classList.remove('adding');
                    btn.innerText = 'Agregar';
                }
            });

        }; // ← cierre correcto de injectOffer


        const processMinicart = () => {
            // Buscar el modal real del carrito (NO el #ajax-cart que es el ícono del header)
            const CART_SELECTORS = [
                '#modal-cart',            // Modal principal de Tiendanube
                '.js-ajax-cart-panel',    // Panel form dentro del modal
                '.cart-sliding',          // Carro tipo drawer
                '[data-component="CartModal"]'
                // EXCLUIDO: #ajax-cart (es el ícono/contador del header, no el modal)
            ];

            let cartPanel = null;
            for (const sel of CART_SELECTORS) {
                const el = document.querySelector(sel);
                if (!el) continue;
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                // Debe estar visible Y tener suficiente altura para ser la modal real (>150px)
                const isRealModal = style.display !== 'none'
                    && style.visibility !== 'hidden'
                    && style.opacity !== '0'
                    && rect.width > 200
                    && rect.height > 150;
                if (isRealModal) { cartPanel = el; break; }
            }

            if (!cartPanel) return;

            offers.forEach(offer => {
                if (!offer.placements?.includes('minicart')) return;
                let show = true;
                if (offer.triggers && offer.triggers.length > 0) {
                    show = false;
                    try {
                        if (window.LS && window.LS.cart && window.LS.cart.items) {
                            for (const item of window.LS.cart.items) {
                                if (offer.triggers.includes(String(item.product_id))) { show = true; break; }
                            }
                        } else {
                            const html = cartPanel.innerHTML;
                            for (const t of offer.triggers) {
                                if (html.includes(String(t))) { show = true; break; }
                            }
                        }
                    } catch (e) { }
                }
                if (show) injectOffer(offer, 'minicart', cartPanel);
            });
        };

        const processPDP = () => {
            if (!IS_PDP) return;
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

        const processPopup = () => {
            offers.forEach(offer => {
                if (!offer.placements?.includes('popup')) return;
                if (!offer.offerProduct || !offer.offerProduct.id) return;
                // Popup solo debe mostrarse si se disparan los triggers o si no hay triggers
                let show = true;
                if (offer.triggers && offer.triggers.length > 0) {
                    show = false;
                    try {
                        if (window.LS && window.LS.cart && window.LS.cart.items) {
                            for (const item of window.LS.cart.items) {
                                if (offer.triggers.includes(String(item.product_id))) { show = true; break; }
                            }
                        }
                        if (!show) {
                            const html = document.body.innerHTML;
                            // Chequeo rapido en DOM si el producto gatillo existe en la pagina
                            for (const t of offer.triggers) {
                                if (html.includes(String(t))) { show = true; break; }
                            }
                        }
                    } catch (e) { }
                }

                if (show && !document.getElementById('hache-popup-wrap-' + offer.id)) {
                    // Prevenir que el popup se muestre cada vez que cambia algo (usar sessionStorage)
                    if (sessionStorage.getItem('hache_popup_seen_' + offer.id)) return;

                    const overlay = document.createElement('div');
                    overlay.id = 'hache-popup-wrap-' + offer.id;
                    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:999999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(3px);';

                    const popupBox = document.createElement('div');
                    popupBox.style.cssText = 'background:transparent; border:none; max-width:90%; position:relative;';

                    const closeBtn = document.createElement('div');
                    closeBtn.innerHTML = '✖';
                    closeBtn.style.cssText = 'position:absolute; top:-35px; right:0; color:#fff; font-size:24px; cursor:pointer; font-weight:bold;';
                    closeBtn.onclick = () => { overlay.remove(); sessionStorage.setItem('hache_popup_seen_' + offer.id, '1'); };

                    popupBox.appendChild(closeBtn);
                    overlay.appendChild(popupBox);
                    document.body.appendChild(overlay);

                    injectOffer(offer, 'popup', popupBox);
                }
            });
        };

        processPDP();
        processMinicart();

        // Retrasar el popup sutilmente para que no sea intrusivo al instante
        setTimeout(processPopup, 3000);

        const obs = new MutationObserver(() => {
            // Detectar cuando el modal REAL del carrito se abre (nunca usar #ajax-cart del header)
            const cartModalOpen = document.querySelector('#modal-cart.modal-show, #modal-cart.active, #modal-cart.open, .cart-sliding.active, .cart-sliding.open');
            if (cartModalOpen) {
                processMinicart();
            }
            processPopup();
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
                .hache-sbar-wrap.in-minicart { margin: 10px 15px; border-left: 0; border-right: 0; }
                .hache-sbar-txt { font-size: 13px; font-weight: 500; color: ${configBar.textColor || '#111'}; margin-bottom: 8px; text-align: center; }
                .hache-sbar-txt b { font-weight: 700; color: ${configBar.color || '#000'}; }
                .hache-sbar-track { width: 100%; height: 6px; background: #eee; border-radius: 10px; overflow: hidden; }
                .hache-sbar-fill { height: 100%; background: ${configBar.color || '#000'}; transition: width 0.4s ease; }
                .hache-sbar-success { color: ${configBar.successColor || '#10b981'}; font-weight: 700; }
        `;
            document.head.appendChild(style);
        }

        const threshold = configBar.threshold || 100000;

        const updateBar = () => {
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

            const stateKey = msg + '|' + pct;

            // Inyectar en minicart
            if (configBar.placements?.includes('minicart')) {
                const cartPanel = document.querySelector('.js-ajax-cart-panel, .js-ajax-cart-list, #modal-cart, .cart-sliding');
                if (cartPanel) {
                    let bar = document.getElementById('hache-sbar-minicart');
                    if (!bar) {
                        bar = document.createElement('div');
                        bar.id = 'hache-sbar-minicart';
                        bar.className = 'hache-sbar-wrap in-minicart';
                        bar.dataset.state = stateKey;
                        bar.innerHTML = `<div class="hache-sbar-txt">${msg}</div><div class="hache-sbar-track"><div class="hache-sbar-fill" style="width: ${pct}%"></div></div>`;
                        cartPanel.insertBefore(bar, cartPanel.firstChild);
                    } else if (bar.dataset.state !== stateKey) { // Sólo modificar si cambió
                        bar.dataset.state = stateKey;
                        bar.querySelector('.hache-sbar-txt').innerHTML = msg;
                        bar.querySelector('.hache-sbar-fill').style.width = pct + '%';
                    }
                }
            }

            // Inyectar en PDP
            if (IS_PDP && configBar.placements?.includes('pdp')) {
                const pdpContainer = document.querySelector('.js-product-form, #product_form, .product-buy-container');
                if (pdpContainer) {
                    let bar = document.getElementById('hache-sbar-pdp');
                    if (!bar) {
                        bar = document.createElement('div');
                        bar.id = 'hache-sbar-pdp';
                        bar.className = 'hache-sbar-wrap';
                        bar.dataset.state = stateKey;
                        bar.innerHTML = `<div class="hache-sbar-txt">${msg}</div><div class="hache-sbar-track"><div class="hache-sbar-fill" style="width: ${pct}%"></div></div>`;
                        pdpContainer.insertBefore(bar, pdpContainer.firstChild);
                    } else if (bar.dataset.state !== stateKey) { // Sólo modificar si cambió
                        bar.dataset.state = stateKey;
                        bar.querySelector('.hache-sbar-txt').innerHTML = msg;
                        bar.querySelector('.hache-sbar-fill').style.width = pct + '%';
                    }
                }
            }
        };

        updateBar();

        let isUpdating = false;
        const obs = new MutationObserver(() => {
            if (isUpdating) return;
            isUpdating = true;
            obs.disconnect(); // Desconectar antes de cambios
            updateBar();
            obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
            isUpdating = false;
        });
        obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    }

    // ─── REGALOS POR MONTO (GIFT BAR) ───
    function initCartGifts(configGifts) {
        if (!configGifts || !configGifts.enabled) return;

        const threshold = parseFloat(configGifts.threshold) || 0;
        const giftId = configGifts.giftProduct;
        if (!giftId || threshold <= 0) return;

        const injectStyles = () => {
            if (document.getElementById('hache-gift-styles')) return;
            const style = document.createElement('style');
            style.id = 'hache-gift-styles';
            style.innerHTML = `
                .hache-gift-wrap { margin-bottom: 20px; padding: 16px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .hache-gift-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
                .hache-gift-title { font-size: 13px; font-weight: 800; color: #92400e; display: flex; align-items: center; gap: 6px; }
                .hache-gift-track { height: 8px; background: #fef3c7; border-radius: 4px; overflow: hidden; position: relative; }
                .hache-gift-fill { height: 100%; background: #f59e0b; border-radius: 4px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); }
                .hache-gift-success { color: #b45309; font-weight: 900; animation: bounce 1s infinite; }
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
            `;
            document.head.appendChild(style);
        };

        const updateGiftBar = () => {
            let subtotal = 0;
            try {
                const el = document.querySelector('.js-cart-subtotal, .js-ajax-cart-total, .cart-total, [data-component="cart.subtotal-value"]');
                if (el) subtotal = parsePrice(el.innerText);
            } catch (e) { }

            const pct = Math.min((subtotal / threshold) * 100, 100);
            const isUnlocked = subtotal >= threshold;
            const faltante = threshold - subtotal;

            let msg = isUnlocked
                ? configGifts.msgSuccess || '🎁 ¡Regalo Desbloqueado!'
                : (configGifts.msgInitial || 'Te faltan {faltante} para tu regalo').replace('{faltante}', `<b>$${fmt(faltante)}</b>`);

            const stateKey = msg + '|' + pct;
            const cartPanel = document.querySelector('.js-ajax-cart-panel, .js-ajax-cart-list, #modal-cart, .cart-sliding');

            if (cartPanel) {
                injectStyles();
                let bar = document.getElementById('hache-gift-bar');
                if (!bar) {
                    bar = document.createElement('div');
                    bar.id = 'hache-gift-bar';
                    bar.className = 'hache-gift-wrap';
                    bar.innerHTML = `
                        <div class="hache-gift-header">
                            <div class="hache-gift-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>
                                <span class="hache-gift-msg">${msg}</span>
                            </div>
                        </div>
                        <div class="hache-gift-track"><div class="hache-gift-fill" style="width: ${pct}%"></div></div>
                    `;
                    cartPanel.insertBefore(bar, cartPanel.firstChild);
                } else if (bar.dataset.state !== stateKey) {
                    bar.dataset.state = stateKey;
                    bar.querySelector('.hache-gift-msg').innerHTML = msg;
                    bar.querySelector('.hache-gift-fill').style.width = pct + '%';
                    if (isUnlocked) bar.querySelector('.hache-gift-msg').classList.add('hache-gift-success');
                    else bar.querySelector('.hache-gift-msg').classList.remove('hache-gift-success');
                }
            }

            // Auto-Add Logic
            if (isUnlocked) {
                const isInCart = document.body.innerHTML.includes(giftId) || document.querySelector(`[data-product-id="${giftId}"]`);
                if (!isInCart && !window.hacheGiftAdding) {
                    window.hacheGiftAdding = true;
                    console.log('[HacheSuite] Auto-adding gift:', giftId);
                    const params = new URLSearchParams({ add_to_cart: giftId, quantity: 1 });
                    fetch(CONFIG.cartEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
                        body: params.toString()
                    }).then(() => {
                        window.location.reload(); // Recargar para mostrar el regalo
                    }).catch(() => { window.hacheGiftAdding = false; });
                }
            }
        };

        const obs = new MutationObserver(updateGiftBar);
        obs.observe(document.body, { childList: true, subtree: true, attributes: true });
        updateGiftBar();
    }

    // ─── BOOT ───
    async function boot() {
        const conf = await fetchConfig();
        if (!conf) return;

        // Toggles globales
        const modules = conf.modules || { offersEnabled: true, bundlesEnabled: true };

        // 1. Iniciar Ofertas Estratégicas
        if (modules.offersEnabled !== false && conf.smartOffers && conf.smartOffers.length > 0) {
            initSmartOffers(conf.smartOffers);
        }

        // 2. Iniciar Barra de Envíos
        if (conf.shippingBar && conf.shippingBar.enabled) {
            initShippingBar(conf.shippingBar);
        }

        // 3. Iniciar Regalos por Monto
        if (conf.cartGifts && conf.cartGifts.enabled) {
            initCartGifts(conf.cartGifts);
        }

        // 4. Iniciar Bundles (Solo en página de producto)
        if (modules.bundlesEnabled !== false && IS_PDP && conf.bundles) {
            initBundles(conf.bundles);
        }

        // 5. Flujo automático de Cupones (Cart page)
        handleCouponFlow();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
