const layout = require('../../layout');

module.exports = ({ dep, grid, movimientos, depositos, productos }) => {
  return layout({
    content: `
<section class="section">
  <h1 class="title">Depósito: ${dep.nombre_dep}</h1>
  <p class="subtitle">Tipo: ${dep.TipoDeposito?.nombre_tipoDep || ''}</p>

  <!-- Botón Registrar Movimiento -->
  <div class="mb-4">
    <button 
      class="button is-primary"
      onclick="document.getElementById('movimientoModal').classList.add('is-active')">
      Registrar Movimiento
    </button>
  </div>

  <div class="columns mt-4">
    <!-- STOCK -->
    <div class="column is-half">
      <div class="card">
        <header class="card-header">
          <p class="card-header-title">Stock Actual</p>
        </header>
        <div class="card-content">
          <table class="table is-fullwidth is-striped">
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
                  <td class="has-text-centered">${r.stock}</td>
                  <td class="has-text-right">
                    <span class="tag ${r.estado === 'Bajo' ? 'is-danger' : 'is-success'}">
                      ${r.estado}
                    </span>
                  </td>
                </tr>
              `).join('') : `
                <tr><td colspan="3" class="has-text-centered">Sin productos</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- HISTORIAL -->
    <div class="column is-half">
      <div class="card">
        <header class="card-header">
          <p class="card-header-title">Historial de Movimientos</p>
        </header>
        <div class="card-content">
          <table class="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Productos</th>
              </tr>
            </thead>
            <tbody>
              ${movimientos.length ? movimientos.map(m => `
                <tr>
                  <td>${new Date(m.fecha).toLocaleDateString()}</td>
                  <td>
                    <ul>
                      ${m.Detalles.map(d => `
                        <li>${d.ProductoDeposito.Producto.nombre_prod} (${d.cantidad})</li>
                      `).join('')}
                    </ul>
                  </td>
                </tr>
              `).join('') : `
                <tr><td colspan="2" class="has-text-centered">Sin movimientos</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL -->
  <div class="modal" id="movimientoModal">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Registrar ${dep.TipoDeposito.nombre_tipoDep === 'Central' ? 'Transferencia' : 'Consumo Interno'}</p>
        <button class="delete" aria-label="close" onclick="document.getElementById('movimientoModal').classList.remove('is-active')"></button>
      </header>
      <section class="modal-card-body">
        <form method="POST" action="/inventarios/depositos/${dep.id_dep}/movimientos">
          ${dep.TipoDeposito.nombre_tipoDep === 'Central' ? `
            <div class="field">
              <label class="label">Depósito destino</label>
              <div class="control">
                <div class="select">
                  <select name="id_dep_destino" required>
                    ${depositos.filter(d => d.id_dep !== dep.id_dep).map(d => `
                      <option value="${d.id_dep}">${d.nombre_dep}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
            </div>
          ` : ''}

          <div id="productosContainer">
            <div class="field is-grouped">
              <div class="control is-expanded">
                <div class="select is-fullwidth">
                  <select name="producto_1" required>
                    ${productos.map(p => `<option value="${p.id_prodDep}">${p.nombre}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="control">
                <input type="number" name="cantidad_1" min="1" class="input" placeholder="Cantidad" required>
              </div>
            </div>
          </div>

          <div class="field">
            <button type="button" class="button is-small" onclick="agregarProducto()">+ Agregar producto</button>
          </div>

          <footer class="modal-card-foot">
            <button type="submit" class="button is-primary">Confirmar</button>
            <button type="button" class="button" onclick="document.getElementById('movimientoModal').classList.remove('is-active')">Cancelar</button>
          </footer>
        </form>
      </section>
    </div>
  </div>

  <script>
    let prodIndex = 1;
    function agregarProducto() {
      prodIndex++;
      const cont = document.getElementById('productosContainer');
      cont.insertAdjacentHTML('beforeend', \`
        <div class="field is-grouped">
          <div class="control is-expanded">
            <div class="select is-fullwidth">
              <select name="producto_\${prodIndex}" required>
                ${productos.map(p => `<option value="${p.id_prodDep}">${p.nombre}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="control">
            <input type="number" name="cantidad_\${prodIndex}" min="1" class="input" placeholder="Cantidad" required>
          </div>
        </div>\`);
    }
  </script>
</section>
`
  });
};
