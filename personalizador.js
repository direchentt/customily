console.log("🚀 Customily Evolution v3.1: Full DOM Control");

// INYECCIÓN DE ESTILOS CSS (Estilos Premium)
const styles = `
    /* Contenedor Principal */
    .custom-variant-container { 
        margin: 25px 0; 
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
    }
    
    /* Títulos de Variantes */
    .custom-variant-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    .custom-variant-title { 
        font-size: 13px; 
        font-weight: 700; 
        text-transform: uppercase; 
        color: #111; 
        letter-spacing: 0.5px; 
    }
    .custom-variant-selected {
        font-size: 13px;
        font-weight: 400;
        color: #666;
        text-transform: capitalize;
    }

    /* Grilla de Opciones */
    .custom-variant-grid { 
        display: flex; 
        flex-wrap: wrap; 
        gap: 10px; 
        margin-bottom: 24px; 
    }
    
    /* Botones Tipo PILL (Texto) */
    .custom-pill {
        padding: 10px 20px; 
        border: 1px solid #e0e0e0; 
        border-radius: 6px; 
        cursor: pointer; 
        background: #fff; 
        color: #333; 
        font-size: 14px; 
        font-weight: 500;
        transition: all 0.2s ease;
        min-width: 60px;
        text-align: center;
    }
    .custom-pill:hover { 
        border-color: #999; 
    }
    .custom-pill.active { 
        background: #111; 
        color: #fff; 
        border-color: #111; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    
    /* Botones Tipo SWATCH (Color) */
    .custom-swatch {
        width: 42px; 
        height: 42px; 
        border-radius: 50%; 
        cursor: pointer;
        border: 2px solid #fff; 
        box-shadow: 0 0 0 1px #ddd; 
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        position: relative;
    }
    .custom-swatch:hover { 
        transform: scale(1.1); 
        box-shadow: 0 0 0 1px #999;
    }
    .custom-swatch.active { 
        box-shadow: 0 0 0 2px #fff, 0 0 0 4px #111; /* Doble anillo */
        transform: scale(1.15); 
    }
    .custom-swatch.white-swatch { 
        background: #fff; 
        background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
        background-size: 10px 10px; /* Patrón ajedrez sutil para blanco */
    }

    /* Panel Texto Personalizado */
    .custom-text-panel {
        margin-top: 30px;
        padding: 20px;
        background: #f9f9f9;
        border-radius: 8px;
        border: 1px solid #eee;
    }
    .custom-input-text {
        width: 100%;
        padding: 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 16px;
        transition: border-color 0.2s;
    }
    .custom-input-text:focus {
        border-color: #111;
        outline: none;
    }

    /* Overlay Texto en Imagen */
    .custom-overlay-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-90deg);
        color: white;
        font-size: 40px; /* Base, responsivo */
        font-weight: 700;
        letter-spacing: 2px;
        text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        pointer-events: none;
        z-index: 100;
        font-family: 'Helvetica', sans-serif;
        text-transform: uppercase;
        white-space: nowrap;
    }

    /* Ajuste Móvil */
    @media (max-width: 480px) {
        .custom-pill { flex: 1; } 
        .custom-overlay-text { font-size: 24px; }
    }
`;

// Insertar Estilos
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// MAPA DE COLORES EXTENDIDO
const COLOR_MAP = {
    'negro': '#000000', 'black': '#000000', 'preto': '#000000',
    'blanco': '#ffffff', 'white': '#ffffff', 'branco': '#ffffff',
    'rojo': '#D32F2F', 'red': '#D32F2F', 'vermelho': '#D32F2F',
    'bordo': '#800000', 'burgundy': '#800000',
    'azul': '#1976D2', 'blue': '#1976D2', 'navy': '#0D47A1', 'celeste': '#81D4FA',
    'verde': '#388E3C', 'green': '#388E3C', 'mint': '#B2DFDB', 'oliva': '#556B2F',
    'rosa': '#E91E63', 'pink': '#E91E63', 'rose': '#FFCDD2', 'fucsia': '#FF00FF',
    'amarillo': '#FBC02D', 'yellow': '#FBC02D',
    'naranja': '#F57C00', 'orange': '#F57C00', 'coral': '#FF7F50',
    'gris': '#9E9E9E', 'grey': '#9E9E9E', 'silver': '#C0C0C0', 'plata': '#C0C0C0',
    'violeta': '#8E24AA', 'purple': '#8E24AA', 'lavender': '#E1BEE7', 'lila': '#D8BFD8',
    'marron': '#795548', 'brown': '#795548', 'beige': '#F5F5DC', 'camel': '#C19A6B',
    'crema': '#FFFDD0', 'cream': '#FFFDD0', 'nude': '#E3BC9A',
    'dorado': '#FFD700', 'gold': '#FFD700',
    'transparente': 'transparent', 'clear': 'transparent'
};

