const layout = require('../../layout');

module.exports = ({ dep, grid, movimientos, depositos, productos, tiposComprobantes, pagination, error }) => {
  const totalProds = pagination?.total || grid.length;
  const bajos = grid.filter(r => r.estado === 'Bajo').length;
  const ultimosMovs = movimientos.length;

  return layout({
    content: `
<section class="section">
  <!-- HEADER -->
  <h1 class="title is-3">Depósito: ${dep.nombre_dep}</h1>
  <p class="subtitle is-5 has-text-grey">
    Tipo: <strong>${dep.TipoDeposito?.nombre_tipoDep || ''}</strong>
  </p>

  <!-- ERROR -->
  ${error ? `
    <div class="notification is-danger is-light">
      ${error}
    </div>
  ` : ''}

  <!-- BOTONES DE ACCIÓN -->
  <div class="mb-5 buttons">
    ${dep.TipoDeposito.nombre_tipoDep === 'Central' ? `
      <button 
        class="button is-link is-medium"
        onclick="document.getElementById('movimientoModal').classList.add('is-active')">
        <span>Registrar Transferencia</span>
      </button>
      <button 
        class="button is-success is-medium"
        onclick="document.getElementById('entradaModal').classList.add('is-active')">
        <span>Registrar Entrada</span>
      </button>
    ` : `
      <button 
        class="button is-danger is-medium"
        onclick="document.getElementById('consumoModal').classList.add('is-active')">
        <span>Registrar Consumo</span>
      </button>
    `}
    <a href="/inventarios/depositos/${dep.id_dep}/parametros" class="button is-warning is-medium">
      <span>⚙️ Parámetros</span>
    </a>
  </div>

  <!-- DASHBOARD STATS -->
  <div class="columns">
    <div class="column">
      <div class="box has-text-centered">
        <p class="heading">Productos</p>
        <p class="title">${totalProds}</p>
      </div>
    </div>
    <div class="column">
      <div class="box has-text-centered">
        <p class="heading">Stock Bajo</p>
        <p class="title has-text-danger">${bajos}</p>
      </div>
    </div>
    <div class="column">
      <div class="box has-text-centered">
        <p class="heading">Últimos Movimientos</p>
        <p class="title">${ultimosMovs}</p>
      </div>
    </div>
  </div>

  <!-- STOCK -->
  <div class="card mb-5">
    <header class="card-header">
      <p class="card-header-title is-size-5">📦 Stock Actual</p>
    </header>
    <div class="card-content">
      <div class="field mb-3">
        <div class="control has-icons-left">
          <input 
            type="text" 
            id="stockFilter" 
            class="input" 
            placeholder="Filtrar productos..." 
            onkeyup="filtrarStock()">
          <span class="icon is-left"><i class="fas fa-search"></i></span>
        </div>
      </div>

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
              <td class="has-text-centered">${r.stock}</td>
              <td class="has-text-right">
                <span class="tag ${r.estado === 'Bajo' ? 'is-danger' : 'is-success'}">${r.estado}</span>
              </td>
            </tr>
          `).join('') : `
            <tr><td colspan="3" class="has-text-centered">Sin productos</td></tr>
          `}
        </tbody>
      </table>

      <!-- Paginación -->
      ${pagination && pagination.pages > 1 ? `
      <nav class="pagination is-centered mt-3" role="navigation">
        <ul class="pagination-list" style="list-style:none; margin:0; padding:0;">
          ${Array.from({ length: pagination.pages }, (_, i) => `
            <li>
              <a href="/inventarios/depositos/${dep.id_dep}?page=${i+1}"
                 class="pagination-link ${pagination.page === i+1 ? 'is-current' : ''}">
                ${i+1}
              </a>
            </li>
          `).join('')}
        </ul>
      </nav>
      ` : ''}
    </div>
  </div>

  <!-- HISTORIAL -->
  <div class="card">
    <header class="card-header">
      <p class="card-header-title is-size-5">📑 Historial de Movimientos</p>
    </header>
    <div class="card-content" style="max-height:400px; overflow-y:auto;">
      <table class="table is-fullwidth is-hoverable is-striped">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Productos</th>
          </tr>
        </thead>
        <tbody>
          ${movimientos.length ? movimientos.map(m => `
            <tr>
              <td>${new Date(m.fecha_mov).toLocaleDateString()}</td>
              <td>
                <span class="tag is-light is-small ${m.TipoMovimiento?.direccion === 'IN' ? 'is-success' : 'is-danger'}">
                  ${m.TipoMovimiento?.nombre || '-'}
                </span>
              </td>
              <td>
                <ul>
                  ${m.Detalles.map(d => `
                    <li>
                      ${d.ProductoDeposito.Producto.nombre_prod} 
                      <span class="has-text-grey">(${d.cantidad})</span>
                    </li>
                  `).join('')}
                </ul>
              </td>
            </tr>
          `).join('') : `
            <tr><td colspan="3" class="has-text-centered">Sin movimientos</td></tr>
          `}
        </tbody>
      </table>
    </div>
  </div>

  <!-- MODAL TRANSFERENCIA -->
  <div class="modal" id="movimientoModal">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Registrar Transferencia</p>
        <button class="delete" aria-label="close" onclick="document.getElementById('movimientoModal').classList.remove('is-active')"></button>
      </header>
      <section class="modal-card-body">
        <form method="POST" action="/inventarios/depositos/${dep.id_dep}/movimientos">
          <div class="field">
            <label class="label">Depósito destino</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select name="id_dep_destino" required>
                  ${depositos.filter(d => d.id_dep !== dep.id_dep).map(d => `
                    <option value="${d.id_dep}">${d.nombre_dep}</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">Observación</label>
            <div class="control">
              <input type="text" name="observacion" class="input" placeholder="Detalle u observación opcional">
            </div>
          </div>

          <div id="productosContainer">
            <div class="field is-grouped producto-row">
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
              <div class="control">
                <button type="button" class="button is-danger is-light removeBtn">✖</button>
              </div>
            </div>
          </div>

          <div class="field">
            <button type="button" class="button is-small" onclick="agregarProducto()">+ Agregar producto</button>
          </div>

          <footer class="modal-card-foot">
            <button type="submit" class="button is-link">Confirmar</button>
            <button type="button" class="button" onclick="document.getElementById('movimientoModal').classList.remove('is-active')">Cancelar</button>
          </footer>
        </form>
      </section>
    </div>
  </div>

  <!-- MODAL ENTRADA -->
  <div class="modal" id="entradaModal">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Registrar Entrada</p>
        <button class="delete" aria-label="close" onclick="document.getElementById('entradaModal').classList.remove('is-active')"></button>
      </header>
      <section class="modal-card-body">
        <form method="POST" action="/inventarios/depositos/${dep.id_dep}/entradas">
          <div class="field">
            <label class="label">Tipo de Comprobante (opcional)</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select name="id_tipoComp">
                  <option value="">-- Ninguno --</option>
                  ${(tiposComprobantes || []).map(tc => `
                    <option value="${tc.id_tipoComp}">${tc.nombre}</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">Observación</label>
            <div class="control">
              <input type="text" name="observacion" class="input" placeholder="Detalle u observación opcional">
            </div>
          </div>

          <div id="entradaProductosContainer">
            <div class="field is-grouped producto-row">
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
              <div class="control">
                <button type="button" class="button is-danger is-light removeBtn">✖</button>
              </div>
            </div>
          </div>

          <div class="field">
            <button type="button" class="button is-small" onclick="agregarEntradaProducto()">+ Agregar producto</button>
          </div>

          <footer class="modal-card-foot">
            <button type="submit" class="button is-success">Confirmar Entrada</button>
            <button type="button" class="button" onclick="document.getElementById('entradaModal').classList.remove('is-active')">Cancelar</button>
          </footer>
        </form>
      </section>
    </div>
  </div>

  <!-- MODAL CONSUMO -->
  <div class="modal" id="consumoModal">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Registrar Consumo</p>
        <button class="delete" aria-label="close" onclick="document.getElementById('consumoModal').classList.remove('is-active')"></button>
      </header>
      <section class="modal-card-body">
        <form method="POST" action="/inventarios/depositos/${dep.id_dep}/consumos">
          <div class="field">
            <label class="label">Observación</label>
            <div class="control">
              <input type="text" name="observacion" class="input" placeholder="Detalle u observación opcional">
            </div>
          </div>

          <div id="consumoProductosContainer">
            <div class="field is-grouped producto-row">
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
              <div class="control">
                <button type="button" class="button is-danger is-light removeBtn">✖</button>
              </div>
            </div>
          </div>

          <div class="field">
            <button type="button" class="button is-small" onclick="agregarConsumoProducto()">+ Agregar producto</button>
          </div>

          <footer class="modal-card-foot">
            <button type="submit" class="button is-danger">Confirmar Consumo</button>
            <button type="button" class="button" onclick="document.getElementById('consumoModal').classList.remove('is-active')">Cancelar</button>
          </footer>
        </form>
      </section>
    </div>
  </div>

  <!-- SCRIPTS -->
  <script>
    function filtrarStock() {
      const input = document.getElementById('stockFilter');
      const filter = input.value.toLowerCase();
      const rows = document.querySelectorAll('#stockTable tbody tr');
      rows.forEach(row => {
        const prod = row.cells[0].innerText.toLowerCase();
        row.style.display = prod.includes(filter) ? '' : 'none';
      });
    }

    let prodIndex = 1;
    function agregarProducto() {
      prodIndex++;
      const cont = document.getElementById('productosContainer');
      cont.insertAdjacentHTML('beforeend', \`
        <div class="field is-grouped mt-2 producto-row">
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
          <div class="control">
            <button type="button" class="button is-danger is-light removeBtn">✖</button>
          </div>
        </div>\`);
    }

    let entradaIndex = 1;
    function agregarEntradaProducto() {
      entradaIndex++;
      const cont = document.getElementById('entradaProductosContainer');
      cont.insertAdjacentHTML('beforeend', \`
        <div class="field is-grouped mt-2 producto-row">
          <div class="control is-expanded">
            <div class="select is-fullwidth">
              <select name="producto_\${entradaIndex}" required>
                ${productos.map(p => `<option value="${p.id_prodDep}">${p.nombre}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="control">
            <input type="number" name="cantidad_\${entradaIndex}" min="1" class="input" placeholder="Cantidad" required>
          </div>
          <div class="control">
            <button type="button" class="button is-danger is-light removeBtn">✖</button>
          </div>
        </div>\`);
    }

    let consumoIndex = 1;
    function agregarConsumoProducto() {
      consumoIndex++;
      const cont = document.getElementById('consumoProductosContainer');
      cont.insertAdjacentHTML('beforeend', \`
        <div class="field is-grouped mt-2 producto-row">
          <div class="control is-expanded">
            <div class="select is-fullwidth">
              <select name="producto_\${consumoIndex}" required>
                ${productos.map(p => `<option value="${p.id_prodDep}">${p.nombre}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="control">
            <input type="number" name="cantidad_\${consumoIndex}" min="1" class="input" placeholder="Cantidad" required>
          </div>
          <div class="control">
            <button type="button" class="button is-danger is-light removeBtn">✖</button>
          </div>
        </div>\`);
    }

    // 🗑️ Eliminar fila de producto (para todos los modales)
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('removeBtn')) {
        e.target.closest('.producto-row').remove();
      }
    });
  </script>
</section>
`
  });
};
