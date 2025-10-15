const layout = require('../../layout');

module.exports = ({ dep, grid, movimientos, productos, tiposComprobantes, pagination, error }) => {
  const totalProds = pagination?.total || grid.length;
  const bajos = grid.filter(r => r.estado === 'Bajo').length;
  const ultimosMovs = movimientos.length;

  return layout({
    content: `
      <link rel="stylesheet" href="/css/deposito-detail.css" />
      
      <section class="section">
        <div class="container is-max-desktop"> 
          
          <div class="box p-5 mb-6 has-background-white">
            <div class="level is-mobile mb-4">
              <div class="level-left">
                <div class="level-item">
                  <h1 class="title is-3 is-capitalized mb-0">${dep.nombre_dep}</h1>
                </div>
              </div>
              <div class="level-right">
                <div class="level-item">
                  <span class="tag is-info is-light is-medium">
                    <span class="icon is-small"><i class="fas fa-warehouse"></i></span>
                    <span>${dep.TipoDeposito?.nombre_tipoDep || 'N/A'}</span>
                  </span>
                </div>
              </div>
            </div>
            ${dep.ubicacion_dep ? `
            <p class="subtitle is-6 has-text-grey">
              <span class="icon-text">
                <span class="icon is-small"><i class="fas fa-map-marker-alt"></i></span>
                <span>Ubicación: ${dep.ubicacion_dep}</span>
              </span>
            </p>
            ` : ''}
            <hr class="my-3">

            <div class="buttons is-centered">
              <button 
                class="button is-success is-large has-text-weight-bold"
                onclick="document.getElementById('entradaModal').classList.add('is-active')">
                <span class="icon"><i class="fas fa-arrow-alt-circle-down"></i></span>
                <span>Registrar Entrada</span>
              </button>
              <button 
                class="button is-danger is-large has-text-weight-bold"
                onclick="document.getElementById('salidaModal').classList.add('is-active')">
                <span class="icon"><i class="fas fa-arrow-alt-circle-up"></i></span>
                <span>Registrar Salida</span>
              </button>
              <a href="/inventarios/depositos/${dep.id_dep}/parametros" 
                class="button is-info is-large has-text-weight-bold">
                <span class="icon"><i class="fas fa-cog"></i></span>
                <span>Parámetros</span>
              </a>
            </div>
          </div>

          <div class="columns is-multiline is-variable is-4 mb-6">
            <div class="column is-one-third-desktop is-half-tablet">
              <div class="box has-background-primary-light has-text-centered p-4">
                <p class="heading has-text-primary">PRODUCTOS REGISTRADOS</p>
                <p class="title is-4 has-text-primary-dark">${totalProds}</p>
              </div>
            </div>
            <div class="column is-one-third-desktop is-half-tablet">
              <div class="box has-background-warning-light has-text-centered p-4">
                <p class="heading has-text-warning">STOCK BAJO</p>
                <p class="title is-4 has-text-warning-dark">${bajos}</p>
              </div>
            </div>
            <div class="column is-one-third-desktop is-full-tablet">
              <div class="box has-background-info-light has-text-centered p-4">
                <p class="heading has-text-info">ÚLTIMOS MOVIMIENTOS</p>
                <p class="title is-4 has-text-info-dark">${ultimosMovs}</p>
              </div>
            </div>
          </div>

          <div class="columns is-multiline is-variable is-4">
            
            <div class="column is-full-desktop is-half-tablet">
              <div class="box">
                <div class="mb-5">
                  <h4 class="title is-4">
                    <span class="icon-text">
                      <span class="icon"><i class="fas fa-boxes"></i></span>
                      <span>Stock Actual</span>
                    </span>
                  </h4>
                  <div class="field mt-4">
                    <div class="control has-icons-left">
                      <input 
                        type="text" 
                        id="stockFilter" 
                        class="input is-medium is-rounded" 
                        placeholder="Filtrar productos..." 
                        onkeyup="filtrarStock()">
                      <span class="icon is-left is-medium"><i class="fas fa-search"></i></span>
                    </div>
                  </div>
                </div>
                <div class="table-container">
                  <table class="table is-fullwidth is-hoverable is-striped" id="stockTable">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th class="has-text-centered">Stock</th>
                        <th class="has-text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${grid.length ? grid.map(r => `
                        <tr>
                          <td>${r.nombre}</td>
                          <td class="has-text-centered has-text-weight-bold">${r.stock}</td>
                          <td class="has-text-right">
                            <span class="tag is-medium ${r.estado === 'Bajo' ? 'is-danger' : 'is-success'}">
                              ${r.estado === 'Bajo' ? '<span class="icon"><i class="fas fa-minus-circle"></i></span>' : '<span class="icon"><i class="fas fa-check-circle"></i></span>'}
                              <span>${r.estado}</span>
                            </span>
                          </td>
                        </tr>
                      `).join('') : `
                        <tr><td colspan="3" class="has-text-centered py-5 has-text-grey">No hay productos registrados en este depósito.</td></tr>
                      `}
                    </tbody>
                  </table>
                </div>
                ${pagination && pagination.pages > 1 ? `
                <nav class="pagination is-centered mt-5" role="navigation">
                  <ul class="pagination-list" style="list-style:none; margin:0; padding:0;">
                    ${Array.from({ length: pagination.pages }, (_, i) => `
                      <li>
                        <a href="/inventarios/depositos/${dep.id_dep}?page=${i+1}"
                          class="pagination-link ${pagination.page === i+1 ? 'is-current has-background-link' : ''}">
                          ${i+1}
                        </a>
                      </li>
                    `).join('')}
                  </ul>
                </nav>
                ` : ''}
              </div>
            </div>

            <div class="column is-full-desktop is-half-tablet">
              <div class="box">
                <div class="mb-5">
                  <h4 class="title is-4">
                    <span class="icon-text">
                      <span class="icon"><i class="fas fa-history"></i></span>
                      <span>Historial de Movimientos</span>
                    </span>
                  </h4>
                </div>
                <div class="table-container" style="max-height: 575px; overflow-y: auto;">
                  <table class="table is-fullwidth is-hoverable is-striped">
                    <thead>
                      <tr>
                        <th class="has-text-grey">Fecha</th>
                        <th class="has-text-grey">Tipo</th>
                        <th class="has-text-grey">Productos Detallados</th>
                        <th class="has-text-grey">Observación</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${movimientos.length ? movimientos.map(m => `
                        <tr>
                          <td>${new Date(m.fecha_mov).toLocaleDateString()}</td>
                          <td>
                            <span class="tag is-medium is-light ${m.TipoMovimiento?.direccion === 'IN' ? 'is-success' : 'is-danger'}">
                              <span class="icon is-small">
                                <i class="fas ${m.TipoMovimiento?.direccion === 'IN' ? 'fa-arrow-circle-down' : 'fa-arrow-circle-up'}"></i>
                              </span>
                              <span>${m.TipoMovimiento?.nombre || '-'}</span>
                            </span>
                          </td>
                          <td>
                            <div class="tags">
                              ${m.Detalles.map(d => `
                                <span class="tag is-info is-light">
                                  ${d.ProductoDeposito.Producto.nombre_prod} 
                                  <span class="has-text-weight-bold ml-1">(${d.cantidad})</span>
                                </span>
                              `).join('')}
                            </div>
                          </td>
                          <td>${m.observacion || '<span class="has-text-grey-light is-italic">Sin observación</span>'}</td>
                        </tr>
                      `).join('') : `
                        <tr><td colspan="4" class="has-text-centered py-5 has-text-grey">No hay movimientos registrados para este depósito.</td></tr>
                      `}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          <div class="modal" id="entradaModal">
            <div class="modal-background"></div>
            <div class="modal-card">
              <header class="modal-card-head has-background-success-light">
                <p class="modal-card-title has-text-success-dark">
                  <span class="icon mr-2"><i class="fas fa-arrow-alt-circle-down"></i></span>
                  Registrar Entrada
                </p>
                <button class="delete" aria-label="close" onclick="document.getElementById('entradaModal').classList.remove('is-active')"></button>
              </header>
              <section class="modal-card-body">
                <form method="POST" action="/inventarios/depositos/${dep.id_dep}/entradas">
                  <div class="field">
                    <label class="label">Observación</label>
                    <div class="control">
                      <input type="text" name="observacion" class="input is-rounded" placeholder="Detalle u observación opcional">
                    </div>
                  </div>
                  <hr>
                  <h4 class="title is-6 mb-3">Productos a Ingresar:</h4>
                  <div id="entradaProductosContainer">
                    <div class="field is-grouped producto-row mb-3">
                      <div class="control is-expanded">
                        <div class="select is-fullwidth is-rounded">
                          <select name="producto_1" required>
                            ${productos.map(p => `<option value="${p.id_prodDep}">${p.Producto.nombre_prod}</option>`).join('')}
                          </select>
                        </div>
                      </div>
                      <div class="control">
                        <input type="number" name="cantidad_1" min="1" step="any" class="input is-rounded" placeholder="Cantidad" required>
                      </div>
                      <div class="control">
                        <button type="button" class="button is-danger is-light removeBtn is-rounded">
                          <span class="icon"><i class="fas fa-times"></i></span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="field">
                    <button type="button" class="button is-small is-info is-light is-rounded" onclick="agregarEntradaProducto()">
                      <span class="icon"><i class="fas fa-plus"></i></span>
                      <span>Agregar producto</span>
                    </button>
                  </div>
                  <footer class="modal-card-foot mt-5">
                    <button type="submit" class="button is-success is-rounded has-text-weight-bold">
                      <span class="icon"><i class="fas fa-check"></i></span>
                      <span>Confirmar Entrada</span>
                    </button>
                    <button type="button" class="button is-light is-rounded" onclick="document.getElementById('entradaModal').classList.remove('is-active')">
                      <span class="icon"><i class="fas fa-ban"></i></span>
                      <span>Cancelar</span>
                    </button>
                  </footer>
                </form>
              </section>
            </div>
          </div>

          <div class="modal" id="salidaModal">
            <div class="modal-background"></div>
            <div class="modal-card">
              <header class="modal-card-head has-background-danger-light">
                <p class="modal-card-title has-text-danger-dark">
                  <span class="icon mr-2"><i class="fas fa-arrow-alt-circle-up"></i></span>
                  Registrar Salida
                </p>
                <button class="delete" aria-label="close" onclick="document.getElementById('salidaModal').classList.remove('is-active')"></button>
              </header>
              <section class="modal-card-body">
                <form method="POST" action="/inventarios/depositos/${dep.id_dep}/salidas">
                  <div class="field">
                    <label class="label">Observación</label>
                    <div class="control">
                      <input type="text" name="observacion" class="input is-rounded" placeholder="Detalle u observación opcional">
                    </div>
                  </div>
                  <hr>
                  <h4 class="title is-6 mb-3">Productos a Consumir/Despachar:</h4>
                  <div id="salidaProductosContainer">
                    <div class="field is-grouped producto-row mb-3">
                      <div class="control is-expanded">
                        <div class="select is-fullwidth is-rounded">
                          <select name="producto_1" required>
                            ${productos.map(p => `<option value="${p.id_prodDep}">${p.Producto.nombre_prod}</option>`).join('')}
                          </select>
                        </div>
                      </div>
                      <div class="control">
                        <input type="number" name="cantidad_1" min="1" step="any" class="input is-rounded" placeholder="Cantidad" required>
                      </div>
                      <div class="control">
                        <button type="button" class="button is-danger is-light removeBtn is-rounded">
                          <span class="icon"><i class="fas fa-times"></i></span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="field">
                    <button type="button" class="button is-small is-info is-light is-rounded" onclick="agregarSalidaProducto()">
                      <span class="icon"><i class="fas fa-plus"></i></span>
                      <span>Agregar producto</span>
                    </button>
                  </div>
                  <footer class="modal-card-foot mt-5">
                    <button type="submit" class="button is-danger is-rounded has-text-weight-bold">
                      <span class="icon"><i class="fas fa-check"></i></span>
                      <span>Confirmar Salida</span>
                    </button>
                    <button type="button" class="button is-light is-rounded" onclick="document.getElementById('salidaModal').classList.remove('is-active')">
                      <span class="icon"><i class="fas fa-ban"></i></span>
                      <span>Cancelar</span>
                    </button>
                  </footer>
                </form>
              </section>
            </div>
          </div>
        </div>
      </section>

      <script>
        document.addEventListener('DOMContentLoaded', () => {
          (document.querySelectorAll('.notification .delete') || []).forEach(($delete) => {
            const $notification = $delete.parentNode;
            $delete.addEventListener('click', () => {
              $notification.parentNode.removeChild($notification);
            });
          });
        });

        function filtrarStock() {
          const input = document.getElementById('stockFilter');
          const filter = input.value.toLowerCase();
          const rows = document.querySelectorAll('#stockTable tbody tr');
          rows.forEach(row => {
            const prod = row.cells[0].innerText.toLowerCase();
            row.style.display = prod.includes(filter) ? '' : 'none';
          });
        }

        let entradaIndex = 1;
        function agregarEntradaProducto() {
          entradaIndex++;
          const cont = document.getElementById('entradaProductosContainer');
          const newRow = \`
            <div class="field is-grouped producto-row mb-3">
              <div class="control is-expanded">
                <div class="select is-fullwidth is-rounded">
                  <select name="producto_\${entradaIndex}" required>
                    ${productos.map(p => `<option value="${p.id_prodDep}">${p.Producto.nombre_prod}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="control">
                <input type="number" name="cantidad_\${entradaIndex}" min="1" step="any" class="input is-rounded" placeholder="Cantidad" required>
              </div>
              <div class="control">
                <button type="button" class="button is-danger is-light removeBtn is-rounded">
                  <span class="icon"><i class="fas fa-times"></i></span>
                </button>
              </div>
            </div>\`;
          cont.insertAdjacentHTML('beforeend', newRow);
        }

        let salidaIndex = 1;
        function agregarSalidaProducto() {
          salidaIndex++;
          const cont = document.getElementById('salidaProductosContainer');
          const newRow = \`
            <div class="field is-grouped producto-row mb-3">
              <div class="control is-expanded">
                <div class="select is-fullwidth is-rounded">
                  <select name="producto_\${salidaIndex}" required>
                    ${productos.map(p => `<option value="${p.id_prodDep}">${p.Producto.nombre_prod}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="control">
                <input type="number" name="cantidad_\${salidaIndex}" min="1" step="any" class="input is-rounded" placeholder="Cantidad" required>
              </div>
              <div class="control">
                <button type="button" class="button is-danger is-light removeBtn is-rounded">
                  <span class="icon"><i class="fas fa-times"></i></span>
                </button>
              </div>
            </div>\`;
          cont.insertAdjacentHTML('beforeend', newRow);
        }

        document.addEventListener('click', (e) => {
          if (e.target.classList.contains('removeBtn') || e.target.closest('.removeBtn')) {
            e.target.closest('.producto-row').remove();
          }
        });
      </script>
    `
  });
};