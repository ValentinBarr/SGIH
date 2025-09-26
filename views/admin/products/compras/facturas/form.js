const layout = require('../../layout');
const getError = (errors, prop) => errors?.[prop] || '';

module.exports = ({ mode, factura, proveedores, productos = [], formasPago = [], estados = [], errors = {} }) => {
  const isNew = mode === 'new';
  const title = isNew ? 'Nueva Factura' : `Editar Factura #${factura.numero_comp}`;
  const action = isNew ? '/compras/facturas/new' : `/compras/facturas/${factura.id_comp}/edit`;

  // Render detalle
  const renderDetailRow = (detalle = {}) => {
    const productOptions = productos.map(p => 
      `<option value="${p.id_prod}" ${detalle.id_prod == p.id_prod ? 'selected' : ''}>
        ${p.nombre_prod}
      </option>`
    ).join('');
    return `
      <tr class="detail-row">
        <td><select name="id_prod[]" required><option value="">Artículo...</option>${productOptions}</select></td>
        <td><input class="input is-small cantidad-input" type="number" name="cantidad[]" value="${detalle.cantidad || ''}" step="0.001" min="0.001" required></td>
        <td><input class="input is-small precio-input" type="number" name="precio[]" value="${detalle.precio || ''}" step="0.01" min="0" required></td>
        <td class="subtotal-cell has-text-right has-text-weight-bold">$0.00</td>
        <td><button type="button" class="button is-danger is-light is-small remove-row-btn">×</button></td>
      </tr>
    `;
  };

  const detailRows = (factura.detalles || []).map(renderDetailRow).join('');

  return layout({
    content: `
      <section class="inventory-card">
        <h1 class="title">${title}</h1>
        ${getError(errors, 'general') ? `<div class="notification is-danger">${getError(errors, 'general')}</div>` : ''}
        <form method="POST" action="${action}">
          <div class="columns">
            <div class="column">
              <label class="label">Fecha</label>
              <input class="input" type="date" name="fecha" value="${factura.fecha || new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="column">
              <label class="label">Proveedor</label>
              <div class="select is-fullwidth">
                <select name="id_prov" required>
                  <option value="">Seleccionar...</option>
                  ${proveedores.map(p => `<option value="${p.id_prov}" ${factura.id_prov == p.id_prov ? 'selected' : ''}>${p.nombre_prov}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="column">
              <label class="label">Estado</label>
              <div class="select is-fullwidth">
                <select name="estado">
                  ${estados.map(e => `<option value="${e}" ${factura.estado == e ? 'selected' : ''}>${e}</option>`).join('')}
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
                      <option value="A" ${factura.letra_comp === 'A' ? 'selected' : ''}>A</option>
                      <option value="B" ${factura.letra_comp === 'B' ? 'selected' : ''}>B</option>
                      <option value="C" ${factura.letra_comp === 'C' ? 'selected' : ''}>C</option>
                    </select>
                  </div>
                </p>
                <p class="control">
                  <input class="input" style="width: 80px;" type="text" name="sucursal_comp"
                         value="${factura.sucursal_comp || '0001'}" maxlength="4">
                </p>
                <p class="control is-expanded">
                  <input class="input" type="text" name="numero_comp" value="${factura.numero_comp || ''}"
                         placeholder="Dejar vacío para nuevo" maxlength="8">
                </p>
              </div>
            </div>

            <div class="column">
              <label class="label">Forma de Pago</label>
              <div class="select is-fullwidth">
                <select name="id_fp">
                  <option value="">Seleccionar...</option>
                  ${formasPago.map(fp => `<option value="${fp.id_fp}" ${factura.id_fp == fp.id_fp ? 'selected' : ''}>${fp.nombre}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          <label class="label">Observaciones</label>
          <textarea class="textarea" name="observacion">${factura.observacion || ''}</textarea>

          <hr>
          <h2 class="subtitle is-5">Artículos</h2>
          <table class="table is-fullwidth">
            <thead>
              <tr><th>Artículo</th><th>Cantidad</th><th>Precio Unit.</th><th class="has-text-right">Subtotal</th><th></th></tr>
            </thead>
            <tbody id="details-tbody">${detailRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="3">
                  <button type="button" class="button is-link is-light" id="add-row-btn">Agregar Artículo</button>
                </td>
                <td id="total-cell" class="has-text-right has-text-weight-bold is-size-5">$0.00</td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <hr>
          <div class="field is-grouped">
            <div class="control"><button class="button is-primary">Guardar</button></div>
            <div class="control"><a href="/compras/facturas" class="button is-light">Cancelar</a></div>
          </div>
        </form>
      </section>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const tbody = document.getElementById('details-tbody');
          const addBtn = document.getElementById('add-row-btn');
          const totalCell = document.getElementById('total-cell');

          function updateTotals() {
            let total = 0;
            tbody.querySelectorAll('.detail-row').forEach(row => {
              const c = parseFloat(row.querySelector('.cantidad-input')?.value) || 0;
              const p = parseFloat(row.querySelector('.precio-input')?.value) || 0;
              const s = c * p;
              row.querySelector('.subtotal-cell').textContent = '$' + s.toFixed(2);
              total += s;
            });
            totalCell.textContent = '$' + total.toFixed(2);
          }

          addBtn.addEventListener('click', () => {
            tbody.insertAdjacentHTML('beforeend', \`${renderDetailRow()}\`);
            updateTotals();
          });

          tbody.addEventListener('input', e => {
            if (e.target.classList.contains('cantidad-input') || e.target.classList.contains('precio-input')) updateTotals();
          });

          tbody.addEventListener('click', e => {
            if (e.target.classList.contains('remove-row-btn')) {
              e.target.closest('tr.detail-row').remove();
              updateTotals();
            }
          });

          updateTotals();
        });
      </script>
    `
  });
};
