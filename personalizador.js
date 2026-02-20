console.log("🚀 Personalizador PRO v1.0: Iniciando Suite de Diseño...");

const SELECTOR_IMAGEN = '.js-product-slide-img, .product-image-container img, .swiper-slide-active img';
const SELECTOR_FORMULARIO = '.js-addtocart, .js-product-form';

// Cargar Fabric.js dinámicamente (Librería profesional de diseño)
function cargarDependencias(callback) {
    if (window.fabric) {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
    script.onload = () => {
        console.log("✅ Fabric.js cargado exitosamente");
        callback();
    };
    document.head.appendChild(script);
}

function iniciarSuiteDiseño() {
    if (!window.location.pathname.includes('/productos/')) return;

    const imagenOriginal = document.querySelector(SELECTOR_IMAGEN);
    const formulario = document.querySelector(SELECTOR_FORMULARIO);

    if (imagenOriginal && formulario && !document.getElementById('canvas-container')) {

        // 1. Preparar el entorno
        const contenedorPadre = imagenOriginal.parentElement;
        contenedorPadre.style.position = "relative";

        // Crear wrapper para el canvas
        const canvasWrapper = document.createElement('div');
        canvasWrapper.id = 'canvas-container';
        canvasWrapper.style.position = "absolute";
        canvasWrapper.style.top = "0";
        canvasWrapper.style.left = "0";
        canvasWrapper.style.zIndex = "10";
        // Importante: modo mezcla para que parezca impreso en la tela
        canvasWrapper.style.mixBlendMode = "multiply";

        // Crear elemento Canvas
        const canvasElement = document.createElement('canvas');
        canvasElement.id = 't-shirt-canvas';
        canvasWrapper.appendChild(canvasElement);

        // Insertar el canvas SOBRE la imagen original
        // (No reemplazamos la imagen, la usamos de guía visual abajo)
        imagenOriginal.style.opacity = "0.8"; // Bajarle un poco el brillo para destacar el diseño
        contenedorPadre.appendChild(canvasWrapper);

        // Inicializar Fabric.js
        const canvas = new fabric.Canvas('t-shirt-canvas');

        // Ajustar tamaño del canvas al de la imagen
        const rect = imagenOriginal.getBoundingClientRect();
        canvas.setWidth(rect.width);
        canvas.setHeight(rect.height);

        // Responsive: Si la ventana cambia, ajustar (básico)
        window.addEventListener('resize', () => {
            const newRect = imagenOriginal.getBoundingClientRect();
            canvas.setWidth(newRect.width);
            canvas.setHeight(newRect.height);
            canvas.renderAll();
        });

        // ---------------------------------------------------------
        // 2. Construir la Caja de Herramientas (Toolbox)
        // ---------------------------------------------------------
        crearPanelHerramientas(formulario, canvas);

        console.log("🎨 Suite de diseño activa");
    }
}

function crearPanelHerramientas(formulario, canvas) {
    const panel = document.createElement('div');
    panel.style.background = "#fff";
    panel.style.border = "1px solid #e1e1e1";
    panel.style.borderRadius = "8px";
    panel.style.padding = "20px";
    panel.style.marginBottom = "20px";
    panel.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";

    const titulo = document.createElement('h3');
    titulo.innerText = "🛠 ESTUDIO DE PERSONALIZACIÓN";
    titulo.style.fontSize = "16px";
    titulo.style.borderBottom = "2px solid #000";
    titulo.style.paddingBottom = "10px";
    titulo.style.marginBottom = "15px";
    panel.appendChild(titulo);

    // --- SECCIÓN: TEXTO ---
    const btnTexto = crearBoton("Agregar Texto (Aa)", "📝");
    btnTexto.onclick = (e) => {
        e.preventDefault();
        const texto = new fabric.IText('TU TEXTO', {
            left: canvas.width / 2 - 50,
            top: canvas.height / 3,
            fontFamily: 'arial',
            fill: '#000000',
            fontSize: 40
        });
        canvas.add(texto);
        canvas.setActiveObject(texto);
    };

    // --- SECCIÓN: IMAGEN ---
    const inputImagen = document.createElement('input');
    inputImagen.type = 'file';
    inputImagen.accept = 'image/*';
    inputImagen.style.display = 'none';
    inputImagen.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (f) => {
            fabric.Image.fromURL(f.target.result, (img) => {
                img.scaleToWidth(200);
                img.set({
                    left: canvas.width / 2 - 100,
                    top: canvas.height / 2 - 100
                });
                canvas.add(img);
                canvas.setActiveObject(img);
            });
        };
        reader.readAsDataURL(e.target.files[0]);
    };

    const btnImagen = crearBoton("Subir Logo/Foto", "📸");
    btnImagen.onclick = (e) => {
        e.preventDefault();
        inputImagen.click();
    };

    // --- SECCIÓN: COLORES ---
    const colorPicker = document.createElement('input');
    colorPicker.type = "color";
    colorPicker.value = "#000000";
    colorPicker.style.marginLeft = "10px";
    colorPicker.style.cursor = "pointer";
    colorPicker.onchange = (e) => {
        const obj = canvas.getActiveObject();
        if (obj) {
            obj.set('fill', e.target.value);
            canvas.renderAll();
        }
    };

    // --- SECCIÓN: BORRAR ---
    const btnBorrar = crearBoton("Borrar Seleccionado", "🗑️");
    btnBorrar.style.background = "#ffebee";
    btnBorrar.style.color = "#c62828";
    btnBorrar.style.border = "1px solid #ffcdd2";
    btnBorrar.onclick = (e) => {
        e.preventDefault();
        const obj = canvas.getActiveObject();
        if (obj) canvas.remove(obj);
    };

    // Estructura del panel
    const filaBotones = document.createElement('div');
    filaBotones.style.display = "flex";
    filaBotones.style.gap = "10px";
    filaBotones.style.flexWrap = "wrap";

    filaBotones.appendChild(btnTexto);
    filaBotones.appendChild(btnImagen);
    filaBotones.appendChild(colorPicker);

    panel.appendChild(filaBotones);
    panel.appendChild(document.createElement('br'));
    panel.appendChild(btnBorrar);
    panel.appendChild(inputImagen); // Input oculto

    // Interceptar el envío del formulario para guardar datos
    interceptarCompra(formulario, canvas);

    // Insertar en la página
    formulario.parentNode.insertBefore(panel, formulario);
}

