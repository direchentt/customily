console.log("🚀 SalesBooster V6.0 PURE COMBO: STARTING...");

const SalesBooster = {
    settings: {
        dbUrl: 'https://raw.githubusercontent.com/direchentt/customily/main/combos.json',
        discountLabel: 'AHORRA EN PACK',
        triggerSelectors: ['.js-product-form', '#product_form', '.js-addtocart', '.product-buy-container'],
        cacheKey: 'sb_combos_db_v6'
    },

    init: async function () {
        const mainProduct = this.getMainProductData();
        if (!mainProduct) return;
        const db = await this.fetchCombosDB();
        let partnerData = db[mainProduct.id];
        if (partnerData && typeof partnerData !== 'string') {
            this.renderComboWidget(mainProduct, partnerData);
        }
    },

    getMainProductData: function () {
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
        console.log("🎨 Rendering Pure Widget...", partner);

        const mainPrice = main.price;
        const partnerPrice = typeof partner.price === 'string' ? this.parsePrice(partner.price) : partner.price;
        const total = mainPrice + partnerPrice;

        // No prometemos un precio exacto, prometemos "PACK"
        // El precio tachado es la suma real.

        const widget = document.createElement('div');
        widget.className = 'sb-combo-widget';
        widget.innerHTML = `
            <div class="sb-header">🔥 MEJOR JUNTOS</div>
            <div class="sb-body">
                <div class="sb-images">
                    <img src="${main.img}" class="sb-thumb">
                    <span class="sb-plus">+</span>
                    <img src="${partner.image || partner.img}" class="sb-thumb">
                </div>
                <div class="sb-details">
                    <div class="sb-partner-title">Agrega también: <strong>${partner.name}</strong></div>
                    <div class="sb-prices">
                        <span class="sb-old">$${total.toLocaleString('es-AR')}</span>
                        <span class="sb-tag">${this.settings.discountLabel}</span>
                    </div>
                </div>
            </div>
            <button class="sb-btn">AGREGAR PACK AL CARRITO 🛒</button>
            <div class="sb-msg" style="display:none;font-size:11px;color:#666;margin-top:5px;">Procesando...</div>
        `;

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
        msg.innerText = "Sumando productos...";
        msg.style.display = 'block';

        try {
            const formData1 = new FormData(); formData1.append('add_to_cart', id1); formData1.append('quantity', 1);
            const formData2 = new FormData(); formData2.append('add_to_cart', id2); formData2.append('quantity', 1);

            // Usamos fetch secuencial para asegurar orden
            await fetch('/comprar/', { method: 'POST', body: formData1 });
            await fetch('/comprar/', { method: 'POST', body: formData2 });

            msg.innerText = "¡Hecho! Abriendo carrito...";

            // Intentar abrir carrito lateral (AJAX)
            if (window.LS && window.LS.cart && window.LS.cart.show) {
                // Pequeño delay para asegurar que TIendanube actualizó el estado
                setTimeout(() => {
                    window.LS.cart.show();
                    btn.disabled = false;
                    btn.style.opacity = 1;
                    msg.style.display = 'none';
                }, 500);
            } else {
                // Fallback clásico
                window.location.href = '/carrito';
            }

        } catch (e) {
            console.error("Cart Error:", e);
            window.location.href = '/carrito';
        }
    },

    parsePrice: function (str) {
        if (typeof str !== 'string') return str;
        return parseFloat(str.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
    },

    injectStyles: function () {
        if (document.getElementById('sb-styles')) return;
        const css = `
            .sb-combo-widget { margin: 25px 0; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fff; font-family: sans-serif; clear: both; width: 100%; box-sizing: border-box; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
            .sb-header { font-size: 13px; font-weight: 800; color: #333; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .sb-body { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
            .sb-images { display: flex; align-items: center; gap: 8px; }
            .sb-thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #eee; background: #fff; }
            .sb-plus { color: #999; font-weight: bold; font-size: 18px; }
            .sb-details { flex: 1; }
            .sb-partner-title { font-size: 13px; color: #555; margin-bottom: 4px; line-height: 1.3; }
            .sb-prices { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
            .sb-old { color: #333; font-weight: bold; font-size: 14px; }
            .sb-tag { background: #000; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }
            .sb-btn { width: 100%; border: none; background: #000; color: #fff; padding: 12px; font-weight: 700; text-transform: uppercase; cursor: pointer; border-radius: 4px; transition: opacity 0.2s; }
            .sb-btn:hover { opacity: 0.8; }
            
            @media (max-width: 480px) {
                .sb-body { flex-direction: column; align-items: flex-start; }
            }
        `;
        const s = document.createElement('style'); s.id = 'sb-styles'; s.innerText = css; document.head.appendChild(s);
    }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => SalesBooster.init());
else SalesBooster.init();
