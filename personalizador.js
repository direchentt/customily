console.log("🚀 Customily V4.2: EXTREME DETECTION MODE");

// CSS
const styles = `
    .custom-trigger-btn {
        width: 100%; padding: 12px; margin: 15px 0; background: #f0f0f0; border: 1px solid #ccc;
        border-radius: 4px; color: #333; font-weight: bold; cursor: pointer; display: flex;
        align-items: center; justify-content: center; gap: 8px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px;
    }
    .custom-trigger-btn:hover { background: #e0e0e0; }
    .custom-trigger-btn.active { background: #333; color: #fff; border-color: #333; }
    .custom-panel { display: none; padding: 15px; background: #fff; border: 1px solid #eee; margin-bottom: 20px; }
    .custom-panel.visible { display: block; }
    .custom-input { width: 100%; padding: 10px; border: 1px solid #ccc; margin-bottom: 10px; }
    .custom-options-row { display: flex; gap: 10px; margin-bottom: 10px; }
    .custom-color-circle { width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 1px solid #ddd; }
    .custom-font-pill { padding: 5px 10px; border: 1px solid #ddd; cursor: pointer; font-size: 12px; }
    .custom-overlay-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-90deg); color: white; font-size: 30px; font-weight: 700; pointer-events: none; z-index: 99; white-space: nowrap; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const FONTS = [{ name: 'Moderna', family: 'Helvetica' }, { name: 'Clásica', family: 'Times' }, { name: 'Cursiva', family: 'Brush Script MT' }];
const COLORS = [{ hex: '#FFFFFF' }, { hex: '#000000' }, { hex: '#FFD700' }, { hex: '#FF69B4' }];

function init() {
    // 1. INTENTO DE BÚSQUEDA AMPLIA
    // Buscamos cualquier formulario que parezca de producto
    const candidates = document.querySelectorAll('form[action*="/cart/add"], .js-product-form, #product_form');

    if (candidates.length === 0) {
        console.warn("⚠️ Customily: No encontré formularios todavía. Reintentando...");
        return;
    }

    console.log(`✅ Customily: Encontrados ${candidates.length} formularios candidatos.`);
    candidates.forEach(inject);
}

function inject(form) {
    if (form.dataset.customilyReady) return;
    form.dataset.customilyReady = "true";

    console.log("💉 Inyectando en:", form);

    // Estado local
    let active = false;
    let text = "";
    let color = COLORS[0].hex;
    let font = FONTS[0].family;

    // UI Elements
    const trigger = document.createElement('div');
    trigger.className = 'custom-trigger-btn';
    trigger.innerHTML = '<span>✨ Personalizar (+ $0)</span>';

    const panel = document.createElement('div');
    panel.className = 'custom-panel';
    panel.innerHTML = '<label style="display:block;margin-bottom:5px;font-size:12px;font-weight:bold;">NOMBRE / FRASE:</label>';

    const input = document.createElement('input');
    input.className = 'custom-input';
    input.placeholder = 'Escribe aquí...';
    input.addEventListener('input', e => { text = e.target.value; updatePreview(form, text, color, font, active); });
    panel.appendChild(input);

    const cRow = document.createElement('div');
    cRow.className = 'custom-options-row';
    COLORS.forEach(c => {
        const d = document.createElement('div'); d.className = 'custom-color-circle'; d.style.background = c.hex;
        d.onclick = () => { color = c.hex; updatePreview(form, text, color, font, active); };
        cRow.appendChild(d);
    });
    panel.appendChild(cRow);

    const fRow = document.createElement('div');
    fRow.className = 'custom-options-row';
    FONTS.forEach(f => {
        const d = document.createElement('div'); d.className = 'custom-font-pill'; d.innerText = f.name;
        d.onclick = () => { font = f.family; updatePreview(form, text, color, font, active); };
        fRow.appendChild(d);
    });
    panel.appendChild(fRow);

    trigger.onclick = () => {
        active = !active;
        panel.classList.toggle('visible');
        trigger.classList.toggle('active');
        trigger.innerHTML = active ? 'CERRAR PERSONALIZACIÓN' : '✨ PERSONALIZAR (+ $0)';
        updatePreview(form, text, color, font, active); // Para mostrar/ocultar overlay
    };

    // PUNTO DE INSERCIÓN CRÍTICO
    // Intentamos encontrar el botón de compra para ponerlo ANTES
    const buyButton = form.querySelector('.js-addtocart, input[type="submit"], button[type="submit"], .js-prod-submit-form');

    if (buyButton) {
        // Inyectar antes del botón
        buyButton.parentNode.insertBefore(trigger, buyButton);
        buyButton.parentNode.insertBefore(panel, buyButton);
        hijack(form, buyButton, () => active ? `${text} | ${color} | ${font}` : null);
    } else {
        // Fallback: Si no encuentro botón, lo pongo al final del form
        console.warn("⚠️ No encontré botón de compra, insertando al final del formulario.");
        form.appendChild(trigger);
        form.appendChild(panel);
    }
}

function updatePreview(form, text, color, font, active) {
    if (!active && !text) return;

    // Buscar contenedor de imagen
    // Estrategia: Buscar .js-product-slide-img visible
    let img = null;
    const slides = document.querySelectorAll('.js-product-slide-img, .swiper-slide-active img, .product-image-container img');

    // Filtrar visibles
    slides.forEach(s => { if (s.offsetParent !== null && s.width > 50) img = s; });
    if (!img && slides.length > 0) img = slides[0]; // Fallback

    if (img) {
        const parent = img.parentElement;
        if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';

        let overlay = parent.querySelector('.custom-overlay-text');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'custom-overlay-text';
            parent.appendChild(overlay);
        }
        overlay.innerText = text;
        overlay.style.color = color;
        overlay.style.fontFamily = font;
        overlay.style.opacity = active ? 1 : 0;
    }
}

function hijack(form, btn, getData) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getData();
        console.log("🛒 Comprando con data:", data);

        // Input oculto fallback
        let hidden = form.querySelector('input[name="properties[Personalizacion]"]');
        if (!hidden) {
            hidden = document.createElement('input'); hidden.type = 'hidden'; hidden.name = 'properties[Personalizacion]';
            form.appendChild(hidden);
        }
        if (data) hidden.value = data;
        else hidden.remove(); // Si no hay data, no mandar campo vacío

        newBtn.innerText = "PROCESANDO...";

        // Enviar
        const fd = new FormData(form);
        fetch(form.action, { method: 'POST', body: fd, headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => {
                if (r.ok) window.location.href = '/cart';
                else form.submit();
            })
            .catch(() => form.submit());
    });
}

// Polling agresivo durante 10 segundos
let attempts = 0;
const interval = setInterval(() => {
    init();
    attempts++;
    if (attempts > 20) clearInterval(interval); // Parar a los 10 seg
}, 500);

// También al DOMReady
document.addEventListener('DOMContentLoaded', init);
window.onload = init;
