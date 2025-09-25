// views/admin/products/compras/remitos/form.js

const layout = require('../../layout');

const getError = (errors, prop) => errors?.[prop] || '';

module.exports = ({ mode, remito, proveedores, depositos, productos = [], estados = [], errors = {} }) => {
  const isNew = mode === 'new';
  const title = isNew ? 'Nuevo Remito' : `Editar Remito #${remito.numero_comp}`;
  const action = isNew ? '/compras/remitos/new' : `/compras/remitos/${remito.id_comp}/edit`;

  // Función para generar CUALQUIER fila de detalle. La usaremos para las filas existentes Y para la plantilla.
  const renderDetailRow = (detalle = {}) => {
    const productOptions = productos.map(p => 
      `<option value="${p.id_prod}" ${detalle.id_prod == p.id_prod ? 'selected' : ''}>
        ${p.nombre_prod}
      </option>`
    ).join('');

    return `
      <tr class="detail-row">
        <td style="width: 40%;">
          <div class="select is-fullwidth is-small">
            <select name="id_prod[]" class="product-select" required>
              <option value="">Seleccionar artículo...</option>
              ${productOptions}
            </select>
          </div>
        </td>
        <td><input class="input is-small cantidad-input" type="number" name="cantidad[]" value="${detalle.cantidad || ''}" step="0.001" min="0.001" placeholder="0.000" required></td>
        <td><input class="input is-small precio-input" type="number" name="precio[]" value="${detalle.precio || ''}" step="0.01" min="0" placeholder="0.00" required></td>
        <td class="subtotal-cell has-text-right has-text-weight-bold">$0.00</td>
        <td><button type="button" class="button is-danger is-light is-small remove-row-btn">×</button></td>
      </tr>
    `;
  };

  const detailRows = (remito.detalles || []).map(renderDetailRow).join('');

  return layout({
    content: `
      <section class="inventory-card">
        <h1 class="title">${title}</h1>
        
        ${getError(errors, 'general') ? `<div class="notification is-danger">${getError(errors, 'general')}</div>` : ''}

        <form method="POST" action="${action}">
          <div class="columns">
            <div class="column"><label class="label">Fecha</label><input class="input" type="date" name="fecha" value="${remito.fecha || new Date().toISOString().split('T')[0]}" required></div>
            <div class="column"><label class="label">Proveedor</label><div class="select is-fullwidth ${getError(errors, 'id_prov') ? 'is-danger' : ''}"><select name="id_prov" required><option value="">Seleccionar...</option>${(proveedores || []).map(p => `<option value="${p.id_prov}" ${remito.id_prov == p.id_prov ? 'selected' : ''}>${p.nombre_prov}</option>`).join('')}</select></div><p class="help is-danger">${getError(errors, 'id_prov')}</p></div>
            <div class="column"><label class="label">Estado</label><div class="select is-fullwidth"><select name="estado">${(estados || []).map(e => `<option value="${e}" ${remito.estado == e ? 'selected' : ''}>${e}</option>`).join('')}</select></div></div>
          </div>
          <div class="columns">
             <div class="column"><label class="label">Depósito</label>${isNew ? `<input class="input" type="text" value="Depósito Central" readonly>`: `<div class="select is-fullwidth"><select name="id_dep">${(depositos || []).map(d => `<option value="${d.id_dep}" ${remito.id_dep == d.id_dep ? 'selected' : ''}>${d.nombre_dep}</option>`).join('')}</select></div>`}</div>
             <div class="column is-half"><label class="label">Número</label><div class="field has-addons"><p class="control"><input class="input" style="width: 50px;" type="text" name="letra_comp" value="${remito.letra_comp || 'R'}" maxlength="1"></p><p class="control"><input class="input" style="width: 80px;" type="text" name="sucursal_comp" value="${remito.sucursal_comp || '0001'}" maxlength="4"></p><p class="control is-expanded"><input class="input" type="text" name="numero_comp" value="${remito.numero_comp || ''}" placeholder="Dejar vacío para nuevo" maxlength="8"></p></div></div>
          </div>
          <div class="columns"><div class="column"><label class="label">Observaciones</label><textarea class="textarea" name="observacion">${remito.observacion || ''}</textarea></div></div>
          
          <hr>
          
          <h2 class="subtitle is-5">Artículos</h2>
          <table class="table is-fullwidth">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th class="has-text-right">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="details-tbody">${detailRows}</tbody>
            <tfoot>
              <tr id="template-row" style="display: none;">
                ${renderDetailRow()}
              </tr>
              <tr>
                <td colspan="3">
                  <button type="button" class="button is-link is-light" id="add-row-btn">
                    <span class="icon is-small"><i class="fas fa-plus"></i></span>
                    <span>Agregar Artículo</span>
                  </button>
                </td>
                <td class="has-text-right has-text-weight-bold is-size-5" id="total-cell">$0.00</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          
          <hr>
          
          <div class="field is-grouped">
            <div class="control"><button class="button is-primary">Guardar</button></div>
            <div class="control"><a href="/compras/remitos" class="button is-light">Cancelar</a></div>
          </div>
        </form>
      </section>

      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const tbody = document.getElementById('details-tbody');
          const addBtn = document.getElementById('add-row-btn');
          const totalCell = document.getElementById('total-cell');
          const templateRow = document.getElementById('template-row');

          // Función central para calcular TODOS los totales
          function updateTotals() {
            let grandTotal = 0;
            tbody.querySelectorAll('.detail-row').forEach(row => {
              const cantidad = parseFloat(row.querySelector('.cantidad-input').value) || 0;
              const precio = parseFloat(row.querySelector('.precio-input').value) || 0;
              const subtotal = cantidad * precio;
              row.querySelector('.subtotal-cell').textContent = '$' + subtotal.toFixed(2);
              grandTotal += subtotal;
            });
            totalCell.textContent = '$' + grandTotal.toFixed(2);
          }

          // ✅ Solución 1: Agregar Artículo
          // Clona la fila plantilla oculta, la hace visible y la agrega a la tabla.
          addBtn.addEventListener('click', () => {
            const newRow = templateRow.cloneNode(true);
            newRow.removeAttribute('id');
            newRow.style.display = 'table-row'; // 'table-row' es el display correcto
            tbody.appendChild(newRow);
          });

          // Se usa 'tbody' para delegación de eventos. Esto asegura que los listeners
          // funcionen tanto para las filas que ya existen como para las nuevas que se agregan.
          tbody.addEventListener('input', (e) => {
            // ✅ Solución 2: Calcular Subtotal
            // Si se cambia la cantidad o el precio, se recalcula todo.
            if (e.target.classList.contains('cantidad-input') || e.target.classList.contains('precio-input')) {
              updateTotals();
            }
          });

          tbody.addEventListener('click', (e) => {
            // ✅ Solución 3: Eliminar Artículo (en modo nuevo Y edición)
            // Si se hace clic en el botón de eliminar, se busca la fila más cercana y se elimina.
            if (e.target.classList.contains('remove-row-btn')) {
              e.target.closest('tr.detail-row').remove();
              updateTotals(); // Se recalcula el total después de eliminar.
            }
          });

          // Llamada inicial para calcular los totales de las filas que ya existen al cargar la página (modo edición).
          updateTotals();
        });
      </script>
    `
  });
};