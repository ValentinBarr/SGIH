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
        <section class="inventory-card">
          <div id="lista-reservas-wrapper" hx-boost="true">
            <div class="level">
              <div class="level-left">
                <h1 class="title">Reservas</h1>
              </div>
              <div class="level-right">
                <button class="button is-light mr-2" id="btn-mostrar-ocultas" style="display: none;">
                  <span class="icon"><i class="fas fa-eye"></i></span>
                  <span>Mostrar ocultas (<span id="count-ocultas">0</span>)</span>
                </button>
                <a class="button is-primary" href="/hoteleria/reservas/new"> 
                  <span class="icon"><i class="fas fa-plus"></i></span>
                  <span>Nueva Reserva</span>
                </a>
              </div>
            </div>

            <p class="is-size-7 has-text-grey mb-3">
              Mostrando ${totalReservas} ${
                totalReservas === 1 ? 'reserva' : 'reservas'
            }
            </p>

            <table class="table is-fullwidth is-hoverable is-striped">
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
                        <div class="has-text-grey-darker has-text-weight-bold">${formatCurrency(r.total)}</div>
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

        <!-- Sistema de Calendarios con Pestañas -->
        <section class="inventory-card mt-5">
          <div class="calendario-hotelero">
            <!-- Encabezado con pestañas -->
            <div class="level mb-4">
              <div class="level-left">
                <h2 class="subtitle is-4 mb-0">Calendario de Reservas</h2>
              </div>
            </div>

            <!-- Pestañas de selección -->
            <div class="tabs is-boxed calendario-tabs">
              <ul>
                <li class="is-active" data-tab="visual">
                  <a>
                    <span class="icon is-small"><i class="fas fa-eye"></i></span>
                    <span>Vista de Reservas</span>
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

            <!-- Contenedor del Calendario Visual -->
            <div id="calendario-visual-container" class="calendario-tab-content active">
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
                <!-- Controles de navegación -->
                <div class="calendario-controls">
                  <div class="calendario-nav">
                    <button id="btn-prev-funcional" class="btn-nav" aria-label="Anterior">
                      <i class="fas fa-chevron-left"></i>
                    </button>
                    <h3 id="periodo-actual-funcional" class="periodo-title">Noviembre 2024</h3>
                    <button id="btn-next-funcional" class="btn-nav" aria-label="Siguiente">
                      <i class="fas fa-chevron-right"></i>
                    </button>
                  </div>
                  
                  <div class="calendario-view-buttons">
                    <button id="btn-hoy-funcional" class="btn-hoy">Hoy</button>
                    <button id="btn-vista-semana-funcional" class="btn-vista" data-vista="semana">Semana</button>
                    <button id="btn-vista-mes-funcional" class="btn-vista active" data-vista="mes">Mes</button>
                  </div>
                </div>

                <!-- Contenedor del calendario funcional -->
                <div id="calendario-container-funcional" class="calendario-container">
                  <!-- El calendario funcional se renderiza aquí -->
                </div>

                <!-- Sección de habitaciones disponibles -->
                <div id="habitaciones-section-funcional" class="habitaciones-section" style="display: none;">
                  <h4 id="fecha-seleccionada-title-funcional" class="fecha-seleccionada-title"></h4>
                  <div id="habitaciones-container-funcional" class="habitaciones-container">
                    <!-- Las tarjetas de habitaciones se renderizan aquí -->
                  </div>
                </div>

                <!-- Leyenda funcional -->
                <div class="calendario-leyenda">
                  <p class="has-text-weight-semibold mb-2">Leyenda:</p>
                  <div class="leyenda-items">
                    <div class="leyenda-item">
                      <span class="leyenda-color" style="background-color: #3b82f6;"></span>
                      <span><i class="fas fa-sign-in-alt"></i> Check-in</span>
                    </div>
                    <div class="leyenda-item">
                      <span class="leyenda-color" style="background-color: #dbeafe;"></span>
                      <span>Rango seleccionado</span>
                    </div>
                    <div class="leyenda-item">
                      <span class="leyenda-color" style="background-color: #10b981;"></span>
                      <span><i class="fas fa-sign-out-alt"></i> Check-out</span>
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
          // Manejo del modal de cancelación
          document.addEventListener('DOMContentLoaded', () => {
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