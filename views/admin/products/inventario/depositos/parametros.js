const layout = require('../../layout');

module.exports = ({ dep, productosDeposito, productos }) => {
  return layout({
    content: `
<section class="section">
  <div class="container">
    <div class="card" style="border-radius: 12px;">
      <header class="card-header">
        <p class="card-header-title is-size-4">
          ⚙️ Parámetros de productos - ${dep.nombre_dep}
        </p>
      </header>
      <div class="card-content">

        <p class="subtitle is-6 has-text-grey mb-4">
          Configura los mínimos, máximos, lote de reposición y ubicación de los productos en este depósito.
        </p>

        <!-- BLOQUE: EXISTENTES -->
        <div class="box" style="border-radius: 12px;">
          <h2 class="title is-5">Productos configurados</h2>

          <!-- Filtro -->
          <div class="field mb-3">
            <div class="control has-icons-left">
              <input 
                type="text" 
                id="paramFilter" 
                class="input" 
                placeholder="Filtrar productos..." 
                onkeyup="filtrarParametros()">
              <span class="icon is-left"><i class="fas fa-search"></i></span>
            </div>
          </div>

          <form method="POST" action="/inventarios/depositos/${dep.id_dep}/parametros/update">
            <div class="table-container">
              <table class="table is-fullwidth is-hoverable is-striped" id="paramTable">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                    <th>Lote Reposición</th>
                    <th>Ubicación</th>
                  </tr>
                </thead>
                <tbody>
                  ${productosDeposito.length ? productosDeposito.map(pd => `
                    <tr>
                      <td>${pd.Producto.nombre_prod}</td>
                      <td><input class="input is-small" type="number" step="0.001" name="minimo_${pd.id_prodDep}" value="${pd.minimo_prodDep || ''}"></td>
                      <td><input class="input is-small" type="number" step="0.001" name="maximo_${pd.id_prodDep}" value="${pd.maximo_prodDep || ''}"></td>
                      <td><input class="input is-small" type="number" step="0.001" name="lote_${pd.id_prodDep}" value="${pd.loteReposicion_prodDep || ''}"></td>
                      <td><input class="input is-small" type="text" name="ubicacion_${pd.id_prodDep}" value="${pd.ubicacion_prodDep || ''}"></td>
                    </tr>
                  `).join('') : `
                    <tr><td colspan="5" class="has-text-centered">No hay productos configurados</td></tr>
                  `}
                </tbody>
              </table>
            </div>
            <div class="mt-3">
              <button type="submit" class="button is-primary">💾 Guardar Cambios</button>
              <a href="/inventarios/depositos/${dep.id_dep}" class="button is-light">⬅ Volver</a>
              <button 
                type="button" 
                class="button is-success" 
                onclick="document.getElementById('addProductoModal').classList.add('is-active')">
                ➕ Agregar Producto
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  </div>

  <!-- MODAL AGREGAR PRODUCTO -->
  <div class="modal" id="addProductoModal">
    <div class="modal-background"></div>
    <div class="modal-card" style="border-radius:12px;">
      <header class="modal-card-head">
        <p class="modal-card-title">➕ Agregar producto al depósito</p>
        <button class="delete" aria-label="close" 
          onclick="document.getElementById('addProductoModal').classList.remove('is-active')"></button>
      </header>
      <section class="modal-card-body">
        <form method="POST" action="/inventarios/depositos/${dep.id_dep}/parametros/add">
          <div class="field">
            <label class="label">Producto</label>
            <div class="select is-fullwidth">
              <select name="id_prod" required>
                ${productos.map(p => `
                  <option value="${p.id_prod}">${p.nombre_prod}</option>
                `).join('')}
              </select>
            </div>
          </div>
          <div class="field">
            <label class="label">Mínimo</label>
            <input class="input" type="number" step="0.001" name="minimo" required>
          </div>
          <div class="field">
            <label class="label">Máximo</label>
            <input class="input" type="number" step="0.001" name="maximo">
          </div>
          <div class="field">
            <label class="label">Lote Reposición</label>
            <input class="input" type="number" step="0.001" name="lote">
          </div>
          <div class="field">
            <label class="label">Ubicación</label>
            <input class="input" type="text" name="ubicacion">
          </div>
          <footer class="modal-card-foot">
            <button type="submit" class="button is-success">Confirmar</button>
            <button type="button" class="button" onclick="document.getElementById('addProductoModal').classList.remove('is-active')">Cancelar</button>
          </footer>
        </form>
      </section>
    </div>
  </div>

  <!-- SCRIPTS -->
  <script>
    function filtrarParametros() {
      const input = document.getElementById('paramFilter');
      const filter = input.value.toLowerCase();
      const rows = document.querySelectorAll('#paramTable tbody tr');
      rows.forEach(row => {
        const prod = row.cells[0]?.innerText.toLowerCase() || '';
        row.style.display = prod.includes(filter) ? '' : 'none';
      });
    }
  </script>
</section>
`
  });
};
