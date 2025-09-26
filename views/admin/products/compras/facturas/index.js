const layout = require('../../layout');

const getEstadoColor = (estado) => {
  const colores = {
    BORRADOR: 'warning',
    EMITIDA: 'info',
    PAGADA: 'success',
    ANULADA: 'danger'
  };
  return colores[estado] || 'light';
};

const getTransicionesValidas = (estadoActual) => {
  const transiciones = {
    BORRADOR: ['EMITIDA', 'ANULADA'],
    EMITIDA: ['PAGADA', 'ANULADA'],
    PAGADA: [],
    ANULADA: []
  };
  return transiciones[estadoActual] || [];
};

module.exports = ({ facturas, proveedores, estados = [], filters, basePath }) => {
  return layout({
    content: `
      <section class="inventory-card">
        <div class="level">
          <div class="level-left">
            <h1 class="title">Facturas de Proveedores</h1>
          </div>
          <div class="level-right">
            <a href="${basePath}/new" class="button is-primary">
              <span class="icon is-small">
                <i class="fas fa-plus"></i>
              </span>
              <span>Nueva Factura</span>
            </a>
          </div>
        </div>

        <!-- Filtros -->
        <div class="box">
          <form method="GET" action="${basePath}">
            <div class="columns">
              <div class="column">
                <label class="label">Buscar</label>
                <input class="input" type="text" name="q" value="${filters.q || ''}" placeholder="Número, observaciones...">
              </div>
              <div class="column">
                <label class="label">Proveedor</label>
                <div class="select is-fullwidth">
                  <select name="id_prov">
                    <option value="">Todos</option>
                    ${proveedores.map(p => 
                      `<option value="${p.id_prov}" ${filters.id_prov == p.id_prov ? 'selected' : ''}>
                        ${p.nombre_prov}
                      </option>`
                    ).join('')}
                  </select>
                </div>
              </div>
              <div class="column">
                <label class="label">Estado</label>
                <div class="select is-fullwidth">
                  <select name="estado">
                    <option value="">Todos</option>
                    ${estados.map(e => 
                      `<option value="${e}" ${filters.estado == e ? 'selected' : ''}>${e}</option>`
                    ).join('')}
                  </select>
                </div>
              </div>
              <div class="column is-narrow">
                <label class="label">&nbsp;</label>
                <div class="field is-grouped">
                  <div class="control"><button type="submit" class="button is-info">Filtrar</button></div>
                  <div class="control"><a href="${basePath}" class="button is-light">Limpiar</a></div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Tabla -->
        <div class="table-container">
          <table class="table is-fullwidth is-hoverable">
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Forma de Pago</th>
                <th class="has-text-right">Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${facturas.length === 0 ? `
                <tr><td colspan="7" class="has-text-centered has-text-grey">No se encontraron facturas</td></tr>
              ` : facturas.map(f => {
                const puedeEditar = f.estado === 'BORRADOR';
                const transiciones = getTransicionesValidas(f.estado);
                return `
                  <tr>
                    <td><strong>${f.letra_comp}${f.sucursal_comp}-${f.numero_comp}</strong></td>
                    <td>${new Date(f.fecha).toLocaleDateString('es-AR')}</td>
                    <td>${f.Proveedor?.nombre_prov || 'N/A'}</td>
                    <td><span class="tag is-${getEstadoColor(f.estado)}">${f.estado}</span></td>
                    <td>${f.FormaPago?.nombre || 'N/A'}</td>
                    <td class="has-text-right"><strong>$${Number(f.total_comp).toFixed(2)}</strong></td>
                    <td>
                      <a href="${basePath}/${f.id_comp}" class="button is-small">Ver</a>
                      ${puedeEditar ? `<a href="${basePath}/${f.id_comp}/edit" class="button is-small is-info">Editar</a>` : ''}
                      ${transiciones.map(e => `
                        <form method="POST" action="${basePath}/${f.id_comp}/estado" style="display:inline;">
                          <input type="hidden" name="nuevo_estado" value="${e}">
                          <button type="submit" class="button is-small is-light">→ ${e}</button>
                        </form>
                      `).join('')}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `
  });
};
