console.log("🚀 Personalizador Mágico v2.1: UI/UX Renacido");

/*
 * Este script reemplaza visualmente el sistema de variantes de Tiendanube
 * creando una interfaz moderna estilo App, pero secretamente sigue controlando
 * los selects originales para que el carrito, precio y stock funcionen perfecto.
 */

// SELECTORES CLAVE (Tiendanube varía según el tema, estos son los más comunes)
const SELECTOR_FORMULARIO = '.js-product-form, .js-addtocart-form, form[action*="/cart/add"]';
const SELECTOR_VARIATION_CONTAINER = '.js-product-variants, .product-variants'; // Contenedor original
const SELECTOR_IMAGEN = '.js-product-slide-img, .product-image-container img';

// MAPA DE COLORES INTELIGENTE (Para pintar los botoncitos)
const MAPA_COLORES = {
    'negro': '#000000', 'black': '#000000', 'preto': '#000000',
    'blanco': '#ffffff', 'white': '#ffffff', 'branco': '#ffffff',
    'rojo': '#D32F2F', 'red': '#D32F2F', 'vermelho': '#D32F2F',
    'azul': '#1976D2', 'blue': '#1976D2',
    'verde': '#388E3C', 'green': '#388E3C',
    'rosa': '#E91E63', 'pink': '#E91E63',
    'amarillo': '#FBC02D', 'yellow': '#FBC02D',
    'gris': '#9E9E9E', 'grey': '#9E9E9E', 'gray': '#9E9E9E',
    'naranja': '#F57C00', 'orange': '#F57C00',
    'violeta': '#8E24AA', 'purple': '#8E24AA',
    'marron': '#795548', 'brown': '#795548'
};

