console.log("🚀 Customily V6.2: LAYOUT FIX + FULL WIDTH");

// --- ESTILOS DE RESET ---
const styles = `
    /* Contenedor Principal: Ocupa todo el ancho, bloque limpio */
    .custom-section-wrapper {
        width: 100% !important;
        display: block !important;
        margin-bottom: 20px !important;
        clear: both !important;
        position: relative;
        z-index: 10;
    }

    /* Botón Activador */
    .custom-trigger-btn {
        width: 100%; 
        padding: 15px; 
        background: #f8f8f8; 
        border: 1px solid #ddd; 
        color: #333;
        font-weight: 700; 
        font-size: 13px;
        text-transform: uppercase; 
        letter-spacing: 1px;
        cursor: pointer; 
        display: flex; 
        align-items: center; 
        justify-content: space-between; /* Flecha a la derecha */
        transition: all 0.2s;
    }
    .custom-trigger-btn:hover { background: #eee; }
    .custom-trigger-btn.active { background: #222; color: #fff; border-color: #222; }
    .custom-trigger-icon { font-size: 10px; transition: transform 0.3s; }
    .custom-trigger-btn.active .custom-trigger-icon { transform: rotate(180deg); }

    /* Panel Desplegable */
    .custom-panel { 
        display: none; 
        background: #fff; 
        border: 1px solid #ddd; 
        border-top: none;
        padding: 20px; 
        box-sizing: border-box; /* Importante para no salirse */
    }
    .custom-panel.visible { display: block; animation: slideIn 0.2s ease-out; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

    /* Inputs y Controles al 100% */
    .custom-form-group { margin-bottom: 15px; }
    .custom-label { display: block; font-size: 11px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; color: #666; }
    
    .custom-input-full { 
        width: 100%; 
        padding: 10px; 
        border: 1px solid #ccc; 
        border-radius: 4px;
        font-size: 15px; 
        box-sizing: border-box; 
    }
    
    .custom-options-grid { display: flex; gap: 10px; align-items: center; }
    .custom-color-picker { 
        width: 40px; height: 40px; 
        border: 1px solid #ddd; padding: 2px; 
        background: #fff; cursor: pointer; border-radius: 4px; 
    }
    .custom-select-full { 
        flex: 1; 
        padding: 10px; 
        border: 1px solid #ccc; 
        border-radius: 4px; 
        background: #fff; 
        font-size: 14px; 
    }

    /* DRAGGABLE TEXT */
    .custom-overlay-container { position: relative !important; }
    .custom-draggable-text {
        position: absolute;
        cursor: move; cursor: grab;
        user-select: none; -webkit-user-select: none;
        white-space: nowrap; font-weight: bold;
        text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        padding: 10px;
        border: 1px dashed rgba(255,255,255,0.4);
        transform: translate(-50%, -50%);
        font-size: 26px; z-index: 9999;
        pointer-events: auto;
    }
    .custom-draggable-text:active { cursor: grabbing; border: 1px solid #fff; background: rgba(0,0,0,0.1); }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const FONTS = [
    { name: 'Moderna (Sans)', val: 'Helvetica, Arial, sans-serif' },
    { name: 'Elegante (Serif)', val: 'Georgia, serif' },
    { name: 'Cursiva (Script)', val: 'Brush Script MT, cursive' },
    { name: 'Máquina (Mono)', val: 'Courier New, monospace' },
    { name: 'Impacto (Bold)', val: 'Impact, sans-serif' }
];

function init() {
    const forms = document.querySelectorAll('form[action*="/cart/add"], .js-product-form');
    forms.forEach(inject);
}

function inject(form) {
    if (form.dataset.cv62) return;
    form.dataset.cv62 = "true";

    const state = { active: false, text: "", color: "#ffffff", font: FONTS[0].val, posX: 50, posY: 50 };

    // ESTRUCTURA LIMPIA
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-section-wrapper';

    // 1. Botón
    const trigger = document.createElement('div');
    trigger.className = 'custom-trigger-btn';
    trigger.innerHTML = '<span>✎ Personalizar (+ $0)</span> <span class="custom-trigger-icon">▼</span>';

    // 2. Panel
    const panel = document.createElement('div');
    panel.className = 'custom-panel';

    // -- Controles --
    // Texto
    panel.innerHTML += '<div class="custom-form-group"><span class="custom-label">1. Escribe tu texto:</span></div>';
    const input = document.createElement('input');
    input.className = 'custom-input-full';
    input.placeholder = 'Ej: TU NOMBRE';
    input.addEventListener('input', e => { state.text = e.target.value; updateOverlay(form, state); });
    panel.lastChild.appendChild(input);

    // Estilos
    panel.innerHTML += '<div class="custom-form-group" style="margin-top:15px"><span class="custom-label">2. Elige estilo:</span></div>';
    const grid = document.createElement('div'); grid.className = 'custom-options-grid';

    const colorP = document.createElement('input'); colorP.type = 'color'; colorP.className = 'custom-color-picker'; colorP.value = state.color;
    colorP.addEventListener('input', e => { state.color = e.target.value; updateOverlay(form, state); });

    const fontS = document.createElement('select'); fontS.className = 'custom-select-full';
    FONTS.forEach(f => { const o = document.createElement('option'); o.value = f.val; o.innerText = f.name; fontS.appendChild(o); });
    fontS.addEventListener('change', e => { state.font = e.target.value; updateOverlay(form, state); });

    grid.appendChild(colorP);
    grid.appendChild(fontS);
    panel.appendChild(grid);

    // Tip
    panel.innerHTML += '<div style="margin-top:10px; font-size:11px; color:#888; text-align:center;">✋ Arrastra el texto sobre la imagen para moverlo</div>';

    wrapper.appendChild(trigger);
    wrapper.appendChild(panel);

    // Lógica Abrir
    trigger.onclick = () => {
        state.active = !state.active;
        panel.classList.toggle('visible');
        trigger.classList.toggle('active');
        if (state.active && !state.text) updateOverlay(form, state, "TU TEXTO");
        else updateOverlay(form, state);
    };

    // --- UBICACIÓN ESTRATÉGICA ---
    // Estrategia: Buscar el contenedor de Precios o Envío para insertarlo ANTES de los botones
    // O buscar el primer elemento visible "product-variants"
    const variants = form.querySelector('.js-product-variants, .product-variants');
    const quantity = form.querySelector('.js-quantity, .quantity');
    const submitBtn = form.querySelector('.js-addtocart, input[type="submit"]');

    // Prioridad de inserción:
    // 1. Después de variantes (si existen)
    // 2. Antes de cantidad (si existe)
    // 3. Antes de botón comprar (último recurso)

    if (variants) {
        // Insertar después de variantes
        variants.parentNode.insertBefore(wrapper, variants.nextSibling);
    } else if (quantity) {
        // Insertar antes de cantidad (para que quede arriba de la fila de compra)
        // PERO verificamos si quantity está dentro de un contenedor 'row'
        const qtyParent = quantity.parentElement;
        if (qtyParent.classList.contains('row') || getComputedStyle(qtyParent).display === 'flex') {
            // Si está en flex, insertamos ANTES del contenedor flex padre
            qtyParent.parentNode.insertBefore(wrapper, qtyParent);
        } else {
            wrapper.style.marginBottom = "20px";
            quantity.parentNode.insertBefore(wrapper, quantity);
        }
    } else if (submitBtn) {
        // Fallback
        submitBtn.parentNode.insertBefore(wrapper, submitBtn);
    } else {
        form.prepend(wrapper);
    }

    if (submitBtn) setupNativeSubmit(form, submitBtn, state);
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
    let isDragging = false;
    let startX, startY;

    const onStart = (e) => {
        e.preventDefault(); e.stopPropagation();
        isDragging = true;
        const c = e.touches ? e.touches[0] : e;
        const rect = container.getBoundingClientRect();

        // Guardamos la posición inicial del puntero
        startX = c.clientX;
        startY = c.clientY;
    };

    const onMove = (e) => {
        if (!isDragging) return;
        e.preventDefault(); // Stop scroll
        const c = e.touches ? e.touches[0] : e;

        const deltaX = c.clientX - startX;
        const deltaY = c.clientY - startY;

        const rect = container.getBoundingClientRect();

        // Posiciòn actual en px
        const curX = (state.posX / 100) * rect.width;
        const curY = (state.posY / 100) * rect.height;

        let newX = curX + deltaX;
        let newY = curY + deltaY;

        // Clamp 0-100%
        let pctX = (newX / rect.width) * 100;
        let pctY = (newY / rect.height) * 100;

        pctX = Math.max(0, Math.min(100, pctX));
        pctY = Math.max(0, Math.min(100, pctY));

        el.style.left = pctX + '%';
        el.style.top = pctY + '%';

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

function setupNativeSubmit(form, btn, state) {
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