let activeText = "";

function initSystem() {
    if (!window.location.pathname.includes('/productos/')) return;

    // Buscar el contenedor original de variantes (Tiendanube suele usar .js-product-variants)
    const originalVariantContainer = document.querySelector('.js-product-variants, .product-variants');

    // Si no hay variantes, al menos dibujamos el personalizador de texto
    if (!originalVariantContainer) {
        initTextFieldOnly();
        return;
    }

    // Evitar duplicar nuestra UI
    if (document.getElementById('custom-ui-root')) return;

    console.log("🎨 Iniciando Transformación UI...");

    // Ocultar nativo (display none)
    // Importante: No removemos, solo ocultamos para que siga funcionando la lógica interna de TN
    originalVariantContainer.style.display = 'none';

    // También ocultar labels sueltos que suelen quedar arriba
    const looseLabels = originalVariantContainer.parentElement.querySelectorAll('label:not(.custom-label)');
    looseLabels.forEach(l => l.style.display = 'none');

    // Crear Contenedor Raíz
    const root = document.createElement('div');
    root.id = 'custom-ui-root';
    root.className = 'custom-variant-container';

    // Analizar los SELECTS originales
    const selects = originalVariantContainer.querySelectorAll('select');

    selects.forEach((select) => {
        const wrapper = document.createElement('div');

        // Obtener Nombre (Color, Talle, etc.)
        let labelText = "Opción";
        // Intentar leer el label asociado o data attributes
        const parentGroup = select.closest('.js-product-variants-group, .product-variants-group');
        if (parentGroup) {
            const lbl = parentGroup.querySelector('label');
            if (lbl) labelText = lbl.innerText.replace(':', '').trim();
        }

        // Header de la variante (Nombre + Selección actual)
        const header = document.createElement('div');
        header.className = 'custom-variant-header';

        const title = document.createElement('span');
        title.className = 'custom-variant-title';
        title.innerText = labelText;

        const selectedValueDisplay = document.createElement('span');
        selectedValueDisplay.className = 'custom-variant-selected';

        header.appendChild(title);
        header.appendChild(selectedValueDisplay);
        wrapper.appendChild(header);

        // Grid de Opciones
        const grid = document.createElement('div');
        grid.className = 'custom-variant-grid';

        // Detectar tipo (Color vs Texto)
        const isColorType = /color|cor|colour/i.test(labelText);

        // Iterar opciones del select
        Array.from(select.options).forEach(opt => {
            if (!opt.value) return; // Skip placeholders

            const val = opt.text.trim(); // Nombre visible (Rojo, S, M, XL)
            const cleanVal = val.split('(')[0].trim(); // Limpiar "(Sin Stock)"

            // Crear Botón
            const btn = document.createElement('div');
            btn.title = cleanVal;

            if (isColorType) {
                btn.className = 'custom-swatch';
                const hex = getHexColor(cleanVal);

                if (hex === 'transparent') {
                    btn.classList.add('white-swatch'); // Usar patrón ajedrez
                } else {
                    btn.style.backgroundColor = hex;
                    if (hex === '#ffffff') btn.classList.add('white-swatch'); // Borde sutil
                }
            } else {
                btn.className = 'custom-pill';
                btn.innerText = cleanVal;
            }

            // Estado Inicial: Activo si coincide con el select original
            if (select.value === opt.value) {
                btn.classList.add('active');
                selectedValueDisplay.innerText = cleanVal;
                updateProductImageOverlay(cleanVal); // Sincronizar overlay inicial
            }

            // Click Handler
            btn.addEventListener('click', () => {
                // 1. UI Update
                grid.querySelectorAll('.active').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedValueDisplay.innerText = cleanVal;

                // 2. Native Sync (Truco: Cambiar select y disparar evento)
                select.value = opt.value;
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);

                // 3. Re-sincronizar Overlay de Texto (Esperar cambio de foto TN)
                setTimeout(() => updateProductImageOverlay(), 400); // 400ms delay para dar tiempo a TN
            });

            grid.appendChild(btn);
        });

        wrapper.appendChild(grid);
        root.appendChild(wrapper);
    });

    // Añadir Panel de Texto Personalizado
    const textPanel = createTextPanel();
    root.appendChild(textPanel);

    // Insertar nuestra UI antes del container original
    originalVariantContainer.parentNode.insertBefore(root, originalVariantContainer);

    // Iniciar vigilancia
    startImageWatch();
}

