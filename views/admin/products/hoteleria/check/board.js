const layout = require('../../layout'); // Adjust path if needed
const { format, isToday, isPast, isSameDay, startOfToday } = require('date-fns'); // 💡 CORREGIDO
const { es } = require('date-fns/locale');
// --- Helpers de Vista ---
const formatDate = (dateStr, formatStr = 'dd/MM') => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Fecha Inválida';
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return format(date, formatStr, { locale: es });
    } catch (e) { return 'Fecha Inválida'; }
};

const statusMap = {
    DISPONIBLE: { color: 'success', text: 'Disponible', icon: 'fa-bed' },
    OCUPADA: { color: 'danger', text: 'Ocupada', icon: 'fa-user-clock' },
    LIMPIEZA: { color: 'info', text: 'Limpieza', icon: 'fa-broom' },
    MANTENIMIENTO: { color: 'dark', text: 'Mantenimiento', icon: 'fa-tools' },
    LLEGADA_HOY: { color: 'link', text: 'Llegada Hoy', icon: 'fa-calendar-check' },
    SALIDA_HOY: { color: 'warning', text: 'Salida Hoy', icon: 'fa-sign-out-alt' },
};

// 1. Renderizado de Tarjeta de Habitación (Para el tablero)
const renderRoomCard = (hab) => {
    const { id_hab, numero, piso, TipoHabitacion, estado, reservaActiva } = hab;
    const tipo = TipoHabitacion?.nombre || 'N/A';

    let primaryStatusKey = estado;
    let checkInDate = null;
    let checkOutDate = null;
    let huespedNombre = '';
    let huespedDocumento = '';

    if (reservaActiva) {
        try {
            checkInDate = new Date(reservaActiva.fechaCheckIn);
            checkOutDate = new Date(reservaActiva.fechaCheckOut);
            checkInDate.setMinutes(checkInDate.getMinutes() + checkInDate.getTimezoneOffset());
            checkOutDate.setMinutes(checkOutDate.getMinutes() + checkOutDate.getTimezoneOffset());
        } catch (e) { checkInDate = null; checkOutDate = null; }
    }
    
    const todayForCard = startOfToday(); 
    if (estado === 'DISPONIBLE' && reservaActiva && reservaActiva.estado === 'CONFIRMADA' && checkInDate && isSameDay(checkInDate, todayForCard)) {
        primaryStatusKey = 'LLEGADA_HOY';
    } else if (estado === 'OCUPADA' && reservaActiva && checkOutDate && isSameDay(checkOutDate, todayForCard)) {
        primaryStatusKey = 'SALIDA_HOY';
    }

    const statusInfo = statusMap[primaryStatusKey] || { color: 'light', text: estado, icon: 'fa-question-circle' };
    const colorClass = `is-${statusInfo.color}`;
    const textColorClass = `has-text-${statusInfo.color}`;

    let detailText = `Tipo: ${tipo}`; 
    let subStatusText = ''; 
    let actionButton = ''; 

    switch (primaryStatusKey) {
        case 'LLEGADA_HOY':
            if (reservaActiva && reservaActiva.Huesped) {
                huespedNombre = `${reservaActiva.Huesped.nombre || ''} ${reservaActiva.Huesped.apellido || ''}`.trim().toLowerCase();
                huespedDocumento = (reservaActiva.Huesped.documento || '').toLowerCase();
                detailText = `${reservaActiva.Huesped.nombre || ''} ${reservaActiva.Huesped.apellido || ''}`.trim();
            }
            subStatusText = `<span class="tag is-link is-light">${reservaActiva?.codigoReserva || 'N/A'}</span>`;
            actionButton = `
                <a href="/hoteleria/checkin/${reservaActiva?.id_reserva}" class="button is-primary is-fullwidth">
                    <span class="icon"><i class="fas fa-sign-in-alt"></i></span>
                    <span>Check-in</span>
                </a>
            `;
            break;
            
        case 'SALIDA_HOY': 
        case 'OCUPADA': 
             if (reservaActiva) {
                 huespedNombre = `${reservaActiva.Huesped.nombre || ''} ${reservaActiva.Huesped.apellido || ''}`.trim().toLowerCase(); 
                 huespedDocumento = (reservaActiva.Huesped?.documento || '').toLowerCase(); 
                 detailText = `${reservaActiva.Huesped.nombre || ''} ${reservaActiva.Huesped?.apellido || ''}`.trim();
                 subStatusText = `<span class="tag ${primaryStatusKey === 'SALIDA_HOY' ? 'is-warning' : 'is-danger'} is-light">Sale: ${formatDate(reservaActiva.fechaCheckOut)}</span>`; 
                 actionButton = `
                    <a href="/hoteleria/checkout/${reservaActiva.id_reserva}" class="button is-warning is-fullwidth">
                        <span class="icon"><i class="fas fa-sign-out-alt"></i></span>
                        <span>Check-out</span>
                    </a>
                 `;
             } else {
                  detailText = "Sin datos"; 
                  subStatusText = "";
             }
             break;
             
        case 'LIMPIEZA':
             subStatusText = `<span class="tag is-info is-light">En proceso</span>`;
             actionButton = `
                <button class="button is-success is-fullwidth btn-action" data-action="disponible" data-hab-id="${id_hab}">
                    <span class="icon"><i class="fas fa-check"></i></span>
                    <span>Disponible</span>
                </button>
             `;
             break;
             
        case 'DISPONIBLE': 
             subStatusText = `<span class="tag is-success is-light">Lista</span>`;
             actionButton = `
                <button class="button is-dark is-light is-fullwidth btn-action" data-action="mantenimiento" data-hab-id="${id_hab}">
                    <span class="icon"><i class="fas fa-tools"></i></span>
                    <span>Mantenimiento</span>
                </button>
             `;
             break;
             
        case 'MANTENIMIENTO':
             subStatusText = `<span class="tag is-dark">Fuera de servicio</span>`;
             actionButton = `
                <button class="button is-success is-fullwidth btn-action" data-action="disponible" data-hab-id="${id_hab}">
                    <span class="icon"><i class="fas fa-check"></i></span>
                    <span>Disponible</span>
                </button>
             `;
             break;
    }

    const dataAttributes = `data-status="${primaryStatusKey}" data-id="${id_hab}" data-nombre-huesped="${huespedNombre}" data-documento-huesped="${huespedDocumento}"`;

    return `
        <div class="column is-one-fifth-desktop is-one-third-tablet is-half-mobile room-card-wrapper" ${dataAttributes}>
            <div class="card room-card">
                <header class="card-header ${colorClass}">
                    <p class="card-header-title has-text-white is-size-4">${numero}</p>
                </header>
                <div class="card-content has-text-centered p-4">
                    <span class="icon is-large my-2 ${textColorClass}">
                        <i class="fas ${statusInfo.icon} fa-3x"></i>
                    </span>
                    <p class="title is-5 ${textColorClass} mb-2">${statusInfo.text}</p>
                    <p class="subtitle is-6 has-text-grey mb-2">${detailText}</p>
                    <p class="is-size-7 has-text-grey-light">Piso ${piso || '?'} • ${tipo}</p>
                    ${subStatusText ? `<div class="mt-2">${subStatusText}</div>` : ''}
                </div>
                ${actionButton ? `<footer class="card-footer"><div class="card-footer-item p-2">${actionButton}</div></footer>` : ''}
            </div>
        </div>
    `;
};