function iniciarUI() {
    if (!window.location.pathname.includes('/productos/')) return;

    // Esperar a que LS (LoadStore) esté listo
    if (typeof LS === 'undefined' || !LS.variants) {
        setTimeout(iniciarUI, 500);
        return;
    }

    console.log("🔎 Variantes detectadas:", LS.variants);

    const form = document.querySelector(SELECTOR_FORMULARIO);
    const containerOriginal = document.querySelector(SELECTOR_VARIATION_CONTAINER);

    if (form && containerOriginal && !document.getElementById('ui-renacida')) {

        // 1. OCULTAR LO FEO (Pero no borrarlo, lo necesitamos)
        containerOriginal.style.display = 'none'; // Ocultar selects nativos
        if (containerOriginal.parentElement.querySelector('label')) {
            // Ocultar labels sueltos si los hay
            containerOriginal.parentElement.querySelectorAll('label').forEach(l => l.style.display = 'none');
        }

        // 2. CONSTRUIR LO NUEVO
        const uiContainer = document.createElement('div');
        uiContainer.id = 'ui-renacida';
        uiContainer.style.marginBottom = "25px";
        uiContainer.style.fontFamily = "'Helvetica', sans-serif";

        // Analizar qué propiedades tiene este producto (Color, Talle, Modelo?)
        // Tiendanube guarda esto en LS.variants[0].option_values es un array de {option: id, box_type}
        // Pero es más fácil analizar los selects del HTML original para saber los nombres.

        // Vamos a deducirlo de las variantes:
        // LS.variants es un array de objetos variante. Cada una tiene "option0", "option1", etc.
        // Necesitamos saber qué ES "option0".
        // Normalmente Tiendanube expone `LS.product.options` que nos dice los nombres.

        let opciones = [];
        if (LS.product && LS.product.options) {
            opciones = LS.product.options; // Ej: ["Color", "Talle"]
        } else {
            // Fallback: tratar de adivinar por los selects
            const selects = containerOriginal.querySelectorAll('select');
            selects.forEach((s, index) => {
                const label = s.closest('.js-product-variants-group')?.querySelector('label')?.innerText || `Opción ${index + 1}`;
                opciones.push(label.replace(':', '').trim());
            });
        }

        console.log("🛠 Opciones a dibujar:", opciones);

        // Por cada opción (Ej: Color), construimos un bloque de botones
        opciones.forEach((nombreOpcion, index) => {
            const opcionIndex = index; // 0, 1, 2...

            // Obtener todos los valores posibles para esta opción (sin repetidos)
            // Recorremos LS.variants y sacamos "option0", "option1"...
            const valoresPosibles = [...new Set(LS.variants.map(v => v[`option${opcionIndex}`]))].filter(Boolean);

            if (valoresPosibles.length > 0) {
                // Crear Título de la Opción
                const label = document.createElement('h4');
                label.innerText = nombreOpcion.toUpperCase();
                label.style.fontSize = "12px";
                label.style.fontWeight = "bold";
                label.style.color = "#888";
                label.style.letterSpacing = "1px";
                label.style.margin = "0 0 10px 0";
                uiContainer.appendChild(label);

                // Contenedor de Botones (Pills o Círculos)
                const grid = document.createElement('div');
                grid.style.display = "flex";
                grid.style.flexWrap = "wrap";
                grid.style.gap = "10px";
                grid.style.marginBottom = "20px";

                valoresPosibles.forEach(valor => {
                    const btn = document.createElement('div');
                    btn.innerText = valor;
                    btn.classList.add(`btn-option-${opcionIndex}`); // Clase para control
                    btn.dataset.valor = valor;

                    // Estilos Base Clean & Modern
                    btn.style.padding = "10px 18px";
                    btn.style.border = "1px solid #e0e0e0";
                    btn.style.borderRadius = "30px"; // Píldora
                    btn.style.cursor = "pointer";
                    btn.style.fontSize = "14px";
                    btn.style.transition = "all 0.2s";
                    btn.style.background = "#fff";
                    btn.style.color = "#333";

                    // INTELIGENCIA DE COLOR 🎨
                    // Si la opción se llama "Color" (o similar) tratamos de pintarlo
                    const esColor = /color|cor/Ii.test(nombreOpcion);
                    const colorHex = MAPA_COLORES[valor.toLowerCase().trim()];

                    if (esColor && colorHex) {
                        btn.innerText = ""; // Sin texto dentro
                        btn.style.width = "35px";
                        btn.style.height = "35px";
                        btn.style.borderRadius = "50%"; // Círculo perfecto
                        btn.style.background = colorHex;
                        btn.title = valor; // Tooltip

                        // Si es blanco, ponerle un bordecito para que se vea
                        if (colorHex === '#ffffff') btn.style.border = "1px solid #ccc";
                        else btn.style.border = "1px solid transparent";
                    }

                    // Click -> Seleccionar
                    btn.addEventListener('click', () => {
                        // 1. Visual: Marcar como activo
                        grid.querySelectorAll('div').forEach(b => {
                            b.style.borderColor = "#e0e0e0";
                            b.style.background = esColor && MAPA_COLORES[b.dataset.valor.toLowerCase()] ? MAPA_COLORES[b.dataset.valor.toLowerCase()] : "#fff";
                            b.style.color = "#333";
                            b.style.transform = "scale(1)";
                            if (esColor && b.dataset.valor.toLowerCase() === 'blanco') b.style.border = "1px solid #ccc";
                        });

                        // Estilo Activo
                        if (esColor && colorHex) {
                            btn.style.transform = "scale(1.15)";
                            btn.style.borderColor = "#000"; // Anillo de selección
                            btn.style.boxShadow = "0 0 0 2px #fff, 0 0 0 4px #000"; // Doble anillo Pro
                        } else {
                            btn.style.background = "#000";
                            btn.style.borderColor = "#000";
                            btn.style.color = "#fff";
                        }

                        // 2. Lógica: Avisar al sistema nativo
                        seleccionarVarianteNativa(opcionIndex, valor);

                        // 3. Reactivar nuestro "Parásito de Texto" (para ajustar a nueva foto)
                        setTimeout(actualizarTextoFlotante, 300);
                    });

                    grid.appendChild(btn);
                });

                uiContainer.appendChild(grid);

                // Autoseleccionar el primero (o el que esté seleccionado ya)
                // TODO: Leer estado inicial
                if (grid.firstChild) grid.firstChild.click();
            }
        });

        // REINSERCIÓN DEL PANEL DE TEXTO PERSONAL
        // (El que hicimos antes, pero ahora estilizado para encajar)
        const panelTexto = construirPanelTexto();
        uiContainer.appendChild(panelTexto);

        // Insertar todo donde estaban las variantes viejas
        containerOriginal.parentNode.insertBefore(uiContainer, containerOriginal);

        // Iniciar el texto flotante
        actualizarTextoFlotante();
    }
}

