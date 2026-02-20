console.log("🚀 Customily V6.1: FIXED DRAG & PLACEMENT");

// --- ESTILOS MEJORADOS ---
const styles = `
    .custom-trigger-container { margin-bottom: 15px; width: 100%; }
    .custom-trigger-btn {
        width: 100%; padding: 12px; 
        background: transparent; border: 1px solid #111; color: #111;
        border-radius: 0; /* Más minimalista, cuadrado */
        font-weight: 700; cursor: pointer; display: flex;
        align-items: center; justify-content: center; gap: 8px; 
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        text-transform: uppercase; letter-spacing: 1px; font-size: 12px;
        transition: all 0.2s ease;
    }
    .custom-trigger-btn:hover { background: #f0f0f0; }
    .custom-trigger-btn.active { background: #111; color: #fff; border-color: #111; }

    .custom-panel { 
        display: none; padding: 20px; background: #fff; border: 1px solid #e0e0e0; 
        margin-top: -1px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);
    }
    .custom-panel.visible { display: block; animation: slideDown 0.3s ease-out; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

    .custom-row { display: flex; gap: 15px; margin-bottom: 15px; align-items: center; }
    .custom-label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #333; width: 60px; }
    .custom-input { flex: 1; padding: 8px; border: 1px solid #ccc; font-size: 14px; outline: none; }
    .custom-input:focus { border-color: #000; }
    .custom-color-picker { width: 35px; height: 35px; border: none; padding: 0; background: none; cursor: pointer; border-radius: 50%; box-shadow: 0 0 0 1px #ddd; }
    .custom-font-select { flex: 1; padding: 8px; border: 1px solid #ccc; background: #fff; font-size: 14px; cursor: pointer; }

    /* OVERLAY ESTILO DRAGGEABLE (SOLIDO) */
    .custom-overlay-container { position: relative !important; touch-action: none; }
    .custom-draggable-text {
        position: absolute;
        cursor: move; /* Cursor explícito de movimiento */
        cursor: grab;
        user-select: none; /* Crucial: No seleccionar texto */
        -webkit-user-select: none;
        white-space: nowrap;
        font-weight: bold;
        text-shadow: 0 2px 4px rgba(0,0,0,0.4);
        padding: 10px; /* Área de agarre más grande */
        border: 1px dashed rgba(255,255,255,0.5); /* Borde sutil siempre visible */
        transform-origin: center center;
        transform: translate(-50%, -50%);
        font-size: 30px;
        z-index: 9999; /* ENCIMA DE TODO (Zoom, Lupa, etc) */
        pointer-events: auto !important; /* Forzar eventos */
    }
    .custom-draggable-text:active, .custom-draggable-text.dragging {
        cursor: grabbing;
        border: 2px dashed #fff;
        background: rgba(0,0,0,0.2);
    }
    @media (max-width: 768px) { .custom-draggable-text { font-size: 20px; } }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const FONTS = [
    { name: 'Moderna', val: 'Helvetica, Arial, sans-serif' },
    { name: 'Elegante', val: 'Georgia, serif' },
    { name: 'Cursiva', val: 'Brush Script MT, cursive' },
    { name: 'Futurista', val: 'Courier New, monospace' },
    { name: 'Impacto', val: 'Impact, sans-serif' }
];

function init() {
    const forms = document.querySelectorAll('form[action*="/cart/add"], .js-product-form');
    if (forms.length) forms.forEach(inject);
}

function inject(form) {
    if (form.dataset.customilyV61) return;
    form.dataset.customilyV61 = "true";

    const state = { active: false, text: "", color: "#ffffff", font: FONTS[0].val, posX: 50, posY: 50 };

    // UI Structure
    const mainWrapper = document.createElement('div');
    mainWrapper.className = 'custom-trigger-container';

    const trigger = document.createElement('div');
    trigger.className = 'custom-trigger-btn';
    trigger.innerHTML = '<span>✎ Personalizar Diseño</span>';

    const panel = document.createElement('div');
    panel.className = 'custom-panel';

    // Renglón 1: Texto
    const r1 = document.createElement('div'); r1.className = 'custom-row';
    r1.innerHTML = '<span class="custom-label">Texto</span>';
    const input = document.createElement('input'); input.className = 'custom-input'; input.placeholder = 'Tu Nombre...';
    input.addEventListener('input', e => { state.text = e.target.value; updateOverlay(form, state); });
    r1.appendChild(input);
    panel.appendChild(r1);

    // Renglón 2: Estilos
    const r2 = document.createElement('div'); r2.className = 'custom-row';
    r2.innerHTML = '<span class="custom-label">Estilo</span>';
    const colorP = document.createElement('input'); colorP.type = 'color'; colorP.className = 'custom-color-picker'; colorP.value = state.color;
    colorP.addEventListener('input', e => { state.color = e.target.value; updateOverlay(form, state); });
    const fontS = document.createElement('select'); fontS.className = 'custom-font-select';
    FONTS.forEach(f => { const o = document.createElement('option'); o.value = f.val; o.innerText = f.name; fontS.appendChild(o); });
    fontS.addEventListener('change', e => { state.font = e.target.value; updateOverlay(form, state); });
    r2.appendChild(colorP); r2.appendChild(fontS);
    panel.appendChild(r2);

    // Hint
    const hint = document.createElement('div');
    hint.style.fontSize = "10px"; hint.style.color = "#888"; hint.style.textAlign = "center"; hint.style.marginTop = "5px";
    hint.innerText = "Arrastra el texto para ubicarlo.";
    panel.appendChild(hint);

    mainWrapper.appendChild(trigger);
    mainWrapper.appendChild(panel);

    trigger.onclick = () => {
        state.active = !state.active;
        panel.classList.toggle('visible');
        trigger.classList.toggle('active');
        if (state.active && !state.text) updateOverlay(form, state, "TU TEXTO");
        else updateOverlay(form, state);
    };

    // --- POSICIONAMIENTO MEJORADO ---
    // Buscamos insertar LO MAS ARRIBA posible antes del botón de compra
    // Intentamos buscar el selector de cantidad o el contenedor de variantes
    const target = form.querySelector('.js-quantity, .quantity, .product-variants, .js-product-variants') || form.querySelector('.js-addtocart, input[type="submit"]');

    if (target) {
        target.parentNode.insertBefore(mainWrapper, target);
        // Setup final
        const btn = form.querySelector('.js-addtocart, input[type="submit"], button[type="submit"]');
        if (btn) setupNativeSubmit(form, btn, state);
    } else {
        form.insertBefore(mainWrapper, form.firstChild);
    }
}

function updateOverlay(form, state, placeholder = "") {
    const container = form.closest('.js-product-container, .product-container, body');
    const images = Array.from(container.querySelectorAll('img'));
    let bestImg = null; let maxArea = 0;

    // Filtro estricto para encontrar la imagen REAL
    images.forEach(img => {
        if (img.offsetParent && img.width > 150) { // Min 150px
            const a = img.width * img.height;
            if (a > maxArea) { maxArea = a; bestImg = img; }
        }
    });

    if (bestImg) {
        const wrapper = bestImg.parentElement;
        wrapper.classList.add('custom-overlay-container');

        let txt = wrapper.querySelector('.custom-draggable-text');
        if (!txt) {
            txt = document.createElement('div');
            txt.className = 'custom-draggable-text';
            wrapper.appendChild(txt);
            makeDraggable(txt, wrapper, state);
        }

        const content = state.text || placeholder;
        txt.innerText = content;
        txt.style.color = state.color;
        txt.style.fontFamily = state.font;
        txt.style.display = (state.active && content) ? 'block' : 'none';

        // Mantener posición
        txt.style.left = state.posX + '%';
        txt.style.top = state.posY + '%';
    }
}

// LOGICA DRAG & DROP ROBUSTA (Global Events)
function makeDraggable(el, container, state) {
    let isDragging = false;
    let startX, startY;

    // INICIO
    const start = (e) => {
        e.preventDefault(); // Prevenir selección nativa o scroll
        e.stopPropagation(); // Prevenir que el click pase al zoom de la imagen
        isDragging = true;
        el.classList.add('dragging');

        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        const rect = container.getBoundingClientRect();

        // Calcular offset inicial relativo al centro del elemento
        // Convertimos el porcentaje actual a pixeles para sincronizar
        const currentLeftPx = (state.posX / 100) * rect.width;
        const currentTopPx = (state.posY / 100) * rect.height;

        // Guardamos donde hicimos click relativo al centro del container
        // No necesitamos offset interno complejo porque transform translate centra el elemento
        startX = clientX;
        startY = clientY;
    };

    // MOVIMIENTO (En DOCUMENT para no perder el foco si salimos rápido)
    const move = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        const rect = container.getBoundingClientRect();

        // Delta de movimiento
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        // Nueva posición en Pixeles
        const currentLeftPx = (state.posX / 100) * rect.width;
        const currentTopPx = (state.posY / 100) * rect.height;

        let newLeftPx = currentLeftPx + deltaX;
        let newTopPx = currentTopPx + deltaY;

        // Convertir a % y Clamp (0-100)
        let pctX = (newLeftPx / rect.width) * 100;
        let pctY = (newTopPx / rect.height) * 100;

        pctX = Math.max(0, Math.min(100, pctX));
        pctY = Math.max(0, Math.min(100, pctY));

        // Aplicar
        el.style.left = pctX + '%';
        el.style.top = pctY + '%';

        // Actualizar referencia para el siguiente frame
        startX = clientX;
        startY = clientY;

        state.posX = pctX;
        state.posY = pctY;
    };

    const end = () => {
        isDragging = false;
        el.classList.remove('dragging');
    };

    el.addEventListener('mousedown', start);
    el.addEventListener('touchstart', start, { passive: false });

    // Listeners globales
    document.addEventListener('mousemove', move);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('mouseup', end);
    document.addEventListener('touchend', end);
}

function setupNativeSubmit(form, btn, state) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
        if (state.active && state.text) {
            e.preventDefault();
            newBtn.innerText = "Guardando..."; newBtn.disabled = true;

            const posX = Math.round(state.posX);
            const posY = Math.round(state.posY);
            const val = `${state.text} | Color: ${state.color} | Fuente: ${state.font.split(',')[0]} | Pos: ${posX}%,${posY}%`;

            let i1 = form.querySelector('input[name="properties[Personalizacion]"]');
            if (!i1) { i1 = document.createElement('input'); i1.type = 'hidden'; i1.name = 'properties[Personalizacion]'; form.appendChild(i1); }
            i1.value = val;

            let i2 = form.querySelector('input[name="comment"]');
            if (!i2) { i2 = document.createElement('input'); i2.type = 'hidden'; i2.name = 'comment'; form.appendChild(i2); }
            i2.value = val;

            HTMLFormElement.prototype.submit.call(form);
        } else {
            e.preventDefault();
            HTMLFormElement.prototype.submit.call(form);
        }
    });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
setInterval(init, 2000);
