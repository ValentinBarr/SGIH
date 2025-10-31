document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------------------
// 🔧 Helper para iconos de comodidades (lado cliente)
// -------------------------------------------------------------------
const getComodidadIcon = (nombre) => {
    const icons = {
        'wi-fi': 'fas fa-wifi',
        'tv': 'fas fa-tv',
        'aire': 'fas fa-snowflake',
        'minibar': 'fas fa-wine-glass-alt',
        'jacuzzi': 'fas fa-hot-tub',
        'cama': 'fas fa-bed',
        'vista': 'fas fa-mountain',
        'escritorio': 'fas fa-desktop',
    };
    const lower = (nombre || '').toLowerCase();
    for (const key in icons) {
        if (lower.includes(key)) {
            return icons[key];
        }
    }
    return 'fas fa-check-circle'; // ícono por defecto
};

    // -------------------------------------------------------------------
    // 1. Elementos del DOM
    // -------------------------------------------------------------------
    const checkInInput = document.getElementById('fechaCheckIn_new');
    const checkOutInput = document.getElementById('fechaCheckOut_new');
    const adultosInput = document.getElementById('cantAdultos_new');
    const ninosInput = document.getElementById('cantNinos_new');
    
    // Elementos de la columna derecha (Tarjetas)
    const habitacionesCardsWrapper = document.getElementById('habitaciones-wrapper-cards');
    const idHabHidden = document.getElementById('id_hab_hidden'); 
    
    // Elementos de resumen y Huésped
    const nochesDisplay = document.getElementById('resumen_noches');
    const totalCalcDisplay = document.getElementById('resumen_total_calc');
    const hiddenTotalCalc = document.getElementById('hidden_total_calc');
    const huespedSelect = document.getElementById('id_huesped_select');

    let currentFetchController; 
    let cachedRooms = []; // Para almacenar los datos de las habitaciones disponibles (incluye precio, etc.)

    // -------------------------------------------------------------------
    // 2. Helpers de Cálculo
    // -------------------------------------------------------------------

    const calcNoches = (checkInStr, checkOutStr) => {
        if (!checkInStr || !checkOutStr) return 0;
        const checkIn = new Date(checkInStr);
        const checkOut = new Date(checkOutStr);
        const diffDays = Math.ceil(Math.abs(checkOut - checkIn) / (1000 * 60 * 60 * 24)); 
        return checkOut <= checkIn ? 0 : diffDays;
    };

    /**
     * Calcula y actualiza el total en el DOM.
     * Lee el precio base de la tarjeta seleccionada (o usa el valor por defecto si no hay selección).
     * @param {string | undefined} precioBaseStr - El precio base de la tarjeta clickeada.
     */
    const calcularTotal = (precioBaseStr) => {
        const noches = parseInt(nochesDisplay.textContent) || 0;
        
        // Determina el precio base: 
        // 1. Usa el precio de la tarjeta seleccionada (si existe).
        // 2. Si no hay una tarjeta seleccionada, usa el precio que ya está en el input hidden (por si viene de un POST fallido).
        let precioBase = 0;
        if (precioBaseStr) {
            precioBase = parseFloat(precioBaseStr);
        } else if (idHabHidden.value) {
            // Si hay un ID seleccionado, buscamos su precio en el cache
             const room = cachedRooms.find(r => r.id_hab == idHabHidden.value);
             if (room) {
                 precioBase = parseFloat(room.TipoHabitacion.precioBase || '0');
             }
        }
        
        const total = precioBase * noches;

        totalCalcDisplay.textContent = `$${total.toFixed(2)}`;
        hiddenTotalCalc.value = total.toFixed(2);
    };

    const updateNoches = () => {
        const noches = calcNoches(checkInInput.value, checkOutInput.value);
        nochesDisplay.textContent = noches;
        // La actualización de total se hará después de re-renderizar las tarjetas
        return noches;
    };

    // -------------------------------------------------------------------
    // 3. Lógica de Renderizado y Disponibilidad
    // -------------------------------------------------------------------

    /**
     * Renderiza las tarjetas usando los datos cacheados.
     */
    const renderRoomCards = (habitaciones) => {
        const noches = updateNoches();
        const ocupantes = parseInt(adultosInput.value) + parseInt(ninosInput.value);
        const idSeleccionado = idHabHidden.value;
        
        if (habitaciones.length === 0 || noches === 0 || ocupantes === 0) {
            // Mensaje si no hay habitaciones o los inputs son inválidos
             const message = noches === 0 ? 'Defina un rango de fechas válido.' : 
                             (ocupantes === 0 ? 'Defina al menos 1 ocupante.' : 
                             'No hay habitaciones disponibles.');
            
            return `<div class="notification is-warning is-light">${message}</div>`;
        }
        
        const cards = habitaciones.map(h => {
            const tipo = h.TipoHabitacion;
            const precioBase = parseFloat(tipo.precioBase);
            const totalCalculado = (precioBase * noches).toFixed(2);
            const isSelected = h.id_hab == idSeleccionado;
            const cardClass = isSelected ? 'is-primary is-light' : 'is-white';
            const capacidadSuficiente = tipo.capacidad >= ocupantes;
            const capacidadClass = capacidadSuficiente ? 'has-text-success' : 'has-text-danger';
            
            // Renderizado simplificado de comodidades (Asumimos que el Repo las incluye)
            const comodidadesHtml = tipo.Comodidades ? tipo.Comodidades.slice(0, 5).map(tc => {
                const com = tc.Comodidad;
                if (!com) return '';
                const icon = getComodidadIcon(com.nombre);
                return `<span class="tag is-light is-rounded mr-1" title="${com.nombre}"><i class="${icon}"></i></span>`;
            }).join('') : '';

            return `
                <div 
                    class="box room-card p-4 mb-3 is-clickable ${cardClass}" 
                    data-id="${h.id_hab}" 
                    data-preciobase="${precioBase.toFixed(2)}"
                >
                    <div class="level is-mobile mb-1">
                        <div class="level-left">
                            <p class="title is-5 mb-0 has-text-weight-bold">
                                HABITACIÓN ${h.numero} - ${tipo.nombre}
                            </p>
                        </div>
                        <div class="level-right">
                            ${isSelected ? '<span class="icon has-text-primary"><i class="fas fa-check-circle"></i></span>' : ''}
                        </div>
                    </div>
                    <p class="subtitle is-7 has-text-grey-light mb-2">Piso ${h.piso || 'N/A'}</p>
                    
                    <hr class="mt-2 mb-2">
                    
                    <div class="level is-mobile is-size-6 mb-2">
                        <div class="level-left">
                            <span class="icon has-text-success mr-2"><i class="fas fa-dollar-sign"></i></span>
                            <p class="has-text-weight-semibold">Precio estimado</p>
                        </div>
                        <div class="level-right">
                            <p>$${precioBase.toFixed(2)} x ${noches} = <strong class="has-text-success">$${totalCalculado}</strong></p>
                        </div>
                    </div>

                    <div class="content is-size-7 mb-2">
                        <div class="tags">
                            ${comodidadesHtml || '<span class="has-text-grey-light">Sin comodidades clave</span>'}
                        </div>
                    </div>
                    
                    <div class="is-size-7 has-text-weight-semibold ${capacidadClass}">
                        <span class="icon mr-1"><i class="fas fa-user-friends"></i></span>
                        Capacidad: ${tipo.capacidad} personas 
                        ${!capacidadSuficiente ? '<strong class="has-text-danger">(Insuficiente)</strong>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        return cards;
    };

    /**
     * Llama a la API para obtener la disponibilidad y renderiza las tarjetas.
     */
    const buscarDisponibilidad = async () => {
        const checkIn = checkInInput.value;
        const checkOut = checkOutInput.value;
        const adultos = adultosInput.value;
        const ninos = ninosInput.value;
        
        // Muestra estado de carga si los inputs son válidos para buscar
        if (calcNoches(checkIn, checkOut) > 0 && parseInt(adultos) + parseInt(ninos) > 0) {
             habitacionesCardsWrapper.innerHTML = `<progress class="progress is-small is-info" max="100">Cargando...</progress>`;
        } else {
             // Si los inputs son inválidos, solo renderiza el mensaje de error de renderRoomCards
             habitacionesCardsWrapper.innerHTML = renderRoomCards([]);
             return;
        }

        if (currentFetchController) currentFetchController.abort();
        currentFetchController = new AbortController();
        const { signal } = currentFetchController;

        try {
            const url = `/hoteleria/api/disponibilidad?checkIn=${checkIn}&checkOut=${checkOut}&adultos=${adultos}&ninos=${ninos}`;
            const response = await fetch(url, { signal });

            if (!response.ok) throw new Error('Error al buscar disponibilidad');
            
            const data = await response.json(); 
            
            // Cachear la respuesta
            cachedRooms = data.habitaciones;

            // Deseleccionar si la antigua habitación ya no está disponible
            if (idHabHidden.value && !data.habitaciones.some(h => h.id_hab == idHabHidden.value)) {
                 idHabHidden.value = '';
            }

            // Renderizar tarjetas
            habitacionesCardsWrapper.innerHTML = renderRoomCards(data.habitaciones);

            // Recalcular el total
            calcularTotal();

        } catch (error) {
            if (error.name === 'AbortError') return; 
            console.error('Error de disponibilidad:', error);
            habitacionesCardsWrapper.innerHTML = `<div class="notification is-danger is-light">Error: ${error.message}</div>`;
            calcularTotal('');
        }
    };

    // -------------------------------------------------------------------
    // 4. Lógica de Selección de Tarjetas
    // -------------------------------------------------------------------

    const handleCardSelection = (e) => {
        let card = e.target.closest('.room-card');
        if (!card) return;

        // 1. Deseleccionar todas las tarjetas
        document.querySelectorAll('.room-card').forEach(c => {
             c.classList.remove('is-primary', 'is-light');
             const checkIconWrapper = c.querySelector('.level-right');
             if (checkIconWrapper) checkIconWrapper.innerHTML = ''; // Limpia el check
        });
        
        // 2. Seleccionar la actual
        card.classList.add('is-primary', 'is-light');

        // 3. Añadir ícono de check
        const levelRight = card.querySelector('.level-right');
        levelRight.innerHTML = '<span class="icon has-text-primary"><i class="fas fa-check-circle"></i></span>';

        // 4. Actualizar el campo oculto y el cálculo
        idHabHidden.value = card.dataset.id;
        calcularTotal(card.dataset.preciobase); 
    };

    // -------------------------------------------------------------------
    // 5. Inicialización y Listeners
    // -------------------------------------------------------------------

    // Eventos de cambios en inputs (fechas/ocupantes)
    // 🚨 FIX: Asegurarse de que los elementos existan antes de agregar listeners
    // (Esto evita errores en la página de listado donde no existen)
    if (checkInInput && checkOutInput && adultosInput && ninosInput) {
    checkInInput.addEventListener('change', buscarDisponibilidad);
    checkOutInput.addEventListener('change', buscarDisponibilidad);
    adultosInput.addEventListener('change', buscarDisponibilidad);
    ninosInput.addEventListener('change', buscarDisponibilidad);

    // Asignar el listener de click al wrapper de tarjetas (delegación)
    habitacionesCardsWrapper.addEventListener('click', handleCardSelection);

    // Inicializa la búsqueda al cargar la página
    updateNoches();
    buscarDisponibilidad();
    }
    
    // -------------------------------------------------------------------
    // 6. Lógica del Modal Nuevo Huésped
    // -------------------------------------------------------------------
    const modalHuesped = document.getElementById('modalNuevoHuesped');
    const btnNuevoHuesped = document.getElementById('btnNuevoHuespedModal');
    const formHuesped = document.getElementById('formNuevoHuesped');
    const btnGuardarHuesped = document.getElementById('btnGuardarNuevoHuesped');
    const errorHuesped = document.getElementById('errorNuevoHuesped');

    // 🚨 FIX: Asegura que los elementos del modal existan
    if (btnNuevoHuesped && modalHuesped && formHuesped && btnGuardarHuesped && errorHuesped) {
        btnNuevoHuesped.addEventListener('click', () => {
            modalHuesped.classList.add('is-active');
        });

        btnGuardarHuesped.addEventListener('click', async () => {
        if (!formHuesped.checkValidity()) {
            formHuesped.reportValidity();
            return;
        }

        const formData = new FormData(formHuesped);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/hoteleria/huespedes/api/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            
            if (response.ok) {
                modalHuesped.classList.remove('is-active');
                errorHuesped.style.display = 'none';
                
                const newOption = new Option(`${result.Huesped.apellido}, ${result.Huesped.nombre} (${result.Huesped.documento || 'N/D'})`, result.Huesped.id_huesped, true, true);
                huespedSelect.add(newOption);
                
                formHuesped.reset();
            } else {
                const errorMessage = result.errors ? Object.values(result.errors).join('. ') : 'Error al registrar el huésped.';
                errorHuesped.textContent = errorMessage;
                errorHuesped.style.display = 'block';
            }

        } catch (error) {
            errorHuesped.textContent = 'Error de conexión con el servidor.';
            errorHuesped.style.display = 'block';
        }
        });
    }
});