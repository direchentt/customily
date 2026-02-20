console.log("🚀 Customily V5.1: NATIVE SUBMIT FIX");

// ESTILOS (Mantenemos los que te gustaron)
const styles = `
    .custom-trigger-btn {
        width: 100%; padding: 12px; margin: 15px 0; background: #222; border: 1px solid #000;
        border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; display: flex;
        align-items: center; justify-content: center; gap: 8px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px;
    }
    .custom-trigger-btn:hover { background: #444; }
    .custom-trigger-btn.active { background: #fff; color: #333; border: 1px solid #ccc; }
    .custom-panel { display: none; padding: 15px; background: #f9f9f9; border: 1px solid #eee; margin-bottom: 20px; border-radius: 4px; }
    .custom-panel.visible { display: block; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
    .custom-label { display: block; font-size: 11px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; color: #666; }
    .custom-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 15px; font-size: 16px; }
    .custom-options-row { display: flex; gap: 10px; margin-bottom: 15px; align-items: center; }
    .custom-color-circle { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; border: 2px solid #fff; box-shadow: 0 0 0 1px #ccc; }
    .custom-color-circle.active { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #333; transform: scale(1.1); }
    .custom-font-pill { padding: 6px 12px; border: 1px solid #ddd; background: #fff; border-radius: 20px; cursor: pointer; font-size: 12px; }
    .custom-font-pill.active { background: #333; color: #fff; border-color: #333; }
    .custom-overlay-container { position: relative !important; display: block !important; }
    .custom-overlay-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-90deg); color: white; font-size: 3vw; font-weight: 700; pointer-events: none; z-index: 100; white-space: nowrap; text-shadow: 0 2px 5px rgba(0,0,0,0.4); }
    @media (min-width: 1024px) { .custom-overlay-text { font-size: 30px; } }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const FONTS = [{ name: 'Moderna', family: 'Helvetica' }, { name: 'Clásica', family: 'Times' }, { name: 'Cursiva', family: 'Brush Script MT' }];
const COLORS = [{ hex: '#FFFFFF' }, { hex: '#000000' }, { hex: '#FFD700' }, { hex: '#FF69B4' }];

function init() {
    const forms = document.querySelectorAll('form[action*="/cart/add"], .js-product-form, #product_form');
    if (forms.length > 0) forms.forEach(inject);
}

function inject(form) {
    if (form.dataset.customilyReady) return;
    form.dataset.customilyReady = "true";

    const state = { active: false, text: "", color: COLORS[0].hex, font: FONTS[0].family };

    // --- UI ELEMENTS ---
    const trigger = document.createElement('div');
    trigger.className = 'custom-trigger-btn';
    trigger.innerHTML = '<span>✨ Personalizar (+ $0)</span>';

    const panel = document.createElement('div');
    panel.className = 'custom-panel';

    const input = document.createElement('input');
    input.className = 'custom-input';
    input.placeholder = 'TU TEXTO AQUÍ';
    input.addEventListener('input', e => { state.text = e.target.value; updatePreview(form, state); });

    // Labels y selectores
    panel.innerHTML += '<span class="custom-label">Texto:</span>';
    panel.appendChild(input);

    panel.innerHTML += '<span class="custom-label">Color:</span>';
    const cRow = document.createElement('div'); cRow.className = 'custom-options-row';
    COLORS.forEach(c => {
        const d = document.createElement('div'); d.className = 'custom-color-circle'; d.style.background = c.hex;
        d.onclick = () => { state.color = c.hex; updatePreview(form, state); };
        cRow.appendChild(d);
    });
    panel.appendChild(cRow);

    panel.innerHTML += '<span class="custom-label">Fuente:</span>';
    const fRow = document.createElement('div'); fRow.className = 'custom-options-row';
    FONTS.forEach(f => {
        const d = document.createElement('div'); d.className = 'custom-font-pill'; d.innerText = f.name;
        d.onclick = () => { state.font = f.family; updatePreview(form, state); };
        fRow.appendChild(d);
    });
    panel.appendChild(fRow);

    trigger.onclick = () => {
        state.active = !state.active;
        panel.classList.toggle('visible');
        trigger.innerHTML = state.active ? 'Cerrar' : '✨ Personalizar (+ $0)';
        updatePreview(form, state);
    };

    // INSERCIÓN
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

function updatePreview(form, state) {
    // Buscar imagen
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
        const p = bestImg.parentElement;
        p.classList.add('custom-overlay-container');
        let ov = p.querySelector('.custom-overlay-text');
        if (!ov) { ov = document.createElement('div'); ov.className = 'custom-overlay-text'; p.appendChild(ov); }
        ov.innerText = state.text || (state.active ? "TU TEXTO" : "");
        ov.style.color = state.color;
        ov.style.fontFamily = state.font;
        ov.style.opacity = state.active ? 1 : 0;
    }
}

function setupNativeSubmit(form, btn, state) {
    // Clonamos para quitar eventos previos (AJAX del tema)
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', (e) => {
        // Preparar datos
        if (state.active && state.text) {
            e.preventDefault(); // Pausamos para inyectar
            newBtn.innerText = "Guardando...";
            newBtn.disabled = true;

            const val = `${state.text} | ${state.color} | ${state.font}`;

            // Inyectar Campo 1: Properties
            let i1 = form.querySelector('input[name="properties[Personalizacion]"]');
            if (!i1) { i1 = document.createElement('input'); i1.type = 'hidden'; i1.name = 'properties[Personalizacion]'; form.appendChild(i1); }
            i1.value = val;

            // Inyectar Campo 2: Comment (Fallback)
            // Algunos temas usan 'comment' o 'note'
            let i2 = form.querySelector('input[name="comment"]');
            if (!i2) { i2 = document.createElement('input'); i2.type = 'hidden'; i2.name = 'comment'; form.appendChild(i2); }
            i2.value = val;

            // SUBMIT NATIVO PURO (Bypassing jQuery/Theme JS)
            HTMLFormElement.prototype.submit.call(form);

        } else {
            // Si no hay personalización, dejamos que el botón intente subir normamente
            // Pero como lo clonamos, perdimos el evento original del tema.
            // Así que hacemos submit nativo seguro.
            e.preventDefault();
            HTMLFormElement.prototype.submit.call(form);
        }
    });
}

// ARRANQUE
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
setInterval(init, 2000);
