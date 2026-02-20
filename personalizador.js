console.log("🚀 Customily V4.1: Aggressive Injection Hotfix");

// CSS (Mismo estilo)
const styles = `
    .custom-trigger-btn {
        width: 100%; padding: 12px; margin: 10px 0; background: #f8f9fa; border: 1px solid #ddd;
        border-radius: 6px; color: #333; font-weight: 600; cursor: pointer; display: flex;
        align-items: center; justify-content: center; gap: 8px; font-family: sans-serif;
    }
    .custom-trigger-btn:hover { background: #e9ecef; }
    .custom-trigger-btn.active { background: #e3f2fd; border-color: #2196f3; color: #1976d2; }
    .custom-panel { display: none; padding: 15px; background: #fff; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 6px 6px; margin-bottom: 20px; }
    .custom-panel.visible { display: block; }
    .custom-label { display: block; font-size: 12px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
    .custom-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 12px; }
    .custom-options-row { display: flex; gap: 10px; margin-bottom: 12px; }
    .custom-color-circle { width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid #fff; box-shadow: 0 0 0 1px #ddd; }
    .custom-color-circle.active { transform: scale(1.2); box-shadow: 0 0 0 2px #fff, 0 0 0 4px #333; }
    .custom-font-pill { padding: 6px 12px; border: 1px solid #ddd; border-radius: 20px; cursor: pointer; font-size: 12px; background: #fff; }
    .custom-font-pill.active { background: #333; color: #fff; }
    .custom-overlay-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-90deg); color: white; font-size: 30px; font-weight: 700; pointer-events: none; z-index: 999; text-shadow: 0 2px 4px rgba(0,0,0,0.5); white-space: nowrap; }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const FONTS = [{ name: 'Moderna', family: 'Helvetica' }, { name: 'Clásica', family: 'Times New Roman' }, { name: 'Cursiva', family: 'Brush Script MT' }];
const COLORS = [{ hex: '#FFFFFF' }, { hex: '#000000' }, { hex: '#FFD700' }, { hex: '#FF69B4' }];
const formStates = new WeakMap();

function searchAndDestroy() {
    // BUSCAR CUALQUIER FORM DE CARRITO (Selector muy amplio)
    const forms = document.querySelectorAll('form[action*="/cart/add"]');
    console.log("🔍 Buscando formularios...", forms.length, "encontrados");
    forms.forEach(injectApp);
}

function injectApp(form) {
    if (form.dataset.customilyInjected) return;
    form.dataset.customilyInjected = "true";

    // Estado local
    const state = { active: false, text: "", color: COLORS[0].hex, font: FONTS[0].family };
    formStates.set(form, state);

    // Crear UI
    const trigger = document.createElement('div');
    trigger.className = 'custom-trigger-btn';
    trigger.innerHTML = '<span>✨ Personalizar (+ $0)</span> <span>▼</span>';

    const panel = document.createElement('div');
    panel.className = 'custom-panel';

    // Input Texto
    panel.innerHTML += '<label class="custom-label">Tu Texto:</label>';
    const input = document.createElement('input');
    input.className = 'custom-input';
    input.placeholder = 'Tu nombre...';
    input.addEventListener('input', e => { state.text = e.target.value; updateOverlay(form, state); });
    panel.appendChild(input);

    // Colores
    const cDiv = document.createElement('div');
    cDiv.className = 'custom-options-row';
    COLORS.forEach(c => {
        const d = document.createElement('div');
        d.className = 'custom-color-circle'; d.style.background = c.hex;
        d.onclick = () => { state.color = c.hex; updateOverlay(form, state); };
        cDiv.appendChild(d);
    });
    panel.appendChild(cDiv);

    // Fuentes
    const fDiv = document.createElement('div');
    fDiv.className = 'custom-options-row';
    FONTS.forEach(f => {
        const p = document.createElement('div');
        p.className = 'custom-font-pill'; p.innerText = f.name;
        p.onclick = () => { state.font = f.family; updateOverlay(form, state); };
        fDiv.appendChild(p);
    });
    panel.appendChild(fDiv);

    // Toggle
    trigger.onclick = () => {
        state.active = !state.active;
        panel.classList.toggle('visible');
        trigger.innerHTML = state.active ? '<span>Cerrar Personalización</span> <span>▲</span>' : '<span>✨ Personalizar (+ $0)</span> <span>▼</span>';
    };

    // INSERCIÓN AGRESIVA: Buscar botón de submit o poner al final
    const btn = form.querySelector('input[type="submit"], button[type="submit"], .js-addtocart');
    if (btn) {
        form.insertBefore(trigger, btn);
        form.insertBefore(panel, btn);
        hijackSubmit(form, btn, state);
    } else {
        // Fallback: Si no hay botón claro, poner al final del form
        form.appendChild(trigger);
        form.appendChild(panel);
    }
}

function updateOverlay(form, state) {
    if (!state.text && !state.active) return;
    // Buscar imagen cercana (hacia arriba o global)
    let container = form.closest('.product-container') || document;
    let imgContainer = container.querySelector('.js-product-slide-img, .swiper-slide-active img, .product-image-container img')?.parentElement;

    if (imgContainer) {
        if (getComputedStyle(imgContainer).position === 'static') imgContainer.style.position = 'relative';
        let ov = imgContainer.querySelector('.custom-overlay-text');
        if (!ov) { ov = document.createElement('div'); ov.className = 'custom-overlay-text'; imgContainer.appendChild(ov); }
        ov.innerText = state.text;
        ov.style.color = state.color;
        ov.style.fontFamily = state.font;
        ov.style.opacity = state.active ? 1 : 0;
    }
}

function hijackSubmit(form, btn, state) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        newBtn.innerText = "Procesando...";
        const fd = new FormData(form);
        if (state.active && state.text) {
            fd.set('properties[Personalizacion]', `${state.text} | ${state.color} | ${state.font}`);
        }
        fetch(form.action, { method: 'POST', body: fd, headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => { if (r.ok) window.location.href = '/cart'; else form.submit(); })
            .catch(() => form.submit());
    });
}

// ARRANQUE MULTIPLE
document.addEventListener('DOMContentLoaded', searchAndDestroy);
window.onload = searchAndDestroy;
setInterval(searchAndDestroy, 1000); // Polling por seguridad (QuickView)
