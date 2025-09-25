// views/admin/products/compras/remitos/detalle.js

const layout = require('../../layout');

const getEstadoColor = (estado) => {
  const colores = { BORRADOR: 'is-light', PENDIENTE: 'is-info', RECIBIDO: 'is-success', ANULADO: 'is-danger' };
  return colores[estado] || 'is-dark';
};

module.exports = ({ remito, transicionesValidas = [], puedeEditar }) => {
  const detailRows = remito.detalles.map(det => `
    <tr>
      <td>${det.Producto.id_prod}</td>
      <td>${det.Producto.nombre_prod}</td>
      <td class="has-text-right">${Number(det.cantidad).toFixed(3)}</td>
      <td class="has-text-right">$${Number(det.precio).toFixed(2)}</td>
      <td class="has-text-right">$${(Number(det.cantidad) * Number(det.precio)).toFixed(2)}</td>
    </tr>
  `).join('');

  return layout({
    content: `
      <section class="inventory-card">
        <div class="level">
          <div class="level-left">
            <div>
              <h1 class="title">Remito R ${remito.sucursal_comp}-${remito.numero_comp}</h1>
              <h2 class="subtitle">Proveedor: ${remito.Proveedor?.nombre_prov || 'N/A'}</h2>
            </div>
          </div>
          <div class="level-right">
            <span class="tag is-large ${getEstadoColor(remito.estado)}">${remito.estado}</span>
          </div>
        </div>
        
        <div class="box">
          <div class="columns">
            <div class="column"><strong>Fecha:</strong> ${new Date(remito.fecha).toLocaleDateString('es-AR')}</div>
            <div class="column"><strong>Depósito:</strong> ${remito.Deposito?.nombre_dep || 'N/A'}</div>
            <div class="column"><strong>Total:</strong> <span class="has-text-weight-bold is-size-5">$${Number(remito.total_comp).toFixed(2)}</span></div>
          </div>
          ${remito.observacion ? `<p><strong>Observaciones:</strong> ${remito.observacion}</p>` : ''}
        </div>

        <h2 class="subtitle is-5">Artículos del Remito</h2>
        <table class="table is-fullwidth is-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th class="has-text-right">Cantidad</th>
              <th class="has-text-right">Precio Unit.</th>
              <th class="has-text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${detailRows}</tbody>
        </table>
        
        <hr>
        
        <div class="field is-grouped">
          <div class="control">
            <a href="/compras/remitos" class="button">Volver a la lista</a>
          </div>
          ${puedeEditar ? `<div class="control"><a href="/compras/remitos/${remito.id_comp}/edit" class="button is-primary">Editar</a></div>` : ''}
          ${transicionesValidas.map(estado => `
            <div class="control">
              <form method="POST" action="/compras/remitos/${remito.id_comp}/estado" style="display: inline;">
                <input type="hidden" name="nuevo_estado" value="${estado}">
                <button type="submit" class="button is-link">Marcar como ${estado}</button>
              </form>
            </div>
          `).join('')}
        </div>
      </section>
    `
  });
};