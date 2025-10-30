const { differenceInDays } = require('date-fns');

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
 * Renderiza la lista de habitaciones disponibles en formato de tarjeta.
 */
const renderHabitacionCards = (habitaciones, tipos, data) => {
    const noches = data.fechaCheckIn && data.fechaCheckOut 
                   ? differenceInDays(new Date(data.fechaCheckOut), new Date(data.fechaCheckIn)) 
                   : 0;

    if (!habitaciones || habitaciones.length === 0) {
        return `
            <div class="notification is-warning is-light">
                <span class="icon"><i class="fas fa-search"></i></span>
                No se encontraron habitaciones disponibles para los criterios seleccionados.
            </div>
        `;
    }

    const huespedesNecesarios = Number(data.cantAdultos || 1) + Number(data.cantNinos || 0);

    return habitaciones.map(h => {
        const tipo = tipos.find(t => t.id_tipoHab === h.id_tipoHab);
        if (!tipo) return ''; // Si no se encuentra el tipo, no renderizar la tarjeta

        const precioBase = parseFloat(tipo.precioBase);
        const totalCalculado = (precioBase * noches).toFixed(2);
        const capacidadTipo = tipo.capacidad;
        
        const comodidades = tipo.Comodidades || [];
        
        const isSelected = data.id_hab == h.id_hab;
        const cardClass = isSelected ? 'is-success has-background-success-light' : 'has-background-white';

        const comodidadesHtml = comodidades.slice(0, 5).map(tc => {
            const com = tc.Comodidad; 
            if (!com) return '';
            const icon = getComodidadIcon(com.nombre);
            return `<span class="tag is-light is-info is-small mr-1" title="${com.nombre}"><i class="${icon}"></i></span>`;
        }).join('');

        return `
            <div 
                class="box room-card p-4 mb-3 is-clickable ${cardClass}" 
                data-id="${h.id_hab}" 
                data-preciobase="${precioBase.toFixed(2)}"
            >
                <div class="level is-mobile mb-1">
                    <div class="level-left">
                        <p class="title is-5 mb-0 has-text-weight-bold has-text-grey-darker">
                            HABITACIÓN ${h.numero} - ${tipo.nombre}
                        </p>
                    </div>
                    <div class="level-right">
                         ${isSelected ? '<span class="icon has-text-success"><i class="fas fa-check-circle"></i></span>' : ''}
                    </div>
                </div>
                <p class="subtitle is-7 has-text-grey-darker mb-2">Piso: ${h.piso || 'N/A'} | Capacidad: ${capacidadTipo} personas</p>
                
                <hr class="mt-2 mb-2">
                
                <div class="level is-mobile is-size-6 mb-2">
                    <div class="level-left"><p class="has-text-weight-semibold">Tarifa:</p></div>
                    <div class="level-right"><p>$${precioBase.toFixed(2)}/noche x ${noches} = <strong class="has-text-link">$${totalCalculado}</strong></p></div>
                </div>
                
                <div class="content is-size-7 mt-3">
                    <p class="has-text-grey mb-1">Comodidades:</p>
                    <div class="tags">${comodidadesHtml || '<span class="has-text-grey-light">N/A</span>'}</div>
                </div>
            </div>
        `;
    }).join('');
};

module.exports = { renderHabitacionCards };