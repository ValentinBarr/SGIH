const layout = require('../../layout');

module.exports = ({ dep, productosDeposito, productos }) => {
  return layout({
    content: `
      <link rel="stylesheet" href="/css/parametros.css" />
      
      <section class="section">
        <div class="container is-max-desktop">
          
          <div class="box p-5 mb-6 has-background-white">
            <div class="level is-mobile mb-4">
              <div class="level-left">
                <div class="level-item">
                  <h1 class="title is-3 is-capitalized mb-0">
                    <span class="icon-text">
                      <span class="icon"><i class="fas fa-cog"></i></span>
                      <span>Parámetros de Depósito</span>
                    </span>
                  </h1>
                </div>
              </div>
              <div class="level-right">
                <div class="level-item">
                  <a href="/inventarios/depositos/${dep.id_dep}" class="button is-link is-normal has-text-weight-bold">
                    <span class="icon is-small"><i class="fas fa-arrow-left"></i></span>
                    <span>Volver al Depósito</span>
                  </a>
                </div>
              </div>
            </div>
            <p class="subtitle is-6 has-text-grey">
              Configura los umbrales de stock, lotes de reposición y ubicaciones para los productos en este depósito.
            </p>
            <hr class="my-3">
            <div class="buttons is-centered">
              <button 
                type="button" 
                class="button is-success is-normal has-text-weight-bold" 
                onclick="document.getElementById('addProductoModal').classList.add('is-active')">
                <span class="icon is-small"><i class="fas fa-plus"></i></span>
                <span>Agregar Producto</span>
              </button>
            </div>
          </div>
          
          <div class="box mb-6 has-background-white">
            <h2 class="title is-5">Productos Configurados</h2>
            <p class="subtitle is-6 has-text-grey">
              Edita los valores directamente en la tabla y haz clic en "Guardar Cambios" para actualizar.
            </p>

            <div class="field mb-5">
              <div class="control has-icons-left">
                <input 
                  type="text" 
                  id="paramFilter" 
                  class="input is-medium is-rounded" 
                  placeholder="Filtrar productos..." 
                  onkeyup="filtrarParametros()">
                <span class="icon is-left is-medium"><i class="fas fa-search"></i></span>
              </div>
            </div>

            <form method="POST" action="/inventarios/depositos/${dep.id_dep}/parametros/update">
              <div class="table-container">
                <table class="table is-fullwidth is-hoverable is-striped" id="paramTable">
                  <thead>
                    <tr>
                      <th class="has-text-grey">Producto</th>
                      <th class="has-text-grey">Mínimo</th>
                      <th class="has-text-grey">Máximo</th>
                      <th class="has-text-grey">Lote Reposición</th>
                      <th class="has-text-grey">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productosDeposito.length ? productosDeposito.map(pd => `
                      <tr>
                        <td>${pd.Producto.nombre_prod}</td>
                        <td><input class="input is-small is-rounded" type="number" step="0.001" name="minimo_${pd.id_prodDep}" value="${pd.minimo_prodDep || ''}"></td>
                        <td><input class="input is-small is-rounded" type="number" step="0.001" name="maximo_${pd.id_prodDep}" value="${pd.maximo_prodDep || ''}"></td>
                        <td><input class="input is-small is-rounded" type="number" step="0.001" name="lote_${pd.id_prodDep}" value="${pd.loteReposicion_prodDep || ''}"></td>
                        <td><input class="input is-small is-rounded" type="text" name="ubicacion_${pd.id_prodDep}" value="${pd.ubicacion_prodDep || ''}"></td>
                      </tr>
                    `).join('') : `
                      <tr><td colspan="5" class="has-text-centered has-text-grey py-5">No hay productos configurados para este depósito.</td></tr>
                    `}
                  </tbody>
                </table>
              </div>
              <div class="mt-5 has-text-right">
                <button type="submit" class="button is-primary is-normal has-text-weight-bold">
                  <span class="icon is-small"><i class="fas fa-save"></i></span>
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </section>

      <div class="modal" id="addProductoModal">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head has-background-success-light">
            <p class="modal-card-title has-text-success-dark">
              <span class="icon mr-2"><i class="fas fa-plus"></i></span>
              Agregar Producto al Depósito
            </p>
            <button class="delete" aria-label="close" onclick="document.getElementById('addProductoModal').classList.remove('is-active')"></button>
          </header>
          <section class="modal-card-body">
            <form method="POST" action="/inventarios/depositos/${dep.id_dep}/parametros/add">
              <div class="field">
                <label class="label">Producto</label>
                <div class="control">
                  <div class="select is-fullwidth is-rounded">
                    <select name="id_prod" required>
                      ${productos.map(p => `
                        <option value="${p.id_prod}">${p.nombre_prod}</option>
                      `).join('')}
                    </select>
                  </div>
                </div>
              </div>
              <div class="field">
                <label class="label">Mínimo</label>
                <div class="control">
                  <input class="input is-rounded" type="number" step="0.001" name="minimo" required>
                </div>
              </div>
              <div class="field">
                <label class="label">Máximo (opcional)</label>
                <div class="control">
                  <input class="input is-rounded" type="number" step="0.001" name="maximo">
                </div>
              </div>
              <div class="field">
                <label class="label">Lote Reposición (opcional)</label>
                <div class="control">
                  <input class="input is-rounded" type="number" step="0.001" name="lote">
                </div>
              </div>
              <div class="field">
                <label class="label">Ubicación (opcional)</label>
                <div class="control">
                  <input class="input is-rounded" type="text" name="ubicacion">
                </div>
              </div>
              <footer class="modal-card-foot">
                <button type="submit" class="button is-success has-text-weight-bold">
                  <span class="icon"><i class="fas fa-check"></i></span>
                  <span>Confirmar</span>
                </button>
                <button type="button" class="button is-light" onclick="document.getElementById('addProductoModal').classList.remove('is-active')">
                  <span class="icon"><i class="fas fa-ban"></i></span>
                  <span>Cancelar</span>
                </button>
              </footer>
            </form>
          </section>
        </div>
      </div>

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
    `
  });
};