console.log("🚀 SalesBooster V2.0: Backend-less Combo Engine (GitHub DB)");

const SalesBooster = {
    settings: {
        dbUrl: 'https://raw.githubusercontent.com/direchentt/customily/main/combos.json', // TU BASE DE DATOS
        discountLabel: 'PACK 10% OFF',
        triggerSelector: '.js-addtocart, input[type="submit"]',
        cacheKey: 'sb_combos_db'
    },

    init: async function () {
        if (!document.querySelector('form[action*="/cart/add"]')) return;

        // 1. Obtener ID del Producto Actual
        const mainProduct = this.getMainProductData();
        if (!mainProduct) return;

        // 2. Obtener DB de Combos (con Caché simple)
        const db = await this.fetchCombosDB();
        const partnerId = db[mainProduct.id];

        if (partnerId) {
            console.log(`✨ SalesBooster: Combo encontrado! ${mainProduct.id} + ${partnerId}`);
            const partnerProduct = await this.fetchPartnerData(partnerId);
            if (partnerProduct) {
                this.renderComboWidget(mainProduct, partnerProduct);
            }
        }
    },

    getMainProductData: function () {
        const img = document.querySelector('.js-product-slide-link img, .js-main-image, #main-image');
        const priceEl = document.querySelector('#price_display, .price-display, .js-price-display');
        const form = document.querySelector('form[action*="/cart/add"]');
        const idInput = form ? form.querySelector('input[name="add_to_cart"]') : null;

        if (!img || !priceEl || !idInput) return null;

        return {
            id: idInput.value,
            img: img.src,
            price: this.parsePrice(priceEl.innerText),
            name: document.querySelector('h1').innerText
        };
    },

    fetchCombosDB: async function () {
        // Cache simple en SessionStorage para no saturar GitHub
        const cached = sessionStorage.getItem(this.settings.cacheKey);
        if (cached) return JSON.parse(cached);

        try {
            const res = await fetch(this.settings.dbUrl + '?t=' + new Date().getTime()); // Anti-cache query
            const data = await res.json();
            sessionStorage.setItem(this.settings.cacheKey, JSON.stringify(data));
            return data;
        } catch (e) {
            console.error("SalesBooster DB Error:", e);
            return {};
        }
    },

    fetchPartnerData: async function (id) {
        // Truco: Usar la búsqueda interna o endpoint de producto si existe
        // En Tiendanube, a veces /productos/ID redirige o carga.
        // Si no, necesitamos la URL. Como solo tenemos ID, intentaremos buscarlo en la tienda.
        // ESTRATEGIA: Buscar en la API de búsqueda de Tiendanube (generalmente /search/?q=ID)

        try {
            // Opción A: Intentar fetchear el HTML de producto si supiéramos la URL.
            // Opción B: Usar endpoint de búsqueda.
            // Vamos a intentar obtener info via store API no documentada o búsqueda.
            const searchRes = await fetch(`/search/?q=${id}`);
            const html = await searchRes.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');

            // Buscar el item en resultados (asumiendo que sale primero por ID exacto)
            const item = doc.querySelector(`.js-item-product[data-product-id="${id}"], .item-product`);

            if (!item) return null;

            const name = item.querySelector('.item-name, .product-name, a[title]').innerText;
            const img = item.querySelector('img').src; // Puede ser thumb
            const priceStr = item.querySelector('.item-price, .price').innerText;
            const url = item.querySelector('a').href;

            return {
                id: id,
                name: name,
                img: img,
                price: this.parsePrice(priceStr),
                url: url
            };

        } catch (e) {
            console.error("Partner Data Error:", e);
            return null;
        }
    },

    renderComboWidget: function (main, partner) {
        const total = main.price + partner.price;
        const discounted = Math.floor(total * 0.9); // Simulamos 10% OFF

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

        const target = document.querySelector(this.settings.triggerSelector);
        if (target) target.parentElement.insertBefore(widget, target.nextSibling);

        widget.querySelector('.sb-btn').onclick = (e) => {
            e.preventDefault();
            this.addComboToCart(main.id, partner.id, e.target);
        };

        this.injectStyles();
    },

    addComboToCart: async function (id1, id2, btn) {
        btn.innerText = "Agregando..."; btn.disabled = true;
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
        const css = `
            .sb-combo-widget { margin: 25px 0; border: 2px dashed #e1e1e1; padding: 15px; border-radius: 8px; background: #fafafa; font-family: sans-serif; }
            .sb-header { font-size: 13px; font-weight: 800; color: #333; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .sb-body { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
            .sb-images { display: flex; align-items: center; gap: 8px; }
            .sb-thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; background: #fff; }
            .sb-plus { color: #999; font-weight: bold; font-size: 18px; }
            .sb-details { flex: 1; }
            .sb-partner-title { font-size: 13px; color: #555; margin-bottom: 4px; line-height: 1.3; }
            .sb-prices { display: flex; align-items: center; gap: 8px; }
            .sb-old { text-decoration: line-through; color: #aaa; font-size: 12px; }
            .sb-new { font-weight: 700; color: #27ae60; font-size: 16px; }
            .sb-tag { background: #27ae60; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
            .sb-btn { width: 100%; border: none; background: #222; color: #fff; padding: 12px; font-weight: 700; text-transform: uppercase; cursor: pointer; border-radius: 4px; transition: opacity 0.2s; }
            .sb-btn:hover { opacity: 0.9; }
        `;
        const s = document.createElement('style'); s.innerText = css; document.head.appendChild(s);
    }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => SalesBooster.init());
else SalesBooster.init();
