const layout = require('../layout');

module.exports = ({ tipos = [], comodidades = [], query = {} }) => layout({
  content: `
  <section class="inventory-card">
    <div class="level">
      <div class="level-left">
        <h1 class="title">Tipos de Habitación</h1>
      </div>
      <div class="level-right">
        <button class="button is-primary" id="btnNuevoTipo">
          <span class="icon"><i class="fas fa-plus"></i></span>
          <span>Nuevo Tipo</span>
        </button>
      </div>
    </div>

    <form method="GET" class="field has-addons mb-3">
      <div class="control is-expanded">
        <input type="text" class="input" name="q" placeholder="Buscar..." value="${query.q || ''}">
      </div>
      <div class="control">
        <button type="submit" class="button is-info">Buscar</button>
      </div>
    </form>

    <table class="table is-fullwidth is-hoverable">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Capacidad</th>
          <th>Precio base</th>
          <th>Comodidades</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${tipos.length > 0 ? tipos.map(t => `
          <tr>
            <td>${t.nombre}</td>
            <td>${t.capacidad}</td>
            <td>$${Number(t.precioBase || 0).toFixed(2)}</td>
            <td>${(t.Comodidades || []).map(c => c.Comodidad?.nombre || '').join(', ')}</td>
            <td>
              <span class="tag is-${t.activo ? 'success' : 'danger'}">
                ${t.activo ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            
            <td class="has-text-right">
              
              <button 
                class="button is-small is-warning btnEditar"
                data-id="${t.id_tipoHab}"
                data-nombre="${t.nombre}"
                data-descripcion="${t.descripcion || ''}"
                data-capacidad="${t.capacidad}"
                data-precio="${t.precioBase}"
                data-comodidades='${JSON.stringify((t.Comodidades || []).map(c => c.id_comodidad))}'>
                <span class="icon"><i class="fas fa-edit"></i></span>
                <span>Editar</span>
              </button>

              <form method="POST" 
                    action="/hoteleria/tipos-habitacion/${t.id_tipoHab}/toggle" 
                    style="display: inline-block;" 
                    class="ml-2">
                
                ${t.activo ? `
                  <button type="submit" class="button is-small is-danger" title="Desactivar tipo">
                    <span class="icon"><i class="fas fa-ban"></i></span>
                    <span>Desactivar</span>
                  </button>
                ` : `
                  <button type="submit" class="button is-small is-success" title="Activar tipo">
                    <span class="icon"><i class="fas fa-check-circle"></i></span>
                    <span>Activar</span>
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
  </section>

  <div class="modal" id="modalTipoHab">
    <div class="modal-background"></div>
    <div class="modal-card" style="max-width: 750px;">
      <header class="modal-card-head has-background-link-light">
        <p class="modal-card-title has-text-link-dark" id="modalTitle">
          <span class="icon mr-2"><i class="fas fa-bed"></i></span>
          Nuevo Tipo de Habitación
        </p>
        <button class="delete" aria-label="close"
                onclick="document.getElementById('modalTipoHab').classList.remove('is-active')"></button>
      </header>

      <section class="modal-card-body">
        <form id="formTipoHab" method="POST">
          <input type="hidden" name="id_tipoHab" id="id_tipoHab">

          <div class="field">
            <label class="label">Nombre</label>
            <input type="text" name="nombre" id="nombre" class="input is-rounded" required>
          </div>

          <div class="field">
            <label class="label">Descripción</label>
            <textarea name="descripcion" id="descripcion" class="textarea is-rounded"></textarea>
          </div>

          <div class="field is-grouped">
            <div class="control is-expanded">
              <label class="label">Capacidad</label>
              <input type="number" name="capacidad" id="capacidad" class="input is-rounded" min="1" required>
            </div>
            <div class="control is-expanded">
              <label class="label">Precio Base</label>
              <input type="number" step="0.01" name="precioBase" id="precioBase" class="input is-rounded" min="0" required>
            </div>
          </div>

          <div class="field">
            <label class="label">Comodidades disponibles</label>

            <div class="field mb-3">
              <div class="control has-icons-left">
                <input type_="text" id="filtroComodidades" class="input is-small is-rounded" placeholder="Buscar comodidad...">
                <span class="icon is-small is-left">
                  <i class="fas fa-search"></i>
                </span>
              </div>
            </div>
            <div class="control">
              <div class="columns is-multiline is-mobile" id="comodidades-container">
                
                ${(comodidades || []).map(c => `
                  <div class="column is-half-mobile is-one-third-tablet is-one-quarter-desktop item-comodidad">
                    <label class="checkbox">
                      <input 
                        type="checkbox" 
                        name="comodidades" 
                        value="${c.id_comodidad}"
                      >
                      ${c.nombre}
                    </label>
                  </div>
                `).join('')}

                <div class="column is-full" id="noComodidadResult" style="display: none;">
                  <p class="has-text-grey has-text-centered">No se encontraron comodidades.</p>
                </div>
                </div>
            </div>
          </div>
        </form>
      </section>

      <footer class="modal-card-foot">
        <button class="button is-success is-rounded" id="btnGuardarTipo">
          <span class="icon"><i class="fas fa-check"></i></span>
          <span>Guardar</span>
        </button>
        <button class="button is-light is-rounded" id="btnCancelarModal" type="button"
                onclick="document.getElementById('modalTipoHab').classList.remove('is-active')">
          <span class="icon"><i class="fas fa-ban"></i></span>
          <span>Cancelar</span>
        </button>
      </footer>
    </div>
  </div>

  <script src="/js/tiposHabitacion.js"></script>
  `
});