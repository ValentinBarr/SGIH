// ====================================================================
// SCRIPT PARA EDITAR RESERVAS
// ====================================================================

(function() {
    'use strict';

    // Elementos del formulario
    const checkInInput = document.getElementById('fechaCheckIn_edit');
    const checkOutInput = document.getElementById('fechaCheckOut_edit');
    const adultosInput = document.getElementById('cantAdultos_edit');
    const ninosInput = document.getElementById('cantNinos_edit');
    
    // Elementos de la columna derecha (Tarjetas)
    const habitacionesCardsWrapper = document.getElementById('habitaciones-wrapper-cards');
    const idHabHidden = document.getElementById('id_hab_hidden'); 
    
    // Elementos de resumen
    const nochesDisplay = document.getElementById('resumen_noches');
    const totalCalcDisplay = document.getElementById('resumen_total_calc');
    const hiddenTotalCalc = document.getElementById('hidden_total_calc');

    let currentFetchController; 
    let cachedRooms = [];

    // -------------------------------------------------------------------
    // Helpers de Cálculo
    // -------------------------------------------------------------------
    function calcularNoches(checkIn, checkOut) {
        if (!checkIn || !checkOut) return 0;
        const d1 = new Date(checkIn);
        const d2 = new Date(checkOut);
        const diff = d2 - d1;
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    }

    function actualizarResumenNoches() {
        const noches = calcularNoches(checkInInput.value, checkOutInput.value);
        nochesDisplay.textContent = noches;
        return noches;
    }

    function actualizarTotal() {
        const idHabSeleccionada = parseInt(idHabHidden.value);
        if (!idHabSeleccionada || cachedRooms.length === 0) {
            totalCalcDisplay.textContent = '$0.00';
            hiddenTotalCalc.value = '0.00';
            return;
        }

        const habitacion = cachedRooms.find(h => h.id_hab === idHabSeleccionada);
        if (!habitacion) {
            totalCalcDisplay.textContent = '$0.00';
            hiddenTotalCalc.value = '0.00';
            return;
        }

        const noches = actualizarResumenNoches();
        const precioBase = parseFloat(habitacion.precioBase || 0);
        const total = (precioBase * noches).toFixed(2);
        
        totalCalcDisplay.textContent = `$${total}`;
        hiddenTotalCalc.value = total;
    }

    // -------------------------------------------------------------------
    // Búsqueda de Disponibilidad
    // -------------------------------------------------------------------
    async function buscarDisponibilidad() {
        const checkIn = checkInInput.value;
        const checkOut = checkOutInput.value;
        const adultos = parseInt(adultosInput.value) || 1;
        const ninos = parseInt(ninosInput.value) || 0;

        console.log('buscarDisponibilidad llamada con:', { checkIn, checkOut, adultos, ninos });

        if (!checkIn || !checkOut) {
            console.log('Faltan fechas');
            habitacionesCardsWrapper.innerHTML = `
                <div class="notification is-info is-light">
                    Introduce las fechas para buscar disponibilidad.
                </div>
            `;
            return;
        }

        if (new Date(checkOut + 'T00:00:00') <= new Date(checkIn + 'T00:00:00')) {
            console.log('Check-out no es posterior a check-in');
            habitacionesCardsWrapper.innerHTML = `
                <div class="notification is-warning is-light">
                    La fecha de check-out debe ser posterior al check-in.
                </div>
            `;
            return;
        }

        // Cancelar petición anterior si existe
        if (currentFetchController) {
            currentFetchController.abort();
        }
        currentFetchController = new AbortController();

        habitacionesCardsWrapper.innerHTML = `
            <div class="notification is-info is-light">
                <span class="icon"><i class="fas fa-spinner fa-spin"></i></span>
                Buscando habitaciones disponibles...
            </div>
        `;

        try {
            const params = new URLSearchParams({ checkIn, checkOut, adultos, ninos });
            const url = `/hoteleria/api/disponibilidad?${params}`;
            console.log('Fetching:', url);
            
            const response = await fetch(url, {
                signal: currentFetchController.signal
            });

            if (!response.ok) {
                throw new Error('Error al buscar disponibilidad');
            }

            const data = await response.json();
            console.log('Respuesta API:', data);
            
            cachedRooms = data.habitacionesDisponibles || [];
            const tipos = data.tiposHabitacion || [];

            console.log('Habitaciones recibidas:', cachedRooms.length);
            console.log('Tipos recibidos:', tipos.length);
            
            if (tipos.length > 0) {
                console.log('Precios de tipos:');
                tipos.forEach(t => {
                    console.log(`  - ${t.nombre}: $${t.precioBase}`);
                });
            }

            if (cachedRooms.length === 0) {
                habitacionesCardsWrapper.innerHTML = `
                    <div class="notification is-warning is-light">
                        <p class="has-text-weight-semibold">No hay habitaciones disponibles</p>
                        <p>No se encontraron habitaciones disponibles para las fechas y ocupantes seleccionados.</p>
                    </div>
                `;
                return;
            }

            renderizarHabitaciones(cachedRooms, tipos);
            actualizarTotal();

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Búsqueda cancelada');
                return;
            }
            console.error('Error al buscar disponibilidad:', error);
            habitacionesCardsWrapper.innerHTML = `
                <div class="notification is-danger is-light">
                    Error al buscar disponibilidad. Por favor, intenta nuevamente.
                </div>
            `;
        }
    }

    // -------------------------------------------------------------------
    // Renderizado de Habitaciones
    // -------------------------------------------------------------------
    function renderizarHabitaciones(habitaciones, tipos) {
        const noches = calcularNoches(checkInInput.value, checkOutInput.value);
        const habitacionSeleccionada = parseInt(idHabHidden.value);

        console.log('=== RENDERIZAR HABITACIONES ===');
        console.log('Noches:', noches);
        console.log('Habitaciones a renderizar:', habitaciones.length);
        console.log('Tipos disponibles:', tipos.length);

        const html = habitaciones.map(h => {
            const tipo = tipos.find(t => t.id_tipoHab === h.id_tipoHab);
            const precioBase = tipo ? parseFloat(tipo.precioBase) : 0;
            const totalCalculado = (precioBase * noches).toFixed(2);
            const tipoNombre = tipo ? tipo.nombre : 'N/A';
            const capacidad = tipo ? tipo.capacidad : 'N/A';
            const isSelected = habitacionSeleccionada === h.id_hab;

            console.log(`Habitación ${h.numero}:`, {
                id_tipoHab: h.id_tipoHab,
                tipoEncontrado: !!tipo,
                tipoNombre,
                precioBase,
                totalCalculado
            });

            // Guardar precio en el objeto para uso posterior
            h.precioBase = precioBase;

            return `
                <div class="box room-card p-4 mb-4 is-clickable ${isSelected ? 'is-primary-light has-border-primary' : ''}" 
                     data-id="${h.id_hab}" 
                     data-preciobase="${precioBase}">
                    <div class="level is-mobile mb-2">
                        <div class="level-left">
                            <div class="level-item">
                                <p class="title is-5 mb-0 has-text-weight-bold">Habitación ${h.numero}</p>
                            </div>
                            <div class="level-item">
                                <span class="tag is-info is-light">${tipoNombre}</span>
                            </div>
                        </div>
                        <div class="level-right">
                            ${isSelected ? '<span class="icon has-text-primary is-size-5"><i class="fas fa-check-circle"></i></span>' : ''}
                        </div>
                    </div>
                    
                    <div class="level is-mobile is-size-6 mb-3">
                        <div class="level-left">
                            <p class="has-text-grey">Piso: ${h.piso || 'N/A'}</p>
                        </div>
                        <div class="level-right">
                            <p class="has-text-weight-semibold">$${precioBase.toFixed(2)}/noche x ${noches} noches = <strong class="has-text-primary is-size-5">$${totalCalculado}</strong></p>
                        </div>
                    </div>

                    <div class="content is-size-7">
                        <p class="has-text-weight-semibold">
                            <span class="icon has-text-success"><i class="fas fa-check-circle"></i></span> 
                            Capacidad: ${capacidad} personas
                        </p>
                    </div>
                </div>
            `;
        }).join('');

        habitacionesCardsWrapper.innerHTML = html;

        // Agregar event listeners a las tarjetas
        document.querySelectorAll('.room-card').forEach(card => {
            card.addEventListener('click', function() {
                const idHab = this.getAttribute('data-id');
                seleccionarHabitacion(idHab);
            });
        });
    }

    // -------------------------------------------------------------------
    // Selección de Habitación
    // -------------------------------------------------------------------
    function seleccionarHabitacion(idHab) {
        idHabHidden.value = idHab;

        // Actualizar clases visuales
        document.querySelectorAll('.room-card').forEach(card => {
            card.classList.remove('is-primary-light', 'has-border-primary');
            const checkIcon = card.querySelector('.fa-check-circle');
            if (checkIcon) checkIcon.parentElement.remove();
        });

        const selectedCard = document.querySelector(`.room-card[data-id="${idHab}"]`);
        if (selectedCard) {
            selectedCard.classList.add('is-primary-light', 'has-border-primary');
            const levelRight = selectedCard.querySelector('.level-right');
            if (levelRight && !levelRight.querySelector('.fa-check-circle')) {
                levelRight.innerHTML = '<span class="icon has-text-primary is-size-5"><i class="fas fa-check-circle"></i></span>';
            }
        }

        actualizarTotal();
    }

    // -------------------------------------------------------------------
    // Event Listeners
    // -------------------------------------------------------------------
    checkInInput.addEventListener('change', () => {
        actualizarResumenNoches();
        buscarDisponibilidad();
    });

    checkOutInput.addEventListener('change', () => {
        actualizarResumenNoches();
        buscarDisponibilidad();
    });

    adultosInput.addEventListener('change', buscarDisponibilidad);
    ninosInput.addEventListener('change', buscarDisponibilidad);

    // Validación del formulario antes de enviar
    document.getElementById('formEditarReserva').addEventListener('submit', function(e) {
        if (!idHabHidden.value) {
            e.preventDefault();
            alert('Por favor, selecciona una habitación antes de guardar.');
            return false;
        }
    });

    // -------------------------------------------------------------------
    // Modal de Calendario
    // -------------------------------------------------------------------
    let calendarioMes = new Date();
    let tempCheckIn = null;
    let tempCheckOut = null;
    
    const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    function abrirModalCalendario() {
        // Cargar fechas actuales
        tempCheckIn = checkInInput.value ? new Date(checkInInput.value + 'T00:00:00') : null;
        tempCheckOut = checkOutInput.value ? new Date(checkOutInput.value + 'T00:00:00') : null;
        
        const modal = document.getElementById('modal-calendario');
        modal.classList.add('is-active');
        
        actualizarDisplayFechas();
        renderizarModalCalendario();
    }
    
    function cerrarModalCalendario() {
        document.getElementById('modal-calendario').classList.remove('is-active');
    }
    
    function actualizarDisplayFechas() {
        const checkinDisplay = document.getElementById('modal-checkin-display');
        const checkoutDisplay = document.getElementById('modal-checkout-display');
        
        if (tempCheckIn) {
            checkinDisplay.textContent = tempCheckIn.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
            checkinDisplay.classList.remove('is-light');
            checkinDisplay.classList.add('is-info');
        } else {
            checkinDisplay.textContent = 'No seleccionado';
            checkinDisplay.classList.add('is-light');
            checkinDisplay.classList.remove('is-info');
        }
        
        if (tempCheckOut) {
            checkoutDisplay.textContent = tempCheckOut.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
            checkoutDisplay.classList.remove('is-light');
            checkoutDisplay.classList.add('is-success');
        } else {
            checkoutDisplay.textContent = 'No seleccionado';
            checkoutDisplay.classList.add('is-light');
            checkoutDisplay.classList.remove('is-success');
        }
    }
    
    function renderizarModalCalendario() {
        const titulo = document.getElementById('modal-cal-titulo');
        const grid = document.getElementById('modal-cal-grid');
        
        titulo.textContent = `${MESES[calendarioMes.getMonth()]} ${calendarioMes.getFullYear()}`;
        
        // Limpiar grid
        grid.innerHTML = '';
        
        // Headers de días
        DIAS_SEMANA.forEach(dia => {
            const div = document.createElement('div');
            div.className = 'calendario-modal-dia header';
            div.textContent = dia;
            grid.appendChild(div);
        });
        
        // Obtener primer y último día del mes
        const primerDia = new Date(calendarioMes.getFullYear(), calendarioMes.getMonth(), 1);
        const ultimoDia = new Date(calendarioMes.getFullYear(), calendarioMes.getMonth() + 1, 0);
        
        // Días vacíos al inicio
        const diaSemanaInicio = primerDia.getDay();
        for (let i = 0; i < diaSemanaInicio; i++) {
            const div = document.createElement('div');
            grid.appendChild(div);
        }
        
        // Días del mes
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const fecha = new Date(calendarioMes.getFullYear(), calendarioMes.getMonth(), dia);
            fecha.setHours(0, 0, 0, 0);
            
            const div = document.createElement('div');
            div.className = 'calendario-modal-dia';
            div.textContent = dia;
            
            // Marcar hoy
            if (fecha.getTime() === hoy.getTime()) {
                div.classList.add('today');
            }
            
            // Deshabilitar días pasados
            if (fecha < hoy) {
                div.classList.add('disabled');
            } else {
                // Marcar check-in
                if (tempCheckIn && fecha.getTime() === tempCheckIn.getTime()) {
                    div.classList.add('checkin');
                }
                
                // Marcar check-out
                if (tempCheckOut && fecha.getTime() === tempCheckOut.getTime()) {
                    div.classList.add('checkout');
                }
                
                // Marcar rango
                if (tempCheckIn && tempCheckOut && fecha > tempCheckIn && fecha < tempCheckOut) {
                    div.classList.add('in-range');
                }
                
                // Event listener
                div.addEventListener('click', () => {
                    if (!tempCheckIn || (tempCheckIn && tempCheckOut)) {
                        // Seleccionar check-in
                        tempCheckIn = fecha;
                        tempCheckOut = null;
                    } else if (fecha > tempCheckIn) {
                        // Seleccionar check-out
                        tempCheckOut = fecha;
                    } else {
                        // Si selecciona una fecha anterior, reiniciar
                        tempCheckIn = fecha;
                        tempCheckOut = null;
                    }
                    
                    actualizarDisplayFechas();
                    renderizarModalCalendario();
                });
            }
            
            grid.appendChild(div);
        }
    }
    
    function aplicarFechas() {
        if (tempCheckIn) {
            // Guardar en formato YYYY-MM-DD para el backend
            const isoCheckIn = tempCheckIn.toISOString().split('T')[0];
            checkInInput.value = isoCheckIn;
            checkInInput.setAttribute('data-date', isoCheckIn);
            console.log('Check-in aplicado:', isoCheckIn);
        }
        
        if (tempCheckOut) {
            // Guardar en formato YYYY-MM-DD para el backend
            const isoCheckOut = tempCheckOut.toISOString().split('T')[0];
            checkOutInput.value = isoCheckOut;
            checkOutInput.setAttribute('data-date', isoCheckOut);
            console.log('Check-out aplicado:', isoCheckOut);
        }
        
        cerrarModalCalendario();
        
        // Forzar búsqueda de disponibilidad después de cerrar el modal
        if (tempCheckIn && tempCheckOut) {
            console.log('Buscando disponibilidad...');
            actualizarResumenNoches();
            buscarDisponibilidad();
        }
    }
    
    // Event listeners del modal
    document.getElementById('btn-calendario-checkin').addEventListener('click', abrirModalCalendario);
    document.getElementById('btn-calendario-checkout').addEventListener('click', abrirModalCalendario);
    
    // También abrir al hacer click en los inputs
    checkInInput.addEventListener('click', abrirModalCalendario);
    checkOutInput.addEventListener('click', abrirModalCalendario);
    
    document.getElementById('modal-cal-close').addEventListener('click', cerrarModalCalendario);
    document.getElementById('modal-cal-cancelar').addEventListener('click', cerrarModalCalendario);
    document.querySelector('#modal-calendario .modal-background').addEventListener('click', cerrarModalCalendario);
    
    document.getElementById('modal-cal-prev').addEventListener('click', () => {
        calendarioMes.setMonth(calendarioMes.getMonth() - 1);
        renderizarModalCalendario();
    });
    
    document.getElementById('modal-cal-next').addEventListener('click', () => {
        calendarioMes.setMonth(calendarioMes.getMonth() + 1);
        renderizarModalCalendario();
    });
    
    document.getElementById('modal-cal-aplicar').addEventListener('click', aplicarFechas);

    // -------------------------------------------------------------------
    // Inicialización
    // -------------------------------------------------------------------
    function inicializar() {
        console.log('Inicializando reservas-edit.js');
        console.log('Check-in value:', checkInInput.value);
        console.log('Check-out value:', checkOutInput.value);
        
        // Actualizar resumen inicial
        actualizarResumenNoches();
        
        // Si ya hay habitaciones renderizadas, cachear sus datos
        const cards = document.querySelectorAll('.room-card');
        console.log('Habitaciones precargadas:', cards.length);
        
        if (cards.length > 0) {
            cards.forEach(card => {
                const idHab = parseInt(card.getAttribute('data-id'));
                const precioBase = parseFloat(card.getAttribute('data-preciobase'));
                cachedRooms.push({ id_hab: idHab, precioBase });
                
                // Agregar event listener
                card.addEventListener('click', function() {
                    seleccionarHabitacion(this.getAttribute('data-id'));
                });
            });
            
            actualizarTotal();
        } else {
            console.log('No hay habitaciones precargadas, intentando buscar...');
            // Si no hay habitaciones precargadas y hay fechas, buscar
            if (checkInInput.value && checkOutInput.value) {
                buscarDisponibilidad();
            }
        }
        
        // Inicializar mes del calendario al mes actual
        calendarioMes = new Date();
    }

    // Ejecutar al cargar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
})();
