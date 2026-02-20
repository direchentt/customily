console.log("🚀 Customily V6.3: LAYOUT ESCAPE DOCTRINE");

// --- ESTILOS ---
const styles = `
    /* Contenedor TOTALMENTE independiente */
    .custom-section-wrapper {
        display: block !important;
        width: 100% !important;
        margin: 20px 0 !important;
        clear: both !important;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }

    .custom-trigger-btn {
        width: 100%; padding: 12px 15px; 
        background: #fff; border: 1px solid #111; color: #111;
        font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;
        cursor: pointer; display: flex; justify-content: space-between; align-items: center;
        transition: all 0.2s;
    }
    .custom-trigger-btn:hover { background: #111; color: #fff; }
    .custom-trigger-btn.active { background: #111; color: #fff; border-bottom: none; }

    .custom-panel { 
        display: none; padding: 20px; background: #fff; border: 1px solid #111; border-top: none; 
        box-sizing: border-box; 
    }
    .custom-panel.visible { display: block; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .custom-label { display: block; font-size: 11px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; color: #555; }
    .custom-input { width: 100%; padding: 8px; border: 1px solid #ccc; font-size: 14px; margin-bottom: 15px; box-sizing: border-box; }
    
    .custom-row { display: flex; gap: 10px; margin-bottom: 5px; }
    .custom-color { width: 40px; height: 38px; padding: 0; border: 1px solid #ccc; background: none; cursor: pointer; }
    .custom-select { flex: 1; padding: 8px; border: 1px solid #ccc; background: #fff; font-size: 14px; }

    /* DRAG TEXT */
    .custom-overlay-container { position: relative !important; }
    .custom-draggable-text {
        position: absolute; cursor: move; cursor: grab;
        user-select: none; -webkit-user-select: none;
        white-space: nowrap; font-weight: bold;
        text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        padding: 5px; border: 1px dashed rgba(255,255,255,0.4);
        transform: translate(-50%, -50%);
        font-size: 24px; z-index: 99999;
        pointer-events: auto;
    }
    .custom-draggable-text:active { cursor: grabbing; border: 1px solid #fff; background: rgba(0,0,0,0.1); }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const FONTS = [
    { name: 'Moderna', val: 'Helvetica, Arial, sans-serif' },
    { name: 'Elegante', val: 'Georgia, serif' },
    { name: 'Cursiva', val: 'Brush Script MT, cursive' },
    { name: 'Máquina', val: 'Courier New, monospace' },
    { name: 'Impacto', val: 'Impact, sans-serif' }
];

function init() {
    // Buscamos formularios
    const forms = document.querySelectorAll('form[action*="/cart/add"], .js-product-form');
    forms.forEach(inject);
}

function inject(form) {
    if (form.dataset.cv63) return;
    form.dataset.cv63 = "true";

    // ESTADO
    const state = { active: false, text: "", color: "#ffffff", font: FONTS[0].val, posX: 50, posY: 50 };

    // --- UI ---
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-section-wrapper';

    const trigger = document.createElement('div');
    trigger.className = 'custom-trigger-btn';
    trigger.innerHTML = '<span>✎ Personalizar Diseño (+ $0)</span> <span>+</span>';

    const panel = document.createElement('div');
    panel.className = 'custom-panel';

    // 1. Text
    panel.innerHTML += '<span class="custom-label">Tu Texto:</span>';
    const input = document.createElement('input');
    input.className = 'custom-input';
    input.placeholder = 'Escribe aquí...';
    input.addEventListener('input', e => { state.text = e.target.value; updateOverlay(form, state); });
    panel.appendChild(input);

    // 2. Styles
    panel.innerHTML += '<span class="custom-label">Estilo:</span>';
    const row = document.createElement('div'); row.className = 'custom-row';

    const colorP = document.createElement('input'); colorP.type = 'color'; colorP.className = 'custom-color'; colorP.value = state.color;
    colorP.addEventListener('input', e => { state.color = e.target.value; updateOverlay(form, state); });

    const fontS = document.createElement('select'); fontS.className = 'custom-select';
    FONTS.forEach(f => { const o = document.createElement('option'); o.value = f.val; o.innerText = f.name; fontS.appendChild(o); });
    fontS.addEventListener('change', e => { state.font = e.target.value; updateOverlay(form, state); });

    row.appendChild(colorP);
    row.appendChild(fontS);
    panel.appendChild(row);

    panel.innerHTML += '<div style="margin-top:10px; font-size:10px; color:#666; text-align:center;">Arrastra el texto para ubicarlo</div>';

    wrapper.appendChild(trigger);
    wrapper.appendChild(panel);

    // Toggle
    trigger.onclick = () => {
        state.active = !state.active;
        panel.classList.toggle('visible');
        trigger.classList.toggle('active');
        trigger.innerHTML = state.active ? '<span>Personalizando...</span> <span>-</span>' : '<span>✎ Personalizar Diseño (+ $0)</span> <span>+</span>';
        if (state.active && !state.text) updateOverlay(form, state, "TU TEXTO"); else updateOverlay(form, state);
    };

    // --- INSERCIÓN EXTERNA (FUERA DEL FORM) ---
    // Estrategia: Insertar ANTES del formulario para salir del contexto flex/grid que rompe todo.
    // Buscamos el padre del form
    const parent = form.parentElement;
    if (parent) {
        parent.insertBefore(wrapper, form);
    } else {
        // Fallback: al principio del form si no hay padre accesible
        form.insertBefore(wrapper, form.firstChild);
    }

    // --- CONEXIÓN REMOTA CON EL BOTÓN DE COMPRA ---
    // Aunque estemos fuera, seguimos secuestrando el submit
    const btn = form.querySelector('.js-addtocart, input[type="submit"], button[type="submit"]');
    if (btn) setupSafeSubmit(form, btn, state);
}

function updateOverlay(form, state, placeholder = "") {
    const container = document.querySelector('.js-product-container, .product-container') || document.body;
    const images = Array.from(container.querySelectorAll('img'));
    let bestImg = null; let maxArea = 0;

    images.forEach(img => {
        if (img.offsetParent && img.width > 200) {
            const a = img.width * img.height;
            if (a > maxArea) { maxArea = a; bestImg = img; }
        }
    });

    if (bestImg) {
        const p = bestImg.parentElement;
        p.classList.add('custom-overlay-container');
        let txt = p.querySelector('.custom-draggable-text');
        if (!txt) {
            txt = document.createElement('div'); txt.className = 'custom-draggable-text';
            p.appendChild(txt);
            makeDraggable(txt, p, state);
        }
        const val = state.text || placeholder;
        txt.innerText = val;
        txt.style.color = state.color;
        txt.style.fontFamily = state.font;
        txt.style.display = (state.active && val) ? 'block' : 'none';
        txt.style.left = state.posX + '%';
        txt.style.top = state.posY + '%';
    }
}

function makeDraggable(el, container, state) {
    let isDragging = false; let startX, startY;

    const onStart = (e) => {
        e.preventDefault(); e.stopPropagation();
        isDragging = true;
        const c = e.touches ? e.touches[0] : e;
        startX = c.clientX; startY = c.clientY;
    };

    const onMove = (e) => {
        if (!isDragging) return; e.preventDefault();
        const c = e.touches ? e.touches[0] : e;
        const deltaX = c.clientX - startX; const deltaY = c.clientY - startY;
        const rect = container.getBoundingClientRect();

        const curX = (state.posX / 100) * rect.width;
        const curY = (state.posY / 100) * rect.height;

        let pctX = ((curX + deltaX) / rect.width) * 100;
        let pctY = ((curY + deltaY) / rect.height) * 100;

        pctX = Math.max(0, Math.min(100, pctX));
        pctY = Math.max(0, Math.min(100, pctY));

        el.style.left = pctX + '%'; el.style.top = pctY + '%';
        state.posX = pctX; state.posY = pctY;
        startX = c.clientX; startY = c.clientY;
    };

    const onEnd = () => { isDragging = false; };

    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
}

function setupSafeSubmit(form, btn, state) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
        if (state.active && state.text) {
            e.preventDefault();
            newBtn.innerText = "Guardando..."; newBtn.disabled = true;
            const posX = Math.round(state.posX); const posY = Math.round(state.posY);
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