// --- Módulo Principal ---
module.exports = ({ habitaciones = [] }) => { 
    
    // 💡 CORRECCIÓN 1: Definición de 'today' fuera de renderRoomCard
    const today = startOfToday(); 
    
    // 1. Calcular Recuentos y Listas de Tarjetas
    const counts = { TODOS: habitaciones.length, LLEGADA_HOY: 0, OCUPADAS_TOTAL: 0, DISPONIBLE: 0, LIMPIEZA: 0, MANTENIMIENTO: 0 };
    const llegadasHoyCards = [];
    const ocupadasCards = [];
    
    habitaciones.forEach(hab => {
        let primaryStatusKey = hab.estado;
        let checkInDate = null;
        let checkOutDate = null;

        if (hab.reservaActiva) {
            try {
                checkInDate = new Date(hab.reservaActiva.fechaCheckIn);
                checkOutDate = new Date(hab.reservaActiva.fechaCheckOut);
                checkInDate.setMinutes(checkInDate.getMinutes() + checkInDate.getTimezoneOffset());
                checkOutDate.setMinutes(checkOutDate.getMinutes() + checkOutDate.getTimezoneOffset());
            } catch {}
        }

        // 🔥 LLEGADA HOY
        if (hab.estado === 'DISPONIBLE' && hab.reservaActiva && hab.reservaActiva.estado === 'CONFIRMADA' && checkInDate && isSameDay(checkInDate, today)) {
            primaryStatusKey = 'LLEGADA_HOY';
            llegadasHoyCards.push(hab);
            counts['LLEGADA_HOY']++; // 🔥 AGREGAR ESTE CONTADOR
            
        // 🔥 SALIDA HOY u OCUPADA
        } else if (hab.estado === 'OCUPADA') {
            primaryStatusKey = (hab.reservaActiva && checkOutDate && isSameDay(checkOutDate, today)) ? 'SALIDA_HOY' : 'OCUPADA';
            ocupadasCards.push(hab);
            counts['OCUPADAS_TOTAL']++;
            
        // 🔥 OTROS ESTADOS
        } else {
            // Contar estados puros (DISPONIBLE sin reserva, LIMPIEZA, MANTENIMIENTO)
            if (counts[hab.estado] !== undefined) {
                counts[hab.estado]++;
            }
        }
    });

    // 2. Renderizar HTML
    const checkinCardsHtml = llegadasHoyCards.length > 0
        ? llegadasHoyCards.map(renderRoomCard).join('')
        : '<div class="column is-full"><p class="has-text-grey-light has-text-centered mt-5">No hay llegadas programadas para hoy.</p></div>';

    const ocupadasCardsHtml = ocupadasCards.length > 0
        ? ocupadasCards.map(renderRoomCard).join('')
        : '<div class="column is-full"><p class="has-text-grey-light has-text-centered mt-5">No hay habitaciones ocupadas.</p></div>';

    const allRoomCardsHtml = habitaciones.length > 0
        ? habitaciones.map(renderRoomCard).join('')
        : '<div class="column is-full"><p class="has-text-grey has-text-centered">No hay habitaciones para mostrar.</p></div>';

    // 3. Devolver Layout
return layout({
    content: `
    <link rel="stylesheet" href="/css/room-board.css"> 
    
    <section class="section">
        
        <div class="box p-5"> 
        
            <!-- HEADER -->
            <div class="level mb-5">
              <div class="level-left">
                <div>
                  <h1 class="title is-2 mb-2">🏨 Gestión Diaria</h1>
                  <p class="subtitle is-5 has-text-grey">
                    ${format(today, "EEEE, dd 'de' MMMM yyyy", { locale: es })}
                  </p>
                </div>
              </div>
              <div class="level-right">
                <a href="/hoteleria/walk-in" class="button is-success is-large is-rounded">
                    <span class="icon is-large"><i class="fas fa-walking"></i></span>
                    <span>Walk-in</span>
                </a>
              </div>
            </div>
            
            <!-- RESUMEN RÁPIDO -->
            <div class="columns is-mobile mb-4">
              <div class="column">
                <div class="box has-background-success-light has-text-centered">
                  <p class="heading">Disponibles</p>
                  <p class="title is-3">${counts.DISPONIBLE || 0}</p>
                </div>
              </div>
              <div class="column">
                <div class="box has-background-danger-light has-text-centered">
                  <p class="heading">Ocupadas</p>
                  <p class="title is-3">${counts.OCUPADAS_TOTAL || 0}</p>
                </div>
              </div>
              <div class="column">
                <div class="box has-background-info-light has-text-centered">
                  <p class="heading">Limpieza</p>
                  <p class="title is-3">${counts.LIMPIEZA || 0}</p>
                </div>
              </div>
              <div class="column">
                <div class="box has-background-dark has-text-white-ter has-text-centered">
                  <p class="heading">Mantenimiento</p>
                  <p class="title is-3 has-text-white">${counts.MANTENIMIENTO || 0}</p>
                </div>
              </div>
            </div>
            
            <!-- TABS -->
            <div class="tabs is-boxed is-large">
              <ul>
                <li class="is-active" data-tab="tab-checkin">
                  <a>
                    <span class="icon"><i class="fas fa-calendar-check"></i></span>
                    <span>Llegadas Hoy</span>
                    <span class="tag is-link is-rounded ml-2">${counts.LLEGADA_HOY || 0}</span>
                  </a>
                </li>
                <li data-tab="tab-checkout">
                  <a>
                    <span class="icon"><i class="fas fa-user-clock"></i></span>
                    <span>Ocupadas</span>
                    <span class="tag is-danger is-rounded ml-2">${counts.OCUPADAS_TOTAL || 0}</span>
                  </a>
                </li>
                <li data-tab="tab-board">
                  <a>
                    <span class="icon"><i class="fas fa-border-all"></i></span>
                    <span>Todas las Habitaciones</span>
                    <span class="tag is-grey-light is-rounded ml-2">${habitaciones.length}</span>
                  </a>
                </li>
              </ul>
            </div>

            <!-- TAB 1: LLEGADAS HOY -->
            <div class="tab-content" id="tab-checkin">
                ${llegadasHoyCards.length > 0 ? `
                    <div class="field mb-4">
                        <div class="control has-icons-left">
                            <input class="input is-large is-rounded" type="text" id="search-checkin-input" placeholder="🔍 Buscar por nombre o documento...">
                            <span class="icon is-left"><i class="fas fa-search"></i></span>
                        </div>
                    </div>
                    <div class="columns is-multiline is-mobile" id="checkin-list-wrapper">
                        ${checkinCardsHtml}
                    </div>
                ` : `
                    <div class="notification is-info is-light">
                        <p class="has-text-centered is-size-5">
                            <span class="icon is-large"><i class="fas fa-info-circle fa-2x"></i></span>
                        </p>
                        <p class="has-text-centered is-size-4 mt-3">
                            No hay llegadas programadas para hoy
                        </p>
                        <p class="has-text-centered has-text-grey mt-2">
                            Las reservas confirmadas aparecerán aquí
                        </p>
                    </div>
                `}
            </div>
            
            <!-- TAB 2: OCUPADAS -->
            <div class="tab-content is-hidden" id="tab-checkout">
                 ${ocupadasCards.length > 0 ? `
                    <div class="field mb-4">
                        <div class="control has-icons-left">
                            <input class="input is-large is-rounded" type="text" id="search-checkout-input" placeholder="🔍 Buscar por nombre o documento...">
                            <span class="icon is-left"><i class="fas fa-search"></i></span>
                        </div>
                    </div>
                    <div class="columns is-multiline is-mobile" id="checkout-list-wrapper">
                        ${ocupadasCardsHtml}
                    </div>
                ` : `
                    <div class="notification is-warning is-light">
                        <p class="has-text-centered is-size-5">
                            <span class="icon is-large"><i class="fas fa-bed fa-2x"></i></span>
                        </p>
                        <p class="has-text-centered is-size-4 mt-3">
                            No hay habitaciones ocupadas
                        </p>
                    </div>
                `}
            </div>

            <!-- TAB 3: TABLERO COMPLETO -->
            <div class="tab-content is-hidden" id="tab-board">
                <!-- Filtros Rápidos -->
                <div class="buttons mb-4">
                    <button class="button is-rounded filter-status" data-status-filter="TODOS">
                        <span class="icon"><i class="fas fa-border-all"></i></span>
                        <span>Todas (${habitaciones.length})</span>
                    </button>
                    <button class="button is-success is-rounded is-light filter-status" data-status-filter="DISPONIBLE">
                        <span class="icon"><i class="fas fa-bed"></i></span>
                        <span>Disponibles (${counts.DISPONIBLE || 0})</span>
                    </button>
                    <button class="button is-danger is-rounded is-light filter-status" data-status-filter="OCUPADA">
                        <span class="icon"><i class="fas fa-user"></i></span>
                        <span>Ocupadas (${counts.OCUPADAS_TOTAL || 0})</span>
                    </button>
                    <button class="button is-info is-rounded is-light filter-status" data-status-filter="LIMPIEZA">
                        <span class="icon"><i class="fas fa-broom"></i></span>
                        <span>Limpieza (${counts.LIMPIEZA || 0})</span>
                    </button>
                    <button class="button is-dark is-rounded is-light filter-status" data-status-filter="MANTENIMIENTO">
                        <span class="icon"><i class="fas fa-tools"></i></span>
                        <span>Mantenimiento (${counts.MANTENIMIENTO || 0})</span>
                    </button>
                </div>
                
                <div class="columns is-multiline is-mobile" id="room-board">
                    ${allRoomCardsHtml}
                </div>
            </div>

            <div id="status-message" class="notification is-hidden mt-4"></div>
        
        </div> 
    </section>

    <script src="/js/room-board.js"></script> 
    `,
});
};