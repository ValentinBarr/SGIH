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

// 👉 ahora solo se permite BORRADOR → EMITIDA o ANULADA
const getTransicionesValidas = (estadoActual) => {
  const transiciones = {
    BORRADOR: ['EMITIDA', 'ANULADA'],
    EMITIDA: [],
    PAGADA: [],
    ANULADA: []
  };
  return transiciones[estadoActual] || [];
};

// 👉 helper para formato en ARS
const formatARS = (value) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(Number(value) || 0);
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
        <div class="table-container" style="overflow: visible;">
          <table class="table is-fullwidth is-hoverable">
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Forma de Pago</th>
                <th class="has-text-right">Total</th>
                <th class="has-text-right">Saldo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${facturas.length === 0 ? `
                <tr><td colspan="8" class="has-text-centered has-text-grey">No se encontraron facturas</td></tr>
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
                    <td class="has-text-right"><strong>${formatARS(f.total_comp)}</strong></td>
                    <td class="has-text-right"><strong>${formatARS(f.saldo_comp)}</strong></td>
                    <td>
                      <div class="dropdown is-right is-up">
                        <div class="dropdown-trigger">
                          <button class="button is-small toggle-dropdown" data-id="${f.id_comp}">
                            <span class="icon is-small">
                              <i class="fas fa-angle-down" aria-hidden="true"></i>
                            </span>
                          </button>
                        </div>
                        <div class="dropdown-menu" id="dropdown-menu-${f.id_comp}" role="menu">
                          <div class="dropdown-content">
                            <a href="${basePath}/${f.id_comp}" class="dropdown-item">
                              <span class="icon is-small"><i class="fas fa-eye"></i></span>
                              Ver detalle
                            </a>
                            ${puedeEditar ? `
                              <a href="${basePath}/${f.id_comp}/edit" class="dropdown-item">
                                <span class="icon is-small"><i class="fas fa-edit"></i></span>
                                Editar
                              </a>
                            ` : `
                              <span class="dropdown-item has-text-grey">
                                <span class="icon is-small"><i class="fas fa-lock"></i></span>
                                No editable (${f.estado})
                              </span>
                            `}
                            
                            ${transiciones.length > 0 ? `
                              <hr class="dropdown-divider">
                              <div class="dropdown-item">
                                <p class="has-text-grey is-size-7">Cambiar estado:</p>
                              </div>
                              ${transiciones.map(e => `
                                <a class="dropdown-item cambiar-estado" 
                                   data-id="${f.id_comp}" 
                                   data-estado="${e}"
                                   data-numero="${f.numero_comp}">
                                  <span class="tag is-small is-${getEstadoColor(e)}">${e}</span>
                                </a>
                              `).join('')}
                            ` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <script>
          document.addEventListener('DOMContentLoaded', function() {
            // toggle de dropdown
            document.querySelectorAll('.toggle-dropdown').forEach(btn => {
              btn.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdown = this.closest('.dropdown');
                dropdown.classList.toggle('is-active');
              });
            });

            // cerrar al hacer click fuera
            document.addEventListener('click', function(e) {
              document.querySelectorAll('.dropdown.is-active').forEach(d => {
                if (!d.contains(e.target)) d.classList.remove('is-active');
              });
            });

            // manejar cambio de estado
            document.querySelectorAll('.cambiar-estado').forEach(btn => {
              btn.addEventListener('click', function(e) {
                e.preventDefault();
                const id = this.dataset.id;
                const nuevoEstado = this.dataset.estado;
                const numero = this.dataset.numero;
                if (confirm(\`¿Está seguro de cambiar la factura \${numero} a \${nuevoEstado}?\`)) {
                  const form = document.createElement('form');
                  form.method = 'POST';
                  form.action = \`${basePath}/\${id}/estado\`;
                  const input = document.createElement('input');
                  input.type = 'hidden';
                  input.name = 'nuevo_estado';
                  input.value = nuevoEstado;
                  form.appendChild(input);
                  document.body.appendChild(form);
                  form.submit();
                }
              });
            });
          });
        </script>
      </section>
    `
  });
};
