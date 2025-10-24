// js/reservas.js
document.addEventListener('DOMContentLoaded', () => {
    // --- MODAL DE EDICIÓN (Existente) ---
    const modalEditar = document.getElementById('modalReserva');
    
    // (Lógica de edición se mantiene igual)
    if (modalEditar) {
        const formEditar = document.getElementById('formReserva');
        const titleEditar = modalEditar.querySelector('.modal-card-title');
        const idFieldEditar = document.getElementById('id_reserva');
        const btnGuardarEditar = document.getElementById('btnGuardarReserva');

        const openModalEditar = () => modalEditar.classList.add('is-active');

        const toISODate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
            return date.toISOString().split('T')[0];
        };

        const assignEditListeners = () => {
            document.querySelectorAll('.btnEditarReserva').forEach((btn) => {
                if (btn.dataset.listenerAttached) return;
                btn.dataset.listenerAttached = true;

                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    try {
                        const response = await fetch(`/hoteleria/reservas/${id}/data`);
                        if (!response.ok) throw new Error('No se pudieron cargar los datos');
                        const data = await response.json();

                        titleEditar.textContent = `Editar Reserva ${data.codigoReserva}`;
                        formEditar.action = `/hoteleria/reservas/${id}/edit${window.location.search}`;
                        idFieldEditar.value = data.id_reserva;

                        document.getElementById('huesped_nombre').value =
                            `${data.Huesped?.apellido}, ${data.Huesped?.nombre}`;
                        document.getElementById('fechaCheckIn').value = toISODate(data.fechaCheckIn);
                        document.getElementById('fechaCheckOut').value = toISODate(data.fechaCheckOut);
                        document.getElementById('total').value = data.total;

                        openModalEditar();
                    } catch (err) {
                        console.error(err);
                        alert('Error al cargar datos de la reserva.');
                    }
                });
            });
        };

        assignEditListeners();
        document.body.addEventListener('htmx:afterOnLoad', assignEditListeners);

        btnGuardarEditar.addEventListener('click', () => {
            formEditar.submit();
        });
    }

    // --- MODAL DE NUEVA RESERVA (con Validación y Cálculo) ---
    const modalNuevo = document.getElementById('modalNuevaReserva');
    if (modalNuevo) {
        const formNuevo = document.getElementById('formNuevaReserva');
        const btnAbrirNuevo = document.getElementById('btnNuevaReserva');
        const btnGuardarNuevo = document.getElementById('btnGuardarNuevaReserva');
        const errorBox = document.getElementById('errorNuevaReserva');

        // Referencias a los campos de cálculo
        const fechaIn = document.getElementById('fechaCheckIn_new');
        const fechaOut = document.getElementById('fechaCheckOut_new');
        const tipoHabSelect = document.getElementById('id_tipoHab_select');
        const cantAdultos = document.getElementById('cantAdultos_new');
        const cantNinos = document.getElementById('cantNinos_new');
        const totalManual = document.getElementById('total_manual_new'); // Campo de input final

        // Referencias a los displays
        const displayNoches = document.getElementById('resumen_noches');
        const displayNochesWrapper = document.getElementById('resumen_noches_wrapper');
        const displayTotalCalc = document.getElementById('resumen_total_calc');
        const displayCapacidad = document.getElementById('resumen_capacidad_text');
        const displayDisponibilidad = document.getElementById('resumen_disponibilidad_text');
        
        // Estado de validación global
        let isAvailable = false;
        let isCapacityOK = false;

        // Función auxiliar para calcular días (igual que en el backend, sin date-fns)
        const calculateNights = (start, end) => {
            if (!start || !end) return 0;
            const diffTime = new Date(end).getTime() - new Date(start).getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 ? diffDays : 0;
        };

        // --- FUNCIONES DE CÁLCULO Y VALIDACIÓN ---

        const updateCalculations = () => {
            const inValue = fechaIn.value;
            const outValue = fechaOut.value;
            const selectedOption = tipoHabSelect.options[tipoHabSelect.selectedIndex];
            
            const idTipoHab = tipoHabSelect.value;
            const totalHuespedes = parseInt(cantAdultos.value) + parseInt(cantNinos.value);
            
            let capacidadMax = 0;
            let precioBase = 0;

            // 1. VALIDACIÓN BÁSICA DE CAMPOS
            const noches = calculateNights(inValue, outValue);

            if (noches <= 0 || !idTipoHab) {
                displayNochesWrapper.style.display = 'none';
                displayTotalCalc.textContent = '$0.00';
                displayCapacidad.innerHTML = `<span class="icon is-small"><i class="fas fa-exclamation-triangle"></i></span> Capacidad: [N/A]`;
                displayDisponibilidad.innerHTML = `<span class="icon is-small"><i class="fas fa-bed"></i></span> Seleccione fechas y tipo.`;
                displayDisponibilidad.className = 'help mt-2 has-text-warning';
                isAvailable = false;
                isCapacityOK = false;
                btnGuardarNuevo.disabled = true;
                return;
            }
            
            // Actualizar noches en la UI
            displayNoches.textContent = noches;
            displayNochesWrapper.style.display = 'block';

            // 2. OBTENER DATOS DEL TIPO DE HABITACIÓN SELECCIONADO
            if (selectedOption && selectedOption.dataset.precio) {
                precioBase = parseFloat(selectedOption.dataset.precio);
                capacidadMax = parseInt(selectedOption.dataset.capacidad);
            }
            
            // 3. VALIDACIÓN DE CAPACIDAD (Local)
            isCapacityOK = totalHuespedes <= capacidadMax;
            const capacidadTexto = isCapacityOK
                ? `Capacidad OK (Máx: ${capacidadMax} pers.)`
                : `Capacidad EXCEDIDA (${totalHuespedes} > Máx: ${capacidadMax})`;
            
            displayCapacidad.className = 'help mt-2 ' + (isCapacityOK ? 'has-text-success' : 'has-text-danger');
            displayCapacidad.innerHTML = `<span class="icon is-small"><i class="fas ${isCapacityOK ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i></span> ${capacidadTexto}`;


            // 4. CÁLCULO DEL PRECIO
            const totalCalculado = noches * precioBase;
            displayTotalCalc.textContent = `$${totalCalculado.toFixed(2)}`;
            
            // Solo sobrescribir el manual si el campo está vacío o es 0
            if (parseFloat(totalManual.value) === 0 || totalManual.value === '') {
                 totalManual.value = totalCalculado.toFixed(2);
            }

            // Deshabilitar temporalmente mientras se consulta
            btnGuardarNuevo.disabled = true;
            displayDisponibilidad.className = 'help mt-2 has-text-info';
            displayDisponibilidad.innerHTML = `<span class="icon is-small"><i class="fas fa-sync fa-spin"></i></span> Verificando disponibilidad...`;


            // --- FETCH DE DISPONIBILIDAD ---
            const url = `/hoteleria/reservas/disponibilidad?id_tipoHab=${idTipoHab}&fechaCheckIn=${inValue}&fechaCheckOut=${outValue}`;

            fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error('Error de servidor al consultar disponibilidad.');
                    return response.json();
                })
                .then(data => {
                    isAvailable = data.estaDisponible;
                    const dispTexto = isAvailable 
                        ? `DISPONIBLE (${data.disponibles} restantes)` 
                        : `NO DISPONIBLE (Quedan: ${data.disponibles} o menos)`;
                    
                    const dispClass = isAvailable ? 'has-text-success' : 'has-text-danger';
                    const dispIcon = isAvailable ? 'fa-check' : 'fa-times';

                    displayDisponibilidad.className = 'help mt-2 ' + dispClass;
                    displayDisponibilidad.innerHTML = `<span class="icon is-small"><i class="fas ${dispIcon}"></i></span> ${dispTexto}`;

                    // Habilitar botón solo si AMBAS condiciones son OK
                    btnGuardarNuevo.disabled = !(isAvailable && isCapacityOK);

                })
                .catch(err => {
                    console.error("Error fetching availability:", err);
                    displayDisponibilidad.className = 'help mt-2 has-text-danger';
                    displayDisponibilidad.innerHTML = `<span class="icon is-small"><i class="fas fa-exclamation-circle"></i></span> Error al consultar disponibilidad.`;
                    isAvailable = false;
                    btnGuardarNuevo.disabled = true;
                });
        };

        // --- ASIGNACIÓN DE LISTENERS PARA CÁLCULO ---
        const calculableInputs = formNuevo.querySelectorAll('.input-calc-total');
        calculableInputs.forEach(input => {
            input.addEventListener('change', updateCalculations);
            input.addEventListener('input', updateCalculations);
        });
        
        // --- LÓGICA DEL MODAL ---
        const mostrarError = (mensaje) => {
            if (errorBox) {
                errorBox.textContent = mensaje;
                errorBox.style.display = 'block';
            } else {
                alert(mensaje);
            }
        };

        btnAbrirNuevo.addEventListener('click', () => {
            formNuevo.reset();
            if (errorBox) errorBox.style.display = 'none';
            // Inicializar cálculos al abrir (para el valor por defecto de 1 adulto)
            setTimeout(updateCalculations, 10); 
            modalNuevo.classList.add('is-active');
        });

        // Guardar (submit) con validación final
        btnGuardarNuevo.addEventListener('click', () => {
            if (errorBox) errorBox.style.display = 'none';
            
            // Revalidación rápida antes de enviar
            if (!isAvailable) {
                mostrarError('La habitación no está disponible para las fechas seleccionadas.');
                return;
            }
             if (!isCapacityOK) {
                mostrarError('La cantidad de huéspedes excede la capacidad máxima del tipo de habitación.');
                return;
            }

            // Validación de campo total manual
            if (!totalManual.value || parseFloat(totalManual.value) <= 0) {
                 mostrarError('El precio total debe ser mayor a cero.');
                 return;
            }

            // Validación de Fechas
            const checkInDate = fechaIn.value;
            const checkOutDate = fechaOut.value;
            const noches = calculateNights(checkInDate, checkOutDate);
            
            // Re-ejecutar validaciones de fechas que ya están en el backend
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const inDate = new Date(checkInDate + 'T00:00:00-03:00');
            const outDate = new Date(checkOutDate + 'T00:00:00-03:00');
            
            if (outDate <= inDate) {
                mostrarError('La fecha de Check-out debe ser posterior a la fecha de Check-in.');
                return;
            }
            if (inDate < hoy && (inDate.getTime() !== hoy.getTime())) { 
                mostrarError('La fecha de Check-in no puede ser anterior a hoy.');
                return;
            }
            
            // --- Confirmación antes de guardar ---
            const confirmacion = confirm(`¿Está seguro de que desea crear esta reserva por ${noches} noches?`);
            
            if (confirmacion) {
                formNuevo.submit();
            }
        });
    }
});