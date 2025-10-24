const layout = require('../layout'); // Ajusta la ruta a tu layout

// 1. Obtenemos las categorías del Enum de Prisma (¡necesitarás pasarlas desde la ruta!)
// Haremos esto en el archivo de rutas
const categoriasEnum = [
  'BASICO', 
  'ENTRETENIMIENTO', 
  'BANIO', 
  'SERVICIO', 
  'OTROS'
];

module.exports = ({ comodidades = [], query = {} }) => layout({
  content: `
  <section class="inventory-card">
    <div class="level">
      <div class="level-left">
        <h1 class="title">Gestionar Comodidades</h1>
      </div>
      <div class="level-right">
        <button class="button is-primary" id="btnNuevaComodidad">
          <span class="icon"><i class="fas fa-plus"></i></span>
          <span>Nueva Comodidad</span>
        </button>
      </div>
    </div>

    <form method="GET" class="field has-addons mb-3">
      <div class="control is-expanded">
        <input type="text" class="input" name="q" placeholder="Buscar comodidad..." value="${query.q || ''}">
      </div>
      <div class="control">
        <button type="submit" class="button is-info">Buscar</button>
      </div>
    </form>

    <table class="table is-fullwidth is-hoverable">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Categoría</th> <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${comodidades.length > 0 ? comodidades.map(c => `
          <tr>
            <td>${c.nombre}</td>
            <td>${c.descripcion || ''}</td>
            <td>
              <span class="tag is-light">${c.categoria || 'OTROS'}</span> </td>
            <td>
              <span class="tag is-${c.activo ? 'success' : 'danger'}">
                ${c.activo ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td class="has-text-right">
              
              <button 
                class="button is-small is-warning btnEditar"
                data-id="${c.id_comodidad}"
                data-nombre="${c.nombre}"
                data-descripcion="${c.descripcion || ''}"
                data-categoria="${c.categoria || 'OTROS'}"> <span class="icon"><i class="fas fa-edit"></i></span>
                <span>Editar</span>
              </button>

              <form method="POST" 
                    action="/hoteleria/comodidades/${c.id_comodidad}/toggle" 
                    style="display: inline-block;" 
                    class="ml-2">
                
                ${c.activo ? `
                  <button type="submit" class="button is-small is-danger" title="Desactivar">
                    <span class="icon"><i class="fas fa-ban"></i></span>
                    <span>Desactivar</span>
                  </button>
                ` : `
                  <button type="submit" class="button is-small is-success" title="Activar">
                    <span class="icon"><i class="fas fa-check-circle"></i></span>
                    <span>Activar</span>
                  </button>
                `}
              </form>
              
            </td>
          </tr>
        `).join('') : `
          <tr><td colspan="5" class="has-text-centered">Sin registros</td></tr> `}
      </tbody>
    </table>
  </section>

  <div class="modal" id="modalComodidad">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head has-background-info-light">
        <p class="modal-card-title has-text-info-dark" id="modalTitle">
          <span class="icon mr-2"><i class="fas fa-wifi"></i></span>
          Nueva Comodidad
        </p>
        <button class="delete" aria-label="close"
                onclick="document.getElementById('modalComodidad').classList.remove('is-active')"></button>
      </header>

      <section class="modal-card-body">
        <form id="formComodidad" method="POST">
          <input type="hidden" name="id_comodidad" id="id_comodidad">

          <div class="field">
            <label class="label">Nombre</label>
            <input type="text" name="nombre" id="nombre" class="input is-rounded" required>
          </div>

          <div class="field">
            <label class="label">Categoría</label>
            <div class="control">
              <div class="select is-rounded is-fullwidth">
                <select name="categoria" id="categoria">
                  ${categoriasEnum.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
          <div class="field">
            <label class="label">Descripción</label>
            <textarea name="descripcion" id="descripcion" class="textarea is-rounded"></textarea>
          </div>
        </form>
      </section>

      <footer class="modal-card-foot">
        <button class="button is-success is-rounded" id="btnGuardarComodidad">
          <span class="icon"><i class="fas fa-check"></i></span>
          <span>Guardar</span>
        </button>
        <button class="button is-light is-rounded" id="btnCancelarModal" type="button"
                onclick="document.getElementById('modalComodidad').classList.remove('is-active')">
          <span class="icon"><i class="fas fa-ban"></i></span>
          <span>Cancelar</span>
        </button>
      </footer>
    </div>
  </div>

  <script src="/js/comodidades.js"></script>
  `
});