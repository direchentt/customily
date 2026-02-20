console.log("🚀 SalesBooster V7.0 VARIANT-AWARE: STARTING...");

const SalesBooster = {
    settings: {
        dbUrl: 'https://raw.githubusercontent.com/direchentt/customily/main/combos.json',
        triggerSelectors: ['.js-product-form', '#product_form', '.js-addtocart', '.product-buy-container']
    },

    init: async function () {
        const mainProduct = this.getMainProductData();
        if (!mainProduct) { console.log("ℹ️ No product page detected."); return; }

        const db = await this.fetchCombosDB();
        const partnerData = db[mainProduct.id];

        if (partnerData && typeof partnerData === 'object') {
            console.log("✨ SalesBooster: Match found!", partnerData);
            this.renderComboWidget(mainProduct, partnerData);
        } else {
            console.log("ℹ️ No combo for product", mainProduct.id);
        }
    },

    getMainProductData: function () {
        // Obtener ID del producto
        let id = null;

        const addToCartInput = document.querySelector('input[name="add_to_cart"]');
        if (addToCartInput) id = addToCartInput.value;

        if (!id) {
            const meta = document.querySelector('meta[property="product:retailer_item_id"]');
            if (meta) id = meta.content;
        }

        if (!id) return null;

        // ⚠️ Obtener variant_id del formulario nativo (CLAVE del fix)
        const variantInput = document.querySelector('input[name="variant_id"], select[name="variant_id"]');
        const variantId = variantInput ? variantInput.value : null;

        const imgEl = document.querySelector('.js-product-slide-link img, .js-main-image, .swiper-slide-active img');
        const priceEl = document.querySelector('#price_display, .price-display, .js-price-display');

        return {
            id: String(id),
            variantId: variantId,
            img: imgEl ? imgEl.src : '',
            price: priceEl ? this.parsePrice(priceEl.innerText) : 0
        };
    },

    fetchCombosDB: async function () {
        try {
            const res = await fetch(this.settings.dbUrl + '?t=' + Date.now());
            return await res.json();
        } catch (e) { console.error("DB Error:", e); return {}; }
    },

    renderComboWidget: function (main, partner) {
        const partnerPrice = this.parsePrice(String(partner.price));
        const total = main.price + partnerPrice;

        const widget = document.createElement('div');
        widget.className = 'sb-combo-widget';
        widget.innerHTML = `
            <div class="sb-header">🔥 MEJOR JUNTOS</div>
            <div class="sb-body">
                <div class="sb-images">
                    <div class="sb-img-wrap">
                        <img src="${main.img}" class="sb-thumb">
                        <span class="sb-this">Este</span>
                    </div>
                    <span class="sb-plus">+</span>
                    <div class="sb-img-wrap">
                        <img src="${partner.image}" class="sb-thumb">
                        <span class="sb-partner-tag">+ Este</span>
                    </div>
                </div>
                <div class="sb-details">
                    <div class="sb-partner-name">${partner.name}</div>
                    <div class="sb-price-row">
                        <span class="sb-total-label">Subtotal Pack:</span>
                        <span class="sb-total">$${total.toLocaleString('es-AR')}</span>
                    </div>
                </div>
            </div>
            <button class="sb-btn" id="sb-add-btn">
                <span class="sb-btn-text">➕ AGREGAR PACK AL CARRITO</span>
                <span class="sb-btn-loading" style="display:none">⏳ Sumando...</span>
            </button>
            <div class="sb-success" style="display:none">✅ ¡Pack agregado! <a href="/cart">Ver carrito →</a></div>
        `;

        // Inyección multi-selector
        let injected = false;
        for (const sel of this.settings.triggerSelectors) {
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

        widget.querySelector('#sb-add-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.addComboToCart(main, partner, widget);
        });

        this.injectStyles();
    },

    addComboToCart: async function (main, partner, widget) {
        const btn = widget.querySelector('#sb-add-btn');
        const textEl = widget.querySelector('.sb-btn-text');
        const loadEl = widget.querySelector('.sb-btn-loading');
        const successEl = widget.querySelector('.sb-success');

        btn.disabled = true;
        textEl.style.display = 'none';
        loadEl.style.display = 'inline';

        try {
            // Re-leer variant_id actualizado (puede cambiar si el usuario seleccionó una variante)
            const variantInput = document.querySelector('input[name="variant_id"], select[name="variant_id"]');
            const currentVariantId = variantInput ? variantInput.value : main.variantId;

            // POST #1: Producto principal con variant_id correcto
            const payload1 = new URLSearchParams({ add_to_cart: main.id, quantity: 1 });
            if (currentVariantId) payload1.append('variant_id', currentVariantId);
            await fetch('/comprar/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: payload1.toString()
            });

            // POST #2: Producto compañero (usar su propio ID como add_to_cart)
            const payload2 = new URLSearchParams({ add_to_cart: partner.id, quantity: 1 });
            await fetch('/comprar/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: payload2.toString()
            });

            // Éxito: Mostrar confirmación y abrir carrito nativo
            loadEl.style.display = 'none';
            successEl.style.display = 'block';
            btn.style.display = 'none';

            // Intentar abrir carrito lateral nativo de Tiendanube
            const cartTrigger = document.querySelector('.js-modal-open[data-target="fullscreen-cart"], .js-modal-open.js-fullscreen-modal-open');
            if (cartTrigger) {
                setTimeout(() => cartTrigger.click(), 400);
            }

        } catch (e) {
            console.error("Cart Error:", e);
            loadEl.style.display = 'none';
            textEl.style.display = 'inline';
            textEl.innerText = '⚠️ Error. Intenta de nuevo.';
            btn.disabled = false;
        }
    },

    parsePrice: function (str) {
        if (typeof str === 'number') return str;
        return parseFloat(str.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
    },

    injectStyles: function () {
        if (document.getElementById('sb-styles')) return;
        const css = `
            .sb-combo-widget {
                margin: 20px 0;
                padding: 16px;
                border: 1.5px solid #e5e7eb;
                border-radius: 10px;
                background: #fff;
                font-family: sans-serif;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                clear: both;
                box-sizing: border-box;
            }
            .sb-header {
                font-size: 12px;
                font-weight: 800;
                color: #111;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 14px;
            }
            .sb-body { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
            .sb-images { display: flex; align-items: center; gap: 8px; }
            .sb-img-wrap { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; }
            .sb-thumb { width: 65px; height: 65px; object-fit: cover; border-radius: 6px; border: 1px solid #eee; }
            .sb-this, .sb-partner-tag { font-size: 9px; color: #888; font-weight: 600; text-transform: uppercase; }
            .sb-partner-tag { color: #16a34a; }
            .sb-plus { font-size: 22px; font-weight: 900; color: #d1d5db; }
            .sb-details { flex: 1; }
            .sb-partner-name { font-size: 13px; font-weight: 600; color: #111; margin-bottom: 6px; }
            .sb-price-row { display: flex; align-items: center; gap: 8px; }
            .sb-total-label { font-size: 12px; color: #6b7280; }
            .sb-total { font-size: 16px; font-weight: 700; color: #111; }
            .sb-btn {
                width: 100%;
                padding: 12px;
                background: #111;
                color: #fff;
                border: none;
                border-radius: 6px;
                font-weight: 700;
                font-size: 13px;
                text-transform: uppercase;
                cursor: pointer;
                letter-spacing: 0.5px;
                transition: background 0.2s;
            }
            .sb-btn:hover:not(:disabled) { background: #374151; }
            .sb-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            .sb-success {
                text-align: center;
                padding: 10px;
                background: #f0fdf4;
                border-radius: 6px;
                font-size: 13px;
                color: #16a34a;
                font-weight: 600;
            }
            .sb-success a { color: #16a34a; text-decoration: underline; }
        `;
        const s = document.createElement('style');
        s.id = 'sb-styles';
        s.textContent = css;
        document.head.appendChild(s);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SalesBooster.init());
} else {
    SalesBooster.init();
}
