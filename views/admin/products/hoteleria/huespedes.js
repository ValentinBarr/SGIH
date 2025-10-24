const layout = require('../layout'); // Ajusta la ruta a tu layout

module.exports = ({ 
  huespedes = [], 
  query = {}, 
  totalPages = 1, 
  currentPage = 1,
  totalHuespedes = 0
}) => {

  // Helper para construir links de paginación
  const buildPageLink = (page) => {
    const newQuery = { ...query, page };
    return `?${new URLSearchParams(newQuery)}`;
  };

  return layout({
  content: `
  <section class="inventory-card">
    
    <div id="lista-huespedes-wrapper" hx-boost="true">

      <div class="level">
        <div class="level-left">
          <h1 class="title">Gestión de Huéspedes</h1>
        </div>
        <div class="level-right">
          <button class="button is-primary" id="btnNuevoHuesped">
            <span class="icon"><i class="fas fa-plus"></i></span>
            <span>Nuevo Huésped</span>
          </button>
        </div>
      </div>

      <div class="level">
        <div class="level-left">
          </div>
        <div class="level-right">
           <p class="is-size-7 has-text-grey">
            ${totalHuespedes} ${totalHuespedes === 1 ? 'resultado' : 'resultados'}
           </p>
        </div>
      </div>
      <form method="GET" class="field has-addons mb-3">
        <div class="control is-expanded">
          <input type="text" class="input" name="q" placeholder="Buscar por nombre, apellido o documento..." value="${query.q || ''}">
        </div>
        <div class="control">
          <button type="submit" class="button is-info">Buscar</button>
        </div>
      </form>

      <table class="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>Documento</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${huespedes.length > 0 ? huespedes.map(h => `
            <tr>
              <td><strong>${h.apellido}, ${h.nombre}</strong></td>
              <td>${h.documento || ''}</td>
              <td>${h.email || ''}</td>
              <td>${h.telefono || ''}</td>
              <td class="has-text-right">
                
                <button 
                  class="button is-small is-warning btnEditar"
                  data-id="${h.id_huesped}"
                  data-nombre="${h.nombre}"
                  data-apellido="${h.apellido}"
                  data-documento="${h.documento || ''}"
                  data-telefono="${h.telefono || ''}"
                  data-email="${h.email || ''}"
                >
                  <span class="icon"><i class="fas fa-edit"></i></span>
                  <span>Editar</span>
                </button>
                
                </td>
            </tr>
          `).join('') : `
            <tr><td colspan="5" class="has-text-centered">Sin registros</td></tr>
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

  <div class="modal" id="modalHuesped">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head has-background-success-light">
        <p class="modal-card-title has-text-success-dark" id="modalTitle">
          <span class="icon mr-2"><i class="fas fa-user-plus"></i></span>
          Nuevo Huésped
        </p>
        <button class="delete" aria-label="close"
                onclick="document.getElementById('modalHuesped').classList.remove('is-active')"></button>
      </header>

      <section class="modal-card-body">
        <form id="formHuesped" method="POST">
          <input type="hidden" name="id_huesped" id="id_huesped">

          <div class="field is-grouped">
            <div class="control is-expanded">
              <label class="label">Nombre</label>
              <input type="text" name="nombre" id="nombre" class="input is-rounded" required>
            </div>
            <div class="control is-expanded">
              <label class="label">Apellido</label>
              <input type="text" name="apellido" id="apellido" class="input is-rounded" required>
            </div>
          </div>

          <div class="field">
            <label class="label">Documento</label>
            <input type="text" name="documento" id="documento" class="input is-rounded">
          </div>
          
          <div class="field is-grouped">
            <div class="control is-expanded">
              <label class="label">Email</label>
              <input type="email" name="email" id="email" class="input is-rounded">
            </div>
            <div class="control is-expanded">
              <label class="label">Teléfono</label>
              <input type="tel" name="telefono" id="telefono" class="input is-rounded">
            </div>
          </div>

        </form>
      </section>

      <footer class="modal-card-foot">
        <button class="button is-success is-rounded" id="btnGuardarHuesped">
          <span class="icon"><i class="fas fa-check"></i></span>
          <span>Guardar</span>
        </button>
        <button class="button is-light is-rounded" id="btnCancelarModal" type="button"
                onclick="document.getElementById('modalHuesped').classList.remove('is-active')">
          <span class="icon"><i class="fas fa-ban"></i></span>
          <span>Cancelar</span>
        </button>
      </footer>
    </div>
  </div>

  <script src="/js/huespedes.js"></script>
  `
})}