const layout = require('../../layout');
const { format, differenceInDays } = require('date-fns');
const { es } = require('date-fns/locale');

// --- Helpers para la Vista ---

/**
 * Formatea fecha a dd/MM/yyyy (manejando zona horaria)
 */
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return format(date, 'dd/MM/yyyy', { locale: es });
};

/**
 * Formatea un número como moneda ARS (Peso Argentino).
 */
const formatCurrency = (value) => {
    const number = Number(value) || 0;
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(number);
}

/**
 * Devuelve la clase de color de Bulma para cada estado (Se mantiene, aunque no se usa en la tabla)
 */
const getEstadoTag = (estado) => {
    const styles = {
        PENDIENTE: 'is-warning',
        CONFIRMADA: 'is-success',
        CHECKED_IN: 'is-link',
        CHECKED_OUT: 'is-dark',
        CANCELADA: 'is-danger',
    };
    return styles[estado] || 'is-light';
};

/**
 * Construye links de paginación preservando filtros
 */
const buildPageLink = (query, page) => {
    const newQuery = { ...query, page };
    return `?${new URLSearchParams(newQuery)}`;
};

/**
 * Calcula el número de noches
 */
const calcNoches = (checkIn, checkOut) => {
    const noches = differenceInDays(new Date(checkOut), new Date(checkIn));
    return noches <= 0 ? 1 : noches;
};

/**
 * Obtiene el número de la habitación principal
 */
const getRoomNumber = (reserva) => {
    return reserva.Habitacion?.numero || 'N/A';
};

