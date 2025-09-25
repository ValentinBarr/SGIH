// views/admin/compras/remitos/index.js

const layout = require('../../layout');

const getEstadoColor = (estado) => {
  const colores = {
    'BORRADOR': 'warning',
    'PENDIENTE': 'info', 
    'RECIBIDO': 'success',
    'ANULADO': 'danger'
  };
  return colores[estado] || 'light';
};

const getTransicionesValidas = (estadoActual) => {
  const transiciones = {
    'BORRADOR': ['PENDIENTE', 'ANULADO'],
    'PENDIENTE': ['RECIBIDO', 'ANULADO'], 
    'RECIBIDO': ['ANULADO'],
    'ANULADO': []
  };
  return transiciones[estadoActual] || [];
};

module.exports = ({ remitos, proveedores, estados = [], filters, basePath }) => {
  return layout({
    content: `
      <section class="inventory-card">
        <div class="level">
          <div class="level-left">
            <h1 class="title">Remitos de Compra</h1>
          </div>
          <div class="level-right">
            <a href="${basePath}/new" class="button is-primary">
              <span class="icon is-small">
                <i class="fas fa-plus"></i>
              </span>
              <span>Nuevo Remito</span>
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

        <!-- Mensajes de éxito/error -->
        ${filters.success === 'created' ? '<div class="notification is-success"><button class="delete"></button>Remito creado exitosamente.</div>' : ''}
        ${filters.success === 'updated' ? '<div class="notification is-success"><button class="delete"></button>Remito actualizado exitosamente.</div>' : ''}
        ${filters.success === 'estado_cambiado' ? '<div class="notification is-success"><button class="delete"></button>Estado del remito cambiado exitosamente.</div>' : ''}
        ${filters.error ? `<div class="notification is-danger"><button class="delete"></button>${decodeURIComponent(filters.error)}</div>` : ''}

        <!-- Tabla de remitos -->
        <div class="table-container">
          <table class="table is-fullwidth is-hoverable">
            <thead>
              <tr class="has-background-light">
                <th>Número</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th class="has-text-right">Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${remitos.length === 0 ? `
                <tr>
                  <td colspan="6" class="has-text-centered has-text-grey">
                    No se encontraron remitos con los filtros aplicados.
                  </td>
                </tr>
              ` : remitos.map(remito => {
                const puedeEditar = remito.estado === 'BORRADOR';
                const transiciones = getTransicionesValidas(remito.estado);
                
                return `
                  <tr>
                    <td>
                      <strong>${remito.letra_comp}${remito.sucursal_comp}-${remito.numero_comp}</strong>
                    </td>
                    <td>
                      ${new Date(remito.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td>
                      ${remito.Proveedor?.nombre_prov || 'Sin proveedor'}
                    </td>
                    <td>
                      <span class="tag is-${getEstadoColor(remito.estado)}">
                        ${remito.estado}
                      </span>
                    </td>
                    <td class="has-text-right">
                      <strong>$${Number(remito.total_comp).toFixed(2)}</strong>
                    </td>
                    <td>
                      <div class="dropdown is-hoverable">
                        <div class="dropdown-trigger">
                          <button class="button is-small" aria-haspopup="true" aria-controls="dropdown-menu-${remito.id_comp}">
                            <span class="icon is-small">
                              <i class="fas fa-angle-down" aria-hidden="true"></i>
                            </span>
                          </button>
                        </div>
                        <div class="dropdown-menu" id="dropdown-menu-${remito.id_comp}" role="menu">
                          <div class="dropdown-content">
                            <a href="${basePath}/${remito.id_comp}" class="dropdown-item">
                              <span class="icon is-small"><i class="fas fa-eye"></i></span>
                              Ver detalle
                            </a>
                            ${puedeEditar ? `
                              <a href="${basePath}/${remito.id_comp}/edit" class="dropdown-item">
                                <span class="icon is-small"><i class="fas fa-edit"></i></span>
                                Editar
                              </a>
                            ` : `
                              <span class="dropdown-item has-text-grey">
                                <span class="icon is-small"><i class="fas fa-lock"></i></span>
                                No editable (${remito.estado})
                              </span>
                            `}
                            
                            ${transiciones.length > 0 ? `
                              <hr class="dropdown-divider">
                              <div class="dropdown-item">
                                <p class="has-text-grey is-size-7">Cambiar estado:</p>
                              </div>
                              ${transiciones.map(nuevoEstado => `
                                <a class="dropdown-item cambiar-estado" 
                                   data-id="${remito.id_comp}" 
                                   data-estado="${nuevoEstado}"
                                   data-numero="${remito.numero_comp}">
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

        <!-- Resumen -->
        <div class="box">
          <p class="has-text-grey">
            <strong>${remitos.length}</strong> remitos encontrados
          </p>
        </div>
      </section>

      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // Manejar notificaciones
          document.querySelectorAll('.notification .delete').forEach(function(deleteBtn) {
            deleteBtn.addEventListener('click', function() {
              deleteBtn.parentElement.remove();
            });
          });

          // Manejar cambio de estado
          document.querySelectorAll('.cambiar-estado').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              
              const id = this.dataset.id;
              const nuevoEstado = this.dataset.estado;
              const numero = this.dataset.numero;
              
              if (confirm(\`¿Está seguro de cambiar el estado del remito \${numero} a \${nuevoEstado}?\`)) {
                // Crear y enviar formulario
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
    `
  });
};