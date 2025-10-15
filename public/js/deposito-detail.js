document.addEventListener('DOMContentLoaded', () => {
  // Script para el cierre del mensaje de error
  (document.querySelectorAll('.notification .delete') || []).forEach(($delete) => {
    const $notification = $delete.parentNode;
    $delete.addEventListener('click', () => {
      $notification.parentNode.removeChild($notification);
    });
  });
});

/**
 * Filtra la tabla de stock en tiempo real basándose en la entrada del usuario.
 */
function filtrarStock() {
  const input = document.getElementById('stockFilter');
  const filter = input.value.toLowerCase();
  const rows = document.querySelectorAll('#stockTable tbody tr');
  rows.forEach(row => {
    const prod = row.cells[0].innerText.toLowerCase();
    row.style.display = prod.includes(filter) ? '' : 'none';
  });
}

/**
 * Agrega una nueva fila de producto al modal de entrada.
 */
let entradaIndex = 1;
function agregarEntradaProducto() {
  entradaIndex++;
  const cont = document.getElementById('entradaProductosContainer');
  const newRow = `
    <div class="field is-grouped producto-row mb-3 animate__animated animate__fadeIn">
      <div class="control is-expanded">
        <div class="select is-fullwidth is-rounded">
          <select name="producto_${entradaIndex}" required>
            ${productos.map(p => `<option value="${p.id_prodDep}">${p.Producto.nombre_prod}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="control">
        <input type="number" name="cantidad_${entradaIndex}" min="1" step="any" class="input is-rounded" placeholder="Cantidad" required>
      </div>
      <div class="control">
        <button type="button" class="button is-danger is-light removeBtn is-rounded">
          <span class="icon"><i class="fas fa-times"></i></span>
        </button>
      </div>
    </div>`;
  cont.insertAdjacentHTML('beforeend', newRow);
}

/**
 * Agrega una nueva fila de producto al modal de salida.
 */
let salidaIndex = 1;
function agregarSalidaProducto() {
  salidaIndex++;
  const cont = document.getElementById('salidaProductosContainer');
  const newRow = `
    <div class="field is-grouped producto-row mb-3 animate__animated animate__fadeIn">
      <div class="control is-expanded">
        <div class="select is-fullwidth is-rounded">
          <select name="producto_${salidaIndex}" required>
            ${productos.map(p => `<option value="${p.id_prodDep}">${p.Producto.nombre_prod}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="control">
        <input type="number" name="cantidad_${salidaIndex}" min="1" step="any" class="input is-rounded" placeholder="Cantidad" required>
      </div>
      <div class="control">
        <button type="button" class="button is-danger is-light removeBtn is-rounded">
          <span class="icon"><i class="fas fa-times"></i></span>
        </button>
      </div>
    </div>`;
  cont.insertAdjacentHTML('beforeend', newRow);
}

/**
 * Maneja la eliminación de filas de productos en los modales de entrada y salida.
 */
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('removeBtn') || e.target.closest('.removeBtn')) {
    e.target.closest('.producto-row').remove();
  }
});