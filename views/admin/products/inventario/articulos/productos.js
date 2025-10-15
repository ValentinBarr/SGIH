const layout = require('../../layout');

const fmtBool = (v) => v ? '<span class="tag is-success is-light">Sí</span>'
                         : '<span class="tag is-danger is-light">No</span>';
const fmtDate = (v) => !v ? '—' : new Date(v).toISOString().split('T')[0];

// opciones de tipo
const TIPOS = ['VENDIBLE','INSUMO','AMENITY','LINEN','SERVICE'];

module.exports = ({ products = [], filters = {}, basePath = '/inventarios/articulos' }) => {
  const f = { q:'', tipo:'', stockeable:'', activo:'', ok:'', ...filters };

  const rows = products.map(p => `
    <tr>
      <td>${p.id_prod}</td>
      <td>${p.nombre_prod}</td>
      <td>${p.tipo_prod}</td>
      <td class="has-text-centered">${fmtBool(p.stockeable_prod)}</td>
      <td class="has-text-centered">${fmtBool(p.activo_prod)}</td>
      <td>${fmtDate(p.fechaAlta_prod)}</td>
      <td class="is-narrow">
        <a href="/inventarios/articulos/${p.id_prod}/edit" class="button is-link is-light is-small">Editar</a>
      </td>
      <td class="is-narrow">
        <button class="button is-small ${p.activo_prod ? 'is-warning' : 'is-success'} is-light is-rounded js-open-toggle" 
                data-id="${p.id_prod}" 
                data-name="${p.nombre_prod}" 
                data-action="${p.activo_prod ? 'desactivar' : 'activar'}"
                data-entity="el artículo"
                data-basepath="${basePath}">
          ${p.activo_prod ? 'Desactivar' : 'Activar'}
        </button>
      </td>
    </tr>
  `).join('');

  return layout({
    content: `
    <section class="inventory-card">
      <!-- Feedback -->
      ${f.ok === 'toggled' 
        ? `<div class="notification is-success">✅ Estado del artículo actualizado correctamente</div>` 
        : ''}

      <div class="level">
        <div class="level-left">
          <h1 class="title">Artículos</h1>
        </div>
        <div class="level-right">
          <a href="/inventarios/articulos/new" class="button is-primary">
            <span class="icon is-small"><i class="fas fa-plus"></i></span>
            <span>Nuevo Artículo</span>
          </a>
        </div>
      </div>

      <!-- Filtros -->
      <form method="GET" action="${basePath}" class="filters-bar">
        <div>
          <label class="label">Buscar</label>
          <input class="input" name="q" placeholder="ID o nombre" value="${f.q}">
        </div>

        <div>
          <label class="label">Tipo</label>
          <div class="select is-fullwidth">
            <select name="tipo" onchange="this.form.submit()">
              <option value="">Todos</option>
              ${TIPOS.map(t => `<option value="${t}" ${f.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>

        <div>
          <label class="label">Stockeable</label>
          <div class="select is-fullwidth">
            <select name="stockeable" onchange="this.form.submit()">
              <option value="">Todos</option>
              <option value="1" ${f.stockeable === '1' ? 'selected' : ''}>Sí</option>
              <option value="0" ${f.stockeable === '0' ? 'selected' : ''}>No</option>
            </select>
          </div>
        </div>

        <div>
          <label class="label">Activo</label>
          <div class="select is-fullwidth">
            <select name="activo" onchange="this.form.submit()">
              <option value="">Todos</option>
              <option value="1" ${f.activo === '1' ? 'selected' : ''}>Sí</option>
              <option value="0" ${f.activo === '0' ? 'selected' : ''}>No</option>
            </select>
          </div>
        </div>

        <div style="display: flex; gap: 8px;">
          <button class="btn btn--subtle btn-apply" type="submit">
            <span class="icon"><i class="fas fa-filter"></i></span>
            Aplicar
          </button>
          <a class="btn btn-clear" href="${basePath}">Limpiar</a>
        </div>
      </form>

      <!-- Tabla -->
      <div class="table-container" style="box-shadow: none; border: 0; padding: 0; margin-top: 8px;">
        <table class="table table-inventory is-fullwidth">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th class="has-text-centered">Stockeable</th>
              <th class="has-text-centered">Activo</th>
              <th>Fecha Alta</th>
              <th colspan="2" class="has-text-centered">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="8" class="has-text-centered has-text-grey">Sin artículos</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Modal de confirmación -->
    <div class="modal" id="toggle-modal">
      <div class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Confirmar acción</p>
          <button class="delete js-close-modal" aria-label="close"></button>
        </header>
        <section class="modal-card-body">
          <p id="toggle-msg">¿Seguro que deseas cambiar el estado del artículo?</p>
        </section>
        <footer class="modal-card-foot">
          <form id="toggle-form" method="POST">
            <button class="button" id="toggle-btn">Confirmar</button>
          </form>
          <button class="button js-close-modal">Cancelar</button>
        </footer>
      </div>
    </div>

    <script src="/js/modal-toggle.js" defer></script>
    `
  });
};