// Función para agrupar reservas por día
const renderReservasPorDia = (reservas, query = {}) => {
    console.log('🔍 VISTA: renderReservasPorDia - Total reservas recibidas:', reservas.length);
    
    if (reservas.length > 0) {
        console.log('🔍 VISTA: Todas las reservas recibidas:', reservas.map(r => ({
            id: r.id_reserva,
            codigo: r.codigoReserva,
            fechaCheckIn: r.fechaCheckIn,
            fechaCheckInTipo: typeof r.fechaCheckIn,
            fechaCheckInISO: r.fechaCheckIn instanceof Date ? r.fechaCheckIn.toISOString() : 'No es Date',
            estado: r.estado,
            huesped: `${r.Huesped?.apellido}, ${r.Huesped?.nombre}`
        })));
    }
    
    // Agrupar reservas por fecha de check-in (solo desde hoy en adelante)
    const reservasPorDia = {};
    
    // Obtener fecha de hoy en zona horaria local
    const hoy = new Date();
    const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    console.log('🔍 Fecha de hoy para filtro:', {
        hoyCompleto: hoy.toISOString(),
        hoySoloFecha: hoySoloFecha.toISOString(),
        hoySoloFechaLocal: hoySoloFecha.toLocaleDateString()
    });
    
    reservas.forEach(reserva => {
        try {
            // Manejar diferentes formatos de fecha
            let fechaCheckIn;
            if (reserva.fechaCheckIn instanceof Date) {
                fechaCheckIn = new Date(reserva.fechaCheckIn);
            } else if (typeof reserva.fechaCheckIn === 'string') {
                // Si ya tiene formato ISO, usarlo directamente
                if (reserva.fechaCheckIn.includes('T')) {
                    fechaCheckIn = new Date(reserva.fechaCheckIn);
                } else {
                    // Si es solo fecha (YYYY-MM-DD), añadir tiempo
                    fechaCheckIn = new Date(reserva.fechaCheckIn + 'T00:00:00');
                }
            } else {
                console.warn('Formato de fecha no reconocido:', reserva.fechaCheckIn);
                return; // Saltar esta reserva
            }
            
            // Verificar que la fecha es válida
            if (isNaN(fechaCheckIn.getTime())) {
                console.warn('Fecha inválida para reserva:', reserva.id_reserva, reserva.fechaCheckIn);
                return; // Saltar esta reserva
            }
            
            const fechaKey = fechaCheckIn.toISOString().split('T')[0]; // YYYY-MM-DD
            
            // Crear fecha solo con año, mes y día para comparación precisa
            const fechaCheckInSoloFecha = new Date(fechaCheckIn.getFullYear(), fechaCheckIn.getMonth(), fechaCheckIn.getDate());
            
            console.log('🔍 Comparando fechas:', {
                reservaId: reserva.id_reserva,
                fechaOriginal: reserva.fechaCheckIn,
                fechaCheckInSoloFecha: fechaCheckInSoloFecha.toISOString(),
                hoySoloFecha: hoySoloFecha.toISOString(),
                diferenciaDias: Math.floor((fechaCheckInSoloFecha.getTime() - hoySoloFecha.getTime()) / (1000 * 60 * 60 * 24)),
                incluir: fechaCheckInSoloFecha.getTime() >= hoySoloFecha.getTime()
            });
            
            // Solo incluir reservas de hoy en adelante (comparando solo fechas, no horas)
            if (fechaCheckInSoloFecha.getTime() >= hoySoloFecha.getTime()) {
                if (!reservasPorDia[fechaKey]) {
                    reservasPorDia[fechaKey] = [];
                }
                reservasPorDia[fechaKey].push(reserva);
            }
        } catch (error) {
            console.error('Error procesando fecha de reserva:', reserva.id_reserva, reserva.fechaCheckIn, error);
        }
    });

    // Ordenar las fechas
    const fechasOrdenadas = Object.keys(reservasPorDia).sort();
    
    console.log('🔍 VISTA: Resultado del filtrado:', {
        reservasOriginales: reservas.length,
        fechasConReservas: fechasOrdenadas.length,
        fechasEncontradas: fechasOrdenadas,
        totalReservasFiltradas: Object.values(reservasPorDia).reduce((total, reservasDelDia) => total + reservasDelDia.length, 0),
        detallesPorFecha: fechasOrdenadas.map(fecha => ({
            fecha,
            cantidadReservas: reservasPorDia[fecha].length,
            reservas: reservasPorDia[fecha].map(r => ({
                id: r.id_reserva,
                codigo: r.codigoReserva,
                huesped: `${r.Huesped?.apellido}, ${r.Huesped?.nombre}`
            }))
        }))
    });
    
    let html = '';
    
    fechasOrdenadas.forEach(fecha => {
        const reservasDelDia = reservasPorDia[fecha];
        const fechaObj = new Date(fecha + 'T00:00:00');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        // Determinar si es hoy, mañana, etc.
        let etiquetaDia = '';
        const diferenciaDias = Math.floor((fechaObj.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diferenciaDias === 0) {
            etiquetaDia = ' (Hoy)';
        } else if (diferenciaDias === 1) {
            etiquetaDia = ' (Mañana)';
        } else if (diferenciaDias === 2) {
            etiquetaDia = ' (Pasado Mañana)';
        }

        // Header del día
        html += `
            <div class="day-section mb-5">
                <div class="day-header mb-4">
                    <h4 class="title is-5 has-text-primary mb-2">
                        <i class="fas fa-calendar-day"></i>
                        ${formatDate(fecha)}${etiquetaDia}
                    </h4>
                    <p class="subtitle is-6 has-text-grey">
                        ${reservasDelDia.length} ${reservasDelDia.length === 1 ? 'reserva' : 'reservas'}
                    </p>
                </div>
                
                <div class="reservas-del-dia">
        `;

        // Reservas del día
        reservasDelDia.forEach(reserva => {
            html += `
                <div class="card mb-3">
                    <div class="card-content p-4">
                        <div class="columns is-mobile is-vcentered">
                            <div class="column is-3">
                                <div class="media">
                                    <div class="media-left">
                                        <figure class="image is-48x48">
                                            <i class="fas fa-user-circle fa-2x has-text-primary"></i>
                                        </figure>
                                    </div>
                                    <div class="media-content">
                                        <p class="title is-6 mb-1">${reserva.Huesped?.apellido || ''}, ${reserva.Huesped?.nombre || ''}</p>
                                        <p class="subtitle is-7 has-text-grey">${reserva.codigoReserva}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="column is-2">
                                <div class="has-text-centered">
                                    <p class="heading">Check-out</p>
                                    <p class="title is-6">${formatDate(reserva.fechaCheckOut)}</p>
                                    <p class="subtitle is-7 has-text-grey">${calcNoches(reserva.fechaCheckIn, reserva.fechaCheckOut)} noches</p>
                                </div>
                            </div>
                            
                            <div class="column is-2">
                                <div class="has-text-centered">
                                    <p class="heading">Habitación</p>
                                    <p class="title is-6">Hab. ${getRoomNumber(reserva)}</p>
                                    <p class="subtitle is-7 has-text-grey">${reserva.Habitacion?.TipoHabitacion?.nombre || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div class="column is-2">
                                <div class="has-text-centered">
                                    <p class="heading">Total</p>
                                    <p class="title is-5 has-text-success">${formatCurrency(reserva.total)}</p>
                                </div>
                            </div>
                            
                            <div class="column is-3">
                                <div class="buttons is-right">
                                    ${renderAcciones(reserva, query)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    return html;
};

/**
 * Renderiza los botones de acción según el estado de la reserva
 */
const renderAcciones = (res, query = {}) => {
    const qParams = new URLSearchParams(query);
    
    const editBtn = `
      <a href="/hoteleria/reservas/${res.id_reserva}/edit?${qParams}" 
         class="button is-small is-info is-rounded" 
         title="Editar reserva">
        <span class="icon is-small"><i class="fas fa-edit"></i></span>
        <span>Editar</span>
      </a>
    `;
    
    const cancelBtn = `
      <button class="button is-small is-danger is-rounded btn-cancelar-reserva" 
              data-id="${res.id_reserva}" 
              data-codigo="${res.codigoReserva}"
              data-huesped="${res.Huesped?.apellido || ''}, ${res.Huesped?.nombre || ''}"
              title="Cancelar reserva">
        <span class="icon is-small"><i class="fas fa-times-circle"></i></span>
        <span>Cancelar</span>
      </button>
    `;
    
    const verBtn = `
      <button class="button is-small is-light is-rounded" 
              title="Reserva finalizada" 
              disabled>
        <span class="icon is-small"><i class="fas fa-check-circle"></i></span>
        <span>Finalizada</span>
      </button>
    `;

    switch (res.estado) {
        case 'PENDIENTE':
        case 'CONFIRMADA':
            return `
              <div class="buttons has-addons">
                ${editBtn}
                ${cancelBtn}
              </div>
            `;
        case 'CHECKED_IN':
            return `
              <div class="buttons">
                ${editBtn}
              </div>
            `;
        default: // CHECKED_OUT o CANCELADA
            if (res.estado === 'CANCELADA') {
                const ocultarBtn = `
                  <button class="button is-small is-light is-rounded btn-ocultar-reserva" 
                          data-id="${res.id_reserva}" 
                          data-codigo="${res.codigoReserva}"
                          title="Ocultar reserva cancelada">
                    <span class="icon is-small"><i class="fas fa-eye-slash"></i></span>
                    <span>Ocultar</span>
                  </button>
                `;
                return `
                  <div class="buttons">
                    ${ocultarBtn}
                  </div>
                `;
            }
            return `
              <div class="buttons">
                ${verBtn}
              </div>
            `;
    }
};

// --- Módulo Principal de la Vista ---

module.exports = ({
    reservas = [],
    tiposHabitacion = [], 
    estadosReserva = [], 
    huespedes = [],
    query = {},
    totalPages = 1,
    currentPage = 1,
    totalReservas = 0,
}) => {
    /**
     * Renderiza los botones de acción según el estado de la reserva
     */
    const renderAcciones = (res) => {
        const qParams = new URLSearchParams(query);
        
        const editBtn = `
          <a href="/hoteleria/reservas/${res.id_reserva}/edit?${qParams}" 
             class="button is-small is-info is-rounded" 
             title="Editar reserva">
            <span class="icon is-small"><i class="fas fa-edit"></i></span>
            <span>Editar</span>
          </a>
        `;
        
        const cancelBtn = `
          <button class="button is-small is-danger is-rounded btn-cancelar-reserva" 
                  data-id="${res.id_reserva}" 
                  data-codigo="${res.codigoReserva}"
                  data-huesped="${res.Huesped?.apellido || ''}, ${res.Huesped?.nombre || ''}"
                  title="Cancelar reserva">
            <span class="icon is-small"><i class="fas fa-times-circle"></i></span>
            <span>Cancelar</span>
          </button>
        `;
        
        const verBtn = `
          <button class="button is-small is-light is-rounded" 
                  title="Reserva finalizada" 
                  disabled>
            <span class="icon is-small"><i class="fas fa-check-circle"></i></span>
            <span>Finalizada</span>
          </button>
        `;

        switch (res.estado) {
            case 'PENDIENTE':
            case 'CONFIRMADA':
                return `
                  <div class="buttons has-addons">
                    ${editBtn}
                    ${cancelBtn}
                  </div>
                `;
            case 'CHECKED_IN':
                return `
                  <div class="buttons">
                    ${editBtn}
                  </div>
                `;
            default: // CHECKED_OUT o CANCELADA
                if (res.estado === 'CANCELADA') {
                    const ocultarBtn = `
                      <button class="button is-small is-light is-rounded btn-ocultar-reserva" 
                              data-id="${res.id_reserva}" 
                              data-codigo="${res.codigoReserva}"
                              title="Ocultar reserva cancelada">
                        <span class="icon is-small"><i class="fas fa-eye-slash"></i></span>
                        <span>Ocultar</span>
                      </button>
                    `;
                    return `
                      <div class="buttons">
                        ${ocultarBtn}
                      </div>
                    `;
                }
                return `
                  <div class="buttons">
                    ${verBtn}
                  </div>
                `;
        }
    };

    return layout({
        content: `
        <!-- Sistema de Gestión de Reservas con Pestañas -->
        <section class="inventory-card">
          <div class="calendario-hotelero">
            <!-- Encabezado principal -->
            <div class="level mb-4">
              <div class="level-left">
                <h1 class="title">Gestión de Reservas</h1>
              </div>
              <div class="level-right">
                <button class="button is-light" id="btn-mostrar-ocultas" style="display: none;">
                  <span class="icon"><i class="fas fa-eye"></i></span>
                  <span>Mostrar ocultas (<span id="count-ocultas">0</span>)</span>
                </button>
              </div>
            </div>

            <!-- Pestañas de selección -->
            <div class="tabs is-boxed calendario-tabs">
              <ul>
                <li class="is-active" data-tab="tabla">
                  <a>
                    <span class="icon is-small"><i class="fas fa-list"></i></span>
                    <span>Lista de Reservas</span>
                  </a>
                </li>
                <li data-tab="visual">
                  <a>
                    <span class="icon is-small"><i class="fas fa-calendar-alt"></i></span>
                    <span>Calendario Visual</span>
                  </a>
                </li>
                <li data-tab="funcional">
                  <a>
                    <span class="icon is-small"><i class="fas fa-calendar-plus"></i></span>
                    <span>Crear Reserva</span>
                  </a>
                </li>
              </ul>
            </div>

            <!-- Contenedor de la Tabla de Reservas -->
            <div id="tabla-reservas-container" class="calendario-tab-content active">
              <div class="tabla-reservas">
                <p class="is-size-7 has-text-grey mb-3">
                  Mostrando ${totalReservas} ${totalReservas === 1 ? 'reserva' : 'reservas'}
                </p>

                ${
                    reservas.length > 0
                        ? renderReservasPorDia(reservas, query)
                        : `
                      <div class="has-text-centered py-6">
                        <i class="fas fa-calendar-times fa-3x has-text-grey-light mb-3"></i>
                        <p class="title is-6 has-text-grey">No se encontraron reservas</p>
                        <p class="subtitle is-7 has-text-grey-light">No hay reservas que coincidan con los filtros aplicados</p>
                      </div>
                    `
                    }
              </div>
            </div>

            <!-- Contenedor del Calendario Visual -->
            <div id="calendario-visual-container" class="calendario-tab-content">
              <div class="calendario-visual">
                <!-- Controles de navegación -->
                <div class="calendario-controls">
                  <div class="calendario-nav">
                    <button id="btn-prev-visual" class="btn-nav" aria-label="Anterior">
                      <i class="fas fa-chevron-left"></i>
                    </button>
                    <h3 id="periodo-actual-visual" class="periodo-title">Noviembre 2024</h3>
                    <button id="btn-next-visual" class="btn-nav" aria-label="Siguiente">
                      <i class="fas fa-chevron-right"></i>
                    </button>
                  </div>
                  
                  <div class="calendario-view-buttons">
                    <button id="btn-hoy-visual" class="btn-hoy">Hoy</button>
                    <button id="btn-vista-semana-visual" class="btn-vista" data-vista="semana">Semana</button>
                    <button id="btn-vista-mes-visual" class="btn-vista active" data-vista="mes">Mes</button>
                  </div>
                </div>

                <!-- Contenedor del calendario visual -->
                <div id="calendario-container-visual" class="calendario-container">
                  <!-- El calendario visual se renderiza aquí -->
                </div>

                <!-- Sección de detalles del día seleccionado -->
                <div id="habitaciones-section-visual" class="habitaciones-section" style="display: none;">
                  <h4 id="fecha-seleccionada-title-visual" class="fecha-seleccionada-title"></h4>
                  <div id="habitaciones-container-visual" class="habitaciones-container">
                    <!-- Los detalles se renderizan aquí -->
                  </div>
                </div>

                <!-- Leyenda visual -->
                <div class="calendario-leyenda">
                  <p class="has-text-weight-semibold mb-2">Leyenda:</p>
                  <div class="leyenda-items">
                    <div class="leyenda-item">
                      <span class="leyenda-color" style="background-color: #48c78e;"></span>
                      <span><i class="fas fa-sign-in-alt"></i> Check-in</span>
                    </div>
                    <div class="leyenda-item">
                      <span class="leyenda-color" style="background-color: #3e8ed0;"></span>
                      <span><i class="fas fa-bed"></i> Ocupado</span>
                    </div>
                    <div class="leyenda-item">
                      <span class="leyenda-color" style="background-color: #ffe08a;"></span>
                      <span><i class="fas fa-sign-out-alt"></i> Check-out</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contenedor del Calendario Funcional -->
            <div id="calendario-funcional-container" class="calendario-tab-content">
              <div class="calendario-funcional">
                <div class="columns is-variable is-6">
                  <!-- Columna del Formulario -->
                  <div class="column is-6">
                    <div class="formulario-reserva">
                      <h4 class="title is-5 mb-4">
                        <i class="fas fa-plus-circle"></i> Nueva Reserva
                      </h4>

                      <!-- Fechas Seleccionadas -->
                      <div class="box has-background-light mb-4" id="fechas-seleccionadas" style="display: none;">
                        <h5 class="subtitle is-6 mb-2">
                          <i class="fas fa-calendar-check"></i> Fechas Seleccionadas
                        </h5>
                        <div class="content">
                          <p><strong>Check-in:</strong> <span id="fecha-checkin-display">-</span></p>
                          <p><strong>Check-out:</strong> <span id="fecha-checkout-display">-</span></p>
                          <p><strong>Noches:</strong> <span id="noches-display">-</span></p>
                        </div>
                      </div>

                      <!-- Formulario de Reserva -->
                      <form id="form-nueva-reserva">
                        <!-- Paso 1: Sección de Huésped -->
                        <div class="field-group mb-5">
                          <div class="step-header">
                            <span class="step-number">1</span>
                            <h5 class="subtitle is-6 mb-0">
                              <i class="fas fa-user"></i> Huésped Principal
                            </h5>
                          </div>
                          
                          <div class="field mb-3">
                            <label class="label">Seleccionar Huésped *</label>
                            <div class="control has-icons-left" style="position: relative;">
                              <input 
                                type="text" 
                                id="huesped_search_input_funcional" 
                                class="input" 
                                placeholder="Buscar huésped por nombre, apellido o documento..."
                                autocomplete="off"
                              >
                              <span class="icon is-small is-left">
                                <i class="fas fa-search"></i>
                              </span>
                              <input type="hidden" name="id_huesped" id="select-huesped-funcional" required>
                              <div id="huesped_dropdown_funcional" class="dropdown-menu" style="display: none; position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; max-height: 300px; overflow-y: auto; background: white; border: 1px solid #dbdbdb; border-radius: 6px; box-shadow: 0 8px 16px rgba(0,0,0,0.1); margin-top: 4px;">
                                <div class="dropdown-content" id="huesped_dropdown_content_funcional"></div>
                              </div>
                            </div>
                            <p class="help">Escriba para buscar o haga clic en el botón + para agregar un nuevo huésped</p>
                          </div>

                          <button type="button" class="button is-light is-fullwidth mt-3" id="btn-nuevo-huesped-funcional">
                            <span class="icon"><i class="fas fa-plus"></i></span>
                            <span>Crear Nuevo Huésped</span>
                          </button>
                        </div>

                        <!-- Paso 2: Sección de Ocupantes -->
                        <div class="field-group mb-5">
                          <div class="step-header">
                            <span class="step-number">2</span>
                            <h5 class="subtitle is-6 mb-0">
                              <i class="fas fa-users"></i> Ocupantes
                            </h5>
                          </div>
                          
                          <div class="columns is-mobile is-variable is-3">
                            <div class="column">
                              <div class="field">
                                <label class="label">Adultos *</label>
                                <div class="control">
                                  <input class="input" type="number" id="adultos" name="cantAdultos" min="1" value="1" required>
                                </div>
                              </div>
                            </div>
                            <div class="column">
                              <div class="field">
                                <label class="label">Niños</label>
                                <div class="control">
                                  <input class="input" type="number" id="ninos" name="cantNinos" min="0" value="0">
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Paso 3: Fechas de Estadía -->
                        <div class="field-group mb-5">
                          <div class="step-header">
                            <span class="step-number">3</span>
                            <h5 class="subtitle is-6 mb-0">
                              <i class="fas fa-calendar-alt"></i> Fechas de Estadía
                            </h5>
                          </div>
                          
                          <div class="columns is-mobile is-variable is-3">
                            <div class="column">
                              <div class="field">
                                <label class="label">Check-in *</label>
                                <div class="control">
                                  <input class="input" type="date" id="fecha-checkin" name="fechaCheckIn" required>
                                </div>
                              </div>
                            </div>
                            <div class="column">
                              <div class="field">
                                <label class="label">Check-out *</label>
                                <div class="control">
                                  <input class="input" type="date" id="fecha-checkout" name="fechaCheckOut" required>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div class="notification is-info is-light mt-3" id="info-noches" style="display: none;">
                            <p class="has-text-weight-semibold">
                              <i class="fas fa-moon"></i>
                              <span id="cantidad-noches-info">0</span> noche(s) de estadía
                            </p>
                          </div>
                        </div>


                        <!-- Paso 4: Total a Pagar -->
                        <div class="field-group mb-5" id="total-reserva" style="display: none;">
                          <div class="step-header">
                            <span class="step-number">4</span>
                            <h5 class="subtitle is-6 mb-0">
                              <i class="fas fa-calculator"></i> Total a Pagar
                            </h5>
                          </div>
                          <div class="box has-background-success-light mt-4">
                            <div class="content">
                              <p class="is-size-3 has-text-weight-bold has-text-success mb-2" id="total-amount">$0</p>
                              <p class="has-text-grey">
                                <span id="precio-por-noche">$0</span> × <span id="cantidad-noches">0</span> noches
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- Paso 5: Observaciones -->
                        <div class="field-group mb-5">
                          <div class="step-header">
                            <span class="step-number">5</span>
                            <h5 class="subtitle is-6 mb-0">
                              <i class="fas fa-comment"></i> Observaciones
                            </h5>
                          </div>
                          <div class="field mt-4">
                            <div class="control">
                              <textarea class="textarea" id="observaciones-funcional" name="observaciones" rows="3" placeholder="Observaciones adicionales (opcional)..."></textarea>
                            </div>
                          </div>
                        </div>

                        <!-- Botones de Acción -->
                        <div class="field is-grouped">
                          <div class="control is-expanded">
                            <button type="button" class="button is-light is-fullwidth" id="btn-limpiar-formulario">
                              <span class="icon"><i class="fas fa-eraser"></i></span>
                              <span>Limpiar</span>
                            </button>
                          </div>
                          <div class="control is-expanded">
                            <button type="submit" class="button is-primary is-fullwidth" id="btn-crear-reserva" disabled>
                              <span class="icon"><i class="fas fa-check"></i></span>
                              <span>Crear Reserva</span>
                            </button>
                          </div>
                        </div>

                        <!-- Campos ocultos -->
                        <input type="hidden" id="habitacion-seleccionada" name="id_hab">
                        <input type="hidden" id="total-hidden" name="total">
                      </form>
                    </div>
                  </div>

                  <!-- Columna de Habitaciones Disponibles -->
                  <div class="column is-6">
                    <div class="habitaciones-container">
                      <div class="habitaciones-header mb-4">
                        <h4 class="title is-5">
                          <i class="fas fa-door-open"></i> Habitaciones Individuales
                        </h4>
                        <p class="subtitle is-6 has-text-grey">
                          Cada habitación específica disponible para las fechas seleccionadas
                        </p>
                      </div>

                      <!-- Contenedor de habitaciones -->
                      <div id="habitaciones-disponibles-columna" style="display: none;">
                        <div id="lista-habitaciones-columna">
                          <!-- Las habitaciones se cargan dinámicamente aquí -->
                        </div>
                      </div>

                      <!-- Estado inicial -->
                      <div id="habitaciones-placeholder" class="has-text-centered py-6">
                        <div class="icon-placeholder mb-4">
                          <i class="fas fa-bed fa-4x has-text-grey-light"></i>
                        </div>
                        <p class="title is-6 has-text-grey">Esperando selección de fechas</p>
                        <p class="subtitle is-7 has-text-grey-light">
                          Complete los pasos 1, 2 y 3 del formulario para ver las habitaciones disponibles
                        </p>
                      </div>

                      <!-- Estado de carga -->
                      <div id="habitaciones-loading" class="has-text-centered py-6" style="display: none;">
                        <div class="icon-placeholder mb-4">
                          <i class="fas fa-spinner fa-spin fa-3x has-text-primary"></i>
                        </div>
                        <p class="title is-6 has-text-primary">Buscando habitaciones...</p>
                        <p class="subtitle is-7 has-text-grey">
                          Verificando disponibilidad para las fechas seleccionadas
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Modal de Reserva -->
        <div id="modal-reserva" class="modal-reserva" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Crear Nueva Reserva</h3>
              <button id="btn-cerrar-modal" class="btn-cerrar-modal">&times;</button>
            </div>
            
            <form id="form-reserva" class="form-reserva">
              <div class="form-section">
                <h4>Información de la Habitación</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label>Tipo de Habitación</label>
                    <input type="text" id="tipo-habitacion-nombre" readonly class="form-control-readonly">
                    <input type="hidden" id="tipo-habitacion-id" name="tipoHabitacionId">
                  </div>
                  <div class="form-group">
                    <label>Precio por Noche</label>
                    <input type="text" id="precio-habitacion" readonly class="form-control-readonly">
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h4>Fechas de Estadía</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label>Check-in *</label>
                    <input type="date" id="fecha-checkin" name="fechaCheckIn" required class="form-control">
                  </div>
                  <div class="form-group">
                    <label>Check-out *</label>
                    <input type="date" id="fecha-checkout" name="fechaCheckOut" required class="form-control">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Adultos *</label>
                    <input type="number" id="cant-adultos" name="cantAdultos" min="1" value="1" required class="form-control">
                  </div>
                  <div class="form-group">
                    <label>Niños</label>
                    <input type="number" id="cant-ninos" name="cantNinos" min="0" value="0" class="form-control">
                  </div>
                </div>
                <div class="total-preview">
                  <strong>Total estimado:</strong> <span id="total-estimado">$0</span>
                </div>
              </div>

              <div class="form-section">
                <h4>Información del Huésped</h4>
                <div class="form-group">
                  <label>Seleccionar Huésped *</label>
                  <select id="select-huesped" name="id_huesped" required class="form-control">
                    <option value="">Cargando huéspedes...</option>
                  </select>
                </div>
                <button type="button" id="btn-nuevo-huesped" class="btn-secondary">+ Crear Nuevo Huésped</button>
              </div>

              <div class="form-section">
                <div class="form-group">
                  <label>Observaciones</label>
                  <textarea id="observaciones" name="observaciones" rows="3" class="form-control"></textarea>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" id="btn-cancelar-reserva" class="btn-cancelar">Cancelar</button>
                <button type="submit" id="btn-confirmar-reserva" class="btn-confirmar">Confirmar Reserva</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Modal de Nuevo Huésped -->
        <div id="modal-nuevo-huesped" class="modal-reserva" style="display: none;">
          <div class="modal-content modal-content-small">
            <div class="modal-header">
              <h3>Crear Nuevo Huésped</h3>
              <button id="btn-cerrar-modal-huesped" class="btn-cerrar-modal">&times;</button>
            </div>
            
            <form id="form-nuevo-huesped" class="form-reserva">
              <div class="form-group">
                <label>Nombre *</label>
                <input type="text" id="huesped-nombre" name="nombre" required class="form-control">
              </div>
              <div class="form-group">
                <label>Apellido *</label>
                <input type="text" id="huesped-apellido" name="apellido" required class="form-control">
              </div>
              <div class="form-group">
                <label>Documento</label>
                <input type="text" id="huesped-documento" name="documento" class="form-control">
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" id="huesped-telefono" name="telefono" class="form-control">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="huesped-email" name="email" class="form-control">
              </div>

              <div class="modal-footer">
                <button type="button" id="btn-cancelar-huesped" class="btn-cancelar">Cancelar</button>
                <button type="submit" class="btn-confirmar">Crear Huésped</button>
              </div>
            </form>
          </div>
        </div>

        <div class="modal" id="modalReserva">
           </div>

        <!-- Modal de Confirmación de Cancelación -->
        <div class="modal" id="modal-cancelar-reserva">
          <div class="modal-background"></div>
          <div class="modal-card">
            <header class="modal-card-head has-background-danger">
              <p class="modal-card-title has-text-white">
                <span class="icon"><i class="fas fa-exclamation-triangle"></i></span>
                Cancelar Reserva
              </p>
              <button class="delete" aria-label="close" id="btn-cerrar-modal-cancelar"></button>
            </header>
            <section class="modal-card-body">
              <div class="content">
                <p class="is-size-5 has-text-weight-semibold">¿Estás seguro de que deseas cancelar esta reserva?</p>
                <div class="box has-background-light">
                  <p><strong>Código:</strong> <span id="cancel-codigo"></span></p>
                  <p><strong>Huésped:</strong> <span id="cancel-huesped"></span></p>
                </div>
                <p class="has-text-danger">
                  <span class="icon"><i class="fas fa-info-circle"></i></span>
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </section>
            <footer class="modal-card-foot">
              <button class="button is-light" id="btn-cancelar-modal">No, mantener reserva</button>
              <button class="button is-danger" id="btn-confirmar-cancelar">
                <span class="icon"><i class="fas fa-times-circle"></i></span>
                <span>Sí, cancelar reserva</span>
              </button>
            </footer>
          </div>
        </div>


        <link rel="stylesheet" href="/css/calendario.css">
        <link rel="stylesheet" href="/css/calendario-reservas.css">
        <link rel="stylesheet" href="/css/calendario-tabs.css">
        <script src="/js/calendario-reservas-visual.js"></script>
        <script src="/js/calendario-reservas-funcional.js"></script>
        <script src="/js/calendario-tabs.js"></script>
        <script src="/js/reservas.js"></script>
        <script>

          // Función temporal para verificar reservas de hoy
          async function verificarReservasHoy() {
            console.log('🔍 VERIFICANDO: Reservas de hoy en BD...');
            
            const hoy = new Date();
            const hoyStr = hoy.toISOString().split('T')[0]; // YYYY-MM-DD
            
            console.log('🔍 VERIFICANDO: Fecha de hoy:', {
              hoy: hoy.toISOString(),
              hoyStr,
              hoyLocal: hoy.toLocaleDateString()
            });
            
            try {
              // Hacer una consulta directa a la API para ver todas las reservas
              const response = await fetch('/hoteleria/reservas/api/calendario');
              if (response.ok) {
                const data = await response.json();
                const reservas = data.reservas || [];
                
                console.log('🔍 VERIFICANDO: Total reservas en BD:', reservas.length);
                
                // Filtrar reservas de hoy
                const reservasHoy = reservas.filter(r => {
                  const fechaReserva = new Date(r.fechaCheckIn);
                  const fechaReservaStr = fechaReserva.toISOString().split('T')[0];
                  return fechaReservaStr === hoyStr;
                });
                
                console.log('🔍 VERIFICANDO: Reservas de hoy encontradas:', {
                  cantidad: reservasHoy.length,
                  reservas: reservasHoy.map(r => ({
                    id: r.id_reserva,
                    codigo: r.codigoReserva,
                    fechaCheckIn: r.fechaCheckIn,
                    fechaCheckInStr: new Date(r.fechaCheckIn).toISOString().split('T')[0],
                    huesped: \`\${r.Huesped?.apellido}, \${r.Huesped?.nombre}\`,
                    estado: r.estado
                  }))
                });
                
                if (reservasHoy.length === 0) {
                  console.log('❌ PROBLEMA: No hay reservas de hoy en la BD');
                } else {
                  console.log('✅ ENCONTRADAS: Hay', reservasHoy.length, 'reservas de hoy en la BD');
                }
                
              } else {
                console.error('Error al obtener reservas de la API');
              }
            } catch (error) {
              console.error('Error verificando reservas:', error);
            }
          }

          // Datos de huéspedes para el buscador
          const huespedData = ${JSON.stringify(huespedes.map(h => ({
            id_huesped: h.id_huesped,
            nombre: h.nombre,
            apellido: h.apellido,
            documento: h.documento || 'N/D',
            telefono: h.telefono || '',
            email: h.email || '',
            displayText: `${h.apellido}, ${h.nombre} (${h.documento || 'N/D'})`
          })))};

          // Inicialización de la página
          document.addEventListener('DOMContentLoaded', () => {
            // Ejecutar verificación automáticamente
            verificarReservasHoy();

            // Inicializar buscador de huéspedes
            const searchInput = document.getElementById('huesped_search_input_funcional');
            const hiddenInput = document.getElementById('select-huesped-funcional');
            const dropdown = document.getElementById('huesped_dropdown_funcional');
            const dropdownContent = document.getElementById('huesped_dropdown_content_funcional');
            
            if (searchInput && hiddenInput && dropdown && dropdownContent) {
              // Función para filtrar huéspedes
              function filterHuespedes(query) {
                if (!query || query.length < 2) return [];
                
                const lowerQuery = query.toLowerCase();
                return huespedData.filter(h => 
                  h.nombre.toLowerCase().includes(lowerQuery) ||
                  h.apellido.toLowerCase().includes(lowerQuery) ||
                  h.documento.toLowerCase().includes(lowerQuery)
                ).slice(0, 10);
              }
              
              // Función para renderizar resultados
              function renderResults(results) {
                if (results.length === 0) {
                  dropdownContent.innerHTML = '<div class="dropdown-item has-text-grey" style="padding: 1rem;">No se encontraron huéspedes</div>';
                  return;
                }
                
                dropdownContent.innerHTML = results.map(h => 
                  '<a class="dropdown-item" data-id="' + h.id_huesped + '" data-display="' + h.displayText + '" style="padding: 0.75rem 1rem; cursor: pointer;">' +
                    '<div>' +
                      '<strong>' + h.apellido + ', ' + h.nombre + '</strong>' +
                      '<br>' +
                      '<small class="has-text-grey">' +
                        '<i class="fas fa-id-card"></i> ' + h.documento +
                        (h.telefono ? ' | <i class="fas fa-phone"></i> ' + h.telefono : '') +
                      '</small>' +
                    '</div>' +
                  '</a>'
                ).join('');
                
                // Agregar event listeners a los items
                dropdownContent.querySelectorAll('.dropdown-item').forEach(function(item) {
                  item.addEventListener('click', function() {
                    const id = item.getAttribute('data-id');
                    const display = item.getAttribute('data-display');
                    hiddenInput.value = id;
                    searchInput.value = display;
                    dropdown.style.display = 'none';
                    
                    // Disparar validación del formulario
                    if (window.validarFormulario) {
                      window.validarFormulario();
                    }
                  });
                });
              }
              
              // Event listener para el input de búsqueda
              searchInput.addEventListener('input', function(e) {
                const query = e.target.value;
                
                if (query.length < 2) {
                  dropdown.style.display = 'none';
                  if (query.length === 0) {
                    hiddenInput.value = '';
                    if (window.validarFormulario) {
                      window.validarFormulario();
                    }
                  }
                  return;
                }
                
                const results = filterHuespedes(query);
                renderResults(results);
                dropdown.style.display = 'block';
              });
              
              // Cerrar dropdown al hacer clic fuera
              document.addEventListener('click', function(e) {
                if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                  dropdown.style.display = 'none';
                }
              });
              
              // Mostrar dropdown al hacer focus
              searchInput.addEventListener('focus', function() {
                if (searchInput.value.length >= 2) {
                  const results = filterHuespedes(searchInput.value);
                  renderResults(results);
                  dropdown.style.display = 'block';
                }
              });
              
              // Limpiar selección si se borra el texto
              searchInput.addEventListener('keyup', function(e) {
                if (searchInput.value.trim() === '') {
                  hiddenInput.value = '';
                  if (window.validarFormulario) {
                    window.validarFormulario();
                  }
                }
              });
            }

            // Manejo del formulario de nueva reserva
            const formNuevaReserva = document.getElementById('form-nueva-reserva');
            const adultosInput = document.getElementById('adultos');
            const ninosInput = document.getElementById('ninos');
            const huespedSelect = document.getElementById('select-huesped-funcional');
            const btnCrearReserva = document.getElementById('btn-crear-reserva');
            const btnLimpiarFormulario = document.getElementById('btn-limpiar-formulario');

            // Validar formulario y habilitar/deshabilitar botón
            function validarFormulario() {
              const fechaCheckin = document.getElementById('fecha-checkin').value;
              const fechaCheckout = document.getElementById('fecha-checkout').value;
              const huesped = huespedSelect.value;
              const habitacion = document.getElementById('habitacion-seleccionada').value;

              const esValido = fechaCheckin && fechaCheckout && huesped && habitacion;
              btnCrearReserva.disabled = !esValido;
            }

            // Exponer globalmente para que pueda ser llamada desde otros scripts
            window.validarFormulario = validarFormulario;

            // Función para mostrar habitaciones en la columna
            function mostrarHabitacionesEnFormulario(habitacionesDisponibles, tiposHabitacion, noches) {
              const habitacionesSection = document.getElementById('habitaciones-disponibles-columna');
              const listaHabitaciones = document.getElementById('lista-habitaciones-columna');
              const placeholder = document.getElementById('habitaciones-placeholder');
              const loading = document.getElementById('habitaciones-loading');
              
              if (!listaHabitaciones) return;

              // Ocultar placeholder y loading
              if (placeholder) placeholder.style.display = 'none';
              if (loading) loading.style.display = 'none';

              let html = '';
              
              if (habitacionesDisponibles.length === 0) {
                html = \`
                  <div class="notification is-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    No hay habitaciones disponibles para las fechas seleccionadas.
                  </div>
                \`;
              } else {
                // Mostrar cada habitación individual
                habitacionesDisponibles.forEach(habitacion => {
                  const tipo = habitacion.TipoHabitacion;
                  const precioTotal = tipo.precioBase * noches;

                  html += \`
                    <div class="habitacion-individual-card mb-4">
                      <div class="card">
                        <div class="card-content p-4">
                          <div class="media mb-3">
                            <div class="media-left">
                              <figure class="image is-64x64">
                                <i class="fas fa-door-open fa-3x has-text-primary"></i>
                              </figure>
                            </div>
                            <div class="media-content">
                              <p class="title is-5 mb-1">Habitación #\${habitacion.numero}</p>
                              <p class="subtitle is-6 has-text-grey mb-2">\${tipo.nombre}</p>
                              <div class="tags">
                                <span class="tag is-info is-light">
                                  <i class="fas fa-users"></i>&nbsp;
                                  Capacidad: \${tipo.capacidad} personas
                                </span>
                                <span class="tag is-success is-light">
                                  <i class="fas fa-check-circle"></i>&nbsp;
                                  Disponible
                                </span>
                              </div>
                            </div>
                            <div class="media-right has-text-right">
                              <p class="title is-4 has-text-primary mb-1">$\${tipo.precioBase.toLocaleString()}</p>
                              <p class="subtitle is-6 has-text-grey">por noche</p>
                            </div>
                          </div>
                          
                          <div class="content mb-4">
                            <div class="box has-background-primary-light p-3">
                              <p class="is-size-5 has-text-weight-bold has-text-primary">
                                Total por \${noches} noche(s): $\${precioTotal.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div class="buttons">
                            <button class="button is-primary is-large is-fullwidth btn-seleccionar-habitacion" 
                                    data-tipo-id="\${tipo.id_tipoHab}"
                                    data-tipo-nombre="\${tipo.nombre}"
                                    data-precio="\${tipo.precioBase}"
                                    data-total="\${precioTotal}"
                                    data-habitacion-id="\${habitacion.id_hab}"
                                    data-habitacion-numero="\${habitacion.numero}">
                              <span class="icon"><i class="fas fa-check"></i></span>
                              <span>Seleccionar Habitación #\${habitacion.numero}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  \`;
                });
              }

              listaHabitaciones.innerHTML = html;
              
              if (habitacionesSection) {
                habitacionesSection.style.display = 'block';
              }

              // Añadir event listeners a los botones de selección
              document.querySelectorAll('.btn-seleccionar-habitacion').forEach(btn => {
                btn.addEventListener('click', function() {
                  seleccionarHabitacion(this);
                });
              });
            }

            // Función para seleccionar habitación
            function seleccionarHabitacion(boton) {
              const tipoId = boton.getAttribute('data-tipo-id');
              const tipoNombre = boton.getAttribute('data-tipo-nombre');
              const precio = parseFloat(boton.getAttribute('data-precio'));
              const total = parseFloat(boton.getAttribute('data-total'));
              const habitacionId = boton.getAttribute('data-habitacion-id');
              const habitacionNumero = boton.getAttribute('data-habitacion-numero');

              // Actualizar campos ocultos
              const habitacionSeleccionada = document.getElementById('habitacion-seleccionada');
              const totalHidden = document.getElementById('total-hidden');
              
              if (habitacionSeleccionada) habitacionSeleccionada.value = habitacionId;
              if (totalHidden) totalHidden.value = total;

              // Mostrar total
              mostrarTotalReserva(tipoNombre, precio, total, habitacionNumero);

              // Marcar botón como seleccionado
              document.querySelectorAll('.btn-seleccionar-habitacion').forEach(b => {
                b.classList.remove('is-success');
                b.classList.add('is-primary');
                const numero = b.getAttribute('data-habitacion-numero');
                b.innerHTML = \`<span class="icon"><i class="fas fa-check"></i></span><span>Seleccionar Habitación #\${numero}</span>\`;
              });

              boton.classList.remove('is-primary');
              boton.classList.add('is-success');
              boton.innerHTML = \`<span class="icon"><i class="fas fa-check-circle"></i></span><span>Habitación #\${habitacionNumero} Seleccionada</span>\`;

              // Validar formulario
              validarFormulario();
            }

            // Función para mostrar total de la reserva
            function mostrarTotalReserva(tipoNombre, precioPorNoche, total, habitacionNumero) {
              const totalReserva = document.getElementById('total-reserva');
              const totalAmount = document.getElementById('total-amount');
              const precioPorNocheSpan = document.getElementById('precio-por-noche');
              const cantidadNoches = document.getElementById('cantidad-noches');

              if (totalAmount && precioPorNocheSpan && cantidadNoches) {
                const checkin = fechaCheckinInput.value;
                const checkout = fechaCheckoutInput.value;
                const noches = Math.ceil((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24));
                
                totalAmount.textContent = \`$\${total.toLocaleString()}\`;
                precioPorNocheSpan.textContent = \`$\${precioPorNoche.toLocaleString()}\`;
                cantidadNoches.textContent = noches;
              }

              // Actualizar el título del paso 4 para mostrar la habitación seleccionada
              const step4Title = document.querySelector('#total-reserva .step-header h5');
              if (step4Title && habitacionNumero) {
                step4Title.innerHTML = \`
                  <i class="fas fa-calculator"></i> Total - Habitación #\${habitacionNumero}
                \`;
              }

              if (totalReserva) {
                totalReserva.style.display = 'block';
              }
            }

            // Event listeners para validación
            if (adultosInput) adultosInput.addEventListener('input', validarFormulario);
            if (ninosInput) ninosInput.addEventListener('input', validarFormulario);
            if (huespedSelect) huespedSelect.addEventListener('change', validarFormulario);

            // Event listeners para campos de fecha
            const fechaCheckinInput = document.getElementById('fecha-checkin');
            const fechaCheckoutInput = document.getElementById('fecha-checkout');

            // Función para calcular y mostrar noches
            function calcularNoches() {
              const checkin = fechaCheckinInput.value;
              const checkout = fechaCheckoutInput.value;
              
              if (checkin && checkout) {
                const fechaIn = new Date(checkin);
                const fechaOut = new Date(checkout);
                const diffTime = fechaOut - fechaIn;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays > 0) {
                  document.getElementById('cantidad-noches-info').textContent = diffDays;
                  document.getElementById('info-noches').style.display = 'block';
                  
                  // Buscar habitaciones disponibles
                  buscarHabitacionesDisponibles();
                } else {
                  document.getElementById('info-noches').style.display = 'none';
                  limpiarHabitacionesDisponibles();
                }
              } else {
                document.getElementById('info-noches').style.display = 'none';
                limpiarHabitacionesDisponibles();
              }
              
              validarFormulario();
            }

            // Función para buscar habitaciones disponibles
            async function buscarHabitacionesDisponibles() {
              const checkin = fechaCheckinInput.value;
              const checkout = fechaCheckoutInput.value;
              const adultos = adultosInput.value || 1;
              const ninos = ninosInput.value || 0;

              if (!checkin || !checkout) return;

              // Mostrar estado de carga
              mostrarCargandoHabitaciones();

              try {
                const params = new URLSearchParams({
                  checkIn: checkin,
                  checkOut: checkout,
                  adultos: adultos,
                  ninos: ninos
                });

                const response = await fetch(\`/hoteleria/api/disponibilidad?\${params}\`);
                if (response.ok) {
                  const data = await response.json();
                  const noches = Math.ceil((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24));
                  mostrarHabitacionesEnFormulario(data.habitacionesDisponibles, data.tiposHabitacion, noches);
                } else {
                  console.error('Error al buscar habitaciones disponibles');
                  // Mostrar error en la columna
                  mostrarErrorHabitaciones('Error al buscar habitaciones disponibles');
                }
              } catch (error) {
                console.error('Error en la búsqueda de habitaciones:', error);
                mostrarErrorHabitaciones('Error de conexión al buscar habitaciones');
              }
            }

            // Función para mostrar error en habitaciones
            function mostrarErrorHabitaciones(mensaje) {
              const habitacionesSection = document.getElementById('habitaciones-disponibles-columna');
              const listaHabitaciones = document.getElementById('lista-habitaciones-columna');
              const placeholder = document.getElementById('habitaciones-placeholder');
              const loading = document.getElementById('habitaciones-loading');
              
              if (placeholder) placeholder.style.display = 'none';
              if (loading) loading.style.display = 'none';
              
              if (listaHabitaciones) {
                listaHabitaciones.innerHTML = \`
                  <div class="notification is-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    \${mensaje}
                  </div>
                \`;
              }
              
              if (habitacionesSection) habitacionesSection.style.display = 'block';
            }

            // Función para limpiar habitaciones disponibles
            function limpiarHabitacionesDisponibles() {
              const habitacionesSection = document.getElementById('habitaciones-disponibles-columna');
              const placeholder = document.getElementById('habitaciones-placeholder');
              const loading = document.getElementById('habitaciones-loading');
              const totalReserva = document.getElementById('total-reserva');
              
              if (habitacionesSection) habitacionesSection.style.display = 'none';
              if (placeholder) placeholder.style.display = 'block';
              if (loading) loading.style.display = 'none';
              if (totalReserva) totalReserva.style.display = 'none';
              
              // Limpiar campos ocultos
              const habitacionSeleccionada = document.getElementById('habitacion-seleccionada');
              const totalHidden = document.getElementById('total-hidden');
              if (habitacionSeleccionada) habitacionSeleccionada.value = '';
              if (totalHidden) totalHidden.value = '';
            }

            // Función para mostrar estado de carga
            function mostrarCargandoHabitaciones() {
              const placeholder = document.getElementById('habitaciones-placeholder');
              const loading = document.getElementById('habitaciones-loading');
              const habitacionesSection = document.getElementById('habitaciones-disponibles-columna');
              
              if (placeholder) placeholder.style.display = 'none';
              if (loading) loading.style.display = 'block';
              if (habitacionesSection) habitacionesSection.style.display = 'none';
            }

            if (fechaCheckinInput) {
              fechaCheckinInput.addEventListener('change', calcularNoches);
              // Establecer fecha mínima como hoy (permitir seleccionar hoy)
              const hoy = new Date().toISOString().split('T')[0];
              fechaCheckinInput.min = hoy;
              console.log('📅 Fecha mínima establecida:', hoy);
            }

            if (fechaCheckoutInput) {
              fechaCheckoutInput.addEventListener('change', calcularNoches);
            }

            // Actualizar fecha mínima de checkout cuando cambie checkin
            if (fechaCheckinInput) {
              fechaCheckinInput.addEventListener('change', () => {
                if (fechaCheckoutInput && fechaCheckinInput.value) {
                  const fechaMinCheckout = new Date(fechaCheckinInput.value);
                  fechaMinCheckout.setDate(fechaMinCheckout.getDate() + 1);
                  fechaCheckoutInput.min = fechaMinCheckout.toISOString().split('T')[0];
                }
              });
            }

            // Event listeners para ocupantes (actualizar habitaciones cuando cambien)
            if (adultosInput) {
              adultosInput.addEventListener('change', () => {
                if (fechaCheckinInput.value && fechaCheckoutInput.value) {
                  buscarHabitacionesDisponibles();
                }
              });
            }

            if (ninosInput) {
              ninosInput.addEventListener('change', () => {
                if (fechaCheckinInput.value && fechaCheckoutInput.value) {
                  buscarHabitacionesDisponibles();
                }
              });
            }

            // Limpiar formulario
            if (btnLimpiarFormulario) {
              btnLimpiarFormulario.addEventListener('click', () => {
                formNuevaReserva.reset();
                document.getElementById('info-noches').style.display = 'none';
                document.getElementById('habitaciones-disponibles').style.display = 'none';
                document.getElementById('total-reserva').style.display = 'none';
                document.getElementById('habitacion-seleccionada').value = '';
                document.getElementById('total-hidden').value = '';
                validarFormulario();
              });
            }

            // Enviar formulario
            if (formNuevaReserva) {
              formNuevaReserva.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Validar que todos los campos estén completos
                const fechaCheckin = document.getElementById('fecha-checkin').value;
                const fechaCheckout = document.getElementById('fecha-checkout').value;
                const huesped = document.getElementById('select-huesped-funcional').value;
                const habitacion = document.getElementById('habitacion-seleccionada').value;
                const total = document.getElementById('total-hidden').value;
                const adultos = document.getElementById('adultos').value;
                const ninos = document.getElementById('ninos').value;
                const observaciones = document.getElementById('observaciones-funcional').value;

                if (!fechaCheckin || !fechaCheckout || !huesped || !habitacion || !total) {
                  alert('Por favor complete todos los campos requeridos');
                  return;
                }

                // Preparar datos para enviar
                const reservaData = {
                  fechaCheckIn: fechaCheckin,
                  fechaCheckOut: fechaCheckout,
                  id_huesped: parseInt(huesped),
                  id_hab: parseInt(habitacion),
                  cantAdultos: parseInt(adultos),
                  cantNinos: parseInt(ninos),
                  total: parseFloat(total),
                  observaciones: observaciones || ''
                };

                console.log('📤 Enviando datos de reserva:', reservaData);
                
                try {
                  btnCrearReserva.disabled = true;
                  btnCrearReserva.innerHTML = '<span class="icon"><i class="fas fa-spinner fa-spin"></i></span><span>Creando Reserva...</span>';
                  
                  const response = await fetch('/hoteleria/reservas/new', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(reservaData)
                  });

                  console.log('📡 Respuesta del servidor:', response.status, response.statusText);

                  if (response.ok) {
                    console.log('✅ Reserva creada exitosamente');
                    
                    // Mostrar mensaje de éxito
                    mostrarMensajeExito('Reserva creada exitosamente');
                    
                    // Limpiar formulario
                    formNuevaReserva.reset();
                    limpiarHabitacionesDisponibles();
                    document.getElementById('info-noches').style.display = 'none';
                    document.getElementById('total-reserva').style.display = 'none';
                    
                    // Opcional: redirigir después de un momento
                    setTimeout(() => {
                      window.location.href = '/hoteleria/reservas?success=Reserva creada exitosamente';
                    }, 2000);
                    
                  } else {
                    const errorData = await response.json();
                    console.error('❌ Error del servidor:', errorData);
                    
                    let errorMessage = 'Error al crear la reserva';
                    if (errorData.message) {
                      errorMessage = errorData.message;
                    } else if (errorData.error) {
                      errorMessage = errorData.error;
                    }
                    
                    mostrarMensajeError(errorMessage);
                  }
                } catch (error) {
                  console.error('💥 Error de conexión:', error);
                  mostrarMensajeError('Error de conexión al crear la reserva');
                } finally {
                  btnCrearReserva.disabled = false;
                  btnCrearReserva.innerHTML = '<span class="icon"><i class="fas fa-check"></i></span><span>Crear Reserva</span>';
                }
              });
            }

            // Función para mostrar mensaje de éxito
            function mostrarMensajeExito(mensaje) {
              // Crear notificación temporal
              const notification = document.createElement('div');
              notification.className = 'notification is-success is-light';
              notification.innerHTML = \`
                <button class="delete"></button>
                <i class="fas fa-check-circle"></i>
                \${mensaje}
              \`;
              
              // Insertar al inicio del formulario
              const formulario = document.querySelector('.formulario-reserva');
              formulario.insertBefore(notification, formulario.firstChild);
              
              // Añadir event listener para cerrar
              notification.querySelector('.delete').addEventListener('click', () => {
                notification.remove();
              });
              
              // Auto-remover después de 5 segundos
              setTimeout(() => {
                if (notification.parentNode) {
                  notification.remove();
                }
              }, 5000);
            }

            // Función para mostrar mensaje de error
            function mostrarMensajeError(mensaje) {
              // Crear notificación temporal
              const notification = document.createElement('div');
              notification.className = 'notification is-danger is-light';
              notification.innerHTML = \`
                <button class="delete"></button>
                <i class="fas fa-exclamation-triangle"></i>
                \${mensaje}
              \`;
              
              // Insertar al inicio del formulario
              const formulario = document.querySelector('.formulario-reserva');
              formulario.insertBefore(notification, formulario.firstChild);
              
              // Añadir event listener para cerrar
              notification.querySelector('.delete').addEventListener('click', () => {
                notification.remove();
              });
              
              // Auto-remover después de 8 segundos
              setTimeout(() => {
                if (notification.parentNode) {
                  notification.remove();
                }
              }, 8000);
            }

            // Manejo del modal de nuevo huésped
            const btnNuevoHuespedFuncional = document.getElementById('btn-nuevo-huesped-funcional');
            const modalNuevoHuesped = document.getElementById('modal-nuevo-huesped');
            const btnCerrarModalHuesped = document.getElementById('btn-cerrar-modal-huesped');
            const formNuevoHuesped = document.getElementById('form-nuevo-huesped');

            // Abrir modal de nuevo huésped
            if (btnNuevoHuespedFuncional) {
              btnNuevoHuespedFuncional.addEventListener('click', () => {
                console.log('🔄 Abriendo modal de nuevo huésped');
                if (modalNuevoHuesped) {
                  modalNuevoHuesped.style.display = 'block';
                  // Limpiar formulario
                  if (formNuevoHuesped) {
                    formNuevoHuesped.reset();
                  }
                }
              });
            }

            // Cerrar modal de nuevo huésped
            if (btnCerrarModalHuesped) {
              btnCerrarModalHuesped.addEventListener('click', () => {
                console.log('❌ Cerrando modal de nuevo huésped');
                if (modalNuevoHuesped) {
                  modalNuevoHuesped.style.display = 'none';
                }
              });
            }

            // Cerrar modal al hacer click fuera
            if (modalNuevoHuesped) {
              modalNuevoHuesped.addEventListener('click', (e) => {
                if (e.target === modalNuevoHuesped) {
                  modalNuevoHuesped.style.display = 'none';
                }
              });
            }

            // Enviar formulario de nuevo huésped
            if (formNuevoHuesped) {
              formNuevoHuesped.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(formNuevoHuesped);
                const huespedData = Object.fromEntries(formData);
                
                console.log('📤 Enviando datos de nuevo huésped:', huespedData);
                
                try {
                  const btnSubmit = formNuevoHuesped.querySelector('button[type="submit"]');
                  if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.textContent = 'Creando...';
                  }
                  
                  const response = await fetch('/hoteleria/huespedes/api/new', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(huespedData)
                  });

                  console.log('📡 Respuesta crear huésped:', response.status);

                  if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Huésped creado:', data);
                    
                    // Cerrar modal
                    modalNuevoHuesped.style.display = 'none';
                    
                    // Actualizar select de huéspedes
                    await actualizarSelectHuespedes(data.Huesped);
                    
                    // Mostrar mensaje de éxito
                    mostrarMensajeExito(\`Huésped \${data.Huesped.nombre} \${data.Huesped.apellido} creado exitosamente\`);
                    
                  } else {
                    const errorData = await response.json();
                    console.error('❌ Error crear huésped:', errorData);
                    
                    let errorMessage = 'Error al crear el huésped';
                    if (errorData.errors && errorData.errors.general) {
                      errorMessage = errorData.errors.general;
                    } else if (errorData.message) {
                      errorMessage = errorData.message;
                    }
                    
                    mostrarMensajeError(errorMessage);
                  }
                } catch (error) {
                  console.error('💥 Error de conexión:', error);
                  mostrarMensajeError('Error de conexión al crear el huésped');
                } finally {
                  const btnSubmit = formNuevoHuesped.querySelector('button[type="submit"]');
                  if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = 'Crear Huésped';
                  }
                }
              });
            }

            // Función para actualizar el select de huéspedes
            async function actualizarSelectHuespedes(nuevoHuesped) {
              const selectHuesped = document.getElementById('select-huesped-funcional');
              if (selectHuesped && nuevoHuesped) {
                // Añadir nueva opción
                const option = document.createElement('option');
                option.value = nuevoHuesped.id_huesped;
                option.textContent = \`\${nuevoHuesped.apellido}, \${nuevoHuesped.nombre}\`;
                selectHuesped.appendChild(option);
                
                // Seleccionar el nuevo huésped
                selectHuesped.value = nuevoHuesped.id_huesped;
                
                // Disparar evento de cambio para validación
                selectHuesped.dispatchEvent(new Event('change'));
                
                console.log('✅ Select de huéspedes actualizado con nuevo huésped');
              }
            }

          // Manejo del modal de cancelación
          const modal = document.getElementById('modal-cancelar-reserva');
            const btnCerrar = document.getElementById('btn-cerrar-modal-cancelar');
            const btnCancelar = document.getElementById('btn-cancelar-modal');
            const btnConfirmar = document.getElementById('btn-confirmar-cancelar');
            let reservaIdActual = null;

            // Abrir modal al hacer click en botón cancelar
            document.addEventListener('click', (e) => {
              const btn = e.target.closest('.btn-cancelar-reserva');
              if (btn) {
                e.preventDefault();
                reservaIdActual = btn.dataset.id;
                document.getElementById('cancel-codigo').textContent = btn.dataset.codigo;
                document.getElementById('cancel-huesped').textContent = btn.dataset.huesped;
                modal.classList.add('is-active');
              }
            });

            // Cerrar modal
            const cerrarModal = () => {
              modal.classList.remove('is-active');
              reservaIdActual = null;
            };

            btnCerrar.addEventListener('click', cerrarModal);
            btnCancelar.addEventListener('click', cerrarModal);
            
            // Cerrar al hacer click en el fondo
            modal.querySelector('.modal-background').addEventListener('click', cerrarModal);

            // Confirmar cancelación
            btnConfirmar.addEventListener('click', async () => {
              if (!reservaIdActual) return;

              try {
                const qParams = new URLSearchParams(window.location.search);
                const response = await fetch(\`/hoteleria/reservas/\${reservaIdActual}/cancelar?\${qParams}\`, {
                  method: 'POST'
                });

                if (response.ok) {
                  window.location.reload();
                } else {
                  alert('Error al cancelar la reserva');
                }
              } catch (error) {
                console.error('Error:', error);
                alert('Error al cancelar la reserva');
              }
            });

            // Manejo de ocultar reservas canceladas con localStorage
            const HIDDEN_RESERVAS_KEY = 'reservas_ocultas';
            
            // Obtener reservas ocultas del localStorage
            function getHiddenReservas() {
              try {
                const hidden = localStorage.getItem(HIDDEN_RESERVAS_KEY);
                return hidden ? JSON.parse(hidden) : [];
              } catch (e) {
                return [];
              }
            }
            
            // Guardar reserva oculta en localStorage
            function hideReserva(id) {
              const hidden = getHiddenReservas();
              if (!hidden.includes(id)) {
                hidden.push(id);
                localStorage.setItem(HIDDEN_RESERVAS_KEY, JSON.stringify(hidden));
              }
            }
            
            // Ocultar reservas que ya están en localStorage
            function applyHiddenReservas() {
              const hidden = getHiddenReservas();
              let hiddenCount = 0;
              
              hidden.forEach(id => {
                const btn = document.querySelector(\`.btn-ocultar-reserva[data-id="\${id}"]\`);
                if (btn) {
                  const row = btn.closest('tr');
                  if (row) {
                    row.style.display = 'none';
                    hiddenCount++;
                  }
                }
              });
              
              // Actualizar botón de mostrar ocultas
              const btnMostrar = document.getElementById('btn-mostrar-ocultas');
              const countSpan = document.getElementById('count-ocultas');
              
              if (hiddenCount > 0) {
                btnMostrar.style.display = 'inline-flex';
                countSpan.textContent = hiddenCount;
              } else {
                btnMostrar.style.display = 'none';
              }
            }
            
            // Mostrar todas las reservas ocultas
            function showAllHidden() {
              const hidden = getHiddenReservas();
              hidden.forEach(id => {
                const btn = document.querySelector(\`.btn-ocultar-reserva[data-id="\${id}"]\`);
                if (btn) {
                  const row = btn.closest('tr');
                  if (row) {
                    row.style.display = '';
                  }
                }
              });
              
              // Limpiar localStorage
              localStorage.removeItem(HIDDEN_RESERVAS_KEY);
              
              // Ocultar botón
              document.getElementById('btn-mostrar-ocultas').style.display = 'none';
            }
            
            // Aplicar ocultas al cargar
            applyHiddenReservas();
            
            // Botón para mostrar ocultas
            document.getElementById('btn-mostrar-ocultas').addEventListener('click', showAllHidden);
            
            // Manejar click en ocultar
            document.addEventListener('click', (e) => {
              const btn = e.target.closest('.btn-ocultar-reserva');
              if (btn) {
                e.preventDefault();
                const reservaId = btn.dataset.id;
                const row = btn.closest('tr');
                
                if (row) {
                  // Guardar en localStorage
                  hideReserva(reservaId);
                  
                  // Animar y ocultar
                  row.style.transition = 'opacity 0.3s';
                  row.style.opacity = '0';
                  setTimeout(() => {
                    row.style.display = 'none';
                    
                    // Actualizar contador
                    const hidden = getHiddenReservas();
                    const btnMostrar = document.getElementById('btn-mostrar-ocultas');
                    const countSpan = document.getElementById('count-ocultas');
                    
                    if (hidden.length > 0) {
                      btnMostrar.style.display = 'inline-flex';
                      countSpan.textContent = hidden.length;
                    }
                  }, 300);
                }
              }
            });
          });
        </script>
        `,
    });
};