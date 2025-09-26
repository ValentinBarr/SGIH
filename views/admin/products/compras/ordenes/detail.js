// views/admin/products/compras/ordenes/detalle.js
const layout = require('../../layout');

const getEstadoColor = (estado) => {
  const colores = { 
    BORRADOR: 'is-light', 
    APROBADA: 'is-info', 
    ENVIADA: 'is-warning', 
    RECIBIDA: 'is-success', 
    ANULADA: 'is-danger' 
  };
  return colores[estado] || 'is-dark';
};

module.exports = ({ orden, transicionesValidas = [], puedeEditar }) => {
  const detailRows = orden.detalles.map(det => `
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
              <h1 class="title">Orden de Compra ${orden.letra_comp}${orden.sucursal_comp}-${orden.numero_comp}</h1>
              <h2 class="subtitle">Proveedor: ${orden.Proveedor?.nombre_prov || 'N/A'}</h2>
            </div>
          </div>
          <div class="level-right">
            <span class="tag is-large ${getEstadoColor(orden.estado)}">${orden.estado}</span>
          </div>
        </div>
        
        <div class="box">
          <div class="columns">
            <div class="column"><strong>Fecha:</strong> ${new Date(orden.fecha).toLocaleDateString('es-AR')}</div>
            <div class="column"><strong>Forma de Pago:</strong> ${orden.FormaPago?.nombre || 'N/A'}</div>
            <div class="column"><strong>Total:</strong> 
              <span class="has-text-weight-bold is-size-5">
                $${Number(orden.total_comp).toFixed(2)}
              </span>
            </div>
          </div>
          ${orden.observacion ? `<p><strong>Observaciones:</strong> ${orden.observacion}</p>` : ''}
        </div>

        <h2 class="subtitle is-5">Artículos de la Orden</h2>
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
            <a href="/compras/ordenes" class="button">Volver a la lista</a>
          </div>
          ${puedeEditar ? `
            <div class="control">
              <a href="/compras/ordenes/${orden.id_comp}/edit" class="button is-primary">Editar</a>
            </div>` : ''}
          ${transicionesValidas.map(estado => `
            <div class="control">
              <form method="POST" action="/compras/ordenes/${orden.id_comp}/estado" style="display: inline;">
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
