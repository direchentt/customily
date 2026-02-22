console.log("🚀 Customily V9.0: SURGICAL PRECISION & BLACKLIST");

// --- ESTILOS ---
const styles = `
    /* BLOQUE PRINCIPAL */
    .custom-section-wrapper { 
        display: block !important; 
        width: 100% !important; 
        margin: 15px 0 25px 0 !important; 
        clear: both !important; 
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        position: relative; z-index: 20;
        background: #fff;
    }

    /* BOTÓN */
    .custom-trigger-btn { 
        width: 100%; padding: 15px; 
        background: #fcfcfc; border: 1px solid #ddd; 
        color: #222; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; 
        cursor: pointer; display: flex; justify-content: space-between; align-items: center; 
        transition: all 0.2s;
    }
    .custom-trigger-btn:hover { background: #f0f0f0; border-color: #ccc; }
    .custom-trigger-btn.active { background: #000; color: #fff; border-color: #000; }

    /* PANEL */
    .custom-panel { 
        display: none; padding: 20px; 
        background: #fff; border: 1px solid #ddd; border-top: none; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .custom-panel.visible { display: block; animation: activePanel 0.3s ease; }
    @keyframes activePanel { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

    /* CONTROLES */
    .custom-label { display: block; font-size: 11px; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
    .custom-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 2px; font-size: 14px; box-sizing: border-box; margin-bottom: 20px; }
    .custom-input:focus { border-color: #000; outline: none; }

    .custom-row { display: flex; gap: 15px; align-items: center; margin-bottom: 20px; }
    .custom-color-input { -webkit-appearance: none; border: none; width: 44px; height: 44px; padding: 0; border-radius: 50%; overflow: hidden; cursor: pointer; box-shadow: 0 0 0 1px #ddd; }
    .custom-color-input::-webkit-color-swatch-wrapper { padding: 0; }
    .custom-color-input::-webkit-color-swatch { border: none; }
    .custom-select { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 2px; background: #fff; cursor: pointer; font-size: 14px; }

    /* SLIDERS */
    .custom-slider-group { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .custom-icon { width: 20px; text-align: center; color: #aaa; font-size: 14px; }
    .custom-slider { flex: 1; -webkit-appearance: none; height: 3px; background: #eee; border-radius: 2px; cursor: pointer; }
    .custom-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #000; border-radius: 50%; cursor: pointer; transition: transform 0.1s; }
    .custom-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }

    /* OVERLAY */
    .custom-overlay-host { position: relative !important; }
    .custom-text-layer {
        position: absolute; pointer-events: none;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
        white-space: nowrap; font-weight: 700;
        text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 1000; /* Encima de zoom */
        font-size: 24px; opacity: 0; transition: opacity 0.2s;
    }
    .custom-text-layer.active { opacity: 1; }
    @media (min-width: 768px) { .custom-text-layer { font-size: 2.5vw; } }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const FONTS = [{ name: 'Moderna', val: 'Helvetica, Arial, sans-serif' }, { name: 'Clásica', val: 'Times New Roman, serif' }, { name: 'Manuscrita', val: 'Brush Script MT, cursive' }, { name: 'Urbana', val: 'Courier New, monospace' }, { name: 'Fuerte', val: 'Impact, sans-serif' }];

// --- INITIALIZER ---
function init() {
    const forms = document.querySelectorAll('form[action*="/cart/add"], .js-product-form');
    forms.forEach(form => {
        if (isEligible(form)) mount(form);
    });
}

// --- FILTRO QUIRÚRGICO (White/Black List) ---
function isEligible(form) {
    if (form.dataset.cv9) return false; // Ya instalado

    // ⛔️ LISTA NEGRA: Contenedores de Grid/Listado
    const isGrid = form.closest('.js-item-product, .item-product, .product-item, .item, .col-grid, .span3, .span4, .product-grid-item');
    if (isGrid) return false;

    // ✅ LISTA BLANCA: Contenedores de Detalle o Modal
    const isPDP = form.closest('.js-product-detail, .js-product-container, #product-detail, .product-detail');
    const isModal = form.closest('.js-modal, .modal, .quick-shop, .fancybox-content');

    return (isPDP || isModal);
}

function mount(form) {
    form.dataset.cv9 = "true";
    const state = { active: false, text: "", color: "#ffffff", font: FONTS[0].val, posX: 50, posY: 50 };

    // DOM ELEMENTS
    const wrapper = document.createElement('div'); wrapper.className = 'custom-section-wrapper';
    const trigger = document.createElement('div'); trigger.className = 'custom-trigger-btn'; trigger.innerHTML = '<span>✨ Personalizar (+ $0)</span> <span>+</span>';
    const panel = document.createElement('div'); panel.className = 'custom-panel';

    wrapper.appendChild(trigger);
    wrapper.appendChild(panel);

    // CONTROLES
    // Text
    panel.innerHTML += '<label class="custom-label">Tu Texto</label>';
    const input = document.createElement('input'); input.className = 'custom-input'; input.placeholder = 'Escribe aquí...';
    input.oninput = (e) => { state.text = e.target.value; updateAll(form, state); };
    panel.appendChild(input);

    // Color & Font
    panel.innerHTML += '<label class="custom-label">Estilo</label>';
    const row = document.createElement('div'); row.className = 'custom-row';
    const cp = document.createElement('input'); cp.type = 'color'; cp.className = 'custom-color-input'; cp.value = state.color;
    cp.oninput = (e) => { state.color = e.target.value; updateAll(form, state); };
    const fs = document.createElement('select'); fs.className = 'custom-select';
    FONTS.forEach(f => { const o = document.createElement('option'); o.value = f.val; o.innerText = f.name; fs.appendChild(o); });
    fs.onchange = (e) => { state.font = e.target.value; updateAll(form, state); };
    row.appendChild(cp); row.appendChild(fs);
    panel.appendChild(row);

    // Sliders
    panel.innerHTML += '<label class="custom-label">Ubicación</label>';
    const makeSlider = (icon, prop) => {
        const d = document.createElement('div'); d.className = 'custom-slider-group';
        d.innerHTML = `<span class="custom-icon">${icon}</span>`;
        const s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = 100; s.value = 50; s.className = 'custom-slider';
        s.oninput = (e) => { state[prop] = e.target.value; updateAll(form, state); };
        d.appendChild(s); return d;
    };
    panel.appendChild(makeSlider('↔', 'posX'));
    panel.appendChild(makeSlider('↕', 'posY'));

    // LOGIC
    trigger.onclick = () => {
        state.active = !state.active;
        panel.classList.toggle('visible');
        trigger.classList.toggle('active');
        trigger.innerHTML = state.active ? '<span>Personalizando...</span> <span>-</span>' : '<span>✨ Personalizar (+ $0)</span> <span>+</span>';
        updateAll(form, state);
    };

    // INSERCIÓN
    // Intentar insertar antes del form para evitar estilos internos
    if (form.parentElement) form.parentElement.insertBefore(wrapper, form);
    else form.prepend(wrapper);

    // SUBMIT INTERCEPT
    setupSubmit(form, state);
}

function updateAll(form, state) {
    updateOverlay(form, state);
    updateHiddenInputs(form, state);
}

function updateHiddenInputs(form, state) {
    const val = state.active && state.text ? `${state.text} | C:${state.color} | F:${state.font.split(',')[0]} | P:${state.posX}%,${state.posY}%` : "";

    let p = form.querySelector('input[name="properties[Personalizacion]"]');
    if (!p) { p = document.createElement('input'); p.type = 'hidden'; p.name = 'properties[Personalizacion]'; form.appendChild(p); }
    p.value = val;

    let c = form.querySelector('input[name="comment"]');
    if (!c) { c = document.createElement('input'); c.type = 'hidden'; c.name = 'comment'; form.appendChild(c); }
    c.value = val;
}

function updateOverlay(form, state) {
    // ENCONTRAR CONTENEDOR DE PRODUCTO
    const container = form.closest('.js-product-detail, .js-modal, .product-container') || document.body;

    // Targeting específico para PDP y Quickshop
    // Buscamos contenedores de imagen específicos del tema
    const targets = container.querySelectorAll('.js-product-slide-link, .js-quickshop-image-padding, .product-img-box');

    // Si no hay targets específicos, fallback a img grandes
    const candidates = targets.length > 0 ? targets : container.querySelectorAll('img');

    candidates.forEach(el => {
        // Si es contenedor, buscar img adentro
        let host = el;
        if (el.tagName === 'IMG') {
            if (el.width < 250) return; // Filtrar miniaturas
            host = el.parentElement;
        } else {
            // Si es contenedor (enlace o div), verificar tamaño
            if (el.offsetWidth < 250) return;
        }

        // Preparar Host
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
        host.classList.add('custom-overlay-host');

        let layer = host.querySelector('.custom-text-layer');
        if (!layer) { layer = document.createElement('div'); layer.className = 'custom-text-layer'; host.appendChild(layer); }

        const txt = state.text || "TU TEXTO";
        layer.innerText = txt;
        layer.style.color = state.color;
        layer.style.fontFamily = state.font;
        layer.style.left = state.posX + '%';
        layer.style.top = state.posY + '%';

        if (state.active && state.text) layer.classList.add('active');
        else layer.classList.remove('active');
    });
}

function setupSubmit(form, state) {
    const btn = form.querySelector('.js-addtocart, input[type="submit"], button[type="submit"]');
    if (!btn) return;
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
    clone.addEventListener('click', (e) => {
        if (state.active && state.text) {
            e.preventDefault();
            clone.innerText = "Agregando..."; clone.style.opacity = 0.7; clone.disabled = true;
            setTimeout(() => HTMLFormElement.prototype.submit.call(form), 200);
        } else {
            e.preventDefault();
            HTMLFormElement.prototype.submit.call(form);
        }
    });
}

// WATCHER PARA QUICK SHOP
const mo = new MutationObserver((muts) => {
    if (muts.some(m => m.addedNodes.length)) init();
});
mo.observe(document.body, { childList: true, subtree: true });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
setInterval(init, 2000);
