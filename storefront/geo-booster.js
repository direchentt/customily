console.log("🚀 GeoBooster V1.0: Localized Urgency Engine");

const GeoBooster = {
    config: {
        api: 'https://ipapi.co/json/',
        storageKey: 'user_geo_data',
        daysToShip: 4, // Días promedio de envío
    },

    init: function () {
        this.data = this.loadData();
        if (this.data) {
            this.render();
        } else {
            this.fetchGeo();
        }

        // Listener para cambios de página (SPA/Infinite Scroll)
        // OBSERVER PARA INYECCIÓN DIFERIDA
        const observer = new MutationObserver((mutations) => {
            if (document.querySelector('.js-product-detail') || document.querySelector('.js-item-product')) {
                this.render();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    },

    loadData: function () {
        const stored = localStorage.getItem(this.config.storageKey);
        if (stored) return JSON.parse(stored);
        return null;
    },

    fetchGeo: function () {
        fetch(this.config.api)
            .then(res => res.json())
            .then(data => {
                if (data.city) {
                    this.data = {
                        city: data.city,
                        region: data.region,
                        country: data.country_name
                    };
                    localStorage.setItem(this.config.storageKey, JSON.stringify(this.data));
                    this.render();
                }
            })
            .catch(err => console.error("GeoBooster Error:", err));
    },

    getDeliveryDate: function () {
        const date = new Date();
        date.setDate(date.getDate() + this.config.daysToShip);
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return date.toLocaleDateString('es-ES', options);
    },

    render: function () {
        if (!this.data) return;

        // 1. PDP (Página de Producto) - Debajo del precio/título
        const pdps = document.querySelectorAll('.js-product-detail, #product-container');
        pdps.forEach(pdp => {
            if (pdp.dataset.geoBoosted) return;
            pdp.dataset.geoBoosted = "true";

            // Mensaje de Envío
            const msg = document.createElement('div');
            msg.className = 'geo-shipping-badge';
            msg.innerHTML = `
                <span class="geo-icon">🚚</span>
                <div>
                    <strong>Envío a <span class="geo-highlight">${this.data.city}</span></strong><br>
                    <span class="geo-sub">Llega estimado el <u>${this.getDeliveryDate()}</u></span>
                </div>
            `;

            // Insertar después del precio o título
            const target = pdp.querySelector('.price-container, .product-price, h1');
            if (target) target.parentNode.insertBefore(msg, target.nextSibling);

            // Social Proof (Fase 2)
            const social = document.createElement('div');
            social.className = 'geo-social-proof';
            const randomViewers = Math.floor(Math.random() * (12 - 4 + 1)) + 4; // Entre 4 y 12
            social.innerHTML = `🔥 <strong>${randomViewers} personas</strong> en <span class="geo-highlight">${this.data.region}</span> están viendo esto.`;

            const btn = pdp.querySelector('.js-addtocart, input[type="submit"]');
            if (btn) btn.parentNode.insertBefore(social, btn.nextSibling); // Debajo del botón
        });

        // 2. Listado de Productos (Grid) - Badge sutil
        const items = document.querySelectorAll('.js-item-product, .item-product');
        items.forEach(item => {
            if (item.dataset.geoBoosted) return;
            item.dataset.geoBoosted = "true";

            // Solo mostrar en 1 de cada 3 para no saturar
            if (Math.random() > 0.7) {
                const badge = document.createElement('div');
                badge.className = 'geo-grid-badge';
                badge.innerText = `🔥 Popular en ${this.data.city}`;

                // Intentar poner sobre la imagen
                const imgContainer = item.querySelector('.product-image-container, .image-container, a');
                if (imgContainer) {
                    imgContainer.style.position = 'relative';
                    imgContainer.appendChild(badge);
                }
            }
        });
    },

    // ESTILOS INYECTADOS
    injectStyles: function () {
        const css = `
            .geo-shipping-badge {
                display: flex; align-items: center; gap: 10px;
                background: #fdfdfd; border: 1px solid #eee; border-radius: 4px;
                padding: 10px 15px; margin: 15px 0;
                font-family: 'Helvetica Neue', sans-serif; font-size: 13px; color: #333;
                animation: fadeInGeo 0.5s ease-out;
            }
            .geo-icon { font-size: 20px; }
            .geo-highlight { color: #000; font-weight: 800; text-transform: uppercase; }
            .geo-sub { font-size: 11px; color: #666; }
            
            .geo-social-proof {
                font-size: 11px; color: #e74c3c; margin-top: 10px; text-align: center;
                display: block; width: 100%; font-weight: 500;
            }

            .geo-grid-badge {
                position: absolute; bottom: 10px; left: 10px;
                background: rgba(0,0,0,0.8); color: #fff;
                padding: 4px 8px; font-size: 10px; font-weight: 700;
                border-radius: 3px; z-index: 5; text-transform: uppercase;
                animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            @keyframes fadeInGeo { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `;
        const style = document.createElement('style');
        style.innerText = css;
        document.head.appendChild(style);
    }
};

// AUTO-START
GeoBooster.injectStyles();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => GeoBooster.init());
else GeoBooster.init();
