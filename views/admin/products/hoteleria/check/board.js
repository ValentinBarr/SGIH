const layout = require('../../layout');
const { format, isToday, isPast, isSameDay } = require('date-fns'); // Agregamos isSameDay
const { es } = require('date-fns/locale');

// --- Helpers ---
const formatDate = (dateStr, formatStr = 'dd/MM') => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return format(date, formatStr, { locale: es });
};

// Mapeo de estados a colores y texto para el filtro rápido
const statusMap = {
    DISPONIBLE: { color: 'success', text: 'Disponible', icon: 'fa-bed' },
    OCUPADA: { color: 'danger', text: 'Ocupada', icon: 'fa-clock' },
    LIMPIEZA: { color: 'info', text: 'Limpieza', icon: 'fa-broom' },
    MANTENIMIENTO: { color: 'dark', text: 'Mantenimiento', icon: 'fa-tools' },
    LLEGADA_HOY: { color: 'link', text: 'Llegada Hoy', icon: 'fa-calendar-check' }, // Estado virtual para filtro
    SALIDA_HOY: { color: 'warning', text: 'Salida Hoy', icon: 'fa-sign-out-alt' }, // Estado virtual para filtro
};

// --- Renderizado de Tarjeta Mejorado ---
const renderRoomCard = (hab) => {
    const { numero, piso, TipoHabitacion, estado, reservaActiva } = hab;
    const tipo = TipoHabitacion?.nombre || 'N/A';
    
    // Determinar estado principal y color
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

    // Lógica específica por estado
    switch (primaryStatusKey) {
        case 'LLEGADA_HOY':
            detailText = `Huésped: ${reservaActiva.Huesped.apellido}`;
            subStatusText = `Reserva: #${reservaActiva.codigoReserva}`;
            // ⚠️ Acción Check-in ahora es un ENLACE a una página de detalles
            actionButton = `
                <a href="/hoteleria/reservas/${reservaActiva.id_reserva}/checkin-detail" class="button is-small is-primary is-fullwidth">
                    <span class="icon is-small"><i class="fas fa-sign-in-alt"></i></span>
                    <span>Ver Check-in</span>
                </a>
            `;
            break;
        case 'SALIDA_HOY':
        case 'OCUPADA':
             if (reservaActiva) {
                detailText = `Huésped: ${reservaActiva.Huesped.apellido}`;
                subStatusText = `Sale: ${formatDate(reservaActiva.fechaCheckOut)}`;
                 actionButton = `
                    <button class="button is-small is-warning is-fullwidth btn-action" data-action="checkout" data-hab-id="${hab.id_hab}">
                        <span class="icon is-small"><i class="fas fa-sign-out-alt"></i></span>
                        <span>Check-out</span>
                    </button>
                `;
             }
             break;
        case 'LIMPIEZA':
             actionButton = `
                <button class="button is-small is-success is-fullwidth btn-action" data-action="disponible" data-hab-id="${hab.id_hab}">
                     <span class="icon is-small"><i class="fas fa-check"></i></span>
                    <span>Marcar Disponible</span>
                </button>
             `;
            break;
        case 'DISPONIBLE': // Disponible sin llegada hoy
             actionButton = `
                <button class="button is-small is-info is-light is-fullwidth btn-action" data-action="limpieza" data-hab-id="${hab.id_hab}">
                     <span class="icon is-small"><i class="fas fa-broom"></i></span>
                    <span>A Limpieza</span>
                </button>
             `;
            break;
        case 'MANTENIMIENTO':
            // Podrías añadir un botón para marcar como disponible si aplica
            break;
    }

    // Atributos de datos para el filtrado JS
    const dataAttributes = `
        data-status="${primaryStatusKey}" 
        data-arrival-today="${isArrivalToday}"
        data-departure-today="${isDepartureToday}"
    `;

    return `
        <div class="column is-one-fifth-desktop is-one-quarter-tablet is-half-mobile room-card-wrapper" ${dataAttributes}>
            <div class="card room-card">
                <header class="card-header ${colorClass}">
                    <p class="card-header-title has-text-white">
                        Hab. ${numero} 
                    </p>
                    <span class="card-header-icon has-text-white">
                        ${tipo}
                    </span>
                </header>
                <div class="card-content has-text-centered p-3">
                    <span class="icon is-large my-1 ${colorClass}-dark">
                       <i class="fas ${statusInfo.icon} fa-3x"></i>
                    </span>
                    <p class="title is-6 ${colorClass}-dark mb-1">${statusInfo.text}</p>
                    <p class="subtitle is-7 has-text-grey">${detailText}</p>
                    ${subStatusText ? `<p class="is-size-7 has-text-grey-light">${subStatusText}</p>` : ''}
                </div>
                ${actionButton ? `<footer class="card-footer">${actionButton}</footer>` : ''}
            </div>
        </div>
    `;
};

// --- Módulo Principal ---
module.exports = ({ habitaciones = [] }) => {
    const cardsHtml = habitaciones.map(renderRoomCard).join('');

    return layout({
        content: `
        <section class="section">
            <h1 class="title is-3">Tablero de Estatus</h1>
            <p class="subtitle is-6">Gestión de Check-in, Check-out y Estados.</p>

            <div class="box mb-5">
                <p class="mb-2 has-text-weight-semibold">Filtros Rápidos:</p>
                <div class="buttons are-small">
                    <button class="button is-rounded filter-btn is-active" data-filter="TODOS">Todos</button>
                    <button class="button is-rounded filter-btn is-link" data-filter="LLEGADA_HOY">Check-in Hoy</button>
                    <button class="button is-rounded filter-btn is-warning" data-filter="SALIDA_HOY">Check-out Hoy</button>
                    <button class="button is-rounded filter-btn is-danger" data-filter="OCUPADA">Ocupadas</button>
                    <button class="button is-rounded filter-btn is-success" data-filter="DISPONIBLE">Disponibles</button>
                    <button class="button is-rounded filter-btn is-info" data-filter="LIMPIEZA">En Limpieza</button>
                </div>
            </div>

            <hr>

            <div class="columns is-multiline is-mobile" id="room-board">
                ${cardsHtml}
            </div>

            <div id="status-message" class="notification is-hidden mt-4"></div>
        </section>

        <script src="/js/room-board.js"></script> 
        `,
    });
};
