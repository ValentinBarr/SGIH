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

    // Map status to CSS classes
    const statusClassMap = {
        'DISPONIBLE': 'available',
        'OCUPADA': 'occupied', 
        'LIMPIEZA': 'cleaning',
        'MANTENIMIENTO': 'maintenance',
        'LLEGADA_HOY': 'arrival',
        'SALIDA_HOY': 'departure'
    };
    
    const statusClass = statusClassMap[primaryStatusKey] || 'available';
    
    return `
        <div class="room-card" ${dataAttributes}>
            <div class="room-card-header room-card-header--${statusClass}">
                <i class="fas fa-door-closed"></i>
                <span>Habitación ${numero}</span>
            </div>
            <div class="room-card-body">
                <div class="room-status-icon ${textColorClass}">
                    <i class="fas ${statusInfo.icon}"></i>
                </div>
                <div class="room-status-text ${textColorClass}">${statusInfo.text}</div>
                <div class="room-details">${detailText}</div>
                <div class="room-meta">
                    <span class="room-meta-tag">Piso ${piso || '?'}</span>
                    <span class="room-meta-tag">${tipo}</span>
                </div>
                ${subStatusText ? `<div class="room-status-tag room-status-tag--${statusInfo.color}">${subStatusText.replace(/<[^>]*>/g, '').replace('Sale: ', '')}</div>` : ''}
            </div>
            ${actionButton ? `<div class="room-card-footer">${actionButton.replace('button is-success is-fullwidth btn-action', 'room-action-btn room-action-btn--success').replace('button is-dark is-light is-fullwidth btn-action', 'room-action-btn room-action-btn--secondary').replace('button is-primary is-fullwidth', 'room-action-btn room-action-btn--primary').replace('button is-warning is-fullwidth', 'room-action-btn room-action-btn--warning')}</div>` : ''}
        </div>
    `;
};

