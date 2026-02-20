console.log("🚀 SalesBooster V2.1 DEBUG MODE: STARTING...");

const SalesBooster = {
    settings: {
        dbUrl: 'https://raw.githubusercontent.com/direchentt/customily/main/combos.json', // TU BASE DE DATOS
        discountLabel: 'PACK 10% OFF',
        triggerSelector: '.js-addtocart, input[type="submit"], .product-form',
        cacheKey: 'sb_combos_db_v2'
    },

    init: async function () {
        console.log("🕵️ SalesBooster: Searching for product context...");

        // 1. Obtener ID del Producto Actual (Múltiples métodos)
        const mainProduct = this.getMainProductData();

        if (!mainProduct) {
            console.warn("⚠️ SalesBooster: No product detected on this page.");
            return;
        }

        console.log("✅ Main Product Detected:", mainProduct);

        // 2. Obtener DB de Combos
        console.log("⬇️ Fetching Combos DB...");
        const db = await this.fetchCombosDB();
        console.log("📂 DB Loaded:", db);

        const partnerId = db[mainProduct.id];

        if (partnerId) {
            console.log(`✨ SalesBooster: MATCH FOUND! ${mainProduct.id} + ${partnerId}`);
            const partnerProduct = await this.fetchPartnerData(partnerId);
            if (partnerProduct) {
                this.renderComboWidget(mainProduct, partnerProduct);
            } else {
                console.error("❌ Partner Product Data Fetch Failed for ID:", partnerId);
            }
        } else {
            console.log("ℹ️ No combo defined for this product ID in DB.");
        }
    },

    getMainProductData: function () {
        // Method 1: Input Hidden (Standard Tiendanube)
        let idInput = document.querySelector('input[name="add_to_cart"]');
        let id = idInput ? idInput.value : null;

        // Method 2: Meta Tag (Facebook Pixel / OG)
        if (!id) {
            const metaId = document.querySelector('meta[property="product:retailer_item_id"]');
            if (metaId) id = metaId.content;
        }

        // Method 3: JSON-LD (Google Structured Data)
        if (!id) {
            const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
            jsonLd.forEach(script => {
                try {
                    const data = JSON.parse(script.innerText);
                    if (data['@type'] === 'Product' || data['@type'] === 'ProductGroup') {
                        id = data.sku || data.productID;
                    }
                } catch (e) { }
            });
        }

        // Method 4: Data Attribute in Body or Container
        if (!id) {
            const container = document.querySelector('.js-product-detail, .product-detail');
            if (container) id = container.getAttribute('data-product-id');
        }

        if (!id) return null;

        // Get basic info
        const imgEl = document.querySelector('.js-product-slide-link img, .js-main-image, #main-image, .swiper-slide-active img');
        const priceEl = document.querySelector('#price_display, .price-display, .js-price-display');
        const nameEl = document.querySelector('h1.product-name, h1, .product-name');

        return {
            id: String(id),
            img: imgEl ? imgEl.src : '',
            price: priceEl ? this.parsePrice(priceEl.innerText) : 0,
            name: nameEl ? nameEl.innerText : 'Producto'
        };
    },

    fetchCombosDB: async function () {
        try {
            const res = await fetch(this.settings.dbUrl + '?t=' + new Date().getTime());
            return await res.json();
        } catch (e) {
            console.error("SalesBooster DB Error:", e);
            return {};
        }
    },

    fetchPartnerData: async function (id) {
        try {
            console.log(`🔍 Searching partner data for ID: ${id}`);
            const searchRes = await fetch(`/search/?q=${id}`);
            const html = await searchRes.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');

            // Buscar item
            const item = doc.querySelector(`.js-item-product[data-product-id="${id}"], .item-product`);

            if (!item) {
                console.warn("⚠️ Partner not found in search results.");
                return null;
            }

            // Extract Data
            const name = item.querySelector('.item-name, .product-name, a[title]').innerText;
            let img = item.querySelector('img').getAttribute('src') || item.querySelector('img').getAttribute('data-src');
            if (img && img.startsWith('//')) img = 'https:' + img;
            const priceStr = item.querySelector('.item-price, .price').innerText;

            return {
                id: id,
                name: name,
                img: img,
                price: this.parsePrice(priceStr)
            };

        } catch (e) {
            console.error("Partner Data Error:", e);
            return null;
        }
    },

    renderComboWidget: function (main, partner) {
        console.log("🎨 Rendering Widget...");
        const total = main.price + partner.price;
        const discounted = Math.floor(total * 0.9);

        const widget = document.createElement('div');
        widget.className = 'sb-combo-widget';
        widget.innerHTML = `
            <div class="sb-header">🔥 COMPRADOS JUNTOS FRECUENTEMENTE</div>
            <div class="sb-body">
                <div class="sb-images">
                    <img src="${main.img}" class="sb-thumb">
                    <span class="sb-plus">+</span>
                    <img src="${partner.img}" class="sb-thumb">
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

        // Try multiple injection points
        const target = document.querySelector(this.settings.triggerSelector);
        if (target) {
            target.parentElement.insertBefore(widget, target.nextSibling);
            console.log("✅ Widget Injected successfully!");
        } else {
            console.error("❌ Could not find injection point (.js-addtocart or similar).");
        }

        widget.querySelector('.sb-btn').onclick = (e) => {
            e.preventDefault();
            this.addComboToCart(main.id, partner.id, e.target);
        };

        this.injectStyles();
    },

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
        return parseFloat(str.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
    },

    injectStyles: function () {
        if (document.getElementById('sb-styles')) return;
        const css = `
            .sb-combo-widget { margin: 25px 0; border: 2px dashed #e1e1e1; padding: 15px; border-radius: 8px; background: #fafafa; font-family: sans-serif; clear: both; }
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
        `;
        const s = document.createElement('style'); s.id = 'sb-styles'; s.innerText = css; document.head.appendChild(s);
    }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => SalesBooster.init());
else SalesBooster.init();
