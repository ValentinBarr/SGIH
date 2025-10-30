const layout = require('../../layout');
const { format } = require('date-fns');

// Importa el modal de huésped (Asegúrate de que la ruta './modal-new' sea correcta)
// 💡 ASUMIMOS que esta ruta es correcta según tu último mensaje:
const newHuespedModal = require('./modal-new')(); 

// Función para obtener la fecha de hoy en formato YYYY-MM-DD
const getToday = () => format(new Date(), 'yyyy-MM-dd');

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
                                        <div class="control is-expanded">
                                            <div class="select is-fullwidth is-rounded ${errors.id_huesped ? 'is-danger' : ''}">
                                                <select name="id_huesped" id="id_huesped_select" required>
                                                    <option value="">-- Buscar o seleccionar un huésped --</option>
                                                    ${huespedes.map((h) => `<option value="${h.id_huesped}" ${data.id_huesped == h.id_huesped ? 'selected' : ''}>${h.apellido}, ${h.nombre} (${h.documento || 'N/D'})</option>`).join('')}
                                                </select>
                                            </div>
                                        </div>
                                        <div class="control">
                                            <button type="button" class="button is-info is-rounded" id="btnNuevoHuespedModal" title="Registrar nuevo huésped">
                                                <span class="icon"><i class="fas fa-user-plus"></i></span>
                                            </button>
                                        </div>
                                    </div>
                                    ${errors.id_huesped ? `<p class="help is-danger">${errors.id_huesped}</p>` : ''}
                                </div>

                                <div class="columns">
                                    <div class="column">
                                        <div class="field">
                                            <label class="label">Check-in</label>
                                            <input type="date" name="fechaCheckIn" id="fechaCheckIn_new" class="input is-rounded input-disponibilidad ${errors.fechaCheckIn ? 'is-danger' : ''}" value="${data.fechaCheckIn || getToday()}" required>
                                            ${errors.fechaCheckIn ? `<p class="help is-danger">${errors.fechaCheckIn}</p>` : ''}
                                        </div>
                                    </div>
                                    <div class="column">
                                        <div class="field">
                                            <label class="label">Check-out</label>
                                            <input type="date" name="fechaCheckOut" id="fechaCheckOut_new" class="input is-rounded input-disponibilidad ${errors.fechaCheckOut ? 'is-danger' : ''}" value="${data.fechaCheckOut || ''}" required>
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
        
        <script src="/js/reservas.js"></script> 
        `,
    });
};