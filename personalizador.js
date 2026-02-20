console.log("🚀 Personalizador v2: Iniciando búsqueda agresiva...");

const SELECTOR_IMAGEN = '.js-product-slide-img, .product-image-container img, .swiper-slide-active img, .js-product-slide-link img';

function aplicarPersonalizador() {
    // Verificar si estamos en una página de producto
    if (!window.location.pathname.includes('/productos/')) return;

    const imagen = document.querySelector(SELECTOR_IMAGEN);

    if (imagen && !imagen.dataset.personalizado) {
        console.log("✅ Imagen encontrada:", imagen);

        // Marcar para no repetir
        imagen.dataset.personalizado = "true";

        // Borde Más Grueso y visible
        imagen.style.border = "10px solid #00ff00";
        imagen.style.boxSizing = "border-box";
        imagen.style.filter = "sepia(1)";

        // Crear etiqueta visible
        const badge = document.createElement('div');
        badge.innerText = "✨ PERSONALIZABLE";
        badge.style.position = "absolute";
        badge.style.top = "20px";
        badge.style.left = "20px";
        badge.style.backgroundColor = "#ff0080";
        badge.style.color = "white";
        badge.style.padding = "10px 20px";
        badge.style.zIndex = "9999";
        badge.style.fontSize = "16px";
        badge.style.fontWeight = "bold";
        badge.style.borderRadius = "8px";
        badge.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";
        badge.style.pointerEvents = "none"; // Para que no interfiera con clicks

        // Asegurar que el padre tenga posición relativa para que el absolute funcione
        if (imagen.parentElement) {
            imagen.parentElement.style.position = "relative";
            imagen.parentElement.appendChild(badge);
        } else {
            // Si no tiene padre directo útil, lo insertamos antes de la imagen
            imagen.parentNode.insertBefore(badge, imagen);
        }

    } else if (!imagen) {
        console.log("⏳ Buscando imagen del producto...");
    }
}

// Intentar cada 500ms durante 10 segundos (Fuerza Bruta) para asegurar carga
let intentos = 0;
const intervalo = setInterval(() => {
    aplicarPersonalizador();
    intentos++;
    if (intentos > 20) {
        clearInterval(intervalo); // Parar después de 10s
        console.log("🏁 Fin de intentos de búsqueda de imagen.");
    }
}, 500);

// También intentar inmediatamente
aplicarPersonalizador();