// --- Módulo Principal ---
module.exports = ({ habitaciones = [] }) => { 
    
    // CORRECCIÓN 1: Definición de 'today' fuera de renderRoomCard
    const today = startOfToday(); 
    
    // 1. Calcular Recuentos y Listas de Tarjetas
    const counts = { TODOS: habitaciones.length, LLEGADA_HOY: 0, OCUPADAS_TOTAL: 0, DISPONIBLE: 0, LIMPIEZA: 0, MANTENIMIENTO: 0 };
    const llegadasHoyCards = [];
    const ocupadasCards = [];
    
    console.log(`📋 Procesando ${habitaciones.length} habitaciones para el tablero`);
    
    habitaciones.forEach(hab => {
        let primaryStatusKey = hab.estado;
        let checkInDate = null;
        let checkOutDate = null;

        console.log(`🔍 Procesando habitación ${hab.numero}:`, {
            estado: hab.estado,
            tieneReservaActiva: !!hab.reservaActiva,
            codigoReserva: hab.reservaActiva?.codigoReserva
        });

        if (hab.reservaActiva) {
            try {
                checkInDate = new Date(hab.reservaActiva.fechaCheckIn);
                checkOutDate = new Date(hab.reservaActiva.fechaCheckOut);
                checkInDate.setMinutes(checkInDate.getMinutes() + checkInDate.getTimezoneOffset());
                checkOutDate.setMinutes(checkOutDate.getMinutes() + checkOutDate.getTimezoneOffset());
                
                console.log(`  → Fechas procesadas:`, {
                    checkIn: checkInDate.toISOString(),
                    checkOut: checkOutDate.toISOString(),
                    esHoy: isSameDay(checkInDate, today)
                });
            } catch (error) {
                console.error(`  ❌ Error procesando fechas:`, error);
            }
        }

        // LLEGADA HOY
        if (hab.estado === 'DISPONIBLE' && hab.reservaActiva && hab.reservaActiva.estado === 'CONFIRMADA' && checkInDate && isSameDay(checkInDate, today)) {
            primaryStatusKey = 'LLEGADA_HOY';
            llegadasHoyCards.push(hab);
            counts['LLEGADA_HOY']++; 
            console.log(`  ✅ LLEGADA HOY: Habitación ${hab.numero} clasificada como llegada hoy`);
            
        // SALIDA HOY u OCUPADA
        } else if (hab.estado === 'OCUPADA') {
            primaryStatusKey = (hab.reservaActiva && checkOutDate && isSameDay(checkOutDate, today)) ? 'SALIDA_HOY' : 'OCUPADA';
            ocupadasCards.push(hab);
            counts['OCUPADAS_TOTAL']++;
            console.log(`  🟠 OCUPADA: Habitación ${hab.numero} clasificada como ${primaryStatusKey}`);
            
        // OTROS ESTADOS
        } else {
            // Contar estados puros (DISPONIBLE sin reserva, LIMPIEZA, MANTENIMIENTO)
            if (counts[hab.estado] !== undefined) {
                counts[hab.estado]++;
            }
            console.log(`  🔘 OTRO ESTADO: Habitación ${hab.numero} en estado ${hab.estado}`);
        }
    });

    console.log(`📏 Resumen final:`, {
        totalHabitaciones: habitaciones.length,
        llegadasHoy: llegadasHoyCards.length,
        ocupadas: ocupadasCards.length,
        disponibles: counts.DISPONIBLE,
        limpieza: counts.LIMPIEZA,
        mantenimiento: counts.MANTENIMIENTO
    });
    
    console.log(`🟢 Habitaciones con llegada hoy:`, llegadasHoyCards.map(h => `${h.numero} (${h.reservaActiva?.codigoReserva})`));

    // 2. Renderizar HTML
    const checkinCardsHtml = llegadasHoyCards.length > 0
        ? llegadasHoyCards.map(renderRoomCard).join('')
        : '<div class="column is-full"><p class="has-text-grey has-text-centered">No hay llegadas programadas para hoy.</p></div>';

    const ocupadasCardsHtml = ocupadasCards.length > 0
        ? ocupadasCards.map(renderRoomCard).join('')
        : '<div class="column is-full"><p class="has-text-grey has-text-centered">No hay habitaciones ocupadas.</p></div>';

    const allRoomCardsHtml = habitaciones.length > 0
        ? habitaciones.map(renderRoomCard).join('')
        : '<div class="column is-full"><p class="has-text-grey has-text-centered">No hay habitaciones para mostrar.</p></div>';

    // 3. Devolver Layout
return layout({
    content: `
    <link rel="stylesheet" href="/css/room-board.css"> 
    
    <div class="room-board-page">
        <div class="room-board-card">
            <!-- HEADER -->
            <div class="room-board-header">
              <div>
                <h1 class="room-board-title">
                  <i class="fas fa-hotel"></i>
                  Gestión Diaria
                </h1>
                <p class="room-board-subtitle">
                  <i class="fas fa-calendar-day"></i>
                  ${format(today, "EEEE, dd 'de' MMMM yyyy", { locale: es })}
                </p>
              </div>
              <div class="room-board-actions">
                <a href="/hoteleria/reservas/new" class="btn-room btn-room--outline">
                    <i class="fas fa-plus"></i>
                    <span>Nueva Reserva</span>
                </a>
                <a href="/hoteleria/walk-in" class="btn-room btn-room--success">
                    <i class="fas fa-walking"></i>
                    <span>Walk-in</span>
                </a>
              </div>
            </div>
            
            <!-- RESUMEN RÁPIDO -->
            <div class="summary-grid">
              <div class="summary-card summary-card--success">
                <div class="summary-card-content">
                  <div class="summary-card-info">
                    <h3>Disponibles</h3>
                    <p class="number">${counts.DISPONIBLE || 0}</p>
                  </div>
                  <div class="summary-card-icon">
                    <i class="fas fa-bed"></i>
                  </div>
                </div>
              </div>
              <div class="summary-card summary-card--danger">
                <div class="summary-card-content">
                  <div class="summary-card-info">
                    <h3>Ocupadas</h3>
                    <p class="number">${counts.OCUPADAS_TOTAL || 0}</p>
                  </div>
                  <div class="summary-card-icon">
                    <i class="fas fa-user-clock"></i>
                  </div>
                </div>
              </div>
              <div class="summary-card summary-card--info">
                <div class="summary-card-content">
                  <div class="summary-card-info">
                    <h3>Limpieza</h3>
                    <p class="number">${counts.LIMPIEZA || 0}</p>
                  </div>
                  <div class="summary-card-icon">
                    <i class="fas fa-broom"></i>
                  </div>
                </div>
              </div>
              <div class="summary-card summary-card--dark">
                <div class="summary-card-content">
                  <div class="summary-card-info">
                    <h3>Mantenimiento</h3>
                    <p class="number">${counts.MANTENIMIENTO || 0}</p>
                  </div>
                  <div class="summary-card-icon">
                    <i class="fas fa-tools"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- TABS -->
            <div class="room-tabs">
              <ul class="room-tabs-list">
                <li class="room-tab is-active" data-tab="tab-checkin">
                  <a class="room-tab-link">
                    <i class="fas fa-calendar-check"></i>
                    <span>Llegadas Hoy</span>
                    <span class="room-tab-badge">${counts.LLEGADA_HOY || 0}</span>
                  </a>
                </li>
                <li class="room-tab" data-tab="tab-checkout">
                  <a class="room-tab-link">
                    <i class="fas fa-user-clock"></i>
                    <span>Ocupadas</span>
                    <span class="room-tab-badge">${counts.OCUPADAS_TOTAL || 0}</span>
                  </a>
                </li>
                <li class="room-tab" data-tab="tab-board">
                  <a class="room-tab-link">
                    <i class="fas fa-th-large"></i>
                    <span>Tablero Completo</span>
                    <span class="room-tab-badge">${habitaciones.length}</span>
                  </a>
                </li>
              </ul>
            </div>

            <!-- TAB 1: LLEGADAS HOY -->
            <div class="tab-content" id="tab-checkin">
                ${llegadasHoyCards.length > 0 ? `
                    <div class="search-container">
                        <div class="search-wrapper">
                            <i class="fas fa-search search-icon"></i>
                            <input class="search-input" type="text" id="search-checkin-input" placeholder="Buscar por nombre, documento o habitación...">
                        </div>
                    </div>
                    <div class="rooms-grid" id="checkin-list-wrapper">
                        ${checkinCardsHtml}
                    </div>
                ` : `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <h3 class="empty-state-title">
                            No hay llegadas programadas para hoy
                        </h3>
                        <p class="empty-state-description">
                            Las reservas confirmadas para hoy aparecerán en esta sección
                        </p>
                        <a href="/hoteleria/reservas/new" class="btn-room btn-room--primary">
                            <i class="fas fa-plus"></i>
                            <span>Crear Nueva Reserva</span>
                        </a>
                    </div>
                `}
            </div>
            
            <!-- TAB 2: OCUPADAS -->
            <div class="tab-content is-hidden" id="tab-checkout">
                 ${ocupadasCards.length > 0 ? `
                    <div class="search-container">
                        <div class="search-wrapper">
                            <i class="fas fa-search search-icon"></i>
                            <input class="search-input" type="text" id="search-checkout-input" placeholder="Buscar por nombre, documento o habitación...">
                        </div>
                    </div>
                    <div class="rooms-grid" id="checkout-list-wrapper">
                        ${ocupadasCardsHtml}
                    </div>
                ` : `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-bed"></i>
                        </div>
                        <h3 class="empty-state-title">
                            No hay habitaciones ocupadas
                        </h3>
                        <p class="empty-state-description">
                            Todas las habitaciones están disponibles o en mantenimiento
                        </p>
                    </div>
                `}
            </div>

            <!-- TAB 3: TABLERO COMPLETO -->
            <div class="tab-content is-hidden" id="tab-board">
                <!-- Filtros Rápidos -->
                <div class="filter-bar">
                    <button class="filter-btn is-active filter-status" data-status-filter="TODOS">
                        <i class="fas fa-th-large"></i>
                        <span>Todas (${habitaciones.length})</span>
                    </button>
                    <button class="filter-btn filter-status" data-status-filter="DISPONIBLE">
                        <i class="fas fa-bed"></i>
                        <span>Disponibles (${counts.DISPONIBLE || 0})</span>
                    </button>
                    <button class="filter-btn filter-status" data-status-filter="OCUPADA">
                        <i class="fas fa-user-clock"></i>
                        <span>Ocupadas (${counts.OCUPADAS_TOTAL || 0})</span>
                    </button>
                    <button class="filter-btn filter-status" data-status-filter="LIMPIEZA">
                        <i class="fas fa-broom"></i>
                        <span>Limpieza (${counts.LIMPIEZA || 0})</span>
                    </button>
                    <button class="filter-btn filter-status" data-status-filter="MANTENIMIENTO">
                        <i class="fas fa-tools"></i>
                        <span>Mantenimiento (${counts.MANTENIMIENTO || 0})</span>
                    </button>
                </div>
                
                <div class="rooms-grid" id="room-board">
                    ${allRoomCardsHtml}
                </div>
            </div>

            <div id="status-message" class="status-message is-hidden"></div>
        
        </div>
    </div>

    <script src="/js/room-board.js"></script> 
    `,
});
};