function seleccionarVarianteNativa(indiceOpcion, valor) {
    // Aquí ocurre la magia sucia.
    // Buscamos los <select> originales y cambiamos su valor.
    const containerSelects = document.querySelector(SELECTOR_VARIATION_CONTAINER);
    const selects = containerSelects.querySelectorAll('select');

    if (selects[indiceOpcion]) {
        selects[indiceOpcion].value = valor;
        // Disparar evento 'change' para que Tiendanube sepa que cambiamos algo
        // y actualice precios, fotos y stock.
        selects[indiceOpcion].dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`🤖 Sincronizado: Opción ${indiceOpcion} -> ${valor}`);
    }
}

function construirPanelTexto() {
    const div = document.createElement('div');
    div.style.marginTop = "30px";
    div.style.paddingTop = "20px";
    div.style.borderTop = "1px solid #eee";

    const label = document.createElement('h4');
    label.innerText = "✍️ TEXTO PERSONALIZADO";
    label.style.fontSize = "12px";
    label.style.fontWeight = "bold";
    label.style.color = "#888";
    label.style.letterSpacing = "1px";
    label.style.marginBottom = "10px";
    div.appendChild(label);

    const input = document.createElement('input');
    input.type = "text";
    input.placeholder = "Escribe tu nombre... (Máx 12)";
    input.maxLength = 12;
    input.style.width = "100%";
    input.style.padding = "12px";
    input.style.border = "1px solid #ccc";
    input.style.borderRadius = "8px"; // Bordes suaves
    input.style.fontSize = "16px";
    input.style.outline = "none";
    input.style.transition = "border 0.2s";

    input.onfocus = () => input.style.border = "1px solid #000";
    input.onblur = () => input.style.border = "1px solid #ccc";

    input.addEventListener('input', (e) => {
        window.textoPersonalizadoGlobal = e.target.value.toUpperCase();
        actualizarTextoFlotante();

        // Guardar en input oculto
        let hidden = document.getElementById('hidden-custom-text');
        if (!hidden) {
            hidden = document.createElement('input');
            hidden.type = "hidden";
            hidden.id = "hidden-custom-text";
            hidden.name = "properties[Texto]";
            document.querySelector(SELECTOR_FORMULARIO).appendChild(hidden);
        }
        hidden.value = window.textoPersonalizadoGlobal;
    });

    div.appendChild(input);
    return div;
}

function actualizarTextoFlotante() {
    // Lógica para pegar el texto en la imagen ACTIVA
    const texto = window.textoPersonalizadoGlobal || "TU NOMBRE";

    // Buscar imagen visible
    const imgs = document.querySelectorAll(SELECTOR_IMAGEN);
    let imgActiva = null;
    imgs.forEach(img => {
        if (img.offsetParent !== null) imgActiva = img;
    });

    // Fallback
    if (!imgActiva && imgs.length > 0) imgActiva = imgs[0];

    if (imgActiva) {
        const contenedor = imgActiva.parentElement;
        if (getComputedStyle(contenedor).position === 'static') contenedor.style.position = 'relative';

        // Borrar anterior
        const viejo = document.getElementById('overlay-texto-flotante');
        if (viejo) viejo.remove();

        // Crear nuevo
        const overlay = document.createElement('div');
        overlay.id = 'overlay-texto-flotante';
        overlay.innerText = texto;
        overlay.style.position = "absolute";
        overlay.style.top = "50%";
        overlay.style.left = "50%";
        overlay.style.transform = "translate(-50%, -50%) rotate(-90deg)"; // Vertical
        overlay.style.color = "white";
        overlay.style.fontSize = "40px"; // Auto-escalable idealmente
        overlay.style.fontWeight = "bold";
        overlay.style.textShadow = "0 2px 4px rgba(0,0,0,0.5)";
        overlay.style.pointerEvents = "none";
        overlay.style.zIndex = "100";
        overlay.style.fontFamily = "sans-serif";
        overlay.style.letterSpacing = "2px";

        // Solo mostrar si hay texto escrito por usuario (opcional)
        // overlay.style.opacity = window.textoPersonalizadoGlobal ? "1" : "0.5";

        contenedor.appendChild(overlay);
    }
}

// Iniciar todo
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', iniciarUI);
} else {
    iniciarUI();
}
