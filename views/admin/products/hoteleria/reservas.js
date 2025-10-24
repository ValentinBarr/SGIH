const layout = require('../layout');
const { format, differenceInDays } = require('date-fns');
const { es } = require('date-fns/locale');

// --- Helpers para la Vista ---

/**
 * Formatea fecha a dd/MM/yyyy (manejando zona horaria)
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  // Ajusta la zona horaria (new Date() a veces toma YYYY-MM-DD como UTC)
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return format(date, 'dd/MM/yyyy', { locale: es });
};

/**
 * Devuelve la clase de color de Bulma para cada estado
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
  * Obtiene el nombre de la habitación principal de la reserva
  */
const getRoomName = (detalles) => {
  return detalles?.[0]?.TipoHabitacion?.nombre || 'N/A';
};

// --- Módulo Principal de la Vista ---

module.exports = ({
  reservas = [],
  tiposHabitacion = [], // Usado en filtros y modal
  estadosReserva = [],  // Usado en filtros
  huespedes = [],         // USADO EN MODAL
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
        return `
          ${action(
            `/hoteleria/reservas/${res.id_reserva}/confirmar`,
            'Confirmar',
            'is-success',
            'fa-check'
          )}
          ${action(
            `/hoteleria/reservas/${res.id_reserva}/cancelar`,
            'Cancelar',
            'is-danger',
            'fa-ban'
          )}
        `;
      case 'CONFIRMADA':
        return `
          ${action(
            `/hoteleria/reservas/${res.id_reserva}/checkin`,
            'Check-in',
            'is-link',
            'fa-sign-in-alt'
          )}
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
          ${action(
            `/hoteleria/reservas/${res.id_reserva}/checkout`,
            'Check-out',
            'is-info',
            'fa-sign-out-alt'
          )}
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
            <button class="button is-primary" id="btnNuevaReserva">
              <span class="icon"><i class="fas fa-plus"></i></span>
              <span>Nueva Reserva</span>
            </button>
          </div>
        </div>

        <form method="GET" class="box" id="formFiltrosReservas">
          <div class="columns is-vcentered">
            <div class="column is-4">
              <div class="field">
                <label class="label is-small">Buscar</label>
                <div class="control has-icons-left">
                  <input type="text" name="q" class="input is-small" placeholder="Huésped, documento, cód. reserva..." value="${
                    query.q || ''
                  }">
                  <span class="icon is-small is-left"><i class="fas fa-search"></i></span>
                </div>
              </div>
            </div>
            <div class="column is-4">
              <div class="field is-grouped">
                <div class="control is-expanded">
                  <label class="label is-small">Check-in Desde</label>
                  <input type="date" name="fechaDesde" class="input is-small" value="${
                    query.fechaDesde || ''
                  }">
                </div>
                <div class="control is-expanded">
                  <label class="label is-small">Check-in Hasta</label>
                  <input type="date" name="fechaHasta" class="input is-small" value="${
                    query.fechaHasta || ''
                  }">
                </div>
              </div>
            </div>
            <div class="column is-4">
              <div class="field is-grouped">
                <div class="control is-expanded">
                  <label class="label is-small">Estado</label>
                  <div class="select is-fullwidth is-small">
                    <select name="estado">
                      <option value="">-- Todos los Estados --</option>
                      ${estadosReserva
                        .map(
                          (e) => `
                        <option value="${e}" ${
                            query.estado === e ? 'selected' : ''
                          }>${e}</option>
                      `
                        )
                        .join('')}
                    </select>
                  </div>
                </div>
                <div class="control is-expanded">
                  <label class="label is-small">Tipo Hab.</label>
                  <div class="select is-fullwidth is-small">
                    <select name="id_tipoHab">
                      <option value="">-- Todas las Hab. --</option>
                      ${tiposHabitacion
                        .map(
                          (t) => `
                        <option value="${t.id_tipoHab}" ${
                            query.id_tipoHab == t.id_tipoHab ? 'selected' : ''
                          }>${t.nombre}</option>
                      `
                        )
                        .join('')}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="field is-grouped is-grouped-right">
            <div class="control">
              <a href="/hoteleria/reservas" class="button is-light is-small">Limpiar Filtros</a>
            </div>
            <div class="control">
              <button type="submit" class="button is-info is-small">Filtrar</button>
            </div>
          </div>
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
              <th>Estado</th>
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
                  <div>${getRoomName(r.DetallesReserva)}</div>
                  <div class="has-text-grey-darker has-text-weight-bold">$${Number(
                    r.total || 0
                  ).toFixed(2)}</div>
                </td>
                <td>
                  <span class="tag ${getEstadoTag(r.estado)}">${r.estado}</span>
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
              <tr><td colspan="6" class="has-text-centered">No se encontraron reservas con esos filtros.</td></tr>
            `
            }
          </tbody>
        </table>

        ${
          totalPages > 1
            ? `
        <nav class="pagination is-centered mt-5" role="navigation" aria-label="pagination">
          <a href="${buildPageLink(
            query,
            currentPage - 1
          )}" class="pagination-previous" ${
                currentPage === 1 ? 'disabled' : ''
              }>Anterior</a>
          <a href="${buildPageLink(
            query,
            currentPage + 1
          )}" class="pagination-next" ${
                currentPage >= totalPages ? 'disabled' : ''
              }>Siguiente</a>
          <ul class="pagination-list">
            <li><span class="pagination-link is-static">Página ${currentPage} de ${totalPages}</span></li>
          </ul>
        </nav>
        `
            : ''
        }

      </div> </section>

    <div class="modal" id="modalReserva">
      <div class="modal-background" onclick="document.getElementById('modalReserva').classList.remove('is-active')"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title" id="modalTitle">Editar Reserva</p>
          <button class="delete" aria-label="close" onclick="document.getElementById('modalReserva').classList.remove('is-active')"></button>
        </header>
        <section class="modal-card-body">
          <form id="formReserva" method="POST">
            <input type="hidden" name="id_reserva" id="id_reserva">
            <div class="field">
              <label class="label">Huésped</label>
              <input class="input" id="huesped_nombre" readonly disabled>
            </div>
            <div class="field is-grouped">
              <div class="control is-expanded">
                <label class="label">Check-in</label>
                <input type="date" name="fechaCheckIn" id="fechaCheckIn" class="input">
              </div>
              <div class="control is-expanded">
                <label class="label">Check-out</label>
                <input type="date" name="fechaCheckOut" id="fechaCheckOut" class="input">
              </div>
            </div>
            <div class="field">
              <label class="label">Total (Manual)</label>
              <input type="number" step="0.01" name="total" id="total" class="input">
            </div>
          </form>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-success" id="btnGuardarReserva">Guardar</button>
          <button class="button" id="btnCancelarModal" onclick="document.getElementById('modalReserva').classList.remove('is-active')">Cancelar</button>
        </footer>
      </div>
    </div>

    <div class="modal" id="modalNuevaReserva">
      <div class="modal-background" onclick="document.getElementById('modalNuevaReserva').classList.remove('is-active')"></div>
      <div class="modal-card" style="max-width: 680px;">
        <header class="modal-card-head has-background-primary-light">
          <p class="modal-card-title has-text-primary-dark">
            <span class="icon mr-2"><i class="fas fa-calendar-plus"></i></span>
            Nueva Reserva Manual
          </p>
          <button class="delete" aria-label="close" onclick="document.getElementById('modalNuevaReserva').classList.remove('is-active')"></button>
        </header>
        
        <section class="modal-card-body">
          <div class="notification is-danger is-light" id="errorNuevaReserva" style="display: none;"></div>

          <form id="formNuevaReserva" method="POST" action="/hoteleria/reservas/new">
            
            <p class="title is-6 is-spaced">1. Huésped y Fechas</p>
            <hr class="mt-0 mb-4">

            <div class="field">
              <label class="label">Huésped</label>
              <div class="field has-addons">
                <div class="control is-expanded">
                  <div class="select is-fullwidth is-rounded">
                    <select name="id_huesped" id="id_huesped_select" required>
                      <option value="">-- Seleccione un huésped --</option>
                      ${huespedes.map((h) => `<option value="${h.id_huesped}">${h.apellido}, ${h.nombre} (${h.documento || 'N/D'})</option>`).join('')}
                    </select>
                  </div>
                </div>
                <div class="control">
                  <a href="/hoteleria/huespedes" target="_blank" class="button is-info is-rounded" title="Abrir gestión de huéspedes en una nueva pestaña">
                    <span class="icon"><i class="fas fa-user-plus"></i></span>
                  </a>
                </div>
              </div>
              <p class="help">Si el huésped no existe, ábrelo en una nueva pestaña.</p>
            </div>

            <div class="field is-grouped">
              <div class="control is-expanded">
                <label class="label">Check-in</label>
                <input type="date" name="fechaCheckIn" id="fechaCheckIn_new" class="input is-rounded input-calc-night input-calc-total" required>
              </div>
              <div class="control is-expanded">
                <label class="label">Check-out</label>
                <input type="date" name="fechaCheckOut" id="fechaCheckOut_new" class="input is-rounded input-calc-night input-calc-total" required>
              </div>
            </div>
            
            <div id="resumen_noches_wrapper" class="field has-text-weight-bold is-size-6 mt-2" style="min-height: 20px; display: none;">
              <p class="has-text-success" id="noches_display_text">
                <span class="icon is-small"><i class="fas fa-calendar-check"></i></span>
                Total: <span id="resumen_noches">0</span> noches
              </p>
            </div>
            
            <p class="title is-6 is-spaced mt-5">2. Habitación y Ocupantes</p>
            <hr class="mt-0 mb-4">

            <div class="field">
              <label class="label">Tipo de Habitación (Principal)</label>
              <div class="control">
                <div class="select is-fullwidth is-rounded">
                  <select name="id_tipoHab" id="id_tipoHab_select" class="input-calc-total" required>
                    <option value="">-- Seleccione un tipo --</option>
                    ${tiposHabitacion.map((t) => `<option value="${t.id_tipoHab}" data-precio="${t.precioBase}" data-capacidad="${t.capacidad}">${t.nombre} (Máx: ${t.capacidad} pers.)</option>`).join('')}
                  </select>
                </div>
              </div>
              <p id="resumen_capacidad_text" class="help mt-2 has-text-warning">
                <span class="icon is-small"><i class="fas fa-exclamation-triangle"></i></span>
                Capacidad: [N/A]
              </p>
            </div>

            <div class="field is-grouped">
              <div class="control is-expanded">
                <label class="label">Adultos</label>
                <input type="number" name="cantAdultos" id="cantAdultos_new" class="input is-rounded input-calc-total" min="1" value="1" required>
              </div>
              <div class="control is-expanded">
                <label class="label">Niños</label>
                <input type="number" name="cantNinos" id="cantNinos_new" class="input is-rounded input-calc-total" min="0" value="0" required>
              </div>
            </div>

            <p class="title is-6 is-spaced mt-5">3. Monto y Pago</p>
            <hr class="mt-0 mb-4">

            <div class="box has-background-warning-light p-3 mb-4">
              <div class="level is-mobile">
                <div class="level-left">
                  <p class="title is-5 has-text-warning-dark mb-0">TOTAL ESTIMADO</p>
                </div>
                <div class="level-right">
                  <p class="title is-5 has-text-warning-dark mb-0" id="resumen_total_calc">$0.00</p>
                </div>
              </div>
              <p class="help has-text-warning-dark mt-2">El precio base se calculará automáticamente.</p>
            </div>

            <div class="field is-grouped">
              <div class="control is-expanded">
                <label class="label">Estado Inicial</label>
                <div class="select is-fullwidth is-rounded">
                  <select name="estado" required>
                    <option value="PENDIENTE" selected>Pendiente</option>
                    <option value="CONFIRMADA">Confirmada</option>
                  </select>
                </div>
              </div>
              <div class="control is-expanded">
                <label class="label">Precio Total Final (Manual)</label>
                <input type="number" step="0.01" name="total" id="total_manual_new" class="input is-rounded" placeholder="0.00" required>
              </div>
            </div>

            <div class="field">
              <label class="label">Observaciones</label>
              <div class="control">
                <textarea name="observaciones" class="textarea is-rounded" rows="2"></textarea>
              </div>
            </div>

          </form>
        </section>
        
        <footer class="modal-card-foot">
          <button class="button is-success" id="btnGuardarNuevaReserva">Guardar Reserva</button>
          <button class="button" onclick="document.getElementById('modalNuevaReserva').classList.remove('is-active')">Cancelar</button>
        </footer>
      </div>
    </div>

    <script src="/js/reservas.js"></script>
    `,
  });
};