const layout = require('../../layout');

module.exports = ({ basePath, filters = {}, movimientos = [], productos = [] }) => {
  return layout({
    content: `
<section class="section">
  <h1 class="title is-3">Movimientos</h1>

  <!-- FILTROS -->
  <form method="GET" action="${basePath}" class="box mb-5">
    <div class="columns is-multiline is-vcentered">
      <div class="column is-3">
        <label class="label">Buscar</label>
        <input class="input" type="text" name="q" value="${filters.q || ''}" placeholder="Texto libre...">
      </div>
      <div class="column is-2">
        <label class="label">Dirección</label>
        <div class="select is-fullwidth">
          <select name="direccion">
            <option value="">Todas</option>
            <option value="IN" ${filters.direccion === 'IN' ? 'selected' : ''}>Entrada</option>
            <option value="OUT" ${filters.direccion === 'OUT' ? 'selected' : ''}>Salida</option>
          </select>
        </div>
      </div>
      <div class="column is-2">
        <label class="label">Desde</label>
        <input class="input" type="date" name="from" value="${filters.from || ''}">
      </div>
      <div class="column is-2">
        <label class="label">Hasta</label>
        <input class="input" type="date" name="to" value="${filters.to || ''}">
      </div>
      <div class="column is-3 is-flex is-align-items-end">
        <button type="submit" class="button is-link mr-2">Filtrar</button>
        <a href="${basePath}" class="button is-light">Limpiar</a>
      </div>
    </div>
  </form>

  <!-- TABLA DE MOVIMIENTOS -->
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Listado de movimientos</p>
    </header>
    <div class="card-content">
      <table class="table is-fullwidth is-hoverable is-striped">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Depósito</th>
            <th>Observación</th>
          </tr>
        </thead>
        <tbody>
          ${movimientos.length
            ? movimientos.map(m => `
              <tr onclick="verMovimiento(${m.id_mov})" style="cursor:pointer;">
                <td>${new Date(m.fecha_mov).toLocaleString()}</td>
                <td>
                  <span class="tag ${m.TipoMovimiento?.direccion === 'IN' ? 'is-success' : 'is-danger'}">
                    ${m.TipoMovimiento?.nombre || '-'}
                  </span>
                </td>
                <td>${m.Deposito?.nombre_dep || '-'}</td>
                <td>${m.observacion || '-'}</td>
              </tr>
            `).join('')
            : `<tr><td colspan="4" class="has-text-centered">No hay movimientos</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>

  <!-- MODAL DETALLE -->
  <div class="modal" id="movDetalleModal">
    <div class="modal-background" onclick="cerrarModal()"></div>
    <div class="modal-card" style="max-width: 600px; width: 95%;">
      <header class="modal-card-head">
        <p class="modal-card-title">Detalle del movimiento</p>
        <button class="delete" aria-label="close" onclick="cerrarModal()"></button>
      </header>
      <section class="modal-card-body" id="movDetalleContent" style="max-height: 65vh; overflow-y: auto;">
        <p class="has-text-centered has-text-grey">Selecciona un movimiento</p>
      </section>
      <footer class="modal-card-foot">
        <button class="button" onclick="cerrarModal()">Cerrar</button>
      </footer>
    </div>
  </div>

  <script>
    async function verMovimiento(id) {
      const modal = document.getElementById('movDetalleModal');
      const content = document.getElementById('movDetalleContent');
      modal.classList.add('is-active');
      content.innerHTML = '<p class="has-text-centered has-text-grey">Cargando...</p>';

      try {
        const res = await fetch('/inventarios/movimientos/' + id);
        if (!res.ok) throw new Error('Error al obtener el movimiento');
        const mov = await res.json();

        content.innerHTML = \`
          <div>
            <p><strong>Fecha:</strong> \${new Date(mov.fecha_mov).toLocaleString()}</p>
            <p><strong>Tipo:</strong> \${mov.TipoMovimiento?.nombre || '-'}</p>
            <p><strong>Depósito:</strong> \${mov.Deposito?.nombre_dep || '-'}</p>
            <p><strong>Observación:</strong> \${mov.observacion || '-'}</p>
          </div>

          <hr>

          <h2 class="title is-6">Productos</h2>
          \${mov.Detalles && mov.Detalles.length
            ? \`
              <table class="table is-fullwidth is-narrow is-striped">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  \${mov.Detalles.map(d => \`
                    <tr>
                      <td>\${d.ProductoDeposito.Producto.nombre_prod}</td>
                      <td>\${d.cantidad}</td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            \`
            : '<p class="has-text-grey">Sin productos</p>'}
        \`;
      } catch (err) {
        content.innerHTML = '<p class="has-text-danger">Error al cargar detalle</p>';
      }
    }

    function cerrarModal() {
      document.getElementById('movDetalleModal').classList.remove('is-active');
    }
  </script>
</section>
`
  });
};
