// views/admin/products/inventario/movimientos.js
const layout = require('../../layout');

function opt(val, text, current) {
  return `<option value="${val}" ${String(current || '') === String(val) ? 'selected' : ''}>${text}</option>`;
}

module.exports = ({ basePath, filters, movimientos, productos }) => {
  const f = {
    q: filters?.q || '',
    depId: filters?.depId || '',
    prodId: filters?.prodId || '',
    dominio: filters?.dominio || '',
    direccion: filters?.direccion || '',
    from: filters?.from || '',
    to: filters?.to || '',
  };

  const rows = (movimientos || [])
    .map((m) => {
      const estadoBadge =
        m.Comprobante?.estado_compInv === 'POSTED'
          ? '<span class="tag is-success is-light">POSTED</span>'
          : '<span class="tag is-warning is-light">DRAFT</span>';

      const qtyClass = m.signedQty < 0 ? 'has-text-danger' : 'has-text-success';
      const qtyFmt = Number(m.signedQty).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      });

      return `
        <tr>
          <td class="is-narrow">${m.Comprobante?.docId_compInv ?? ''}</td>
          <td>${m.fechaFmt}</td>
          <td>${m.Comprobante?.docType_compInv ?? ''}</td>
          <td>${m.TipoMovimiento?.Nombre ?? ''} <small class="has-text-grey">(${m.TipoMovimiento?.Direccion})</small></td>
          <td>${m.Deposito?.nombre_dep ?? ''}</td>
          <td>${m.Producto?.nombre_prod ?? ''}</td>
          <td class="has-text-right ${qtyClass}"><strong>${qtyFmt}</strong></td>
          <td class="is-narrow">${m.uom_movInv || ''}</td>
          <td>${m.nota_movInv ? m.nota_movInv : ''}</td>
          <td class="is-narrow">${estadoBadge}</td>
        </tr>
      `;
    })
    .join('');

  // opciones de productos (simple)
  const prodOptions =
    `<option value="">Todos</option>` +
    (productos || [])
      .map((p) => opt(p.id_prod, `${p.id_prod} - ${p.nombre_prod}`, f.prodId))
      .join('');

  return layout({
    content: `
    <section class="inventory-card">
      <div class="inventory-toolbar">
        <h2 class="title is-5" style="margin:0;">Movimientos de Inventario</h2>
        <div style="flex:1"></div>
        <a href="/inventarios/articulos" class="btn btn--subtle">← Volver a Artículos</a>
      </div>

      <!-- Filtros -->
      <form method="GET" action="${basePath}" class="filters-bar">
        <div>
          <label class="label">Buscar</label>
          <input class="input" name="q" placeholder="Producto o nota" value="${f.q}">
        </div>

        <div>
          <label class="label">Producto</label>
          <div class="select is-fullwidth">
            <select name="prodId" onchange="this.form.submit()">
              ${prodOptions}
            </select>
          </div>
        </div>

        <div>
          <label class="label">Depósito (ID)</label>
          <input class="input" name="depId" placeholder="ej: 7" value="${f.depId}" />
        </div>

        <div>
          <label class="label">Dominio</label>
          <div class="select is-fullwidth">
            <select name="dominio" onchange="this.form.submit()">
              ${opt('', 'Todos', f.dominio)}
              ${opt('COMPRA', 'COMPRA', f.dominio)}
              ${opt('VENTA', 'VENTA', f.dominio)}
              ${opt('TRANSFERENCIA', 'TRANSFERENCIA', f.dominio)}
              ${opt('AJUSTE', 'AJUSTE', f.dominio)}
              ${opt('CONTEO', 'CONTEO', f.dominio)}
            </select>
          </div>
        </div>

        <div>
          <label class="label">Dirección</label>
          <div class="select is-fullwidth">
            <select name="direccion" onchange="this.form.submit()">
              ${opt('', 'Todas', f.direccion)}
              ${opt('IN', 'IN (Entrada)', f.direccion)}
              ${opt('OUT', 'OUT (Salida)', f.direccion)}
            </select>
          </div>
        </div>

        <div>
          <label class="label">Desde</label>
          <input type="date" class="input" name="from" value="${f.from}">
        </div>
        <div>
          <label class="label">Hasta</label>
          <input type="date" class="input" name="to" value="${f.to}">
        </div>

        <div style="display:flex; gap:8px;">
          <button class="btn btn--subtle btn-apply" type="submit">
            <span class="icon"><i class="fas fa-filter"></i></span> Aplicar
          </button>
          <a class="btn btn-clear" href="${basePath}">Limpiar</a>
        </div>
      </form>

      <div class="table-container" style="box-shadow:none;border:0;padding:0;margin-top:8px;">
        <table class="table table-inventory is-fullwidth">
          <thead>
            <tr>
              <th>Doc</th>
              <th>Fecha</th>
              <th>DocType</th>
              <th>Movimiento</th>
              <th>Depósito</th>
              <th>Producto</th>
              <th class="has-text-right">Cantidad</th>
              <th>UoM</th>
              <th>Nota</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="10" class="has-text-centered has-text-grey">Sin movimientos</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
    `,
  });
};