function createTextPanel() {
    const p = document.createElement('div');
    p.className = 'custom-text-panel';

    const h = document.createElement('div');
    h.className = 'custom-variant-title';
    h.innerText = '✍️ PERSONALIZACIÓN (Opcional)';
    h.style.marginBottom = '10px';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'custom-input-text';
    input.placeholder = 'Escribe tu nombre... (Máx 12)';
    input.maxLength = 12;

    input.addEventListener('input', (e) => {
        activeText = e.target.value.toUpperCase();
        updateProductImageOverlay();
        syncWithCart(activeText);
    });

    p.appendChild(h);
    p.appendChild(input);
    return p;
}

function getHexColor(name) {
    const key = name.toLowerCase().replace(/\s/g, ''); // "Azul Marino" -> "azulmarino"
    // Búsqueda exacta primero
    if (COLOR_MAP[key]) return COLOR_MAP[key];

    // Búsqueda parcial (ej: "Rojo Intenso" busca "rojo")
    for (const k in COLOR_MAP) {
        if (key.includes(k)) return COLOR_MAP[k];
    }
    return '#eee'; // Gris fallback
}

// LÓGICA DE OVERLAY INTELIGENTE (PARÁSITO)
function updateProductImageOverlay() {
    const text = activeText || "TU NOMBRE";

    // Encontrar imagen visible (Activa)
    // TN suele usar slick-active o swiper-slide-active, o simplemente la img visible
    const images = document.querySelectorAll('.js-product-slide-img, .product-image-container img');
    let targetContainer = null;

    images.forEach(img => {
        // Truco: offsetParent no es null si es visible
        // Y asegurarnos que es lo suficientemente grande (no thumbnail)
        if (img.offsetParent !== null && img.clientWidth > 100) {
            targetContainer = img.parentElement;
        }
    });

    if (!targetContainer) return; // No encontramos imagen activa

    // Preparar contenedor
    if (getComputedStyle(targetContainer).position === 'static') {
        targetContainer.style.position = 'relative';
    }

    // Limpiar anterior
    const old = targetContainer.querySelector('.custom-overlay-text');
    if (old) old.remove();

    // Crear nuevo overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-overlay-text';
    overlay.innerText = text;

    // Visibilidad (si no escribió nada, mostrar semi-transparente como ejemplo)
    overlay.style.opacity = activeText ? '1' : '0.6';

    targetContainer.appendChild(overlay);
}

function syncWithCart(text) {
    // Buscar form de compra
    const form = document.querySelector('.js-product-form, .js-addtocart-form, form[action*="/cart/add"]');
    if (!form) return;

    let hidden = document.getElementById('custom-hidden-input');
    if (!hidden) {
        hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.id = 'custom-hidden-input';
        hidden.name = 'properties[Personalización]'; // Estándar Shopify/TN
        form.appendChild(hidden);
    }
    hidden.value = text;
}

function initTextFieldOnly() {
    // Fallback si no hay variantes: mostrar solo campo de texto
    const form = document.querySelector('.js-product-form');
    if (form && !document.getElementById('custom-ui-root')) {
        const root = document.createElement('div');
        root.id = 'custom-ui-root';
        root.appendChild(createTextPanel());
        form.insertBefore(root, form.querySelector('.js-addtocart'));
        startImageWatch();
    }
}

function startImageWatch() {
    // Vigilar cambios de imagen (clicks en thumbnails o flechas)
    setInterval(() => updateProductImageOverlay(), 800);
}

// ARRANQUE
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSystem);
} else {
    initSystem();
}
