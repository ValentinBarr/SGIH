const layout = require('../../layout');
const { format } = require('date-fns');

// Función para obtener la fecha de hoy en formato YYYY-MM-DD
const getToday = () => format(new Date(), 'yyyy-MM-dd');

// Función para formatear fecha de la BD a YYYY-MM-DD
const formatDateForInput = (date) => {
    if (!date) return '';
    // Agregar 'T00:00:00' para evitar problemas de zona horaria
    const dateStr = typeof date === 'string' ? date : date.toISOString();
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${year}-${month}-${day}`;
};

// --- Helper para íconos de comodidades (FontAwesome) ---
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
    const lowerName = nombre ? nombre.toLowerCase() : '';
    for (const key in icons) {
        if (lowerName.includes(key)) {
            return icons[key];
        }
    }
    return 'fas fa-check-circle'; // Ícono por defecto
};

/**
 * Renderiza la lista de habitaciones disponibles en formato de tarjeta
 */
const renderHabitacionCards = (habitaciones, tipos, noches, habitacionActualId) => {
    console.log('renderHabitacionCards llamada con:');
    console.log('- Habitaciones:', habitaciones ? habitaciones.length : 0);
    console.log('- Tipos:', tipos ? tipos.length : 0);
    console.log('- Noches:', noches);
    console.log('- Habitación actual ID:', habitacionActualId);
    
    if (!habitaciones || habitaciones.length === 0) {
        console.log('No hay habitaciones para renderizar');
        return `
            <div class="notification is-warning is-light">
                <p class="has-text-weight-semibold">No hay habitaciones disponibles</p>
                <p>No se encontraron habitaciones disponibles para las fechas y ocupantes seleccionados.</p>
            </div>
        `;
    }

    const cards = habitaciones.map(h => {
        const tipo = tipos.find(t => t.id_tipoHab === h.id_tipoHab);
        const precioBase = tipo ? parseFloat(tipo.precioBase) : 0;
        const totalCalculado = (precioBase * noches).toFixed(2);
        const tipoNombre = tipo ? tipo.nombre : 'N/A';
        const capacidadTipo = tipo ? tipo.capacidad : 'N/A';
        
        const comodidades = tipo && tipo.Comodidades ? tipo.Comodidades : [];
        
        const isSelected = habitacionActualId == h.id_hab;
        const cardClass = isSelected ? 'is-primary-light has-border-primary' : '';

        const comodidadesHtml = comodidades.slice(0, 5).map(tc => {
            const com = tc.Comodidad; 
            if (!com) return '';
            const icon = getComodidadIcon(com.nombre);
            return `<span class="tag is-light is-info is-small mr-1" title="${com.nombre}"><i class="${icon}"></i></span>`;
        }).join('');

        return `
            <div 
                class="box room-card p-4 mb-4 is-clickable ${cardClass}" 
                data-id="${h.id_hab}" 
                data-preciobase="${precioBase.toFixed(2)}"
            >
                <div class="level is-mobile mb-2">
                    <div class="level-left">
                        <div class="level-item">
                            <p class="title is-5 mb-0 has-text-weight-bold has-text-grey-darker">
                                Habitación ${h.numero}
                            </p>
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
                    <div class="tags">
                        ${comodidadesHtml || '<span class="has-text-grey-light">No hay comodidades listadas.</span>'}
                    </div>
                    <div class="mt-3">
                        <p class="is-size-7 has-text-weight-semibold">
                            <span class="icon has-text-success"><i class="fas fa-check-circle"></i></span> 
                            Capacidad: ${capacidadTipo} personas
                        </p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return cards;
};

