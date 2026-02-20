console.log("🚀 Customily V8.0: CONTEXT-AWARE & PINPOINT ACCURACY");

// --- ESTILOS NATIVOS ---
const styles = `
    /* Contenedor Principal: Limpio y aislado */
    .custom-section-wrapper { 
        display: block !important; 
        width: 100% !important; 
        margin: 15px 0 25px 0 !important; 
        clear: both !important; 
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        position: relative; z-index: 10;
        background: #fff;
    }

    /* Botón Activador Estilo Acordeón */
    .custom-trigger-btn { 
        width: 100%; padding: 15px; 
        background: #fdfdfd; 
        border: 1px solid #e0e0e0; border-radius: 4px;
        color: #333; 
        font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; 
        cursor: pointer; display: flex; justify-content: space-between; align-items: center; 
        transition: all 0.2s ease;
    }
    .custom-trigger-btn:hover { background: #f4f4f4; border-color: #ccc; }
    .custom-trigger-btn.active { background: #222; color: #fff; border-color: #222; }

    /* Panel de Control */
    .custom-panel { 
        display: none; padding: 20px; 
        background: #fff; 
        border: 1px solid #e0e0e0; border-top: none; 
        border-radius: 0 0 4px 4px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.03);
    }
    .custom-panel.visible { display: block; animation: slideDown 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

    /* Inputs y Controles */
    .custom-label { display: block; font-size: 11px; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; color: #999; letter-spacing: 0.5px; }
    
    .custom-input { 
        width: 100%; padding: 10px; 
        border: 1px solid #ddd; border-radius: 3px;
        font-size: 14px; color: #333;
        box-sizing: border-box; margin-bottom: 15px;
        transition: border 0.2s;
    }
    .custom-input:focus { border-color: #000; outline: none; }

    .custom-row { display: flex; gap: 10px; align-items: center; margin-bottom: 20px; }
    
    .custom-color-input { 
        -webkit-appearance: none; border: none; width: 40px; height: 40px; padding: 0; 
        border-radius: 50%; overflow: hidden; cursor: pointer; box-shadow: 0 0 0 1px #ddd;
    }
    .custom-color-input::-webkit-color-swatch-wrapper { padding: 0; }
    .custom-color-input::-webkit-color-swatch { border: none; }
    
    .custom-select { 
        flex: 1; padding: 10px; 
        border: 1px solid #ddd; border-radius: 3px; 
        background-color: #fff; font-size: 14px; cursor: pointer; 
    }

    /* SLIDERS DE PRECISIÓN */
    .custom-slider-group { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .custom-icon { font-size: 16px; color: #ccc; width: 20px; text-align: center; }
    .custom-slider { 
        flex: 1; -webkit-appearance: none; height: 4px; background: #eee; border-radius: 2px; cursor: pointer; 
    }
    .custom-slider::-webkit-slider-thumb { 
        -webkit-appearance: none; width: 14px; height: 14px; 
        background: #000; border-radius: 50%; 
        box-shadow: 0 2px 5px rgba(0,0,0,0.2); 
        transition: transform 0.1s;
    }
    .custom-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }

    /* OVERLAY VISUAL SOBRE IMAGEN */
    .custom-overlay-host { position: relative !important; }
    .custom-text-layer {
        position: absolute; 
        pointer-events: none; /* Intocable, deja pasar clicks al zoom/slider */
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        white-space: nowrap; 
        font-weight: 700;
        text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000; /* Encima de todo */
        font-size: 24px;
        opacity: 0; transition: opacity 0.2s ease;
    }
    .custom-text-layer.active { opacity: 1; }
    
    /* Responsive Ajuste */
    @media (min-width: 768px) { .custom-text-layer { font-size: 30vw; } } /* Dinámico base */
    @media (min-width: 1024px) { .custom-text-layer { font-size: 36px; } } /* Fijo en desk */
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const FONTS = [
    { name: 'Moderna', val: 'Helvetica, Arial, sans-serif' },
    { name: 'Clásica', val: 'Times New Roman, serif' },
    { name: 'Manuscrita', val: 'Brush Script MT, cursive' },
    { name: 'Urbana', val: 'Courier New, monospace' },
    { name: 'Fuerte', val: 'Impact, sans-serif' }
];

// --- 1. INITIALIZER INTELIGENTE ---
function init() {
    // Busca formularios candidatos
    const forms = document.querySelectorAll('form[action*="/cart/add"], .js-product-form');
    forms.forEach(form => {
        // FILTRO DE CONTEXTO ESTRICTO
        if (isEligibleContext(form)) {
            mountCustomizer(form);
        }
    });
}

// DETERMINA SI EL FORMULARIO MERECE EL PERSONALIZADOR
function isEligibleContext(form) {
    // 1. Si ya lo tiene, no repetir
    if (form.dataset.customilyV8) return false;

    // 2. Buscar ancestros clave
    const parentContainer = form.closest(
        '.product-detail, #product-container, .js-product-detail, .modal, .quick-shop, .fancybox-content'
    );

    // 3. Buscar ancestros PROHIBIDOS (Tarjetas de listado)
    const isListingCard = form.closest(
        '.item, .product-item, .card, .product-grid-item, .span3, .span4, .col-item'
    );

    // REGLA DE ORO: Debe estar en un contenedor de detalle Y NO en una tarjeta de lista
    if (parentContainer && !isListingCard) return true;

    return false;
}

function mountCustomizer(form) {
    form.dataset.customilyV8 = "true";

    const state = { active: false, text: "", color: "#ffffff", font: FONTS[0].val, posX: 50, posY: 50 };

    // CONTAINER
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-section-wrapper';

    // TRIGGER
    const trigger = document.createElement('div');
    trigger.className = 'custom-trigger-btn';
    trigger.innerHTML = '<span>✨ Personalizar (+ $0)</span> <span>User Studio</span>';

    // PANEL
    const panel = document.createElement('div');
    panel.className = 'custom-panel';

    // UI ELEMENTS
    // Text
    panel.innerHTML += '<label class="custom-label">Tu Texto o Iniciales</label>';
    const input = document.createElement('input');
    input.className = 'custom-input';
    input.placeholder = 'Escribe aquí...';
    input.oninput = (e) => { state.text = e.target.value; updateSystem(form, state); };
    panel.appendChild(input);

    // Style
    panel.innerHTML += '<label class="custom-label">Estilo y Color</label>';
    const row = document.createElement('div'); row.className = 'custom-row';
    const colorP = document.createElement('input'); colorP.type = 'color'; colorP.className = 'custom-color-input'; colorP.value = state.color;
    colorP.oninput = (e) => { state.color = e.target.value; updateSystem(form, state); };
    const fontS = document.createElement('select'); fontS.className = 'custom-select';
    FONTS.forEach(f => {
        const o = document.createElement('option'); o.value = f.val; o.innerText = f.name; fontS.appendChild(o);
    });
    fontS.onchange = (e) => { state.font = e.target.value; updateSystem(form, state); };
    row.appendChild(colorP); row.appendChild(fontS);
    panel.appendChild(row);

    // Positioning Sliders
    panel.innerHTML += '<label class="custom-label">Posición Exacta</label>';

    // Sliders
    const createSlider = (icon, prop) => {
        const g = document.createElement('div'); g.className = 'custom-slider-group';
        g.innerHTML = `<span class="custom-icon">${icon}</span>`;
        const s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = 100; s.value = 50; s.className = 'custom-slider';
        s.oninput = (e) => { state[prop] = e.target.value; updateSystem(form, state); };
        g.appendChild(s);
        return g;
    };

    panel.appendChild(createSlider('↔', 'posX'));
    panel.appendChild(createSlider('↕', 'posY'));

    // Inject
    wrapper.appendChild(trigger);
    wrapper.appendChild(panel);

    // Toggle Logic
    trigger.onclick = () => {
        state.active = !state.active;
        panel.classList.toggle('visible');
        trigger.classList.toggle('active');
        if (state.active && !state.text) updateSystem(form, state, "TU TEXTO"); else updateSystem(form, state);
    };

    // --- PLACEMENT STRATEGY ---
    // Intentamos colocarlo ANTES del formulario para salir del flow de la tarjeta
    // Pero dentro del contenedor de detalles
    if (form.parentElement) form.parentElement.insertBefore(wrapper, form);
    else form.insertBefore(wrapper, form.firstChild);

    // NATIVE SUBMIT INTERCEPT
    setupSubmit(form, state);
}

function updateSystem(form, state, placeholder = "") {
    // 1. UPDATE VISUAL OVERLAY
    updateVisuals(form, state, placeholder);

    // 2. UPDATE HIDDEN FIELDS (Sync Realtime)
    const dataString = `${state.text} | Color: ${state.color} | Fuente: ${state.font.split(',')[0]} | Pos: ${state.posX}%,${state.posY}%`;

    // Property Field
    let propField = form.querySelector('input[name="properties[Personalizacion]"]');
    if (!propField) {
        propField = document.createElement('input'); propField.type = 'hidden'; propField.name = 'properties[Personalizacion]';
        form.appendChild(propField);
    }

    // Comment Field (Backup)
    let noteField = form.querySelector('input[name="comment"]');
    if (!noteField) {
        noteField = document.createElement('input'); noteField.type = 'hidden'; noteField.name = 'comment';
        form.appendChild(noteField);
    }

    if (state.active && state.text) {
        propField.value = dataString;
        noteField.value = dataString;
    } else {
        propField.value = "";
        noteField.value = "";
    }
}

function updateVisuals(form, state, placeholder = "") {
    // ENCONTRAR LA IMAGEN CORRECTA
    // Subimos hasta encontrar el contenedor del producto
    const container = form.closest('.product-detail, #product-container, .quick-shop-modal, .js-product-detail') || document.body;

    // Buscamos todas las imágenes GRANDES visibles
    const images = Array.from(container.querySelectorAll('img'));

    images.forEach(img => {
        // Criterio de "Imagen Principal": Grande y visible
        if (img.width > 200 && img.offsetParent !== null) {

            // Contenedor Inmediato (El que tiene position:relative a menudo)
            let host = img.parentElement;

            // Fix para contenedores con overflow hidden o position static
            if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
            host.classList.add('custom-overlay-host');

            // Buscar o Crear Capa de Texto
            let layer = host.querySelector('.custom-text-layer');
            if (!layer) {
                layer = document.createElement('div');
                layer.className = 'custom-text-layer';
                host.appendChild(layer);
            }

            // Aplicar Estilos
            const content = state.text || placeholder;
            layer.innerText = content;
            layer.style.color = state.color;
            layer.style.fontFamily = state.font;
            layer.style.left = state.posX + '%';
            layer.style.top = state.posY + '%';

            if (state.active && content) layer.classList.add('active');
            else layer.classList.remove('active');
        }
    });
}

function setupSubmit(form, state) {
    const btn = form.querySelector('.js-addtocart, input[type="submit"], button[type="submit"]');
    if (!btn) return;

    // Clonar para limpiar eventos sucios anteriores
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', (e) => {
        if (state.active && state.text) {
            e.preventDefault();
            // Feedback UI
            newBtn.innerText = "Agregando Personalización...";
            newBtn.style.opacity = 0.8;
            newBtn.disabled = true;

            // Submit Nativo (Los inputs hidden ya están sincronizados)
            setTimeout(() => {
                HTMLFormElement.prototype.submit.call(form);
            }, 200);
        } else {
            // Passthrough normal
            e.preventDefault();
            HTMLFormElement.prototype.submit.call(form);
        }
    });
}

// --- OBSERVER PARA QUICK SHOPS ---
// Vigila si se abren modales nuevos para inyectar el script al vuelo
const observer = new MutationObserver((mutations) => {
    let shouldInit = false;
    mutations.forEach(m => {
        if (m.addedNodes.length > 0) shouldInit = true;
    });
    if (shouldInit) init();
});

observer.observe(document.body, { childList: true, subtree: true });

// BOOT
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
setInterval(init, 3000); // Polling de seguridad (suave)
