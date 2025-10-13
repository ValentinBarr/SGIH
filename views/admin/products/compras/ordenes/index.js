const layout = require('../../layout');

// Función de formato de moneda para pesos argentinos
const formatARS = (number) => {
  const value = Number(number) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const getEstadoColor = (estado) => {
  const colores = {
    'BORRADOR': 'warning',
    'EN_PROCESO': 'info',
    'APROBADA': 'success',
    'ANULADA': 'danger'
  };
  return colores[estado] || 'light';
};

const getTransicionesValidas = (estadoActual) => {
  const transiciones = {
    'BORRADOR': ['EN_PROCESO', 'ANULADA'],
    'EN_PROCESO': ['APROBADA', 'ANULADA'],
    'APROBADA': ['ANULADA'],
    'ANULADA': []
  };
  return transiciones[estadoActual] || [];
};

module.exports = ({ ordenes, proveedores, estados = [], filters, basePath }) => {
  return layout({
    content: `
      <section class="inventory-card">
        <div class="level">
          <div class="level-left">
            <h1 class="title">Órdenes de Compra</h1>
          </div>
          <div class="level-right">
            <a href="${basePath}/new" class="button is-primary">
              <span class="icon is-small">
                <i class="fas fa-plus"></i>
              </span>
              <span>Nueva Orden de Compra</span>
            </a>
          </div>
        </div>

        <!-- Filtros -->
        <div class="box">
          <form method="GET" action="${basePath}">
            <div class="columns">
              <div class="column">
                <label class="label">Buscar</label>
                <input class="input" 
                       type="text" 
                       name="q" 
                       value="${filters.q}" 
                       placeholder="Número, observaciones...">
              </div>
              <div class="column">
                <label class="label">Proveedor</label>
                <div class="select is-fullwidth">
                  <select name="id_prov">
                    <option value="">Todos los proveedores</option>
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
                    <option value="">Todos los estados</option>
                    ${estados.map(estado => 
                      `<option value="${estado}" ${filters.estado == estado ? 'selected' : ''}>
                        ${estado}
                      </option>`
                    ).join('')}
                  </select>
                </div>
              </div>
              <div class="column is-narrow">
                <label class="label">&nbsp;</label>
                <div class="field is-grouped">
                  <div class="control">
                    <button type="submit" class="button is-info">Filtrar</button>
                  </div>
                  <div class="control">
                    <a href="${basePath}" class="button is-light">Limpiar</a>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Tabla de órdenes -->
        <div class="table-container" style="overflow: visible;">
          <table class="table is-fullwidth is-hoverable">
            <thead>
              <tr class="has-background-light">
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
              ${ordenes.length === 0 ? `
                <tr>
                  <td colspan="7" class="has-text-centered has-text-grey">
                    No se encontraron órdenes con los filtros aplicados.
                  </td>
                </tr>
              ` : ordenes.map(orden => {
                const puedeEditar = orden.estado === 'BORRADOR';
                const transiciones = getTransicionesValidas(orden.estado);
                
                return `
                  <tr>
                    <td>
                      <strong>${orden.letra_comp}${orden.sucursal_comp}-${orden.numero_comp}</strong>
                    </td>
                    <td>
                      ${new Date(orden.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td>
                      ${orden.Proveedor?.nombre_prov || 'Sin proveedor'}
                    </td>
                    <td>
                      <span class="tag is-${getEstadoColor(orden.estado)}">
                        ${orden.estado}
                      </span>
                    </td>
                    <td>
                      ${orden.FormaPago?.nombre || 'N/A'}
                    </td>
                    <td class="has-text-right">
                      <strong>${formatARS(orden.total_comp)}</strong>
                    </td>
                    <td>
                      <div class="dropdown is-right is-up">
                        <div class="dropdown-trigger">
                          <button class="button is-small toggle-dropdown" data-id="${orden.id_comp}">
                            <span class="icon is-small">
                              <i class="fas fa-angle-down" aria-hidden="true"></i>
                            </span>
                          </button>
                        </div>
                        <div class="dropdown-menu" id="dropdown-menu-${orden.id_comp}" role="menu">
                          <div class="dropdown-content">
                            <a href="${basePath}/${orden.id_comp}" class="dropdown-item">
                              <span class="icon is-small"><i class="fas fa-eye"></i></span>
                              Ver detalle
                            </a>
                            ${puedeEditar ? `
                              <a href="${basePath}/${orden.id_comp}/edit" class="dropdown-item">
                                <span class="icon is-small"><i class="fas fa-edit"></i></span>
                                Editar
                              </a>
                            ` : `
                              <span class="dropdown-item has-text-grey">
                                <span class="icon is-small"><i class="fas fa-lock"></i></span>
                                No editable (${orden.estado})
                              </span>
                            `}
                            
                            ${transiciones.length > 0 ? `
                              <hr class="dropdown-divider">
                              <div class="dropdown-item">
                                <p class="has-text-grey is-size-7">Cambiar estado:</p>
                              </div>
                              ${transiciones.map(nuevoEstado => `
                                <a class="dropdown-item cambiar-estado" 
                                   data-id="${orden.id_comp}" 
                                   data-estado="${nuevoEstado}"
                                   data-numero="${orden.numero_comp}">
                                  <span class="tag is-small is-${getEstadoColor(nuevoEstado)}">
                                    ${nuevoEstado}
                                  </span>
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
            // Activar toggles de dropdown
            document.querySelectorAll('.toggle-dropdown').forEach(btn => {
              btn.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdown = this.closest('.dropdown');
                dropdown.classList.toggle('is-active');
              });
            });

            // Cerrar dropdowns al hacer click fuera
            document.addEventListener('click', function(e) {
              document.querySelectorAll('.dropdown.is-active').forEach(d => {
                if (!d.contains(e.target)) d.classList.remove('is-active');
              });
            });

            // Manejar cambio de estado
            document.querySelectorAll('.cambiar-estado').forEach(function(btn) {
              btn.addEventListener('click', function(e) {
                e.preventDefault();
                const id = this.dataset.id;
                const nuevoEstado = this.dataset.estado;
                const numero = this.dataset.numero;
                if (confirm(\`¿Está seguro de cambiar el estado de la orden \${numero} a \${nuevoEstado}?\`)) {
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
