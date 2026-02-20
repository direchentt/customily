console.log("🚀 SalesBooster V5.0 AJAX + COUPON: STARTING...");

const SalesBooster = {
    settings: {
        dbUrl: 'https://raw.githubusercontent.com/direchentt/customily/main/combos.json',
        discountLabel: 'PACK 10% OFF',
        couponCode: 'PACK10', // ASEGÚRATE DE CREAR ESTE CUPÓN EN TIENDANUBE
        triggerSelectors: ['.js-product-form', '#product_form', '.js-addtocart', '.product-buy-container'],
        cacheKey: 'sb_combos_db_v5'
    },

    init: async function () {
        // ... (Init igual a V4) ...
        const mainProduct = this.getMainProductData();
        if (!mainProduct) return;
        const db = await this.fetchCombosDB();
        let partnerData = db[mainProduct.id];
        if (partnerData && typeof partnerData !== 'string') {
            this.renderComboWidget(mainProduct, partnerData);
        }
    },

    getMainProductData: function () {
        // ... (Lógica igual a V4) ...
        let idInput = document.querySelector('input[name="add_to_cart"]');
        let id = idInput ? idInput.value : null;

        if (!id) {
            const metaId = document.querySelector('meta[property="product:retailer_item_id"]');
            if (metaId) id = metaId.content;
        }

        if (!id) {
            const container = document.querySelector('.js-product-detail, .product-detail');
            if (container) id = container.getAttribute('data-product-id');
        }

        if (!id) return null;

        const imgEl = document.querySelector('.js-product-slide-link img, .js-main-image, #main-image, .swiper-slide-active img');
        const priceEl = document.querySelector('#price_display, .price-display, .js-price-display');

        return {
            id: String(id),
            img: imgEl ? imgEl.src : '',
            price: priceEl ? this.parsePrice(priceEl.innerText) : 0,
            name: document.querySelector('.js-product-name, h1')?.innerText || 'Producto'
        };
    },

    fetchCombosDB: async function () {
        try {
            const res = await fetch(this.settings.dbUrl + '?t=' + new Date().getTime());
            return await res.json();
        } catch (e) { return {}; }
    },

    renderComboWidget: function (main, partner) {
        // ... (HTML del Widget igual a V4) ...
        const mainPrice = main.price;
        const partnerPrice = typeof partner.price === 'string' ? this.parsePrice(partner.price) : partner.price;
        const total = mainPrice + partnerPrice;
        const discounted = Math.floor(total * 0.9);

        const widget = document.createElement('div');
        widget.className = 'sb-combo-widget';
        widget.innerHTML = `
            <div class="sb-header">🔥 COMPRADOS JUNTOS FRECUENTEMENTE</div>
            <div class="sb-body">
                <div class="sb-images">
                    <img src="${main.img}" class="sb-thumb">
                    <span class="sb-plus">+</span>
                    <img src="${partner.image || partner.img}" class="sb-thumb">
                </div>
                <div class="sb-details">
                    <div class="sb-partner-title">Llevate también: <strong>${partner.name}</strong></div>
                    <div class="sb-prices">
                        <span class="sb-old">$${total.toLocaleString('es-AR')}</span>
                        <span class="sb-new">$${discounted.toLocaleString('es-AR')}</span>
                        <span class="sb-tag">${this.settings.discountLabel}</span>
                    </div>
                </div>
            </div>
            <button class="sb-btn">AGREGAR PACK AL CARRITO 🛒</button>
            <div class="sb-msg" style="display:none;font-size:11px;color:#666;margin-top:5px;">Agregando productos...</div>
        `;

        // INYECCIÓN ROBUSTA
        let injected = false;
        for (const selector of this.settings.triggerSelectors) {
            const target = document.querySelector(selector);
            if (target) {
                target.parentElement.insertBefore(widget, target.nextSibling);
                injected = true;
                break;
            }
        }
        if (!injected) {
            const fallback = document.querySelector('.js-product-detail') || document.body;
            fallback.appendChild(widget);
        }

        // EVENT LISTENER
        widget.querySelector('.sb-btn').onclick = (e) => {
            e.preventDefault();
            this.addComboToCart(main.id, partner.id, widget);
        };

        this.injectStyles();
    },

    addComboToCart: async function (id1, id2, widget) {
        const btn = widget.querySelector('.sb-btn');
        const msg = widget.querySelector('.sb-msg');

        btn.disabled = true;
        btn.style.opacity = 0.5;
        msg.innerText = "Agregando pack...";
        msg.style.display = 'block';

        try {
            // 1. Agregar Producto Main
            await fetch('/comprar/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ add_to_cart: id1, quantity: 1 })
            });

            // 2. Agregar Partner
            await fetch('/comprar/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ add_to_cart: id2, quantity: 1 })
            });

            msg.innerText = "¡Listo! Redirigiendo...";

            // 3. Redirigir INTELIGENTE (Detecta idioma/país)
            // Intentar usar LS.cart primero si existe
            if (window.LS && window.LS.cart && window.LS.cart.show) {
                window.LS.cart.show(); // Abrir carrito lateral si el tema lo soporta
                btn.disabled = false;
                btn.style.opacity = 1;
                msg.style.display = 'none';
            } else {
                // Redirigir a checkout aplicando cupón si es posible
                window.location.href = `/checkout/v3/start?coupon=${this.settings.couponCode}`;
            }

        } catch (e) {
            console.error("Cart Error:", e);
            msg.innerText = "Error agregando. Intenta manualmente.";
            // Fallback a redirección simple
            window.location.href = '/checkout';
        }
    },

    parsePrice: function (str) {
        if (typeof str !== 'string') return str;
        return parseFloat(str.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
    },

    injectStyles: function () {
        if (document.getElementById('sb-styles')) return;
        const css = `
            .sb-combo-widget { margin: 25px 0; border: 2px dashed #27ae60; padding: 15px; border-radius: 8px; background: #f9fffb; font-family: sans-serif; clear: both; width: 100%; box-sizing: border-box; }
            .sb-header { font-size: 13px; font-weight: 800; color: #27ae60; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .sb-body { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
            .sb-images { display: flex; align-items: center; gap: 8px; }
            .sb-thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; background: #fff; }
            .sb-plus { color: #999; font-weight: bold; font-size: 18px; }
            .sb-details { flex: 1; }
            .sb-partner-title { font-size: 13px; color: #555; margin-bottom: 4px; line-height: 1.3; }
            .sb-prices { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
            .sb-old { text-decoration: line-through; color: #aaa; font-size: 12px; }
            .sb-new { font-weight: 700; color: #27ae60; font-size: 16px; }
            .sb-tag { background: #27ae60; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
            .sb-btn { width: 100%; border: none; background: #27ae60; color: #fff; padding: 12px; font-weight: 700; text-transform: uppercase; cursor: pointer; border-radius: 4px; transition: opacity 0.2s; box-shadow: 0 4px 6px rgba(39, 174, 96, 0.2); }
            .sb-btn:hover { opacity: 0.9; transform: translateY(-1px); }
            
            @media (max-width: 480px) {
                .sb-body { flex-direction: column; align-items: flex-start; }
            }
        `;
        const s = document.createElement('style'); s.id = 'sb-styles'; s.innerText = css; document.head.appendChild(s);
    }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => SalesBooster.init());
else SalesBooster.init();