function crearBoton(texto, icono) {
    const btn = document.createElement('button');
    btn.innerHTML = `${icono} ${texto}`;
    btn.style.padding = "10px 15px";
    btn.style.border = "1px solid #ccc";
    btn.style.background = "#f8f9fa";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.fontWeight = "bold";
    btn.style.fontSize = "13px";
    btn.style.transition = "all 0.2s";

    btn.onmouseover = () => btn.style.background = "#e2e6ea";
    btn.onmouseout = () => btn.style.background = "#f8f9fa";

    return btn;
}

function interceptarCompra(formulario, canvas) {
    // Buscar el botón de submit real
    const btnSubmit = formulario.querySelector('input[type="submit"], button[type="submit"]');

    if (btnSubmit) {
        btnSubmit.addEventListener('click', (e) => {
            // Nota: En Tiendanube puro no podemos subir la imagen al servidor fácilmente sin backend.
            // Lo que haremos es guardar un resumen de texto en los atributos del carrito si es posible,
            // o al menos dejar preparado el hook.

            // Generar imagen base64 (para uso futuro o guardar en localstorage)
            const diseñoFinal = canvas.toDataURL({ format: 'png' });
            console.log("🎁 Diseño generado (listo para enviar):", diseñoFinal.substring(0, 50) + "...");

            // Aquí podríamos intentar inyectar un input hidden si el theme lo soporta
            // const inputHidden = document.createElement('input');
            // inputHidden.type = 'hidden';
            // inputHidden.name = 'properties[Diseño]';
            // inputHidden.value = 'Diseño personalizado generado por el usuario';
            // formulario.appendChild(inputHidden);
        });
    }
}

// Iniciar proceso
cargarDependencias(() => {
    let intentos = 0;
    const intervalo = setInterval(() => {
        iniciarSuiteDiseño();
        intentos++;
        if (intentos > 20) clearInterval(intervalo);
    }, 500);
});
