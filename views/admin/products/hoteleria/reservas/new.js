const layout = require('../../layout');
const { format } = require('date-fns');

// Importa el modal de huésped (Asegúrate de que la ruta './modal-new' sea correcta)
// 💡 ASUMIMOS que esta ruta es correcta según tu último mensaje:
const newHuespedModal = require('./modal-new')(); 

// Función para obtener la fecha de hoy en formato YYYY-MM-DD
const getToday = () => format(new Date(), 'yyyy-MM-dd');

// --- Helper de íconos (server) ---
const getComodidadIcon = (nombre) => {
  const icons = {
    'wi-fi':'fas fa-wifi','tv':'fas fa-tv','aire':'fas fa-snowflake',
    'minibar':'fas fa-wine-glass-alt','jacuzzi':'fas fa-hot-tub',
    'cama':'fas fa-bed','vista':'fas fa-mountain','escritorio':'fas fa-desktop',
  };
  const lower = (nombre || '').toLowerCase();
  for (const k in icons) if (lower.includes(k)) return icons[k];
  return 'fas fa-check-circle';
};

/**
 * Renderiza la lista de habitaciones disponibles en formato de tarjeta (MEJORADO).
 */
const renderHabitacionCards = (habitaciones, tipos, noches) => {
    // Si la búsqueda aún no se ha ejecutado o falló, se muestra el placeholder inicial
    if (!habitaciones || habitaciones.length === 0) {
        return `
            <div class="notification is-info is-light">
                Introduce las fechas y el número de huéspedes para buscar disponibilidad.
            </div>
        `;
    }

    // Calcular la capacidad total necesaria
    const huespedesNecesarios = Number(data.cantAdultos || 1) + Number(data.cantNinos || 0);

    const cards = habitaciones.map(h => {
        const tipo = tipos.find(t => t.id_tipoHab === h.id_tipoHab);
        const precioBase = tipo ? parseFloat(tipo.precioBase) : 0;
        const totalCalculado = (precioBase * noches).toFixed(2);
        const tipoNombre = tipo ? tipo.nombre : 'N/A';
        const capacidadTipo = tipo ? tipo.capacidad : 'N/A';
        
        // El repositorio debería incluir Comodidades: TipoHabitacion.Comodidades (asumiendo include en el Repo)
        const comodidades = tipo && tipo.Comodidades ? tipo.Comodidades : [];
        
        const isSelected = data.id_hab == h.id_hab;
        const cardClass = isSelected ? 'is-primary-light has-border-primary' : '';
        
        const capacidadSuficiente = capacidadTipo >= huespedesNecesarios;
        const capacidadMessage = capacidadSuficiente 
            ? `<span class="icon has-text-success"><i class="fas fa-check-circle"></i></span> Capacidad: ${capacidadTipo} personas`
            : `<span class="icon has-text-danger"><i class="fas fa-exclamation-triangle"></i></span> <strong class="has-text-danger">Capacidad Insuficiente (${huespedesNecesarios} req.)</strong>`;

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
                        ${comodidadesHtml || '<span class="has-text-grey-light">No hay comodidades clave listadas.</span>'}
                    </div>
                    <div class="mt-3">
                        <p class="is-size-7 has-text-weight-semibold">
                            ${capacidadMessage}
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
    // Calculamos las noches para el renderizado inicial de las tarjetas
    const noches = data.fechaCheckIn && data.fechaCheckOut 
                   ? require('date-fns').differenceInDays(new Date(data.fechaCheckOut), new Date(data.fechaCheckIn)) 
                   : 0;

    // --- Lógica para Edición vs Creación ---
    const isEditing = data && data.id_reserva;
    const formAction = isEditing ? `/hoteleria/reservas/${data.id_reserva}/edit` : '/hoteleria/reservas/new';
    const pageTitle = isEditing ? `Editar Reserva #${data.codigoReserva}` : 'Crear Nueva Reserva';
    const buttonText = isEditing ? 'Guardar Cambios' : 'Guardar Reserva';
    const habitacionesCardsHtml = renderHabitacionCards(habitacionesDisponibles, tiposHabitacion, noches);

    return layout({
        content: `
        <section class="section">
            <div class="container is-max-widescreen">
                <h1 class="title is-3 mb-5">${pageTitle}</h1>

                <form id="formNuevaReserva" method="POST" action="${formAction}">
                    
                    ${errors.general ? `<div class="notification is-danger is-light">${errors.general}</div>` : ''}

                    <div class="columns is-multiline">
                        <div class="column is-7">
                            <div class="box p-5 mb-5">
                                <h2 class="title is-5">1. Huésped y Fechas</h2>
                                <hr class="mt-2 mb-4">
                                    
                                <div class="field">
                                    <label class="label">Huésped Principal</label>
                                    <div class="field has-addons">
                                        <div class="control is-expanded has-icons-left">
                                            <input 
                                                type="text" 
                                                id="huesped_search_input" 
                                                class="input is-rounded ${errors.id_huesped ? 'is-danger' : ''}" 
                                                placeholder="Buscar huésped por nombre, apellido o documento..."
                                                autocomplete="off"
                                                value="${data.id_huesped ? huespedes.find(h => h.id_huesped == data.id_huesped) ? `${huespedes.find(h => h.id_huesped == data.id_huesped).apellido}, ${huespedes.find(h => h.id_huesped == data.id_huesped).nombre}` : '' : ''}"
                                            >
                                            <span class="icon is-small is-left">
                                                <i class="fas fa-search"></i>
                                            </span>
                                            <input type="hidden" name="id_huesped" id="id_huesped_select" value="${data.id_huesped || ''}" required>
                                            <div id="huesped_dropdown" class="dropdown-menu" style="display: none; position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; max-height: 300px; overflow-y: auto; background: white; border: 1px solid #dbdbdb; border-radius: 6px; box-shadow: 0 8px 16px rgba(0,0,0,0.1); margin-top: 4px;">
                                                <div class="dropdown-content" id="huesped_dropdown_content"></div>
                                            </div>
                                        </div>
                                        <div class="control">
                                            <button type="button" class="button is-info is-rounded" id="btnNuevoHuespedModal" title="Registrar nuevo huésped">
                                                <span class="icon"><i class="fas fa-user-plus"></i></span>
                                            </button>
                                        </div>
                                    </div>
                                    ${errors.id_huesped ? `<p class="help is-danger">${errors.id_huesped}</p>` : ''}
                                    <p class="help">Escriba para buscar o haga clic en el botón + para agregar un nuevo huésped</p>
                                </div>

                                <div class="columns">
                                    <div class="column">
                                        <div class="field">
                                            <label class="label">Check-in</label>
                                            <div class="control has-icons-right">
                                                <input type="text" name="fechaCheckIn" id="fechaCheckIn_new" class="input is-rounded input-disponibilidad ${errors.fechaCheckIn ? 'is-danger' : ''}" value="${data.fechaCheckIn || getToday()}" placeholder="DD/MM/YYYY" readonly required style="cursor: pointer; background-color: white;">
                                                <span class="icon is-small is-right" style="pointer-events: all; cursor: pointer;" id="btn-calendario-checkin-new">
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
                                                <input type="text" name="fechaCheckOut" id="fechaCheckOut_new" class="input is-rounded input-disponibilidad ${errors.fechaCheckOut ? 'is-danger' : ''}" value="${data.fechaCheckOut || ''}" placeholder="DD/MM/YYYY" readonly required style="cursor: pointer; background-color: white;">
                                                <span class="icon is-small is-right" style="pointer-events: all; cursor: pointer;" id="btn-calendario-checkout-new">
                                                    <i class="fas fa-calendar-alt"></i>
                                                </span>
                                            </div>
                                            ${errors.fechaCheckOut ? `<p class="help is-danger">${errors.fechaCheckOut}</p>` : ''}
                                        </div>
                                    </div>
                                </div>

                                <div id="resumen_noches_wrapper" class="field has-text-weight-bold is-size-6 mt-2 mb-5" style="min-height: 20px;">
                                    <p class="has-text-link">
                                        <span class="icon is-small"><i class="fas fa-calendar-check"></i></span>
                                        Total: <span id="resumen_noches">0</span> noches
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
                                            <input type="number" name="cantAdultos" id="cantAdultos_new" class="input is-rounded input-disponibilidad ${errors.cantAdultos ? 'is-danger' : ''}" min="1" value="${data.cantAdultos || 1}" required>
                                            ${errors.cantAdultos ? `<p class="help is-danger">${errors.cantAdultos}</p>` : ''}
                                        </div>
                                    </div>
                                    <div class="column">
                                        <div class="field">
                                            <label class="label">Niños</label>
                                            <input type="number" name="cantNinos" id="cantNinos_new" class="input is-rounded input-disponibilidad ${errors.cantNinos ? 'is-danger' : ''}" min="0" value="${data.cantNinos || 0}" required>
                                            ${errors.cantNinos ? `<p class="help is-danger">${errors.cantNinos}</p>` : ''}
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div class="box p-5 mb-5">
                        <h2 class="title is-5">3. Habitaciones Disponibles</h2>
                        <p class="subtitle is-6 has-text-grey mb-4">Resultados para tu búsqueda. Haz clic en una tarjeta para seleccionarla.</p>
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
                                            <p class="title is-4 has-text-primary-dark mb-0" id="resumen_total_calc">$0.00</p>
                                            <input type="hidden" name="total" id="hidden_total_calc" value="${data.total || '0.00'}">
                                        </div>
                                    </div>
                                    <p class="help has-text-primary-dark mt-2">El total se calcula al seleccionar una habitación disponible.</p>
                                </div>
                                
                                <input type="hidden" name="estado" value="CONFIRMADA">

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
                                <span>${buttonText}</span>
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </section>

        ${newHuespedModal}

        <!-- Modal de Calendario -->
        <div class="modal" id="modal-calendario-new">
            <div class="modal-background"></div>
            <div class="modal-card" style="width: 90%; max-width: 500px;">
                <header class="modal-card-head">
                    <p class="modal-card-title">
                        <span class="icon"><i class="fas fa-calendar-alt"></i></span>
                        Seleccionar Fechas
                    </p>
                    <button class="delete" aria-label="close" id="modal-cal-close-new"></button>
                </header>
                <section class="modal-card-body">
                    <div class="mb-4">
                        <div class="tags has-addons">
                            <span class="tag is-info">Check-in:</span>
                            <span class="tag is-light" id="modal-checkin-display-new">No seleccionado</span>
                        </div>
                        <div class="tags has-addons">
                            <span class="tag is-success">Check-out:</span>
                            <span class="tag is-light" id="modal-checkout-display-new">No seleccionado</span>
                        </div>
                        <p class="help">
                            <span class="icon is-small"><i class="fas fa-info-circle"></i></span>
                            Selecciona primero el check-in, luego el check-out
                        </p>
                    </div>

                    <div class="level is-mobile mb-3">
                        <div class="level-left">
                            <button type="button" class="button is-small" id="modal-cal-prev-new">
                                <span class="icon"><i class="fas fa-chevron-left"></i></span>
                            </button>
                        </div>
                        <div class="level-item">
                            <p class="has-text-weight-semibold" id="modal-cal-titulo-new"></p>
                        </div>
                        <div class="level-right">
                            <button type="button" class="button is-small" id="modal-cal-next-new">
                                <span class="icon"><i class="fas fa-chevron-right"></i></span>
                            </button>
                        </div>
                    </div>
                    
                    <div id="modal-cal-grid-new" class="calendario-modal-grid"></div>
                </section>
                <footer class="modal-card-foot">
                    <button class="button" type="button" id="modal-cal-cancelar-new">Cancelar</button>
                    <button class="button is-primary" type="button" id="modal-cal-aplicar-new">
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
        
        <script>
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
        </script>
        
        <script>
            // Inicializar buscador de huéspedes cuando el DOM esté listo
            document.addEventListener('DOMContentLoaded', function() {
                const searchInput = document.getElementById('huesped_search_input');
                const hiddenInput = document.getElementById('id_huesped_select');
                const dropdown = document.getElementById('huesped_dropdown');
                const dropdownContent = document.getElementById('huesped_dropdown_content');
                
                if (!searchInput || !hiddenInput || !dropdown || !dropdownContent) {
                    console.error('Elementos del buscador de huéspedes no encontrados');
                    return;
                }
                
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
                    }
                });
            });
        </script>
        
        <script src="/js/reservas.js"></script>
        <script src="/js/reservas-new-calendar.js"></script> 
        `,
    });
};