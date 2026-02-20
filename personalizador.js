console.log("🚀 Customily V3.2: AJAX Hijack Edition");

// --- INICIO CÓDIGO UI (CSS Y DOM) ---
// (Mantenemos la estética que te gustó)

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

    const originalVariantContainer = document.querySelector('.js-product-variants, .product-variants');
    if (!originalVariantContainer) {
        initTextFieldOnly();
        return;
    }
    if (document.getElementById('custom-ui-root')) return;

    // 1. Ocultar Nativo
    originalVariantContainer.style.display = 'none';
    const looseLabels = originalVariantContainer.parentElement.querySelectorAll('label:not(.custom-label)');
    looseLabels.forEach(l => l.style.display = 'none');

    // 2. Crear UI Nueva
    const root = document.createElement('div');
    root.id = 'custom-ui-root';
    root.className = 'custom-variant-container';

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

    // 3. ACTIVAR EL SECUESTRO AJAX
    interceptAddToCart();
    startImageWatch();
}

function createTextPanel() {
    const p = document.createElement('div');
    p.className = 'custom-text-panel';
    p.innerHTML = '<div class="custom-variant-title" style="margin-bottom:10px">✍️ PERSONALIZACIÓN</div>';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'custom-input-text';
    input.placeholder = 'Escribe tu nombre... (Máx 12)';
    input.maxLength = 12;
    input.name = 'properties[Personalizacion]'; // Intento nativo standard
    input.id = 'custom-text-input'; // ID para encontrarlo fácil

    input.addEventListener('input', (e) => {
        activeText = e.target.value.toUpperCase();
        updateProductImageOverlay();
    });

    p.appendChild(input);
    return p;
}

// --- SECUESTRO AJAX (LA CLAVE) ---
function interceptAddToCart() {
    const form = document.querySelector('.js-product-form, .js-addtocart-form, form[action*="/cart/add"]');
    const btn = form ? form.querySelector('.js-addtocart, input[type="submit"], button[type="submit"]') : null;

    if (btn && form) {
        console.log("🕵️‍♂️ AJAX Hijack Activado en botón:", btn);

        // CLONAR el botón para eliminar eventos de temas que bloquean (Remove Event Listeners hack)
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault(); // DETENER ENVÍO NATIVO
            e.stopPropagation();

            const textValue = document.getElementById('custom-text-input')?.value || "";

            console.log("🚀 Iniciando compra AJAX con texto:", textValue);

            // Cambiar texto botón a "Agregando..."
            const originalText = newBtn.value || newBtn.innerText;
            if (newBtn.tagName === 'INPUT') newBtn.value = "Guardando...";
            else newBtn.innerText = "Guardando...";
            newBtn.disabled = true;

            // Construir FormData con TODOS los datos del form (incluyendo nuestro input si está dentro)
            // Si nuestro input no está en el form, lo agregamos manualmente
            const formData = new FormData(form);

            // Forzar el dato "extra" por si acaso
            if (textValue) {
                formData.set('properties[Personalizacion]', textValue);
                // Intento extra: a veces TN usa 'note'
                // formData.append('note', `Personalización: ${textValue}`); 
            }

            // ENVIAR FETCH
            const actionUrl = form.action;
            fetch(actionUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest' // Para que TN sepa que es Ajax
                }
            })
                .then(response => {
                    if (response.ok) {
                        console.log("✅ Producto agregado con personalización!");
                        // Redirigir al carrito para asegurar que el usuario vea que funcionó
                        // (Ya no podemos abrir el side-cart del tema porque lo rompimos al clonar el botón)
                        window.location.href = '/checkout';
                    } else {
                        console.error("❌ Error en backend:", response);
                        alert("Hubo un error al agregar. Intenta de nuevo.");
                        newBtn.disabled = false;
                        if (newBtn.tagName === 'INPUT') newBtn.value = originalText;
                        else newBtn.innerText = originalText;
                    }
                })
                .catch(error => {
                    console.error("❌ Error de red:", error);
                    // Fallback: Soltar el formulario nativo si falla el fetch
                    form.submit();
                });
        });
    }
}

function getHexColor(name) {
    const k = name.toLowerCase().replace(/\s/g, '');
    for (const key in COLOR_MAP) { if (k.includes(key)) return COLOR_MAP[key]; }
    return '#eee';
}

function updateProductImageOverlay() {
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
function initTextFieldOnly() { /* ... fallback ... */ }

// ARRANQUE
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSystem);
else initSystem();
