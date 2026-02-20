console.log("🚀 Customily V6.0: DRAG & DROP STUDIOS");

// --- ESTILOS PREMIUM (V6) ---
const styles = `
    .custom-trigger-btn {
        width: 100%; padding: 12px; margin: 15px 0; 
        background: transparent; border: 1px solid #000; color: #000;
        border-radius: 4px; font-weight: 600; cursor: pointer; display: flex;
        align-items: center; justify-content: center; gap: 8px; 
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        text-transform: uppercase; letter-spacing: 1px; font-size: 13px;
        transition: all 0.2s ease;
    }
    .custom-trigger-btn:hover { background: #f5f5f5; }
    .custom-trigger-btn.active { background: #000; color: #fff; border-color: #000; }

    .custom-panel { 
        display: none; padding: 20px; background: #fff; border: 1px solid #eee; 
        border-radius: 8px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }
    .custom-panel.visible { display: block; animation: slideDown 0.3s ease-out; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

    .custom-row { display: flex; gap: 15px; margin-bottom: 15px; align-items: center; }
    .custom-label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #666; width: 60px; }
    
    .custom-input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; outline: none; }
    .custom-input:focus { border-color: #000; }

    .custom-color-picker { 
        width: 40px; height: 40px; border: none; padding: 0; background: none; cursor: pointer; 
        border-radius: 50%; overflow: hidden; box-shadow: 0 0 0 1px #ddd;
    }
    
    .custom-font-select { 
        flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
        background: #fff; font-size: 14px; cursor: pointer;
    }

    /* OVERLAY ESTILO DRAGGEABLE */
    .custom-overlay-container { position: relative !important; touch-action: none; } /* Importante para touch */
    .custom-draggable-text {
        position: absolute;
        cursor: grab;
        user-select: none;
        white-space: nowrap;
        font-weight: bold;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        padding: 5px;
        border: 1px dashed transparent;
        transition: border 0.2s;
        transform-origin: center center;
        /* Valores por defecto */
        top: 50%; left: 50%; transform: translate(-50%, -50%);
        font-size: 24px;
        z-index: 100;
    }
    .custom-draggable-text:active, .custom-draggable-text.dragging {
        cursor: grabbing;
        border: 1px dashed rgba(255,255,255,0.8);
        background: rgba(0,0,0,0.1);
    }
    /* En móviles, aumentar tamaño touch */
    @media (max-width: 768px) {
        .custom-draggable-text { font-size: 20px; padding: 10px; }
    }
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
    if (form.dataset.customilyV6) return;
    form.dataset.customilyV6 = "true";

    // ESTADO
    const state = {
        active: false,
        text: "",
        color: "#ffffff",
        font: FONTS[0].val,
        posX: 50, posY: 50 // Porcentajes
    };

    // UI
    const trigger = document.createElement('div');
    trigger.className = 'custom-trigger-btn';
    trigger.innerHTML = '<span>✎ Personalizar Diseño</span>';

    const panel = document.createElement('div');
    panel.className = 'custom-panel';

    // 1. Texto
    const r1 = document.createElement('div'); r1.className = 'custom-row';
    r1.innerHTML = '<span class="custom-label">Texto</span>';
    const input = document.createElement('input');
    input.className = 'custom-input';
    input.placeholder = 'Escribe aquí...';
    input.addEventListener('input', e => { state.text = e.target.value; updateOverlay(form, state); });
    r1.appendChild(input);
    panel.appendChild(r1);

    // 2. Color & Fuente
    const r2 = document.createElement('div'); r2.className = 'custom-row';
    r2.innerHTML = '<span class="custom-label">Estilo</span>';

    const colorP = document.createElement('input');
    colorP.type = 'color'; colorP.className = 'custom-color-picker'; colorP.value = state.color;
    colorP.addEventListener('input', e => { state.color = e.target.value; updateOverlay(form, state); });

    const fontS = document.createElement('select');
    fontS.className = 'custom-font-select';
    FONTS.forEach(f => {
        const o = document.createElement('option'); o.value = f.val; o.innerText = f.name;
        fontS.appendChild(o);
    });
    fontS.addEventListener('change', e => { state.font = e.target.value; updateOverlay(form, state); });

    r2.appendChild(colorP);
    r2.appendChild(fontS);
    panel.appendChild(r2);

    // 3. Instrucción
    const hint = document.createElement('div');
    hint.style.fontSize = "11px"; hint.style.color = "#888"; hint.style.textAlign = "center"; hint.style.marginTop = "10px";
    hint.innerText = "💡 Tip: Arrastra el texto sobre la imagen para moverlo";
    panel.appendChild(hint);

    // Toggle
    trigger.onclick = () => {
        state.active = !state.active;
        panel.classList.toggle('visible');
        trigger.classList.toggle('active');
        if (state.active && !state.text) {
            // Placeholder inicial visual
            updateOverlay(form, state, "TU TEXTO");
        } else {
            updateOverlay(form, state);
        }
    };

    // Insertar
    const btn = form.querySelector('.js-addtocart, input[type="submit"], button[type="submit"]');
    if (btn) {
        btn.parentNode.insertBefore(trigger, btn);
        btn.parentNode.insertBefore(panel, btn);
        setupNativeSubmit(form, btn, state);
    } else {
        form.appendChild(trigger);
        form.appendChild(panel);
    }
}

function updateOverlay(form, state, placeholder = "") {
    // Buscar Imagen
    const container = form.closest('.js-product-container, .product-container, body');
    const images = Array.from(container.querySelectorAll('img'));
    let bestImg = null; let maxArea = 0;
    images.forEach(img => {
        if (img.offsetParent && img.width > 100) {
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

        // Mantener posición visual
        txt.style.left = state.posX + '%';
        txt.style.top = state.posY + '%';
    }
}

// LOGICA DRAG & DROP (Mouse + Touch)
function makeDraggable(el, container, state) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    const start = (e) => {
        if (e.type === 'touchstart') e.preventDefault(); // Evitar scroll al arrastrar
        isDragging = true;
        el.classList.add('dragging');

        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        const rect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        // Offset del mouse dentro del elemento
        startX = clientX - elRect.left;
        startY = clientY - elRect.top;
    };

    const move = (e) => {
        if (!isDragging) return;
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        const rect = container.getBoundingClientRect();

        // Nueva posición relativa al contenedor
        let newLeft = clientX - rect.left - startX + (el.offsetWidth / 2);
        let newTop = clientY - rect.top - startY + (el.offsetHeight / 2);

        // Convertir a porcentajes para responsividad
        let pctX = (newLeft / rect.width) * 100;
        let pctY = (newTop / rect.height) * 100;

        // Límites (0-100%)
        pctX = Math.max(0, Math.min(100, pctX));
        pctY = Math.max(0, Math.min(100, pctY));

        el.style.left = pctX + '%';
        el.style.top = pctY + '%';

        // Guardar estado
        state.posX = pctX;
        state.posY = pctY;
    };

    const end = () => {
        isDragging = false;
        el.classList.remove('dragging');
    };

    el.addEventListener('mousedown', start);
    el.addEventListener('touchstart', start, { passive: false });

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

            // Format: "Texto | Color | Fuente | Pos: 50%,50%"
            // Redondear para que sea limpio
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

// Start
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
setInterval(init, 2000);
