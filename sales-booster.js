// SalesBooster V8.0 — Fri Feb 20 01:32:41 -03 2026
// SalesBooster V8.0 — Multi-Product | Discount Engine | Smart Logic
// https://github.com/direchentt/customily

(function () {
    'use strict';

    const CONFIG = {
        dbUrl: 'https://raw.githubusercontent.com/direchentt/customily/main/combos.json',
        cartEndpoint: '/comprar/',
        cartTriggerSelector: '.js-modal-open[href*="cart"], .js-modal-open.js-fullscreen-modal-open, [data-target="fullscreen-cart"]',
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
        const products = combo.products || [];
        if (products.length === 0) return;

        const discount = parseInt(combo.discount) || 0;
        const totalPack = products.reduce((s, p) => s + parsePrice(p.price), main.price);
        const discountedTotal = Math.floor(totalPack * (1 - discount / 100));
        const savings = totalPack - discountedTotal;

        const widget = document.createElement('div');
        widget.className = 'sb-widget';
        widget.id = 'sb-combo-widget';

        widget.innerHTML = `
            ${combo.badge ? `<div class="sb-badge">${combo.badge}</div>` : ''}
            <div class="sb-title">${combo.label || '🔥 MEJOR JUNTOS'}</div>

            <div class="sb-products">
                <div class="sb-product-item">
                    <img src="${main.img}" alt="${main.name}" class="sb-product-img" />
                    <div class="sb-product-name">${main.name}</div>
                    <div class="sb-product-price">$${fmt(main.price)}</div>
                </div>

                ${products.map(p => `
                    <div class="sb-separator">+</div>
                    <div class="sb-product-item">
                        <img src="${p.image}" alt="${p.name}" class="sb-product-img" />
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
                <span class="sb-cta-text">🛒 AGREGAR PACK AL CARRITO</span>
                <span class="sb-cta-loading" style="display:none">⏳ Agregando...</span>
            </button>
            <div class="sb-disclaimer">Ambos productos se agregan al carrito.</div>
            <div class="sb-success" style="display:none">
                ✅ ¡Pack agregado! — <a href="/cart">Ver carrito →</a>
            </div>
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

        // CTA Handler
        widget.querySelector('#sb-cta-btn').addEventListener('click', function (e) {
            e.preventDefault();
            addComboToCart(main, products, widget);
        });

        injectStyles();
    }

    // ─── ADD TO CART ───
    async function addComboToCart(main, partners, widget) {
        const btn = widget.querySelector('#sb-cta-btn');
        const textEl = widget.querySelector('.sb-cta-text');
        const loadEl = widget.querySelector('.sb-cta-loading');
        const successEl = widget.querySelector('.sb-success');
        const disclaimer = widget.querySelector('.sb-disclaimer');

        btn.disabled = true;
        textEl.style.display = 'none';
        loadEl.style.display = 'inline';

        try {
            // Leer variant_id más reciente (puede cambiar si el usuario cambia variante)
            const variantInput = document.querySelector('input[name="variant_id"], select[name="variant_id"]');
            const variantId = variantInput ? variantInput.value : main.variantId;

            // 1. Agregar producto principal
            const payload1 = new URLSearchParams({ add_to_cart: main.id, quantity: 1 });
            if (variantId) payload1.append('variant_id', variantId);
            await fetch(CONFIG.cartEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: payload1.toString()
            });

            // 2. Agregar productos del pack
            for (const p of partners) {
                const payload = new URLSearchParams({ add_to_cart: p.id, quantity: 1 });
                await fetch(CONFIG.cartEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: payload.toString()
                });
            }

            // Éxito
            loadEl.style.display = 'none';
            btn.style.display = 'none';
            disclaimer.style.display = 'none';
            successEl.style.display = 'block';

            // Intentar abrir carrito lateral nativo
            const cartTrigger = document.querySelector(CONFIG.cartTriggerSelector);
            if (cartTrigger) {
                setTimeout(() => cartTrigger.click(), 400);
            }

        } catch (e) {
            console.error('[SalesBooster] Cart Error:', e);
            loadEl.style.display = 'none';
            textEl.style.display = 'inline';
            textEl.textContent = '⚠️ Error al agregar. Intenta de nuevo.';
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

    // ─── BOOT ───
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
