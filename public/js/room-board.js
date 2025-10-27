document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const roomBoard = document.getElementById('room-board');
    const statusMessage = document.getElementById('status-message');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // --- Helpers (Duplicados de la vista) ---
    const formatDate = (dateStr, formatStr = 'dd/MM') => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // No aplicamos offset aquí, asumimos que el backend devuelve fechas correctas
        // date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        // Usamos Intl.DateTimeFormat para un formato más localizado si es necesario, o date-fns si está disponible
        try {
            // Si tienes date-fns cargado en el cliente:
            // return dateFns.format(date, formatStr, { locale: dateFns.locale.es });
            // Formato simple si no tienes date-fns en el cliente:
             const day = String(date.getDate()).padStart(2, '0');
             const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses son 0-indexados
             if (formatStr === 'dd/MM/yyyy') {
                 const year = date.getFullYear();
                 return `${day}/${month}/${year}`;
             }
             return `${day}/${month}`; // Default dd/MM

        } catch (e) {
             console.warn("date-fns not available on client, using basic date formatting.");
             const day = String(date.getDate()).padStart(2, '0');
             const month = String(date.getMonth() + 1).padStart(2, '0');
             return `${day}/${month}`;
        }
    };

    const isSameDay = (date1, date2) => {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    };

    const statusMap = {
        DISPONIBLE: { color: 'success', text: 'Disponible', icon: 'fa-bed' },
        OCUPADA: { color: 'danger', text: 'Ocupada', icon: 'fa-clock' },
        LIMPIEZA: { color: 'info', text: 'Limpieza', icon: 'fa-broom' },
        MANTENIMIENTO: { color: 'dark', text: 'Mantenimiento', icon: 'fa-tools' },
        LLEGADA_HOY: { color: 'link', text: 'Llegada Hoy', icon: 'fa-calendar-check' },
        SALIDA_HOY: { color: 'warning', text: 'Salida Hoy', icon: 'fa-sign-out-alt' },
    };

    // --- Renderizado de Tarjeta (Versión JS) ---
    const renderRoomCardJS = (hab) => {
        // Asegúrate de que 'hab' tiene la misma estructura que en la vista,
        // incluyendo hab.TipoHabitacion y hab.reservaActiva.Huesped
        const { numero, piso, TipoHabitacion, estado, reservaActiva } = hab;
        const tipo = TipoHabitacion?.nombre || 'N/A';

        let primaryStatusKey = estado;
        const today = new Date();
        let isArrivalToday = false;
        let isDepartureToday = false;

        if (estado === 'DISPONIBLE' && reservaActiva && reservaActiva.estado === 'CONFIRMADA' && isSameDay(new Date(reservaActiva.fechaCheckIn), today)) {
            primaryStatusKey = 'LLEGADA_HOY';
            isArrivalToday = true;
        } else if (estado === 'OCUPADA' && reservaActiva && isSameDay(new Date(reservaActiva.fechaCheckOut), today)) {
            primaryStatusKey = 'SALIDA_HOY';
            isDepartureToday = true;
        }

        const statusInfo = statusMap[primaryStatusKey] || { color: 'light', text: estado, icon: 'fa-question-circle' };
        const colorClass = `is-${statusInfo.color}`;

        let detailText = `Tipo: ${tipo}`;
        let subStatusText = '';
        let actionButton = '';

        // Lógica de botones (igual que en la vista)
        switch (primaryStatusKey) {
            case 'LLEGADA_HOY':
                detailText = `Huésped: ${reservaActiva.Huesped?.apellido || 'N/A'}`;
                subStatusText = `Reserva: #${reservaActiva.codigoReserva}`;
                actionButton = `
                    <a href="/hoteleria/reservas/${reservaActiva.id_reserva}/checkin-detail" class="button is-small is-primary is-fullwidth">
                        <span class="icon is-small"><i class="fas fa-sign-in-alt"></i></span>
                        <span>Ver Check-in</span>
                    </a>`;
                break;
            case 'SALIDA_HOY':
            case 'OCUPADA':
                 if (reservaActiva) {
                    detailText = `Huésped: ${reservaActiva.Huesped?.apellido || 'N/A'}`;
                    subStatusText = `Sale: ${formatDate(reservaActiva.fechaCheckOut)}`;
                    actionButton = `
                        <button class="button is-small is-warning is-fullwidth btn-action" data-action="checkout" data-hab-id="${hab.id_hab}">
                            <span class="icon is-small"><i class="fas fa-sign-out-alt"></i></span>
                            <span>Check-out</span>
                        </button>`;
                 }
                 break;
            case 'LIMPIEZA':
                 actionButton = `
                    <button class="button is-small is-success is-fullwidth btn-action" data-action="disponible" data-hab-id="${hab.id_hab}">
                        <span class="icon is-small"><i class="fas fa-check"></i></span>
                        <span>Marcar Disponible</span>
                    </button>`;
                break;
            case 'DISPONIBLE':
                 actionButton = `
                    <button class="button is-small is-info is-light is-fullwidth btn-action" data-action="limpieza" data-hab-id="${hab.id_hab}">
                        <span class="icon is-small"><i class="fas fa-broom"></i></span>
                        <span>A Limpieza</span>
                    </button>`;
                break;
            // MANTENIMIENTO no tiene botón por defecto
        }

        // Atributos de datos
        const dataAttributes = `
            data-status="${primaryStatusKey}"
            data-arrival-today="${isArrivalToday}"
            data-departure-today="${isDepartureToday}"
        `;

        // Generar el HTML de la tarjeta (igual que en la vista)
        return `
            <div class="column is-one-fifth-desktop is-one-quarter-tablet is-half-mobile room-card-wrapper" ${dataAttributes}>
                <div class="card room-card">
                    <header class="card-header ${colorClass}">
                        <p class="card-header-title has-text-white">Hab. ${numero}</p>
                        <span class="card-header-icon has-text-white">${tipo}</span>
                    </header>
                    <div class="card-content has-text-centered p-3">
                        <span class="icon is-large my-1 ${colorClass}-dark"><i class="fas ${statusInfo.icon} fa-3x"></i></span>
                        <p class="title is-6 ${colorClass}-dark mb-1">${statusInfo.text}</p>
                        <p class="subtitle is-7 has-text-grey">${detailText}</p>
                        ${subStatusText ? `<p class="is-size-7 has-text-grey-light">${subStatusText}</p>` : ''}
                    </div>
                    ${actionButton ? `<footer class="card-footer">${actionButton}</footer>` : ''}
                </div>
            </div>`;
    };


    // --- Lógica de Filtrado ---
    const filterCards = (filter) => {
        const roomCards = roomBoard.querySelectorAll('.room-card-wrapper');
        roomCards.forEach(card => {
            const status = card.dataset.status;
            let show = false;
            switch (filter) {
                case 'TODOS': show = true; break;
                case 'LLEGADA_HOY': show = status === 'LLEGADA_HOY'; break;
                case 'SALIDA_HOY': show = status === 'SALIDA_HOY'; break;
                case 'OCUPADA': show = status === 'OCUPADA' || status === 'SALIDA_HOY'; break;
                case 'DISPONIBLE': show = status === 'DISPONIBLE'; break;
                case 'LIMPIEZA': show = status === 'LIMPIEZA'; break;
                default: show = status === filter;
            }
            card.style.display = show ? '' : 'none';
        });
        filterButtons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.filter === filter));
    };

    // --- Lógica de Acciones (API) ---
    const handleAction = async (e) => {
        const button = e.target.closest('.btn-action');
        if (!button) return; // Si no es un botón de acción, ignora

        // Ya no necesitamos ignorar 'checkin' porque es un <a>
        // if (button.dataset.action === 'checkin') return;

        const habId = button.dataset.habId;
        const action = button.dataset.action;
        const cardWrapper = button.closest('.room-card-wrapper');

        button.classList.add('is-loading');
        statusMessage.classList.add('is-hidden');

        try {
            const response = await fetch('/hoteleria/board/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habId, action }),
            });

            const result = await response.json();

            if (response.ok && result.success && result.habitacion) {
                // ✅ Éxito: Actualizar solo la tarjeta dinámicamente
                const updatedCardHtml = renderRoomCardJS(result.habitacion); // Usar la función JS
                if (cardWrapper) {
                    cardWrapper.outerHTML = updatedCardHtml; // Reemplaza el HTML de la tarjeta
                    // Re-aplicar filtro por si el estado cambió de categoría
                    const activeFilter = document.querySelector('.filter-btn.is-active')?.dataset.filter || 'TODOS';
                    filterCards(activeFilter);
                } else {
                     window.location.reload(); // Fallback si no encuentra el wrapper
                }
                showStatusMessage(result.message || 'Acción completada.', 'success'); // Mensaje de éxito

            } else {
                // Error devuelto por el servidor
                showStatusMessage(result.message || 'Error desconocido al procesar la acción.', 'danger');
            }

        } catch (error) {
            console.error('Error en la acción:', error);
            showStatusMessage(`Error de red o conexión: ${error.message}`, 'danger');
        } finally {
            // Quitar estado de carga (el botón original ya no existe si se reemplazó el HTML)
             const newButton = roomBoard.querySelector(`.room-card-wrapper[data-hab-id="${habId}"] .btn-action`);
             if (newButton) newButton.classList.remove('is-loading');
        }
    };

    // --- Mostrar Mensajes ---
    const showStatusMessage = (message, type = 'info') => {
        statusMessage.textContent = message;
        statusMessage.className = `notification is-${type} mt-4`;
        statusMessage.classList.remove('is-hidden');
    };

    // --- Asignar Event Listeners ---
    if (roomBoard) { // Verificar que el tablero exista
        roomBoard.addEventListener('click', handleAction);
    } else {
        console.error("Elemento #room-board no encontrado.");
    }


    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterCards(button.dataset.filter);
        });
    });

    // Aplicar filtro inicial (TODOS)
    filterCards('TODOS');

});