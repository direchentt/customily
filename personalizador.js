console.log("🚀 Customily V4: Universal & Collapsible");

// INYECCIÓN DE ESTILOS CSS - ¡Premium Design!
const styles = `
    .custom-trigger-btn {
        width: 100%;
        padding: 12px;
        margin: 10px 0 20px 0;
        background: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 6px;
        color: #333;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s;
        font-family: 'Helvetica', sans-serif;
    }
    .custom-trigger-btn:hover { background: #e9ecef; }
    .custom-trigger-btn.active { background: #e3f2fd; border-color: #2196f3; color: #1976d2; }
    
    .custom-panel {
        display: none; /* Oculto por defecto */
        padding: 15px;
        background: #fff;
        border: 1px solid #e0e0e0;
        border-top: none;
        border-radius: 0 0 6px 6px;
        margin-top: -21px; /* Pegarlo al botón */
        margin-bottom: 20px;
        animation: slideDown 0.3s ease-out;
    }
    .custom-panel.visible { display: block; }

    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

    .custom-label { display: block; font-size: 12px; font-weight: bold; margin-bottom: 5px; color: #555; text-transform: uppercase; }
    .custom-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 12px; font-size: 16px; }
    
    .custom-options-row { display: flex; gap: 10px; margin-bottom: 12px; }
    .custom-color-circle { 
        width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid #fff; box-shadow: 0 0 0 1px #ddd; 
        transition: transform 0.2s;
    }
    .custom-color-circle:hover { transform: scale(1.1); }
    .custom-color-circle.active { transform: scale(1.2); box-shadow: 0 0 0 2px #fff, 0 0 0 4px #333; }

    .custom-font-pill {
        padding: 6px 12px; border: 1px solid #ddd; border-radius: 20px; cursor: pointer; font-size: 12px; background: #fff;
    }
    .custom-font-pill.active { background: #333; color: #fff; border-color: #333; }

    /* Overlay Estilos */
    .custom-overlay-text {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-90deg);
        color: white; font-size: 30px; font-weight: 700; pointer-events: none; z-index: 100;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5); white-space: nowrap;
    }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// CONFIGURACIÓN
const FONTS = [
    { name: 'Moderna', family: 'Helvetica, sans-serif' },
    { name: 'Clásica', family: 'Times New Roman, serif' },
    { name: 'Cursiva', family: 'Brush Script MT, cursive' }
];
const COLORS = [
    { name: 'Blanco', hex: '#FFFFFF' },
    { name: 'Negro', hex: '#000000' },
    { name: 'Dorado', hex: '#FFD700' },
    { name: 'Rosa', hex: '#FF69B4' }
];

// ESTADO GLOBAL (Por formulario, ya que puede haber varios en QuickView)
// Usaremos WeakMap para asociar estado a cada formulario
const formStates = new WeakMap();

function initObserver() {
    console.log("👀 Iniciando Observador Universal de Formularios...");

    // Configurar MutationObserver para detectar nuevos formularios (Popups, QuickView)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Solo elementos HTML
                        // Si el nodo es un form o contiene uno
                        const forms = node.matches?.('.js-product-form, form[action*="/cart/add"]')
                            ? [node]
                            : node.querySelectorAll?.('.js-product-form, form[action*="/cart/add"]');

                        forms?.forEach(injectApp);
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Inyectar en los que ya existen al cargar
    document.querySelectorAll('.js-product-form, form[action*="/cart/add"]').forEach(injectApp);
}

function injectApp(form) {
    if (form.dataset.customilyInjected) return; // Evitar duplicados
    form.dataset.customilyInjected = "true";

    console.log("✨ Inyectando Personalizador en:", form);

    // Estado inicial para este form
    const state = {
        active: false,
        text: "",
        color: COLORS[0].hex,
        font: FONTS[0].family
    };
    formStates.set(form, state);

    // 1. Crear Botón Desplegable
    const trigger = document.createElement('div');
    trigger.className = 'custom-trigger-btn';
    trigger.innerHTML = '<span>✨ Personalizar (+ $0)</span> <span style="font-size:10px">▼</span>';

    // 2. Crear Panel Oculto
    const panel = document.createElement('div');
    panel.className = 'custom-panel';

    // -- Contenido del Panel --

    // Input Texto
    const labelText = document.createElement('label');
    labelText.className = 'custom-label';
    labelText.innerText = "Tu Nombre / Frase:";
    panel.appendChild(labelText);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'custom-input';
    input.placeholder = 'Escribe aquí...';
    input.maxLength = 15;
    input.addEventListener('input', (e) => {
        state.text = e.target.value;
        updateOverlay(form, state);
    });
    panel.appendChild(input);

    // Selector Color
    const labelColor = document.createElement('label');
    labelColor.className = 'custom-label';
    labelColor.innerText = "Color del Texto:";
    panel.appendChild(labelColor);

    const colorGrid = document.createElement('div');
    colorGrid.className = 'custom-options-row';
    COLORS.forEach(c => {
        const circle = document.createElement('div');
        circle.className = 'custom-color-circle';
        circle.style.backgroundColor = c.hex;
        circle.title = c.name;
        if (c.hex === state.color) circle.classList.add('active');

        circle.addEventListener('click', () => {
            state.color = c.hex;
            colorGrid.querySelectorAll('.active').forEach(cl => cl.classList.remove('active'));
            circle.classList.add('active');
            updateOverlay(form, state);
        });
        colorGrid.appendChild(circle);
    });
    panel.appendChild(colorGrid);

    // Selector Fuente
    const labelFont = document.createElement('label');
    labelFont.className = 'custom-label';
    labelFont.innerText = "Tipografía:";
    panel.appendChild(labelFont);

    const fontRow = document.createElement('div');
    fontRow.className = 'custom-options-row';
    FONTS.forEach(f => {
        const pill = document.createElement('div');
        pill.className = 'custom-font-pill';
        pill.innerText = f.name;
        pill.style.fontFamily = f.family;
        if (f.family === state.font) pill.classList.add('active');

        pill.addEventListener('click', () => {
            state.font = f.family;
            fontRow.querySelectorAll('.active').forEach(pl => pl.classList.remove('active'));
            pill.classList.add('active');
            updateOverlay(form, state);
        });
        fontRow.appendChild(pill);
    });
    panel.appendChild(fontRow);

    // -- Lógica Desplegable --
    trigger.addEventListener('click', () => {
        state.active = !state.active;
        panel.classList.toggle('visible');
        trigger.classList.toggle('active');
        trigger.innerHTML = state.active
            ? '<span>✨ Personalizando...</span> <span style="font-size:10px">▲</span>'
            : '<span>✨ Personalizar (+ $0)</span> <span style="font-size:10px">▼</span>';

        // Si cierra, limpiamos visualmente (opcional)
        // updateOverlay(form, state); 
    });

    // Insertar en Formulario (Antes del botón agregar)
    const addToCartBtn = form.querySelector('.js-addtocart, input[type="submit"], button[type="submit"]');
    if (addToCartBtn) {
        form.insertBefore(trigger, addToCartBtn);
        form.insertBefore(panel, addToCartBtn);

        // Hijack del botón para enviar datos
        hijackSubmit(form, addToCartBtn, state);
    }
}

function updateOverlay(form, state) {
    if (!state.text && !state.active) return; // Si no hay nada, no mostrar

    // Buscar la imagen del producto asociada a ESTE formulario
    // En QuickView, la imagen suele estar en un contenedor hermano o padre cercano
    // Estrategia: Buscar hacia arriba el contenedor del producto (.product-container) y bajar a la imagen
    const productContainer = form.closest('.js-product-container, .product-container, .quick-shop-modal');
    let imgContainer = null;

    if (productContainer) {
        // Intentar encontrar la imagen activa dentro de este contenedor
        const img = productContainer.querySelector('.js-product-slide-img, .swiper-slide-active img, .product-image-container img');
        if (img) imgContainer = img.parentElement;
    } else {
        // Fallback global (Page Product)
        const img = document.querySelector('.js-product-slide-img, .product-image-container img');
        if (img) imgContainer = img.parentElement;
    }

    if (imgContainer) {
        if (getComputedStyle(imgContainer).position === 'static') imgContainer.style.position = 'relative';

        let overlay = imgContainer.querySelector('.custom-overlay-text');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'custom-overlay-text';
            imgContainer.appendChild(overlay);
        }

        // Actualizar estilos
        overlay.innerText = state.text || (state.active ? "TU TEXTO" : "");
        overlay.style.color = state.color;
        overlay.style.fontFamily = state.font;
        overlay.style.opacity = state.active ? '1' : '0'; // Ocultar si cerró panel
    }
}

function hijackSubmit(form, btn, state) {
    // Clonar para limpiar listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', (e) => {
        e.preventDefault();

        const originalText = newBtn.value || newBtn.innerText;
        newBtn.disabled = true;
        if (newBtn.tagName === 'INPUT') newBtn.value = "Procesando..."; else newBtn.innerText = "Procesando...";

        const formData = new FormData(form);

        // SOLO enviar personalización si el panel estaba abierto y activo
        if (state.active && state.text) {
            console.log("🎁 Enviando Personalización:", state);
            const dataString = `${state.text} | Color: ${getColorName(state.color)} | Fuente: ${getFontName(state.font)}`;
            formData.set('properties[Personalizacion]', dataString);
        }

        // Enviar AJAX
        fetch(form.action || '/cart/add', {
            method: 'POST', body: formData, headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
            .then(res => {
                if (res.ok) window.location.href = '/cart';
                else throw new Error("Error backend");
            })
            .catch(err => {
                console.error("Fallback Submit", err);
                // Si falla AJAX, inyectar input hidden y submit normal
                if (state.active && state.text) {
                    const hidden = document.createElement('input');
                    hidden.type = 'hidden';
                    hidden.name = 'properties[Personalizacion]';
                    hidden.value = `${state.text} | Color: ${getColorName(state.color)}`;
                    form.appendChild(hidden);
                }
                form.submit();
            });
    });
}

function getColorName(hex) {
    const c = COLORS.find(x => x.hex === hex);
    return c ? c.name : hex;
}
function getFontName(family) {
    const f = FONTS.find(x => x.family === family);
    return f ? f.name : "Standard";
}

// Iniciar
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initObserver);
else initObserver();
