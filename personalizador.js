console.log("🚀 Customily V5.0: STABLE RELEASE");

// ESTILOS (Optimizados)
const styles = `
    .custom-trigger-btn {
        width: 100%; padding: 12px; margin: 15px 0; background: #222; border: 1px solid #000;
        border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; display: flex;
        align-items: center; justify-content: center; gap: 8px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px;
        transition: background 0.3s;
    }
    .custom-trigger-btn:hover { background: #444; }
    .custom-trigger-btn.active { background: #fff; color: #333; border: 1px solid #ccc; }
    
    .custom-panel { display: none; padding: 15px; background: #f9f9f9; border: 1px solid #eee; margin-bottom: 20px; border-radius: 4px; }
    .custom-panel.visible { display: block; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

    .custom-label { display: block; font-size: 11px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; color: #666; }
    .custom-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 15px; font-size: 16px; }
    
    .custom-options-row { display: flex; gap: 10px; margin-bottom: 15px; align-items: center; }
    .custom-color-circle { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; border: 2px solid #fff; box-shadow: 0 0 0 1px #ccc; transition: transform 0.2s; }
    .custom-color-circle:hover { transform: scale(1.1); }
    .custom-color-circle.active { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #333; transform: scale(1.1); }
    
    .custom-font-pill { padding: 6px 12px; border: 1px solid #ddd; background: #fff; border-radius: 20px; cursor: pointer; font-size: 12px; transition: all 0.2s; }
    .custom-font-pill:hover { border-color: #999; }
    .custom-font-pill.active { background: #333; color: #fff; border-color: #333; }

    /* OVERLAY CRÍTICO */
    .custom-overlay-container { position: relative !important; display: block !important; }
    .custom-overlay-text { 
        position: absolute; top: 50%; left: 50%; 
        transform: translate(-50%, -50%) rotate(-90deg); 
        color: white; font-size: 3vw; /* Responsivo */
        font-weight: 700; pointer-events: none; z-index: 100; 
        white-space: nowrap; text-shadow: 0 2px 5px rgba(0,0,0,0.4); 
    }
    @media (min-width: 1024px) { .custom-overlay-text { font-size: 30px; } }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const FONTS = [{ name: 'Moderna', family: 'Helvetica, sans-serif' }, { name: 'Clásica', family: 'Times New Roman, serif' }, { name: 'Cursiva', family: 'Brush Script MT, cursive' }];
const COLORS = [{ hex: '#FFFFFF' }, { hex: '#000000' }, { hex: '#FFD700' }, { hex: '#FF69B4' }];

function init() {
    // Buscar formularios de agregar al carrito
    const forms = document.querySelectorAll('form[action*="/cart/add"]');
    if (forms.length > 0) forms.forEach(inject);
}

function inject(form) {
    if (form.dataset.customilyV5) return;
    form.dataset.customilyV5 = "true";

    // ESTADO
    const state = { active: false, text: "", color: COLORS[0].hex, font: FONTS[0].family };

    // --- DOM CREATION ---
    const trigger = document.createElement('div');
    trigger.className = 'custom-trigger-btn';
    trigger.innerHTML = '<span>✨ Personalizar (+ $0)</span>';

    const panel = document.createElement('div');
    panel.className = 'custom-panel';

    // Input
    panel.innerHTML += '<span class="custom-label">Escribe tu nombre:</span>';
    const input = document.createElement('input');
    input.className = 'custom-input';
    input.placeholder = 'Ej: SOFIA';
    input.maxLength = 12;
    input.addEventListener('input', (e) => {
        state.text = e.target.value;
        refreshPreview(form, state);
    });
    panel.appendChild(input);

    // Colores
    panel.innerHTML += '<span class="custom-label">Color del texto:</span>';
    const cRow = document.createElement('div');
    cRow.className = 'custom-options-row';
    COLORS.forEach(c => {
        const d = document.createElement('div'); d.className = 'custom-color-circle'; d.style.background = c.hex;
        if (c.hex === state.color) d.classList.add('active');
        d.onclick = () => {
            state.color = c.hex; refreshPreview(form, state);
            cRow.querySelectorAll('.active').forEach(x => x.classList.remove('active'));
            d.classList.add('active');
        };
        cRow.appendChild(d);
    });
    panel.appendChild(cRow);

    // Fuentes
    panel.innerHTML += '<span class="custom-label">Tipografía:</span>';
    const fRow = document.createElement('div');
    fRow.className = 'custom-options-row';
    FONTS.forEach(f => {
        const d = document.createElement('div'); d.className = 'custom-font-pill'; d.innerText = f.name; d.style.fontFamily = f.family;
        if (f.family === state.font) d.classList.add('active');
        d.onclick = () => {
            state.font = f.family; refreshPreview(form, state);
            fRow.querySelectorAll('.active').forEach(x => x.classList.remove('active'));
            d.classList.add('active');
        };
        fRow.appendChild(d);
    });
    panel.appendChild(fRow);

    // Lógica Abrir/Cerrar
    trigger.onclick = () => {
        state.active = !state.active;
        panel.classList.toggle('visible');
        trigger.classList.toggle('active');
        trigger.innerHTML = state.active ? 'Cerrar Personalización' : '✨ Personalizar (+ $0)';

        // Al abrir, mostramos preview aunque no haya texto (Placeholder)
        refreshPreview(form, state);
    };

    // INSERCIÓN
    const btn = form.querySelector('.js-addtocart, input[type="submit"], button[type="submit"]');
    if (btn) {
        btn.parentNode.insertBefore(trigger, btn);
        btn.parentNode.insertBefore(panel, btn);

        // INTERCEPTOR DE ENVÍO (Simplificado y Robusto)
        setupSafeSubmit(form, btn, state);
    } else {
        form.appendChild(trigger);
        form.appendChild(panel);
    }
}

function refreshPreview(form, state) {
    // Buscar la imagen más grande visible cerca del formulario
    // 1. Buscar en el contenedor del producto padre
    const productContainer = form.closest('.js-product-container, .product-container, .row') || document;

    // 2. Buscar todas las imágenes y quedarse con la visible más grande
    const images = Array.from(productContainer.querySelectorAll('img'));
    let bestImg = null;
    let maxArea = 0;

    images.forEach(img => {
        // Ignorar iconos pequeños o ocultos
        if (img.offsetParent === null) return;
        const area = img.offsetWidth * img.offsetHeight;
        if (area > 10000 && area > maxArea) { // Mínimo 100x100px
            maxArea = area;
            bestImg = img;
        }
    });

    if (bestImg) {
        const wrapper = bestImg.parentElement;
        wrapper.classList.add('custom-overlay-container'); // Force relative

        let overlay = wrapper.querySelector('.custom-overlay-text');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'custom-overlay-text';
            wrapper.appendChild(overlay);
        }

        // Mostrar
        const displayText = state.text || (state.active ? "TU TEXTO" : "");
        overlay.innerText = displayText;
        overlay.style.color = state.color;
        overlay.style.fontFamily = state.font;
        overlay.style.display = state.active ? 'block' : 'none';
        overlay.style.opacity = state.active ? '1' : '0';
    } else {
        console.warn("⚠️ Customily: No encontré imagen principal para preview.");
    }
}

function setupSafeSubmit(form, btn, state) {
    // CLONAR BOTÓN para eliminar eventos nativos problemáticos
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', (e) => {
        if (state.active && state.text) {
            e.preventDefault(); // Solo prevenimos si hay personalización

            // Feedback visual
            const oldText = newBtn.value || newBtn.innerText;
            if (newBtn.tagName === 'INPUT') newBtn.value = "Guardando..."; else newBtn.innerText = "Guardando...";
            newBtn.disabled = true;

            // Datos
            const finalData = `${state.text} | ${state.color} | ${state.font.split(',')[0]}`;

            // 1. INYECTAR INPUT OCULTO (Seguro de vida)
            let hidden = form.querySelector('input[name="properties[Personalizacion]"]');
            if (!hidden) {
                hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.name = 'properties[Personalizacion]';
                form.appendChild(hidden);
            }
            hidden.value = finalData;

            // 2. INTENTAR AJAX A /cart/add (Estándar)
            const formData = new FormData(form);
            // Asegurar que el dato viaja en FormData también
            formData.set('properties[Personalizacion]', finalData);

            fetch('/cart/add', {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
                .then(response => {
                    if (response.ok) {
                        window.location.href = '/cart'; // Éxito -> Carrito
                    } else {
                        console.warn("⚠️ AJAX falló, usando submit nativo fallback.");
                        form.submit(); // Fallo -> Submit clásico (funciona 99%)
                    }
                })
                .catch(err => {
                    console.error("⚠️ Error RED, usando submit nativo.", err);
                    form.submit(); // Error Red -> Submit clásico
                });

        } else {
            // Si NO hay personalización, dejar pasar el click normal (o hacer submit nativo)
            // Para asegurar compatibilidad con temas que usan JS en el submit, 
            // idealmente llamaríamos al botón original, pero como lo reemplazamos...
            // Hacemos submit directo del form.
            // OJO: Si el tema valida variantes con JS, esto podría saltar validación.
            // Riesgo aceptable para priorizar la personalización.
            // form.submit(); <-- Esto es muy agresivo.

            // Mejor: Si no hay personalización, usar lógica standard de agregar.
            // Como reemplazamos el botón, perdimos la lógica del tema.
            // Recreamos un add básico.
            e.preventDefault();
            const formData = new FormData(form);
            fetch('/cart/add', { method: 'POST', body: formData })
                .then(() => window.location.reload()) // Recargar para ver carrito (feedback básico)
                .catch(() => form.submit());
        }
    });
}

// ARRANQUE
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
setInterval(init, 2000); // Check periódico para modales
