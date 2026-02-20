console.log("🚀 Customily V7.0: PRECISION SLIDERS CONTROL");

// --- ESTILOS ---
const styles = `
    .custom-section-wrapper { display: block !important; width: 100% !important; margin: 20px 0 !important; clear: both !important; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .custom-trigger-btn { 
        width: 100%; padding: 12px 15px; background: #fff; border: 1px solid #000; color: #000; 
        font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; 
        cursor: pointer; display: flex; justify-content: space-between; align-items: center; 
        transition: all 0.2s;
    }
    .custom-trigger-btn:hover { background: #000; color: #fff; }
    .custom-trigger-btn.active { background: #000; color: #fff; border-bottom: none; }

    .custom-panel { display: none; padding: 20px; background: #fff; border: 1px solid #000; border-top: none; box-sizing: border-box; }
    .custom-panel.visible { display: block; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .custom-label { display: block; font-size: 11px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; color: #555; margin-top: 10px; }
    .custom-label:first-child { margin-top: 0; }
    
    .custom-input { width: 100%; padding: 8px; border: 1px solid #ccc; font-size: 14px; box-sizing: border-box; }
    
    .custom-row { display: flex; gap: 10px; align-items: center; }
    .custom-color { width: 40px; height: 38px; padding: 0; border: 1px solid #ccc; background: none; cursor: pointer; }
    .custom-select { flex: 1; padding: 8px; border: 1px solid #ccc; background: #fff; font-size: 14px; }

    /* SLIDERS */
    .custom-range-wrapper { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
    .custom-range-icon { font-size: 14px; width: 20px; text-align: center; }
    .custom-range { flex: 1; cursor: pointer; height: 4px; background: #ddd; -webkit-appearance: none; border-radius: 2px; }
    .custom-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #000; border-radius: 50%; cursor: pointer; }

    /* OVERLAY */
    .custom-overlay-container { position: relative !important; }
    .custom-text-overlay {
        position: absolute; pointer-events: none !important; /* Click-through */
        white-space: nowrap; font-weight: bold;
        text-shadow: 0 1px 4px rgba(0,0,0,0.4);
        transform: translate(-50%, -50%);
        font-size: 24px; z-index: 2147483647; /* Máximo Z posible */
        width: auto; height: auto;
    }
    @media (min-width: 1024px) { .custom-text-overlay { font-size: 32px; } }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const FONTS = [{ name: 'Moderna', val: 'Helvetica, Arial, sans-serif' }, { name: 'Elegante', val: 'Georgia, serif' }, { name: 'Cursiva', val: 'Brush Script MT, cursive' }, { name: 'Máquina', val: 'Courier New, monospace' }, { name: 'Impacto', val: 'Impact, sans-serif' }];

function init() {
    if (!window.location.pathname.includes('/productos/')) return;
    const forms = document.querySelectorAll('form[action*="/cart/add"], .js-product-form');
    forms.forEach(inject);
}

function inject(form) {
    if (form.dataset.cv70) return;
    form.dataset.cv70 = "true";

    const state = { active: false, text: "", color: "#ffffff", font: FONTS[0].val, posX: 50, posY: 50 };

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-section-wrapper';

    const trigger = document.createElement('div');
    trigger.className = 'custom-trigger-btn';
    trigger.innerHTML = '<span>✎ Personalizar (+ $0)</span> <span>+</span>';

    const panel = document.createElement('div');
    panel.className = 'custom-panel';

    // 1. TEXTO
    panel.innerHTML += '<span class="custom-label">Tu Texto:</span>';
    const input = document.createElement('input');
    input.className = 'custom-input';
    input.placeholder = 'Escribe nombre o iniciales...';
    input.addEventListener('input', e => {
        state.text = e.target.value;
        updateAll(form, state);
    });
    panel.appendChild(input);

    // 2. ESTILO
    panel.innerHTML += '<span class="custom-label">Estilo:</span>';
    const row = document.createElement('div'); row.className = 'custom-row';
    const colorP = document.createElement('input'); colorP.type = 'color'; colorP.className = 'custom-color'; colorP.value = state.color;
    colorP.addEventListener('input', e => { state.color = e.target.value; updateAll(form, state); });
    const fontS = document.createElement('select'); fontS.className = 'custom-select';
    FONTS.forEach(f => { const o = document.createElement('option'); o.value = f.val; o.innerText = f.name; fontS.appendChild(o); });
    fontS.addEventListener('change', e => { state.font = e.target.value; updateAll(form, state); });
    row.appendChild(colorP); row.appendChild(fontS);
    panel.appendChild(row);

    // 3. POSICIÓN (SLIDERS) - ¡La forma fácil!
    panel.innerHTML += '<span class="custom-label">Ubicación:</span>';

    // X
    const wrapX = document.createElement('div'); wrapX.className = 'custom-range-wrapper';
    wrapX.innerHTML = '<span class="custom-range-icon">↔</span>';
    const rangeX = document.createElement('input'); rangeX.type = 'range'; rangeX.min = 0; rangeX.max = 100; rangeX.value = 50; rangeX.className = 'custom-range';
    rangeX.addEventListener('input', e => { state.posX = e.target.value; updateAll(form, state); });
    wrapX.appendChild(rangeX); panel.appendChild(wrapX);

    // Y
    const wrapY = document.createElement('div'); wrapY.className = 'custom-range-wrapper';
    wrapY.innerHTML = '<span class="custom-range-icon">↕</span>';
    const rangeY = document.createElement('input'); rangeY.type = 'range'; rangeY.min = 0; rangeY.max = 100; rangeY.value = 50; rangeY.className = 'custom-range';
    rangeY.addEventListener('input', e => { state.posY = e.target.value; updateAll(form, state); });
    wrapY.appendChild(rangeY); panel.appendChild(wrapY);

    wrapper.appendChild(trigger);
    wrapper.appendChild(panel);

    // LOGICA TOGGLE
    trigger.onclick = () => {
        state.active = !state.active;
        panel.classList.toggle('visible');
        trigger.classList.toggle('active');
        trigger.innerHTML = state.active ? '<span>Personalizando...</span> <span>-</span>' : '<span>✎ Personalizar (+ $0)</span> <span>+</span>';
        if (state.active && !state.text) updateAll(form, state, "TU TEXTO"); else updateAll(form, state);
    };

    // INSERCIÓN (Antes del form para seguridad layout)
    const parent = form.parentElement;
    if (parent) parent.insertBefore(wrapper, form);
    else form.insertBefore(wrapper, form.firstChild);

    // SUBMIT HANDLER (Native + Sync)
    const btn = form.querySelector('.js-addtocart, input[type="submit"], button[type="submit"]');
    if (btn) setupNativeButton(form, btn, state);
}

// Actualiza Overlay + Hidden Inputs al mismo tiempo
function updateAll(form, state, placeholder = "") {
    // 1. Update Preview Overlay
    updateOverlay(form, state, placeholder);

    // 2. Update Hidden Inputs (Real-time sync)
    const val = `${state.text} | Color: ${state.color} | Fuente: ${state.font.split(',')[0]} | Pos: ${state.posX}%,${state.posY}%`;

    let i1 = form.querySelector('input[name="properties[Personalizacion]"]');
    if (!i1) { i1 = document.createElement('input'); i1.type = 'hidden'; i1.name = 'properties[Personalizacion]'; form.appendChild(i1); }
    if (state.active && state.text) i1.value = val; else i1.value = ""; // Limpiar si no activo

    let i2 = form.querySelector('input[name="comment"]');
    if (!i2) { i2 = document.createElement('input'); i2.type = 'hidden'; i2.name = 'comment'; form.appendChild(i2); }
    if (state.active && state.text) i2.value = val; else i2.value = "";
}

function updateOverlay(form, state, placeholder = "") {
    // Buscamos MÚLTIPLES imágenes grandes
    let container = form.closest('.js-product-container, .product-container') || document.body;
    const images = Array.from(container.querySelectorAll('img'));

    // Inyectamos el texto en TODAS las imagenes candidatas para que al cambiar de slide se vea
    images.forEach(img => {
        if (img.offsetParent && img.width > 250) {
            const p = img.parentElement;
            if (getComputedStyle(p).position === 'static') p.style.position = 'relative';
            p.classList.add('custom-overlay-container');

            let txt = p.querySelector('.custom-text-overlay');
            if (!txt) {
                txt = document.createElement('div');
                txt.className = 'custom-text-overlay';
                p.appendChild(txt);
            }

            const val = state.text || placeholder;
            txt.innerText = val;
            txt.style.color = state.color;
            txt.style.fontFamily = state.font;
            txt.style.display = (state.active && val) ? 'block' : 'none';
            txt.style.left = state.posX + '%';
            txt.style.top = state.posY + '%';
        }
    });
}

function setupNativeButton(form, btn, state) {
    // Clonamos botón para remover eventos legacy
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', (e) => {
        if (state.active && state.text) {
            e.preventDefault();
            // Feedback Visual
            const originalText = newBtn.innerText;
            newBtn.innerText = "Guardando...";
            newBtn.disabled = true;
            newBtn.style.opacity = "0.7";

            // Los inputs ya están actualizados por updateAll(), así que mandamos submit
            setTimeout(() => {
                HTMLFormElement.prototype.submit.call(form);
            }, 300); // Pequeño delay dramático para asegurar DOM update
        } else {
            // Flujo normal
            e.preventDefault();
            HTMLFormElement.prototype.submit.call(form);
        }
    });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
setInterval(init, 2000);
