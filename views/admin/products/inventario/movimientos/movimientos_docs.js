const layout = require('../../layout');

module.exports = ({ rows }) => {
  const ci = rows[0].Comprobante;
  const header = `
    <div class="box" style="padding:14px;margin-bottom:12px;">
      <h3 class="title is-5" style="margin:0;">Comprobante #${ci.docId_compInv}</h3>
      <p class="subtitle is-6" style="margin:4px 0 0 0;">
        ${ci.docType_compInv} · ${ci.estado_compInv} · ${new Date(ci.fecha_compInv).toLocaleString()}
      </p>
    </div>
  `;
  const body = rows.map(r => {
    const qty = r.signedQty;
    const cls = qty < 0 ? 'has-text-danger' : 'has-text-success';
    return `
      <tr>
        <td>${r.TipoMovimiento?.Nombre ?? ''} <small>(${r.TipoMovimiento?.Direccion})</small></td>
        <td>${r.Deposito?.nombre_dep ?? ''}</td>
        <td>${r.Producto?.nombre_prod ?? ''}</td>
        <td class="has-text-right ${cls}"><strong>${qty}</strong></td>
        <td>${r.uom_movInv ?? ''}</td>
        <td>${r.nota_movInv ?? ''}</td>
      </tr>
    `;
  }).join('');

  return layout({
    content: `
      <section class="inventory-card">
        <div class="inventory-toolbar">
          <a href="/inventarios/movimientos" class="btn btn--subtle">← Volver</a>
          <div style="flex:1"></div>
        </div>
        ${header}
        <div class="table-container" style="box-shadow:none;border:0;padding:0;margin-top:8px;">
          <table class="table is-fullwidth">
            <thead>
              <tr>
                <th>Movimiento</th><th>Depósito</th><th>Producto</th>
                <th class="has-text-right">Cantidad</th><th>UoM</th><th>Nota</th>
              </tr>
            </thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </section>
    `,
  });
};
