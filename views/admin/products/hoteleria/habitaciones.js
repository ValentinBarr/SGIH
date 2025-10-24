const layout = require('../layout'); // Ajusta la ruta a tu layout

const estadosHabitacion = [
  'DISPONIBLE', 'OCUPADA', 'LIMPIEZ', 'MANTENIMIENTO'
];

// 👇 ================== PROPS DE MÓDULO ACTUALIZADAS ================== 👇
module.exports = ({ 
  habitaciones = [], 
  tiposHabitacion = [], 
  query = {}, 
  totalPages = 1, 
  currentPage = 1,
  totalHabitaciones = 0
}) => {

  // Helper para construir links de filtro (preserva la búsqueda 'q')
  const buildFilterLink = (params) => {
    const newQuery = { ...query, ...params, page: 1 }; // Resetea a pág 1
    if (params.activo === undefined) delete newQuery.activo;
    return `?${new URLSearchParams(newQuery)}`;
  };
  
  // Helper para construir links de paginación (preserva todo 'query' excepto page)
  const buildPageLink = (page) => {
    const newQuery = { ...query, page };
    return `?${new URLSearchParams(newQuery)}`;
  };

  return layout({
  content: `
  <section class="inventory-card">
  <div id="lista-habitaciones-wrapper" hx-boost="true">
    <div class="level">
      <div class="level-left">
        <h1 class="title">Inventario de Habitaciones</h1>
      </div>
      <div class="level-right">
        <button class="button is-primary" id="btnNuevaHabitacion">
          <span class="icon"><i class="fas fa-plus"></i></span>
          <span>Nueva Habitación</span>
        </button>
      </div>
    </div>

    <div class="level">
      <div class="level-left">
        <div class="tabs is-toggle is-small">
          <ul>
            <li class="${!query.activo ? 'is-active' : ''}">
              <a href="${buildFilterLink({ activo: undefined })}">
                <span class="icon is-small"><i class="fas fa-list"></i></span>
                <span>Todos</span>
              </a>
            </li>
            <li class="${query.activo === 'true' ? 'is-active' : ''}">
              <a href="${buildFilterLink({ activo: 'true' })}">
                <span class="icon is-small"><i class="fas fa-check-circle"></i></span>
                <span>Activos</span>
              </a>
            </li>
            <li class="${query.activo === 'false' ? 'is-active' : ''}">
              <a href="${buildFilterLink({ activo: 'false' })}">
                <span class="icon is-small"><i class="fas fa-ban"></i></span>
                <span>Inactivos</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div class="level-right">
         <p class="is-size-7 has-text-grey">
          ${totalHabitaciones} ${totalHabitaciones === 1 ? 'resultado' : 'resultados'}
         </p>
      </div>
    </div>
    <form method="GET" class="field has-addons mb-3">
      <input type="hidden" name="activo" value="${query.activo || ''}" />
      
      <div class="control is-expanded">
        <input type="text" class="input" name="q" placeholder="Buscar por número..." value="${query.q || ''}">
      </div>
      <div class="control">
        <button type="submit" class="button is-info">Buscar</button>
      </div>
    </form>

    <table class="table is-fullwidth is-hoverable">
      <thead>
        <tr>
          <th>Número</th>
          <th>Tipo</th>
          <th>Piso</th>
          <th>Estado Físico</th>
          <th>Registro</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${habitaciones.length > 0 ? habitaciones.map(h => `
          <tr>
            <td><strong>${h.numero}</strong></td>
            <td>${h.TipoHabitacion?.nombre || 'N/A'}</td>
            <td>${h.piso || 'N/A'}</td>
            <td><span class="tag is-info is-light">${h.estado}</span></td>
            <td>
              <span class="tag is-${h.activo ? 'success' : 'danger'}">
                ${h.activo ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td class="has-text-right">
              
              <button 
                class="button is-small is-warning btnEditar"
                data-id="${h.id_hab}"
                data-numero="${h.numero}"
                data-piso="${h.piso || ''}"
                data-estado="${h.estado}"
                data-id-tipohab="${h.id_tipoHab}"
              >
                <span class="icon"><i class="fas fa-edit"></i></span>
                <span>Editar</span>
              </button>

                <form method="POST" 
                    action="/hoteleria/habitaciones/${h.id_hab}/toggle?${new URLSearchParams(query)}" 
                    style="display: inline-block;" 
                    class="ml-2"
                    
                    hx-post="/hoteleria/habitaciones/${h.id_hab}/toggle?${new URLSearchParams(query)}"
                    hx-target="closest tr"
                    hx-swap="outerHTML"
              >
                
                ${h.activo ? `
                  <button type="submit" class="button is-small is-danger" title="Desactivar registro">
                    <span class="icon"><i class="fas fa-ban"></i></span>
                  </button>
                ` : `
                  <button type="submit" class="button is-small is-success" title="Activar registro">
                    <span class="icon"><i class="fas fa-check-circle"></i></span>
                  </button>
                `}
              </form>
            </td>
          </tr>
        `).join('') : `
          <tr><td colspan="6" class="has-text-centered">Sin registros</td></tr>
        `}
      </tbody>
    </table>

    ${totalPages > 1 ? `
    <nav class="pagination is-centered mt-5" role="navigation" aria-label="pagination">
      <a 
        href="${buildPageLink(currentPage - 1)}" 
        class="pagination-previous" 
        ${currentPage === 1 ? 'disabled' : ''}
      >Anterior</a>
      
      <a 
        href="${buildPageLink(currentPage + 1)}" 
        class="pagination-next" 
        ${currentPage >= totalPages ? 'disabled' : ''}
      >Siguiente</a>
      
      <ul class="pagination-list">
        <li>
          <span class="pagination-link is-static">
            Página ${currentPage} de ${totalPages}
          </span>
        </li>
      </ul>
    </nav>
    ` : ''}
    </div> </section>

  <div class="modal" id="modalHabitacion">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head has-background-primary-light">
        <p class="modal-card-title has-text-primary-dark" id="modalTitle">
          <span class="icon mr-2"><i class="fas fa-door-open"></i></span>
          Nueva Habitación
        </p>
        <button class="delete" aria-label="close"
                onclick="document.getElementById('modalHabitacion').classList.remove('is-active')"></button>
      </header>
      <section class="modal-card-body">
        <form id="formHabitacion" method="POST">
          <input type="hidden" name="id_hab" id="id_hab">
          <div class="field">
            <label class="label">Número de Habitación</label>
            <input type="text" name="numero" id="numero" class="input is-rounded" placeholder="Ej: 101, 205B" required>
          </div>
          <div class="field">
            <label class="label">Piso</label>
            <input type="number" name="piso" id="piso" class="input is-rounded" placeholder="Ej: 1, 2...">
          </div>
          <div class="field">
            <label class="label">Tipo de Habitación</label>
            <div class="control">
              <div class="select is-rounded is-fullwidth">
                <select name="id_tipoHab" id="id_tipoHab" required>
                  <option value="">-- Seleccione un tipo --</option>
                  ${(tiposHabitacion || []).map(t => `
                    <option value="${t.id_tipoHab}">${t.nombre} (Cap: ${t.capacidad})</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>
          <div class="field">
            <label class="label">Estado Físico Inicial</label>
            <div class="control">
              <div class="select is-rounded is-fullwidth">
                <select name="estado" id="estado" required>
                  ${estadosHabitacion.map(e => `<option value="${e}">${e}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </form>
      </section>
      <footer class="modal-card-foot">
        <button class="button is-success is-rounded" id="btnGuardarHabitacion">
          <span class="icon"><i class="fas fa-check"></i></span>
          <span>Guardar</span>
        </button>
        <button class="button is-light is-rounded" id="btnCancelarModal" type="button"
                onclick="document.getElementById('modalHabitacion').classList.remove('is-active')">
          <span class="icon"><i class="fas fa-ban"></i></span>
          <span>Cancelar</span>
        </button>
      </footer>
    </div>
  </div>

  <script src="/js/habitaciones.js"></script>
  `
})};