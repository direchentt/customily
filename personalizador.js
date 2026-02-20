console.log("🚀 Personalizador v0.3: Fondo Dinámico Activado");

const SELECTOR_IMAGEN = '.js-product-slide-img, .product-image-container img';
const SELECTOR_FORMULARIO = '.js-addtocart, .js-product-form';

function iniciar() {
    if (!window.location.pathname.includes('/productos/')) return;

    const imagen = document.querySelector(SELECTOR_IMAGEN);
    const formulario = document.querySelector(SELECTOR_FORMULARIO);

    // Evitar duplicados
    if (imagen && formulario && !document.getElementById('customily-panel')) {
        console.log("✨ Creando interfaz de personalización de fondo...");

        // 1. Preparar el Contenedor de la Imagen
        const contenedorImagen = imagen.parentElement;
        contenedorImagen.style.position = "relative";

        // 2. Crear una Capa de Color (Overlay) ENCIMA de la imagen original
        // Usamos mix-blend-mode para que parezca que la tinta del producto cambia
        const capaColor = document.createElement('div');
        capaColor.id = 'customily-color-overlay';
        capaColor.style.position = "absolute";
        capaColor.style.top = "0";
        capaColor.style.left = "0";
        capaColor.style.width = "100%";
        capaColor.style.height = "100%";
        capaColor.style.backgroundColor = "transparent"; // Empieza transparente
        capaColor.style.mixBlendMode = "multiply"; // Truco: "multiply" oscurece, "overlay" tiñe
        capaColor.style.pointerEvents = "none";
        capaColor.style.zIndex = "50";
        capaColor.style.transition = "background-color 0.3s ease"; // Suavidad

        contenedorImagen.appendChild(capaColor);

        // 3. Crear el Panel de Control (Debajo del precio/título)
        const panel = document.createElement('div');
        panel.id = 'customily-panel';
        panel.style.marginBottom = "20px";
        panel.style.padding = "15px";
        panel.style.backgroundColor = "#fff";
        panel.style.borderRadius = "8px";
        panel.style.border = "1px solid #ddd";
        panel.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";

        const titulo = document.createElement('h4');
        titulo.innerText = "🎨 Elige el Color del Producto";
        titulo.style.margin = "0 0 10px 0";
        titulo.style.fontSize = "14px";
        titulo.style.textTransform = "uppercase";
        titulo.style.letterSpacing = "1px";

        panel.appendChild(titulo);

        // 4. Crear Botones de Colores
        const colores = [
            { nombre: "Original", hex: "transparent" },
            { nombre: "Rojo Pasión", hex: "#ff0000" },
            { nombre: "Azul Profundo", hex: "#0000ff" },
            { nombre: "Verde Esmeralda", hex: "#00ff00" },
            { nombre: "Amarillo Solar", hex: "#ffff00" },
            { nombre: "Negro Elegante", hex: "#333333" }
        ];

        const contenedorBotones = document.createElement('div');
        contenedorBotones.style.display = "flex";
        contenedorBotones.style.gap = "10px";

        colores.forEach(color => {
            const btn = document.createElement('button');
            btn.title = color.nombre;
            btn.style.width = "30px";
            btn.style.height = "30px";
            btn.style.borderRadius = "50%"; // Circulares
            btn.style.border = "2px solid #ddd";
            btn.style.cursor = "pointer";
            btn.style.backgroundColor = color.hex === "transparent" ? "white" : color.hex;

            // Si es transparente, poner una X o icono para indicar "sin color"
            if (color.hex === "transparent") {
                btn.style.backgroundImage = "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)";
                btn.style.backgroundSize = "10px 10px";
            } else {
                // Hacer que el color sea semitransparente para simular tinte real
                // (En la visualización en la imagen, no en el botón)
            }

            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Evitar recarga
                console.log("Cambiando color a:", color.nombre);

                // Aplicar color a la capa superpuesta
                // Usamos rgba para que se vea la textura de abajo
                if (color.hex === "transparent") {
                    capaColor.style.backgroundColor = "transparent";
                } else {
                    // Convertir hex a rgba con opacidad 0.5 para efecto tinte
                    capaColor.style.backgroundColor = color.hex;
                    capaColor.style.opacity = "0.5"; // Ajustable
                }

                // Efecto visual en el botón seleccionado
                Array.from(contenedorBotones.children).forEach(b => b.style.transform = "scale(1)");
                btn.style.transform = "scale(1.2)";
                btn.style.borderColor = "#000";
            });

            contenedorBotones.appendChild(btn);
        });

        panel.appendChild(contenedorBotones);

        // Insertar antes del botón de comprar
        if (formulario && formulario.parentNode) {
            formulario.parentNode.insertBefore(panel, formulario);
        }
    }
}

// Ejecutar con persistencia
let intentos = 0;
const intervalo = setInterval(() => {
    iniciar();
    intentos++;
    if (intentos > 20) clearInterval(intervalo);
}, 500);