module.exports = ({
    huespedes = [],
    habitacionesDisponibles = [],
    tiposHabitacion = [], 
    errors = {},
    data = {},
}) => {
    // Calculamos las noches (agregar T00:00:00 para evitar problemas de zona horaria)
    let noches = 0;
    if (data.fechaCheckIn && data.fechaCheckOut) {
        const checkInStr = typeof data.fechaCheckIn === 'string' ? data.fechaCheckIn : data.fechaCheckIn.toISOString();
        const checkOutStr = typeof data.fechaCheckOut === 'string' ? data.fechaCheckOut : data.fechaCheckOut.toISOString();
        const checkIn = new Date(checkInStr.split('T')[0] + 'T00:00:00');
        const checkOut = new Date(checkOutStr.split('T')[0] + 'T00:00:00');
        noches = require('date-fns').differenceInDays(checkOut, checkIn);
    }

    const habitacionesCardsHtml = renderHabitacionCards(habitacionesDisponibles, tiposHabitacion, noches, data.id_hab);

    return layout({
        content: `
        <section class="section">
            <div class="container is-max-widescreen">
                <div class="level mb-5">
                    <div class="level-left">
                        <div>
                            <h1 class="title is-3">Editar Reserva #${data.codigoReserva}</h1>
                            <p class="subtitle is-6 has-text-grey">
                                <span class="tag ${data.estado === 'CONFIRMADA' ? 'is-success' : data.estado === 'PENDIENTE' ? 'is-warning' : 'is-info'} is-light">
                                    ${data.estado}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div class="level-right">
                        <a href="/hoteleria/reservas" class="button is-light is-rounded">
                            <span class="icon"><i class="fas fa-arrow-left"></i></span>
                            <span>Volver a Reservas</span>
                        </a>
                    </div>
                </div>

                <form id="formEditarReserva" method="POST" action="/hoteleria/reservas/${data.id_reserva}/edit">
                    
                    ${errors.general ? `<div class="notification is-danger is-light">${errors.general}</div>` : ''}

                    <div class="columns is-multiline">
                        <div class="column is-7">
                            <div class="box p-5 mb-5">
                                <h2 class="title is-5">1. Huésped y Fechas</h2>
                                <hr class="mt-2 mb-4">
                                    
                                <div class="field">
                                    <label class="label">Huésped Principal</label>
                                    <div class="control">
                                        <div class="select is-fullwidth is-rounded ${errors.id_huesped ? 'is-danger' : ''}">
                                            <select name="id_huesped" id="id_huesped_select" required>
                                                <option value="">-- Seleccionar huésped --</option>
                                                ${huespedes.map((h) => `<option value="${h.id_huesped}" ${data.id_huesped == h.id_huesped ? 'selected' : ''}>${h.apellido}, ${h.nombre} (${h.documento || 'N/D'})</option>`).join('')}
                                            </select>
                                        </div>
                                    </div>
                                    ${errors.id_huesped ? `<p class="help is-danger">${errors.id_huesped}</p>` : ''}
                                </div>

                                <div class="columns">
                                    <div class="column">
                                        <div class="field">
                                            <label class="label">Check-in</label>
                                            <div class="control has-icons-right">
                                                <input type="text" name="fechaCheckIn" id="fechaCheckIn_edit" class="input is-rounded input-disponibilidad ${errors.fechaCheckIn ? 'is-danger' : ''}" value="${formatDateForInput(data.fechaCheckIn)}" placeholder="DD/MM/YYYY" readonly required style="cursor: pointer; background-color: white;">
                                                <span class="icon is-small is-right" style="pointer-events: all; cursor: pointer;" id="btn-calendario-checkin">
                                                    <i class="fas fa-calendar-alt"></i>
                                                </span>
                                            </div>
                                            ${errors.fechaCheckIn ? `<p class="help is-danger">${errors.fechaCheckIn}</p>` : ''}
                                        </div>
                                    </div>
                                    <div class="column">
                                        <div class="field">
                                            <label class="label">Check-out</label>
                                            <div class="control has-icons-right">
                                                <input type="text" name="fechaCheckOut" id="fechaCheckOut_edit" class="input is-rounded input-disponibilidad ${errors.fechaCheckOut ? 'is-danger' : ''}" value="${formatDateForInput(data.fechaCheckOut)}" placeholder="DD/MM/YYYY" readonly required style="cursor: pointer; background-color: white;">
                                                <span class="icon is-small is-right" style="pointer-events: all; cursor: pointer;" id="btn-calendario-checkout">
                                                    <i class="fas fa-calendar-alt"></i>
                                                </span>
                                            </div>
                                            ${errors.fechaCheckOut ? `<p class="help is-danger">${errors.fechaCheckOut}</p>` : ''}
                                        </div>
                                    </div>
                                </div>

                                <div id="resumen_noches_wrapper" class="field has-text-weight-bold is-size-6 mt-2 mb-4" style="min-height: 20px;">
                                    <p class="has-text-link">
                                        <span class="icon is-small"><i class="fas fa-calendar-check"></i></span>
                                        Total: <span id="resumen_noches">${noches}</span> noches
                                    </p>
                                </div>
                             </div>
                        </div>
                        <div class="column is-5">
                             <div class="box p-5 mb-5">
                                <h2 class="title is-5">2. Ocupantes</h2>
                                <hr class="mt-2 mb-4">
                                <div class="columns">
                                    <div class="column">
                                        <div class="field">
                                            <label class="label">Adultos</label>
                                            <input type="number" name="cantAdultos" id="cantAdultos_edit" class="input is-rounded input-disponibilidad ${errors.cantAdultos ? 'is-danger' : ''}" min="1" value="${data.cantAdultos || 1}" required>
                                            ${errors.cantAdultos ? `<p class="help is-danger">${errors.cantAdultos}</p>` : ''}
                                        </div>
                                    </div>
                                    <div class="column">
                                        <div class="field">
                                            <label class="label">Niños</label>
                                            <input type="number" name="cantNinos" id="cantNinos_edit" class="input is-rounded input-disponibilidad ${errors.cantNinos ? 'is-danger' : ''}" min="0" value="${data.cantNinos || 0}" required>
                                            ${errors.cantNinos ? `<p class="help is-danger">${errors.cantNinos}</p>` : ''}
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div class="box p-5 mb-5">
                        <h2 class="title is-5">3. Habitaciones Disponibles</h2>
                        <p class="subtitle is-6 has-text-grey mb-4">Selecciona una habitación disponible para las fechas indicadas.</p>
                        <hr class="mt-0 mb-4">
                        <div id="habitaciones-wrapper-cards">
                            ${habitacionesCardsHtml}
                        </div>
                    </div>

                    <div class="box p-5 mb-5">
                                <h2 class="title is-5">4. Resumen y Estado</h2>
                                <hr class="mt-2 mb-4">
                                
                                <input type="hidden" name="id_hab" id="id_hab_hidden" value="${data.id_hab || ''}" required>
                                ${errors.id_hab ? `<p class="help is-danger mb-4">${errors.id_hab}</p>` : ''}

                                <div class="box has-background-primary-light p-4 mb-5">
                                    <div class="level is-mobile">
                                        <div class="level-left">
                                            <p class="title is-5 mb-0">TOTAL A PAGAR</p>
                                        </div>
                                        <div class="level-right">
                                            <p class="title is-4 has-text-primary-dark mb-0" id="resumen_total_calc">$${data.total || '0.00'}</p>
                                            <input type="hidden" name="total" id="hidden_total_calc" value="${data.total || '0.00'}">
                                        </div>
                                    </div>
                                </div>
                                
                                <input type="hidden" name="estado" value="${data.estado}">

                                <div class="field">
                                    <label class="label">Observaciones</label>
                                    <div class="control">
                                        <textarea name="observaciones" class="textarea is-rounded" rows="2">${data.observaciones || ''}</textarea>
                                    </div>
                                </div>
                    </div>

                    <div class="field is-grouped is-grouped-right mt-5">
                        <p class="control">
                            <a href="/hoteleria/reservas" class="button is-light is-rounded is-medium">Cancelar</a>
                        </p>
                        <p class="control">
                            <button type="submit" class="button is-primary is-rounded is-medium" id="btnGuardarReserva">
                                <span class="icon"><i class="fas fa-save"></i></span>
                                <span>Guardar Cambios</span>
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </section>

        <!-- Modal de Calendario -->
        <div class="modal" id="modal-calendario">
            <div class="modal-background"></div>
            <div class="modal-card" style="width: 90%; max-width: 500px;">
                <header class="modal-card-head">
                    <p class="modal-card-title">
                        <span class="icon"><i class="fas fa-calendar-alt"></i></span>
                        Seleccionar Fechas
                    </p>
                    <button class="delete" aria-label="close" id="modal-cal-close"></button>
                </header>
                <section class="modal-card-body">
                    <div class="mb-4">
                        <div class="tags has-addons">
                            <span class="tag is-info">Check-in:</span>
                            <span class="tag is-light" id="modal-checkin-display">No seleccionado</span>
                        </div>
                        <div class="tags has-addons">
                            <span class="tag is-success">Check-out:</span>
                            <span class="tag is-light" id="modal-checkout-display">No seleccionado</span>
                        </div>
                        <p class="help">
                            <span class="icon is-small"><i class="fas fa-info-circle"></i></span>
                            Selecciona primero el check-in, luego el check-out
                        </p>
                    </div>

                    <div class="level is-mobile mb-3">
                        <div class="level-left">
                            <button type="button" class="button is-small" id="modal-cal-prev">
                                <span class="icon"><i class="fas fa-chevron-left"></i></span>
                            </button>
                        </div>
                        <div class="level-item">
                            <p class="has-text-weight-semibold" id="modal-cal-titulo"></p>
                        </div>
                        <div class="level-right">
                            <button type="button" class="button is-small" id="modal-cal-next">
                                <span class="icon"><i class="fas fa-chevron-right"></i></span>
                            </button>
                        </div>
                    </div>
                    
                    <div id="modal-cal-grid" class="calendario-modal-grid"></div>
                </section>
                <footer class="modal-card-foot">
                    <button class="button" type="button" id="modal-cal-cancelar">Cancelar</button>
                    <button class="button is-primary" type="button" id="modal-cal-aplicar">
                        <span class="icon"><i class="fas fa-check"></i></span>
                        <span>Aplicar</span>
                    </button>
                </footer>
            </div>
        </div>
        
        <style>
            .calendario-modal-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 6px;
                font-size: 0.875rem;
            }
            
            .calendario-modal-dia {
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                border: 1px solid #e5e7eb;
                font-weight: 500;
            }
            
            .calendario-modal-dia:hover:not(.disabled):not(.header) {
                background-color: #3b82f6;
                color: white;
                transform: scale(1.05);
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
            }
            
            .calendario-modal-dia.header {
                font-weight: 700;
                background-color: #f3f4f6;
                cursor: default;
                color: #6b7280;
                font-size: 0.75rem;
            }
            
            .calendario-modal-dia.disabled {
                color: #d1d5db;
                cursor: not-allowed;
                background-color: #f9fafb;
                opacity: 0.5;
            }
            
            .calendario-modal-dia.checkin {
                background-color: #3b82f6;
                color: white;
                font-weight: 700;
                border: 2px solid #1e40af;
            }
            
            .calendario-modal-dia.checkout {
                background-color: #10b981;
                color: white;
                font-weight: 700;
                border: 2px solid #059669;
            }
            
            .calendario-modal-dia.today {
                border: 2px solid #f59e0b;
                font-weight: 700;
            }
            
            .calendario-modal-dia.in-range {
                background-color: #dbeafe;
                color: #1e40af;
                border-color: #93c5fd;
            }
        </style>
        
        <script src="/js/reservas-edit.js"></script> 
        `,
    });
};
