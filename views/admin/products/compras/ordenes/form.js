const layout = require('../../layout');

const getError = (errors, prop) => errors?.[prop] || '';

module.exports = ({ mode, orden, proveedores, productos = [], formasPago = [], estados = [], errors = {} }) => {
  const isNew = mode === 'new';
  const title = isNew ? 'Nueva Orden de Compra' : `Editar Orden #${orden.numero_comp}`;
  const action = isNew ? '/compras/ordenes/new' : `/compras/ordenes/${orden.id_comp}/edit`;

  // Render fila de detalle
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
            <select name="id_prod[]" required>
              <option value="">Seleccionar artículo...</option>
              ${productOptions}
            </select>
          </div>
        </td>
        <td>
          <input class="input is-small cantidad-input" type="number" name="cantidad[]" 
                 value="${detalle.cantidad || ''}" step="0.001" min="0.001" required>
        </td>
        <td>
          <input class="input is-small precio-input" type="number" name="precio[]" 
                 value="${detalle.precio || ''}" step="0.01" min="0" required>
        </td>
        <td class="subtotal-cell has-text-right has-text-weight-bold">$0.00</td>
        <td>
          <button type="button" class="button is-danger is-light is-small remove-row-btn">×</button>
        </td>
      </tr>
    `;
  };

  const detailRows = (orden.detalles || []).map(renderDetailRow).join('');

  return layout({
    content: `
      <section class="inventory-card">
        <h1 class="title">${title}</h1>

        ${getError(errors, 'general') ? `<div class="notification is-danger">${getError(errors, 'general')}</div>` : ''}

        <form method="POST" action="${action}">
          <div class="columns">
            <div class="column">
              <label class="label">Fecha</label>
              <input class="input" type="date" name="fecha" 
                     value="${orden.fecha || new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="column">
              <label class="label">Proveedor</label>
              <div class="select is-fullwidth ${getError(errors, 'id_prov') ? 'is-danger' : ''}">
                <select name="id_prov" required>
                  <option value="">Seleccionar...</option>
                  ${(proveedores || []).map(p => 
                    `<option value="${p.id_prov}" ${orden.id_prov == p.id_prov ? 'selected' : ''}>
                      ${p.nombre_prov}
                    </option>`
                  ).join('')}
                </select>
              </div>
              <p class="help is-danger">${getError(errors, 'id_prov')}</p>
            </div>
            <div class="column">
              <label class="label">Estado</label>
              <div class="select is-fullwidth">
                <select name="estado">
                  ${(estados || [])
                    .filter(e => !(isNew && e === 'ANULADA')) // No mostrar "Anulada" en alta
                    .map(e => `<option value="${e}" ${orden.estado == e ? 'selected' : ''}>${e}</option>`)
                    .join('')}
                </select>
              </div>
            </div>
          </div>

          <div class="columns">
            <div class="column is-half">
              <label class="label">Número</label>
              <div class="field has-addons">
                <p class="control">
                  <div class="select">
                    <select name="letra_comp" required>
                      <option value="A" ${orden.letra_comp === 'A' ? 'selected' : ''}>A</option>
                      <option value="B" ${orden.letra_comp === 'B' ? 'selected' : ''}>B</option>
                      <option value="C" ${orden.letra_comp === 'C' ? 'selected' : ''}>C</option>
                    </select>
                  </div>
                </p>
                <p class="control">
                  <input class="input" style="width: 80px;" type="text" name="sucursal_comp"
                         value="${orden.sucursal_comp || '0001'}" maxlength="4">
                </p>
                <p class="control is-expanded">
                  <input class="input" type="text" name="numero_comp" value="${orden.numero_comp || ''}"
                         placeholder="Dejar vacío para nuevo" maxlength="8">
                </p>
              </div>
            </div>

            <div class="column">
              <label class="label">Forma de Pago</label>
              <div class="select is-fullwidth">
                <select name="id_fp">
                  <option value="">Seleccionar...</option>
                  ${(formasPago || []).map(fp => 
                    `<option value="${fp.id_fp}" ${orden.id_fp == fp.id_fp ? 'selected' : ''}>
                      ${fp.nombre}
                    </option>`
                  ).join('')}
                </select>
              </div>
            </div>
          </div>

          <div class="columns">
            <div class="column">
              <label class="label">Observaciones</label>
              <textarea class="textarea" name="observacion">${orden.observacion || ''}</textarea>
            </div>
          </div>

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
            <div class="control"><a href="/compras/ordenes" class="button is-light">Cancelar</a></div>
          </div>
        </form>
      </section>

      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const tbody = document.getElementById('details-tbody');
          const addBtn = document.getElementById('add-row-btn');
          const totalCell = document.getElementById('total-cell');

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

          function updateTotals() {
            let grandTotal = 0;
            tbody.querySelectorAll('.detail-row').forEach(row => {
              const cantidad = parseFloat(row.querySelector('.cantidad-input')?.value) || 0;
              const precio = parseFloat(row.querySelector('.precio-input')?.value) || 0;
              const subtotal = cantidad * precio;
              row.querySelector('.subtotal-cell').textContent = formatARS(subtotal);
              grandTotal += subtotal;
            });
            totalCell.textContent = formatARS(grandTotal);
          }

          // ➕ Agregar fila
          addBtn.addEventListener('click', () => {
            const newRowHtml = \`${renderDetailRow()}\`;
            tbody.insertAdjacentHTML('beforeend', newRowHtml);
            updateTotals();
          });

          // 🖊️ Recalcular totales al editar
          tbody.addEventListener('input', (e) => {
            if (e.target.classList.contains('cantidad-input') || e.target.classList.contains('precio-input')) {
              updateTotals();
            }
          });

          // ❌ Eliminar fila
          tbody.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-row-btn')) {
              e.target.closest('tr.detail-row').remove();
              updateTotals();
            }
          });

          // Calcular al inicio
          updateTotals();
        });
      </script>
    `
  });
};
