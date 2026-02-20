console.log("🚀 Personalizador Estable v1.0: Modo Texto + Carrito");

const SELECTOR_IMAGEN = '.js-product-slide-img, .product-image-container img, .swiper-slide-active img';
const SELECTOR_FORMULARIO = '.js-addtocart, .js-product-form';

function iniciarPersonalizador() {
    if (!window.location.pathname.includes('/productos/')) return;

    const imagen = document.querySelector(SELECTOR_IMAGEN);
    const formulario = document.querySelector(SELECTOR_FORMULARIO);

    // Evitar duplicados
    if (imagen && formulario && !document.getElementById('customily-container')) {

        // 1. Crear el Contenedor Visual (Overlay)
        const contenedorImagen = imagen.parentElement;
        contenedorImagen.style.position = "relative";

        const textoOverlay = document.createElement('div');
        textoOverlay.id = 'preview-texto';
        textoOverlay.innerText = "TU TEXTO";
        textoOverlay.style.position = "absolute";
        textoOverlay.style.top = "50%";
        textoOverlay.style.left = "50%";
        textoOverlay.style.transform = "translate(-50%, -50%)"; // Centrado perfecto
        textoOverlay.style.color = "white"; // Default blanco
        textoOverlay.style.fontSize = "30px";
        textoOverlay.style.fontWeight = "bold";
        textoOverlay.style.textAlign = "center";
        textoOverlay.style.textShadow = "2px 2px 4px rgba(0,0,0,0.8)";
        textoOverlay.style.pointerEvents = "none"; // Para no bloquear la imagen
        textoOverlay.style.zIndex = "100";
        textoOverlay.style.maxWidth = "80%";
        textoOverlay.style.wordWrap = "break-word";

        contenedorImagen.appendChild(textoOverlay);

        // 2. Crear el Panel de Control (Inputs)
        const panel = document.createElement('div');
        panel.id = 'customily-container';
        panel.style.background = "#f8f9fa";
        panel.style.padding = "15px";
        panel.style.borderRadius = "8px";
        panel.style.marginBottom = "20px";
        panel.style.border = "1px solid #ddd";

        // Título del Panel
        const titulo = document.createElement('h4');
        titulo.innerText = "✏️ Personaliza tu Producto";
        titulo.style.marginTop = "0";
        titulo.style.marginBottom = "10px";
        titulo.style.fontSize = "16px";
        panel.appendChild(titulo);

        // Input de TEXTO
        const inputTexto = document.createElement('input');
        inputTexto.type = "text";
        inputTexto.placeholder = "Escribe tu nombre o frase...";
        inputTexto.style.width = "100%";
        inputTexto.style.padding = "10px";
        inputTexto.style.marginBottom = "10px";
        inputTexto.style.borderRadius = "5px";
        inputTexto.style.border = "1px solid #ccc";
        inputTexto.addEventListener('input', (e) => {
            const val = e.target.value;
            textoOverlay.innerText = val || "TU TEXTO";
            actualizarInputOculto();
        });
        panel.appendChild(inputTexto);

        // Selector de COLOR DE TEXTO
        const labelColor = document.createElement('label');
        labelColor.innerText = "Color del Texto:";
        labelColor.style.display = "block";
        labelColor.style.marginTop = "10px";
        labelColor.style.fontSize = "14px";
        panel.appendChild(labelColor);

        const colores = [
            { nombre: "Blanco", hex: "#FFFFFF" },
            { nombre: "Negro", hex: "#000000" },
            { nombre: "Rojo", hex: "#D32F2F" },
            { nombre: "Azul", hex: "#1976D2" },
            { nombre: "Dorado", hex: "#FFD700" }
        ];

        const contenedorColores = document.createElement('div');
        contenedorColores.style.display = "flex";
        contenedorColores.style.gap = "10px";
        contenedorColores.style.marginTop = "5px";

        let colorSeleccionado = "Blanco"; // Default

        colores.forEach(c => {
            const btnColor = document.createElement('div');
            btnColor.style.width = "30px";
            btnColor.style.height = "30px";
            btnColor.style.borderRadius = "50%";
            btnColor.style.backgroundColor = c.hex;
            btnColor.style.border = "2px solid #ddd";
            btnColor.style.cursor = "pointer";
            btnColor.title = c.nombre;

            btnColor.addEventListener('click', () => {
                // Quitar selección visual a todos
                Array.from(contenedorColores.children).forEach(b => b.style.transform = "scale(1)");
                // Seleccionar este
                btnColor.style.transform = "scale(1.2)";
                btnColor.style.borderColor = "#333";

                // Aplicar
                textoOverlay.style.color = c.hex;
                colorSeleccionado = c.nombre;
                actualizarInputOculto();
            });
            contenedorColores.appendChild(btnColor);
        });
        panel.appendChild(contenedorColores);

        // 3. LA CLAVE: Guardar en el Pedido (Propiedades de Línea)
        // Creamos un campo oculto que viaja con el formulario al carrito
        // Nota: El "name" depende del tema, probaremos con el estándar de Shopify/TN
        const inputHidden = document.createElement('input');
        inputHidden.type = 'hidden';
        inputHidden.name = 'properties[Personalizacion]'; // Estándar común
        inputHidden.id = 'customily-data-hidden';
        formulario.appendChild(inputHidden);

        // Función para guardar los datos
        function actualizarInputOculto() {
            const texto = inputTexto.value;
            if (texto) {
                // Guardamos: "Texto: Juan - Color: Rojo"
                inputHidden.value = `Texto: ${texto} | Color: ${colorSeleccionado}`;
                console.log("💾 Datos preparados para enviar:", inputHidden.value);
            } else {
                inputHidden.value = ""; // Si borra, no enviamos nada
            }
        }

        // Insertar panel antes del botón de compra
        formulario.parentNode.insertBefore(panel, formulario);
    }
}

// Ejecutar con persistencia
let intentos = 0;
const intervalo = setInterval(() => {
    iniciarPersonalizador();
    intentos++;
    if (intentos > 20) clearInterval(intervalo);
}, 500);
