console.log("🚀 SalesBooster V1.0: Dynamic Combo Engine");

const SalesBooster = {
    settings: {
        discountLabel: '10% OFF', // Visual only unless coupon applied
        triggerSelector: '.js-product-detail, #product-container', // Donde inyectar
        relatedSelector: '.js-related-product, .related-item, .item-product', // Donde buscar compañero
    },

    init: function () {
        if (!document.querySelector('form[action*="/cart/add"]')) return; // Solo en PDP

        // 1. Encontrar Candidato Cross-Sell
        const mainProduct = this.getMainProductData();
        const partner = this.findPartnerProduct();

        if (mainProduct && partner) {
            this.renderComboWidget(mainProduct, partner);
        }
    },

    getMainProductData: function () {
        // Datos del producto actual
        const img = document.querySelector('.js-product-slide-link img, .js-main-image, #main-image');
        const priceEl = document.querySelector('#price_display, .price-display');
        const form = document.querySelector('form[action*="/cart/add"]');
        const idInput = form ? form.querySelector('input[name="add_to_cart"]') : null;

        if (!img || !priceEl || !idInput) return null;

        return {
            id: idInput.value,
            img: img.src,
            price: this.parsePrice(priceEl.innerText),
            form: form // Necesario para variantes
        };
    },

    findPartnerProduct: function () {
        // Buscar productos relacionados en el DOM
        const related = document.querySelector(this.settings.relatedSelector);
        if (!related) return null;

        const img = related.querySelector('img');
        const name = related.querySelector('.item-name, .product-name, h3, a');
        const price = related.querySelector('.item-price, .price');
        const link = related.querySelector('a'); // Necesitamos sacar el ID de la URL o data-attr

        if (!img || !name || !price || !link) return null;

        // Intentar obtener ID desde el enlace o data attribute
        // Esto es un hack común: sacar ID de la URL /productos/nombre-id123/
        // O buscar un input hidden si existe
        // Para V1 usaremos el enlace para hacer un fetch rápido y sacar el ID real si es necesario
        // O asumimos que es un producto simple por ahora.

        return {
            element: related,
            name: name.innerText,
            img: img.src,
            price: this.parsePrice(price.innerText),
            url: link.href
        };
    },

    renderComboWidget: function (main, partner) {
        // CALCULOS
        const total = main.price + partner.price;
        const discounted = Math.floor(total * 0.9); // 10% simulado visual

        // UI
        const widget = document.createElement('div');
        widget.className = 'sb-combo-widget';
        widget.innerHTML = `
            <div class="sb-header">🔥 Comprados Juntos Frecuentemente</div>
            <div class="sb-visual">
                <div class="sb-img-box"><img src="${main.img}"></div>
                <div class="sb-plus">+</div>
                <div class="sb-img-box"><img src="${partner.img}"></div>
            </div>
            <div class="sb-info">
                <div class="sb-partner-name">Llevate también: <strong>${partner.name}</strong></div>
                <div class="sb-pricing">
                    <span class="sb-total-price">$${total.toLocaleString('es-AR')}</span>
                    <span class="sb-deal-price">$${discounted.toLocaleString('es-AR')}</span>
                    <span class="sb-badge">${this.settings.discountLabel}</span>
                </div>
                <button class="sb-add-btn">AGREGAR PACK AL CARRITO 🛒</button>
            </div>
        `;

        // INJECT
        const target = document.querySelector('.js-addtocart, input[type="submit"]');
        if (target) target.parentNode.insertBefore(widget, target.nextSibling);

        // LOGIC
        widget.querySelector('.sb-add-btn').onclick = (e) => {
            e.preventDefault();
            this.addComboToCart(main, partner, e.target);
        };

        this.injectStyles();
    },

    addComboToCart: async function (main, partner, btn) {
        btn.innerText = "⏳ Procesando...";
        btn.disabled = true;

        // Fetch ID real del partner si no lo tenemos
        let partnerId = partner.id;
        if (!partnerId) {
            try {
                const res = await fetch(partner.url);
                const html = await res.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const form = doc.querySelector('form[action*="/cart/add"]');
                partnerId = form.querySelector('input[name="add_to_cart"]').value;
            } catch (e) {
                console.error("Error fetching partner ID", e);
                btn.innerText = "Error ❌";
                return;
            }
        }

        // Add Main + Partner
        try {
            // Asumimos API standard de Tiendanube /cart/add
            // 1. Main
            await fetch('/cart/add', {
                method: 'POST',
                body: new URLSearchParams({ add_to_cart: main.id, quantity: 1 }),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            // 2. Partner
            await fetch('/cart/add', {
                method: 'POST',
                body: new URLSearchParams({ add_to_cart: partnerId, quantity: 1 }),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            // Redirect to Cart
            window.location.href = '/cart';

        } catch (err) {
            console.error(err);
            btn.innerText = "Error 😓";
            alert("No se pudo agregar el combo. Intenta manualmente.");
        }
    },

    parsePrice: function (str) {
        // Limpiar "$ 1.500,00" -> 1500
        return parseFloat(str.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
    },

    injectStyles: function () {
        const css = `
            .sb-combo-widget {
                background: #f9f9f9; border: 2px dashed #333;
                border-radius: 8px; padding: 15px; margin: 20px 0;
                font-family: 'Helvetica Neue', sans-serif;
            }
            .sb-header { font-weight: 800; text-transform: uppercase; margin-bottom: 10px; color: #333; font-size: 12px; letter-spacing: 1px; }
            .sb-visual { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px; }
            .sb-img-box { width: 60px; height: 60px; background: #fff; border-radius: 4px; overflow: hidden; border: 1px solid #ddd; }
            .sb-img-box img { width: 100%; height: 100%; object-fit: cover; }
            .sb-plus { font-size: 20px; font-weight: bold; color: #888; }
            .sb-info { text-align: center; }
            .sb-partner-name { font-size: 12px; margin-bottom: 5px; color: #555; }
            .sb-pricing { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px; }
            .sb-total-price { text-decoration: line-through; color: #999; font-size: 12px; }
            .sb-deal-price { font-weight: 800; font-size: 16px; color: #222; }
            .sb-badge { background: #222; color: #fff; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 3px; }
            .sb-add-btn {
                width: 100%; background: #27ae60; color: #fff; border: none; padding: 12px;
                font-weight: 700; text-transform: uppercase; cursor: pointer; border-radius: 4px;
                transition: background 0.2s;
            }
            .sb-add-btn:hover { background: #219150; }
        `;
        const s = document.createElement('style'); s.innerText = css; document.head.appendChild(s);
    }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => SalesBooster.init());
else SalesBooster.init();
