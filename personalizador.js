console.log("🚀 Customily V6.4: PDP EXCLUSIVE & REMOTE LINK");

// --- ESTILOS ---
const styles = `
    .custom-section-wrapper { display: block !important; width: 100% !important; margin: 20px 0 !important; clear: both !important; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .custom-trigger-btn { width: 100%; padding: 12px 15px; background: #fff; border: 1px solid #111; color: #111; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
    .custom-trigger-btn:hover { background: #111; color: #fff; }
    .custom-trigger-btn.active { background: #111; color: #fff; border-bottom: none; }
    .custom-panel { display: none; padding: 20px; background: #fff; border: 1px solid #111; border-top: none; box-sizing: border-box; }
    .custom-panel.visible { display: block; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .custom-label { display: block; font-size: 11px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; color: #555; }
    .custom-input { width: 100%; padding: 8px; border: 1px solid #ccc; font-size: 14px; margin-bottom: 15px; box-sizing: border-box; }
    .custom-row { display: flex; gap: 10px; margin-bottom: 5px; }
    .custom-color { width: 40px; height: 38px; padding: 0; border: 1px solid #ccc; background: none; cursor: pointer; }
    .custom-select { flex: 1; padding: 8px; border: 1px solid #ccc; background: #fff; font-size: 14px; }
    /* DRAG TEXT */
    .custom-overlay-container { position: relative !important; }
    .custom-draggable-text { position: absolute; cursor: move; cursor: grab; user-select: none; -webkit-user-select: none; white-space: nowrap; font-weight: bold; text-shadow: 0 1px 3px rgba(0,0,0,0.3); padding: 5px; border: 1px dashed rgba(255,255,255,0.4); transform: translate(-50%, -50%); font-size: 24px; z-index: 99999; pointer-events: auto; }
    .custom-draggable-text:active { cursor: grabbing; border: 1px solid #fff; background: rgba(0,0,0,0.1); }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const FONTS = [{ name: 'Moderna', val: 'Helvetica, Arial, sans-serif' }, { name: 'Elegante', val: 'Georgia, serif' }, { name: 'Cursiva', val: 'Brush Script MT, cursive' }, { name: 'Máquina', val: 'Courier New, monospace' }, { name: 'Impacto', val: 'Impact, sans-serif' }];

function init() {
    // 1. FILTRO DE PÁGINA: Solo ejecutar en PDP (/productos/)
    if (!window.location.pathname.includes('/productos/')) {
        console.log("🚫 Customily: Fuera de PDP, desactivado.");
        return;
    }

    const forms = document.querySelectorAll('form[action*="/cart/add"], .js-product-form');
    forms.forEach(inject);
}

function inject(form) {
    if (form.dataset.cv64) return;
    form.dataset.cv64 = "true";

    const state = { active: false, text: "", color: "#ffffff", font: FONTS[0].val, posX: 50, posY: 50 };

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-section-wrapper';
    const trigger = document.createElement('div');
    trigger.className = 'custom-trigger-btn';
    trigger.innerHTML = '<span>✎ Personalizar Diseño (+ $0)</span> <span>+</span>';
    const panel = document.createElement('div');
    panel.className = 'custom-panel';

    panel.innerHTML += '<span class="custom-label">Tu Texto:</span>';
    const input = document.createElement('input');
    input.className = 'custom-input';
    input.placeholder = 'Escribe aquí...';
    input.addEventListener('input', e => {
        state.text = e.target.value;
        // Pasamos el FORM original para buscar contexto
        updateOverlay(form, state);
    });
    panel.appendChild(input);

    panel.innerHTML += '<span class="custom-label">Estilo:</span>';
    const row = document.createElement('div'); row.className = 'custom-row';
    const colorP = document.createElement('input'); colorP.type = 'color'; colorP.className = 'custom-color'; colorP.value = state.color;
    colorP.addEventListener('input', e => { state.color = e.target.value; updateOverlay(form, state); });
    const fontS = document.createElement('select'); fontS.className = 'custom-select';
    FONTS.forEach(f => { const o = document.createElement('option'); o.value = f.val; o.innerText = f.name; fontS.appendChild(o); });
    fontS.addEventListener('change', e => { state.font = e.target.value; updateOverlay(form, state); });
    row.appendChild(colorP); row.appendChild(fontS);
    panel.appendChild(row);
    panel.innerHTML += '<div style="margin-top:10px; font-size:10px; color:#666; text-align:center;">Arrastra el texto para ubicarlo</div>';

    wrapper.appendChild(trigger);
    wrapper.appendChild(panel);

    trigger.onclick = () => {
        state.active = !state.active;
        panel.classList.toggle('visible');
        trigger.classList.toggle('active');
        trigger.innerHTML = state.active ? '<span>Personalizando...</span> <span>-</span>' : '<span>✎ Personalizar Diseño (+ $0)</span> <span>+</span>';
        if (state.active && !state.text) updateOverlay(form, state, "TU TEXTO"); else updateOverlay(form, state);
    };

    // Insertar ANTES del form
    const parent = form.parentElement;
    if (parent) parent.insertBefore(wrapper, form);
    else form.insertBefore(wrapper, form.firstChild);

    const btn = form.querySelector('.js-addtocart, input[type="submit"], button[type="submit"]');
    if (btn) setupSafeSubmit(form, btn, state);
}

function updateOverlay(form, state, placeholder = "") {
    // BÚSQUEDA DE IMAGEN MEJORADA
    // Ahora que estamos "fuera" del form, necesitamos buscar globalmente en el contenedor principal
    // Buscamos el ancestro común más cercano que sea el contenedor del producto
    let container = form.closest('.js-product-container, .product-container');

    // Si no lo encuentra, usamos document body como fallback
    if (!container) container = document.body;

    const images = Array.from(container.querySelectorAll('img'));
    let bestImg = null; let maxArea = 0;

    images.forEach(img => {
        // Filtramos iconos, logos, etc.
        if (img.offsetParent && img.width > 250) { // Min 250px para ser foto ppal
            const a = img.width * img.height;
            if (a > maxArea) { maxArea = a; bestImg = img; }
        }
    });

    if (bestImg) {
        const p = bestImg.parentElement;
        // Forzamos position relative para que el absolute funcione
        if (getComputedStyle(p).position === 'static') p.style.position = 'relative';
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
    } else {
        console.warn("⚠️ Customily: No encontré imagen grande en el contenedor.");
    }
}

function makeDraggable(el, container, state) {
    let isDragging = false; let startX, startY;
    const onStart = (e) => { e.preventDefault(); e.stopPropagation(); isDragging = true; const c = e.touches ? e.touches[0] : e; startX = c.clientX; startY = c.clientY; };
    const onMove = (e) => {
        if (!isDragging) return; e.preventDefault();
        const c = e.touches ? e.touches[0] : e;
        const deltaX = c.clientX - startX; const deltaY = c.clientY - startY;
        const rect = container.getBoundingClientRect();
        const curX = (state.posX / 100) * rect.width;
        const curY = (state.posY / 100) * rect.height;
        let pctX = ((curX + deltaX) / rect.width) * 100;
        let pctY = ((curY + deltaY) / rect.height) * 100;
        pctX = Math.max(0, Math.min(100, pctX)); pctY = Math.max(0, Math.min(100, pctY));
        el.style.left = pctX + '%'; el.style.top = pctY + '%';
        state.posX = pctX; state.posY = pctY;
        startX = c.clientX; startY = c.clientY;
    };
    const onEnd = () => { isDragging = false; };
    el.addEventListener('mousedown', onStart); el.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove', onMove); document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd); document.addEventListener('touchend', onEnd);
}

function setupSafeSubmit(form, btn, state) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
        if (state.active && state.text) {
            e.preventDefault();
            newBtn.innerText = "Guardando..."; newBtn.disabled = true;
            const posX = Math.round(state.posX); const posY = Math.round(state.posY);
            const val = `${state.text} | Color: ${state.color} | Fuente: ${state.font.split(',')[0]} | Pos: ${posX}%,${posY}%`; // Data string
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
