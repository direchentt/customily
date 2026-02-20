console.log("🚀 SalesBooster V4.0 MULTI-INJECTOR: STARTING...");

const SalesBooster = {
    settings: {
        dbUrl: 'https://raw.githubusercontent.com/direchentt/customily/main/combos.json',
        discountLabel: 'PACK 10% OFF',
        // Aumentamos los selectores para asegurar inyección
        triggerSelectors: [
            '.js-product-form',  // Prioridad 1: Después del form completo
            '#product_form',     // Prioridad 2: ID del form
            '.js-addtocart',    // Prioridad 3: Botón
            '.product-buy-container',
            '.js-product-buy-container'
        ],
        cacheKey: 'sb_combos_db_v4'
    },

    init: async function () {
        // ... (Mismo código de inicialización V3) ...
        console.log("🕵️ SalesBooster V4: Searching context...");

        const mainProduct = this.getMainProductData();
        if (!mainProduct) return;

        const db = await this.fetchCombosDB();
        let partnerData = db[mainProduct.id];

        if (partnerData) {
            if (typeof partnerData === 'string') {
                console.warn("⚠️ Legacy Combo Format detected.");
            } else {
                console.log("✨ SalesBooster: INSTANT MATCH!", partnerData);
                this.renderComboWidget(mainProduct, partnerData);
            }
        } else {
            console.log("ℹ️ No combo config found for", mainProduct.id);
        }
    },

    getMainProductData: function () {
        // ... (Misma lógica robusta de V3) ...
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
            price: priceEl ? this.parsePrice(priceEl.innerText) : 0
        };
    },

    fetchCombosDB: async function () {
        try {
            const res = await fetch(this.settings.dbUrl + '?t=' + new Date().getTime());
            return await res.json();
        } catch (e) { return {}; }
    },

    renderComboWidget: function (main, partner) {
        console.log("🎨 Rendering Widget V4...");

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
        `;

        // INYECCIÓN MULTI-SELECTOR
        let injected = false;
        for (const selector of this.settings.triggerSelectors) {
            const target = document.querySelector(selector);
            if (target) {
                console.log(`✅ Injecting after: ${selector}`);
                target.parentElement.insertBefore(widget, target.nextSibling);
                injected = true;
                break; // Stop after first successful injection
            }
        }

        if (!injected) {
            console.error("❌ CRITICAL: No injection point found in PDP.");
            // Fallback: Append to body or product detail container
            const fallback = document.querySelector('.js-product-detail') || document.body;
            fallback.appendChild(widget);
            console.log("⚠️ Used fallback injection.");
        }

        widget.querySelector('.sb-btn').onclick = (e) => {
            e.preventDefault();
            this.addComboToCart(main.id, partner.id, e.target);
        };

        this.injectStyles();
    },

    // ... (Métodos addComboToCart, parsePrice, injectStyles iguales a V3) ...
    addComboToCart: async function (id1, id2, btn) {
        btn.innerText = "Agregando..."; btn.style.opacity = 0.7;
        try {
            await fetch('/cart/add', { method: 'POST', body: new URLSearchParams({ add_to_cart: id1, quantity: 1 }) });
            await fetch('/cart/add', { method: 'POST', body: new URLSearchParams({ add_to_cart: id2, quantity: 1 }) });
            window.location.href = '/cart';
        } catch (e) {
            alert("Error al agregar combo.");
            btn.innerText = "Error";
        }
    },

    parsePrice: function (str) {
        if (typeof str !== 'string') return str;
        return parseFloat(str.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
    },

    injectStyles: function () {
        if (document.getElementById('sb-styles')) return;
        const css = `
            .sb-combo-widget { margin: 25px 0; border: 2px dashed #e1e1e1; padding: 15px; border-radius: 8px; background: #fafafa; font-family: sans-serif; clear: both; width: 100%; box-sizing: border-box; }
            .sb-header { font-size: 13px; font-weight: 800; color: #333; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
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
            .sb-btn { width: 100%; border: none; background: #222; color: #fff; padding: 12px; font-weight: 700; text-transform: uppercase; cursor: pointer; border-radius: 4px; transition: opacity 0.2s; }
            .sb-btn:hover { opacity: 0.9; }
            
            @media (max-width: 480px) {
                .sb-body { flex-direction: column; align-items: flex-start; }
                .sb-thumb { width: 50px; height: 50px; }
            }
        `;
        const s = document.createElement('style'); s.id = 'sb-styles'; s.innerText = css; document.head.appendChild(s);
    }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => SalesBooster.init());
else SalesBooster.init();
