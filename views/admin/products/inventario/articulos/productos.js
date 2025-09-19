const layout = require('../../layout');

const fmtBool = (v) => v ? '<span class="tag is-success is-light">Sí</span>'
                         : '<span class="tag is-danger is-light">No</span>';
const fmtDec  = (v, d=2) => v==null ? '—' : (Number(v).toFixed(d));
const fmtDate = (v) => !v ? '—' : new Date(v).toISOString().split('T')[0];

// opciones de tipo (ajustá si usás otras)
const TIPOS = ['VENDIBLE','INSUMO','AMENITY','LINEN','SERVICE'];

module.exports = ({ products = [], filters = {}, basePath = '/inventarios/articulos' }) => {
  const f = { q:'', tipo:'', stockeable:'', activo:'', ...filters };

  const rows = products.map(p => `
    <tr>
      <td>${p.id_prod}</td>
      <td>${p.nombre_prod}</td>
      <td>${p.unidad_prod}</td>
      <td>${p.tipo_prod}</td>
      <td class="has-text-right">${fmtDec(p.precio_prod, 2)}</td>
      <td class="has-text-centered">${fmtBool(p.activo_prod)}</td>
      <td>${fmtDate(p.fechaAlta_prod)}</td>
      <td class="is-narrow">
        <a href="/inventarios/articulos/${p.id_prod}/edit" class="button is-link is-light is-small">Editar</a>
      </td>
      <td class="is-narrow">
        <form method="POST" action="/inventarios/articulos/${p.id_prod}/delete">
          <button class="button is-danger is-light is-small" onclick="return confirm('¿Eliminar producto #${p.id_prod}?')">Eliminar</button>
        </form>
      </td>
    </tr>
  `).join('');

return layout({
  content: `
    <section class="inventory-card">
      <!-- Toolbar -->
      <div class="inventory-toolbar">
        <div style="flex: 1"></div>
        <a href="/inventarios/articulos/new" class="btn btn--primary">
          <span class="icon"><i class="fas fa-plus"></i></span>
          Nueva Producto
        </a>
      </div>

      <!-- Filtros -->
      <form method="GET" action="${basePath || '/inventarios/articulos'}" class="filters-bar">
        <div>
          <label class="label">Buscar</label>
          <input class="input" name="q" placeholder="ID o nombre" value="${f.q}">
        </div>

        <div>
          <label class="label">Tipo</label>
          <div class="select is-fullwidth">
            <select name="tipo" onchange="this.form.submit()">
              <option value="">Todos</option>
              ${(typeof TIPOS !== 'undefined' ? TIPOS : ['VENDIBLE','INSUMO','AMENITY','LINEN','SERVICE'])
                .map(t => `<option value="${t}" ${f.tipo === t ? 'selected' : ''}>${t}</option>`)
                .join('')}
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
          <a class="btn btn-clear" href="${basePath || '/inventarios/articulos'}">Limpiar</a>
        </div>
      </form>

      <!-- Tabla -->
      <div class="table-container" style="box-shadow: none; border: 0; padding: 0; margin-top: 8px;">
        <table class="table table-inventory is-fullwidth">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Unidad</th>
              <th>Tipo</th>
              <th class="has-text-right">Precio</th>
              <th class="has-text-centered">Activo</th>
              <th>Fecha Alta</th>
              <th colspan="2" class="has-text-centered">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="9" class="has-text-centered has-text-grey">Sin productos</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `
});


};
