console.log("🚀 Customily V3.3: Robust Cart Integration");

// --- 1. UI CSS (Misma estética premium) ---
const styles = `
    .custom-variant-container { margin: 25px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .custom-variant-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .custom-variant-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #111; }
    .custom-variant-selected { font-size: 13px; font-weight: 400; color: #666; text-transform: capitalize; }
    .custom-variant-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
    .custom-pill { padding: 10px 20px; border: 1px solid #e0e0e0; border-radius: 6px; cursor: pointer; background: #fff; color: #333; font-size: 14px; transition: all 0.2s; min-width: 60px; text-align: center; }
    .custom-pill:hover { border-color: #999; }
    .custom-pill.active { background: #111; color: #fff; border-color: #111; }
    .custom-swatch { width: 42px; height: 42px; border-radius: 50%; cursor: pointer; border: 2px solid #fff; box-shadow: 0 0 0 1px #ddd; transition: all 0.2s; position: relative; }
    .custom-swatch:hover { transform: scale(1.1); }
    .custom-swatch.active { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #111; transform: scale(1.15); }
    .custom-swatch.white-swatch { background: #fff; background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%); background-size: 10px 10px; }
    .custom-text-panel { margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px; border: 1px solid #eee; }
    .custom-input-text { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 16px; }
    .custom-overlay-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-90deg); color: white; font-size: 40px; font-weight: 700; pointer-events: none; z-index: 100; text-shadow: 0 2px 8px rgba(0,0,0,0.4); font-family: 'Helvetica', sans-serif; text-transform: uppercase; white-space: nowrap; }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const COLOR_MAP = {
    'negro': '#000000', 'black': '#000000', 'blanco': '#ffffff', 'white': '#ffffff',
    'rojo': '#D32F2F', 'red': '#D32F2F', 'azul': '#1976D2', 'blue': '#1976D2',
    'verde': '#388E3C', 'green': '#388E3C', 'rosa': '#E91E63', 'pink': '#E91E63',
    'amarillo': '#FBC02D', 'yellow': '#FBC02D', 'gris': '#9E9E9E', 'grey': '#9E9E9E',
    'violeta': '#8E24AA', 'purple': '#8E24AA', 'naranja': '#F57C00', 'orange': '#F57C00',
    'marron': '#795548', 'brown': '#795548', 'dorado': '#FFD700', 'gold': '#FFD700'
};

let activeText = "";

function initSystem() {
    if (!window.location.pathname.includes('/productos/')) return;

    // Buscar contenedor nativo
    const originalVariantContainer = document.querySelector('.js-product-variants, .product-variants');
    if (!originalVariantContainer) {
        initTextFieldOnly();
        return;
    }
    if (document.getElementById('custom-ui-root')) return;

    // Ocultar nativo
    originalVariantContainer.style.display = 'none';
    originalVariantContainer.parentElement.querySelectorAll('label:not(.custom-label)').forEach(l => l.style.display = 'none');

    // Construir UI
    const root = document.createElement('div');
    root.id = 'custom-ui-root';
    root.className = 'custom-variant-container';

    // Generar botones
    originalVariantContainer.querySelectorAll('select').forEach((select) => {
        const wrapper = document.createElement('div');
        let labelText = "Opción";
        const parentGroup = select.closest('.js-product-variants-group, .product-variants-group');
        if (parentGroup && parentGroup.querySelector('label')) {
            labelText = parentGroup.querySelector('label').innerText.replace(':', '').trim();
        }

        const header = document.createElement('div');
        header.className = 'custom-variant-header';
        header.innerHTML = `<span class="custom-variant-title">${labelText}</span><span class="custom-variant-selected"></span>`;
        wrapper.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'custom-variant-grid';
        const isColorType = /color|cor|colour/i.test(labelText);

        Array.from(select.options).forEach(opt => {
            if (!opt.value) return;
            const val = opt.text.trim();
            const cleanVal = val.split('(')[0].trim();
            const btn = document.createElement('div');
            btn.title = cleanVal;

            if (isColorType) {
                btn.className = 'custom-swatch';
                const hex = getHexColor(cleanVal);
                btn.style.backgroundColor = hex;
                if (hex === '#ffffff' || hex === 'transparent') btn.classList.add('white-swatch');
            } else {
                btn.className = 'custom-pill';
                btn.innerText = cleanVal;
            }

            if (select.value === opt.value) {
                btn.classList.add('active');
                header.querySelector('.custom-variant-selected').innerText = cleanVal;
                updateProductImageOverlay();
            }

            btn.addEventListener('click', () => {
                grid.querySelectorAll('.active').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                header.querySelector('.custom-variant-selected').innerText = cleanVal;
                select.value = opt.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                setTimeout(() => updateProductImageOverlay(), 400);
            });
            grid.appendChild(btn);
        });
        wrapper.appendChild(grid);
        root.appendChild(wrapper);
    });

    root.appendChild(createTextPanel());
    originalVariantContainer.parentNode.insertBefore(root, originalVariantContainer);

    // Preparar inputs ocultos en el formulario nativo DESDE EL INICIO
    prepareFormInputs();

    // Activar Hijack
    interceptAddToCart();
    startImageWatch();
}

function createTextPanel() {
    const p = document.createElement('div');
    p.className = 'custom-text-panel';
    p.innerHTML = '<div class="custom-variant-title" style="margin-bottom:10px">✍️ PERSONALIZACIÓN</div>';

    // Este input es para el usuario visualmente
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'custom-input-text';
    input.placeholder = 'Escribe tu nombre... (Máx 12)';
    input.maxLength = 12;
    input.id = 'visual-text-input';

    input.addEventListener('input', (e) => {
        activeText = e.target.value.toUpperCase();
        updateProductImageOverlay();
        syncInputs(activeText); // Sincronizar con campos ocultos
    });

    p.appendChild(input);
    return p;
}

function prepareFormInputs() {
    const form = document.querySelector('.js-product-form, .js-addtocart-form, form[action*="/cart/add"]');
    if (!form) return;

    // Creamos inputs ocultos que viajan "naturalmente" con el form
    // Usamos 'note' como fallback seguro si 'properties' falla
    if (!form.querySelector('input[name="properties[Personalizacion]"]')) {
        const i1 = document.createElement('input');
        i1.type = 'hidden';
        i1.name = 'properties[Personalizacion]';
        i1.id = 'hidden-prop-input';
        form.appendChild(i1);
    }
}

function syncInputs(text) {
    const i1 = document.getElementById('hidden-prop-input');
    if (i1) i1.value = text;
}

// --- SECUESTRO AJAX INTELIGENTE ---
function interceptAddToCart() {
    const form = document.querySelector('.js-product-form, .js-addtocart-form, form[action*="/cart/add"]');
    const btn = form ? form.querySelector('.js-addtocart, input[type="submit"], button[type="submit"]') : null;

    if (btn && form) {
        console.log("🛡️ Activando protocolo de compra segura...");

        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Texto del botón
            const originalText = newBtn.value || newBtn.innerText;
            if (newBtn.tagName === 'INPUT') newBtn.value = "Procesando...";
            else newBtn.innerText = "Procesando...";
            newBtn.disabled = true;

            const textValue = activeText;
            console.log("🛒 Intentando agregar al carrito:", textValue);

            // Intentar usar la API oficial LS si existe (Método 1 - El mejor)
            if (typeof LS !== 'undefined' && LS.addToCart) {
                console.log("✅ Usando LS.addToCart API oficial");
                // Buscar variante seleccionada
                const variantInput = form.querySelector('input[name="variation_id"], select[name="variation_id"]');
                const variantId = variantInput ? variantInput.value : null;

                if (variantId) {
                    // LS.addToCart(id, qty, callback) - No acepta properties directamente en versiones viejas
                    // Así que usaremos AJAX directo a /cart/add
                    directAjaxAdd(form, newBtn, originalText);
                } else {
                    // Fallback a submit nativo
                    console.log("⚠️ No se encontró ID variante, usando submit nativo");
                    form.submit();
                }
            } else {
                // Método 2 - AJAX Directo a /cart/add
                console.log("✅ Usando AJAX Directo /cart/add");
                directAjaxAdd(form, newBtn, originalText);
            }
        });
    }
}

function directAjaxAdd(form, btn, originalText) {
    const formData = new FormData(form);

    // Asegurar que nuestra personalización vaya
    if (activeText) {
        formData.set('properties[Personalizacion]', activeText);
    }

    // URL Absoluta estándar de Tiendanube
    const url = '/cart/add';

    fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => {
            // Tiendanube a veces devuelve redirect (status 200 pero url cambia) o JSON
            if (response.ok) {
                console.log("🎉 Éxito AJAX");
                window.location.href = '/cart'; // Ir al carrito para verificar
            } else {
                throw new Error('Error en respuesta AJAX');
            }
        })
        .catch(err => {
            console.error("⚠️ Falló AJAX, intentando submit nativo (Fallback)...", err);
            // PLAN Z: Enviar formulario nativo (recargará la página)
            // Ya tenemos los inputs ocultos inyectados, así que deberían viajar
            form.submit();
        });
}

function getHexColor(name) {
    const k = name.toLowerCase().replace(/\s/g, '');
    for (const key in COLOR_MAP) { if (k.includes(key)) return COLOR_MAP[key]; }
    return '#eee';
}

function updateProductImageOverlay() { /* Logic maintained */
    /* ... (Mismo código de overlay que funciona bien) ... */
    const images = document.querySelectorAll('.js-product-slide-img, .product-image-container img');
    let target = null;
    images.forEach(img => { if (img.offsetParent !== null && img.clientWidth > 100) target = img.parentElement; });
    if (target) {
        if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
        const old = target.querySelector('.custom-overlay-text');
        if (old) old.remove();
        const overlay = document.createElement('div');
        overlay.className = 'custom-overlay-text';
        overlay.innerText = activeText || "TU NOMBRE";
        overlay.style.opacity = activeText ? '1' : '0.6';
        target.appendChild(overlay);
    }
}

function startImageWatch() { setInterval(() => updateProductImageOverlay(), 800); }
function initTextFieldOnly() { /* ... */ }

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSystem);
else initSystem();
