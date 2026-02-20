console.log("🚀 Personalizador Casetify Lite v1.0: Iniciando...");

const SELECTOR_IMAGEN = '.js-product-slide-img, .product-image-container img, .swiper-slide-active img';
const SELECTOR_FORMULARIO = '.js-addtocart, .js-product-form';

function iniciarCasetify() {
    if (!window.location.pathname.includes('/productos/')) return;

    const imagenBase = document.querySelector(SELECTOR_IMAGEN);
    const formulario = document.querySelector(SELECTOR_FORMULARIO);

    // Evitar duplicados
    if (imagenBase && formulario && !document.getElementById('casetify-panel')) {

        console.log("📱 Construyendo interfaz tipo Casetify...");

        // ------------------------------------------------
        // 1. PREPARAR EL VISUALIZADOR (LAYERS)
        // ------------------------------------------------
        const contenedorVisual = imagenBase.parentElement;
        contenedorVisual.style.position = "relative";

        // Capa 1: El Arte (Es la imagen original del producto)
        // Capa 2: El Marco de la Funda (Simulado por ahora con un borde visual)
        const capaMarco = document.createElement('div');
        capaMarco.id = 'case-frame';
        capaMarco.style.position = "absolute";
        capaMarco.style.top = "0";
        capaMarco.style.left = "0";
        capaMarco.style.width = "100%";
        capaMarco.style.height = "100%";
        capaMarco.style.pointerEvents = "none";
        capaMarco.style.zIndex = "10";
        capaMarco.style.boxSizing = "border-box";
        capaMarco.style.border = "20px solid #000"; // Borde inicial (Negro Impact)
        capaMarco.style.borderRadius = "30px"; // Bordes redondeados tipo iPhone
        capaMarco.style.boxShadow = "inset 0 0 20px rgba(0,0,0,0.5)"; // Sombra interna para realismo

        contenedorVisual.appendChild(capaMarco);

        // Capa 3: El Texto Personalizado
        const capaTexto = document.createElement('div');
        capaTexto.id = 'case-text';
        capaTexto.innerText = "TU NOMBRE";
        capaTexto.style.position = "absolute";
        capaTexto.style.top = "40%";
        capaTexto.style.left = "50%";
        capaTexto.style.transform = "translate(-50%, -50%) rotate(-90deg)"; // Texto vertical estilo Casetify
        capaTexto.style.fontFamily = "'Helvetica', sans-serif";
        capaTexto.style.fontSize = "40px";
        capaTexto.style.fontWeight = "bold";
        capaTexto.style.color = "white";
        capaTexto.style.letterSpacing = "5px";
        capaTexto.style.zIndex = "20";
        capaTexto.style.textShadow = "2px 2px 0px rgba(0,0,0,0.5)";

        contenedorVisual.appendChild(capaTexto);

        // ------------------------------------------------
        // 2. CONSTRUIR EL PANEL DE CONTROL (UI)
        // ------------------------------------------------
        const panel = document.createElement('div');
        panel.id = 'casetify-panel';
        panel.style.background = "#fff";
        panel.style.padding = "20px";
        panel.style.border = "1px solid #eee";
        panel.style.borderRadius = "10px";
        panel.style.marginBottom = "20px";
        panel.style.marginTop = "20px";
        panel.style.fontFamily = "sans-serif";
        panel.style.boxShadow = "0 3px 10px rgba(0,0,0,0.05)";

        // Título Estiloso
        const titulo = document.createElement('h3');
        titulo.innerText = "🛠 PERSONALIZA TU FUNDA";
        titulo.style.margin = "0 0 15px 0";
        titulo.style.fontSize = "16px";
        titulo.style.borderBottom = "2px solid #000";
        titulo.style.paddingBottom = "10px";
        titulo.style.textTransform = "uppercase";
        titulo.style.letterSpacing = "1px";
        panel.appendChild(titulo);

        // SECCIÓN A: MODELO DE DISPOSITIVO
        const labelDispositivo = document.createElement('label');
        labelDispositivo.innerText = "1. MODELO DE DISPOSITIVO";
        labelDispositivo.style.display = "block";
        labelDispositivo.style.fontWeight = "bold";
        labelDispositivo.style.fontSize = "12px";
        labelDispositivo.style.marginBottom = "5px";
        labelDispositivo.style.color = "#555";
        panel.appendChild(labelDispositivo);

        const selectDispositivo = document.createElement('select');
        selectDispositivo.style.width = "100%";
        selectDispositivo.style.padding = "10px";
        selectDispositivo.style.marginBottom = "15px";
        selectDispositivo.style.borderRadius = "5px";
        selectDispositivo.style.border = "1px solid #ccc";
        selectDispositivo.style.backgroundColor = "#fafafa";

        ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 14', 'Samsung S24 Ultra'].forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.innerText = m;
            selectDispositivo.appendChild(opt);
        });

        selectDispositivo.addEventListener('change', () => actualizarDatosCompra());
        panel.appendChild(selectDispositivo);

        // SECCIÓN B: TIPO DE FUNDA (Colores/Estilos)
        const labelEstilo = document.createElement('label');
        labelEstilo.innerText = "2. ESTILO DE BORDE (IMPACTO)";
        labelEstilo.style.display = "block";
        labelEstilo.style.fontWeight = "bold";
        labelEstilo.style.fontSize = "12px";
        labelEstilo.style.marginBottom = "5px";
        labelEstilo.style.color = "#555";
        panel.appendChild(labelEstilo);

        const gridEstilos = document.createElement('div');
        gridEstilos.style.display = "flex";
        gridEstilos.style.gap = "10px";
        gridEstilos.style.marginBottom = "20px";

        const estilos = [
            { nombre: "Impact Black", color: "#111", borde: "20px solid #111" },
            { nombre: "Cotton Candy", color: "#ffb7b2", borde: "20px solid #ffb7b2" },
            { nombre: "Clear", color: "#eef", borde: "20px solid rgba(255,255,255,0.7)" },
            { nombre: "Azul Cobalto", color: "#0047AB", borde: "20px solid #0047AB" }
        ];

        let estiloSeleccionado = estilos[0].nombre;

        estilos.forEach(estilo => {
            const btn = document.createElement('div');
            btn.title = estilo.nombre;
            btn.style.width = "40px";
            btn.style.height = "40px";
            btn.style.borderRadius = "50%";
            btn.style.backgroundColor = estilo.color;
            btn.style.border = "2px solid #ddd"; // Borde inactivo
            btn.style.cursor = "pointer";
            btn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
            btn.style.transition = "transform 0.2s, border-color 0.2s";

            // Acción al hacer click
            btn.addEventListener('click', () => {
                // Feedback visual en botones (resetear todos)
                Array.from(gridEstilos.children).forEach(b => {
                    b.style.transform = "scale(1)";
                    b.style.border = "2px solid #ddd";
                });
                // Activar este botón
                btn.style.transform = "scale(1.15)";
                btn.style.border = "3px solid #000"; // Borde activo negro fuerte

                // CAMBIAR EL MARCO (Aquí iría el cambio de imagen PNG en el futuro)
                capaMarco.style.border = estilo.borde;
                estiloSeleccionado = estilo.nombre;

                // Actualizar input oculto
                actualizarDatosCompra();
            });

            gridEstilos.appendChild(btn);
        });

        // Seleccionar el primero por defecto
        if (gridEstilos.firstChild) {
            gridEstilos.firstChild.click();
        }

        panel.appendChild(gridEstilos);

        // SECCIÓN C: TEXTO PERSONALIZADO
        const labelTexto = document.createElement('label');
        labelTexto.innerText = "3. TU FIRMA / TEXTO";
        labelTexto.style.display = "block";
        labelTexto.style.fontWeight = "bold";
        labelTexto.style.fontSize = "12px";
        labelTexto.style.marginBottom = "5px";
        labelTexto.style.color = "#555";
        panel.appendChild(labelTexto);

        const inputTexto = document.createElement('input');
        inputTexto.type = "text";
        inputTexto.placeholder = "Escribe tu nombre... (Máx 10)";
        inputTexto.maxLength = 10;
        inputTexto.style.width = "100%";
        inputTexto.style.padding = "12px";
        inputTexto.style.borderRadius = "5px";
        inputTexto.style.border = "1px solid #ccc";
        inputTexto.style.fontSize = "16px";
        inputTexto.style.backgroundColor = "#fafafa";

        inputTexto.addEventListener('input', (e) => {
            const val = e.target.value;
            capaTexto.innerText = val ? val.toUpperCase() : "TU NOMBRE";
            // Si está vacío, ocultar texto visualmente para limpieza
            capaTexto.style.opacity = val ? "1" : "0.5";
            actualizarDatosCompra();
        });
        panel.appendChild(inputTexto);

        // ------------------------------------------------
        // 3. CONECTAR CON EL CARRITO
        // ------------------------------------------------
        // Creamos inputs ocultos para que viajen al checkout
        const inputHidden = document.createElement('input');
        inputHidden.type = 'hidden';
        inputHidden.name = 'properties[Configuración]'; // Campo principal para Shopify/TN
        inputHidden.id = 'customily-data-hidden';
        formulario.appendChild(inputHidden);

        function actualizarDatosCompra() {
            const dispositivo = selectDispositivo.value;
            const texto = inputTexto.value || "Sin texto";

            // Construir string de datos: "iPhone 15 | Borde Negro | Texto: JUAN"
            const valorFinal = `${dispositivo} | Borde: ${estiloSeleccionado} | Texto: ${texto}`;
            inputHidden.value = valorFinal;

            console.log("📦 Datos listos para carrito:", inputHidden.value);
        }

        // Inicializar datos
        actualizarDatosCompra();

        // Insertar Panel antes del botón de compra
        formulario.parentNode.insertBefore(panel, formulario);
    }
}

// Ejecutar persistente por si la página tarda en cargar
let intentos = 0;
const intervalo = setInterval(() => {
    iniciarCasetify();
    intentos++;
    if (intentos > 20) clearInterval(intervalo);
}, 500);
