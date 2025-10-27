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

// --- Módulo Principal de la Vista ---

module.exports = ({
    reservas = [],
    tiposHabitacion = [], 
    estadosReserva = [], 
    query = {},
    totalPages = 1,
    currentPage = 1,
    totalReservas = 0,
}) => {
    /**
     * Renderiza los botones de acción según el estado de la reserva
     * ❌ Eliminadas acciones de Check-in y Check-out (mantenido)
     */
    const renderAcciones = (res) => {
        const qParams = new URLSearchParams(query);
        const action = (url, label, style, icon) => `
          <form method="POST" action="${url}?${qParams}" style="display: inline-block;">
            <button type="submit" class="button is-small ${style} is-light is-rounded" title="${label}">
              <span class="icon is-small"><i class="fas ${icon}"></i></span>
            </button>
          </form>
        `;
        const editBtn = `
          <button class="button is-small is-warning is-light is-rounded btnEditarReserva" data-id="${res.id_reserva}" title="Editar">
            <span class="icon is-small"><i class="fas fa-edit"></i></span>
          </button>
        `;

        switch (res.estado) {
            case 'PENDIENTE':
            case 'CONFIRMADA':
                return `
                  ${action(
                    `/hoteleria/reservas/${res.id_reserva}/cancelar`,
                    'Cancelar',
                    'is-danger',
                    'fa-ban'
                  )}
                  ${editBtn}
                `;
            case 'CHECKED_IN':
                return `
                    ${editBtn}
                `;
            default: // CHECKED_OUT o CANCELADA
                return `
                  <button class="button is-small is-light is-rounded btnVerReserva" data-id="${res.id_reserva}" title="Ver (no implementado)" disabled>
                    <span class="icon is-small"><i class="fas fa-eye"></i></span>
                  </button>
                `;
        }
    };

    return layout({
        content: `
        <section class="inventory-card">
          <div id="lista-reservas-wrapper" hx-boost="true">
            <div class="level">
              <div class="level-left">
                <h1 class="title">Reservas</h1>
              </div>
              <div class="level-right">
                <a class="button is-primary" href="/hoteleria/reservas/new"> 
                  <span class="icon"><i class="fas fa-plus"></i></span>
                  <span>Nueva Reserva</span>
                </a>
              </div>
            </div>

            <form method="GET" class="box" id="formFiltrosReservas">
              </form>

            <p class="is-size-7 has-text-grey mb-3">
              Mostrando ${totalReservas} ${
                totalReservas === 1 ? 'reserva' : 'reservas'
            }
            </p>

            <table class="table is-fullwidth is-hoverable is-striped is-size-7">
              <thead>
                <tr>
                  <th>Huésped / Cód.</th>
                  <th>Check-in</th>
                  <th>Check-out / Noches</th>
                  <th>Hab. / Total</th>
                  <th>Acciones</th> 
                  </tr>
              </thead>
              <tbody>
                ${
                    reservas.length > 0
                        ? reservas
                              .map(
                                  (r) => `
                    <tr>
                      <td>
                        <div><strong>${r.Huesped?.apellido || ''}, ${
                                      r.Huesped?.nombre || ''
                                  }</strong></div>
                        <div class="has-text-grey">${r.codigoReserva}</div>
                        </td>
                      <td>${formatDate(r.fechaCheckIn)}</td>
                      <td>
                        <div>${formatDate(r.fechaCheckOut)}</div>
                        <div class="has-text-grey">${calcNoches(
                          r.fechaCheckIn,
                          r.fechaCheckOut
                      )} noches</div>
                      </td>
                      <td>
                        <div>${getRoomNumber(r)}</div> 
                        <div class="has-text-grey-darker has-text-weight-bold">$${Number(
                          r.total || 0
                      ).toFixed(2)}</div>
                      </td>
                      <td>
                        <div class="buttons are-small">
                          ${renderAcciones(r)}
                        </div>
                      </td>
                    </tr>
                  `
                              )
                              .join('')
                        : `
                  <tr><td colspan="5" class="has-text-centered">No se encontraron reservas con esos filtros.</td></tr>
                `
                }
              </tbody>
            </table>

            </div>
        </section>
        <div class="modal" id="modalReserva">
           </div>

        <script src="/js/reservas.js"></script>
        `,
    });
};