// views/admin/compras/pagos/index.js

const layout = require('../../layout');

module.exports = ({ pagos, proveedores, filters }) => {
  const renderRows = pagos.map(pago => `
    <tr>
      <td>#${pago.id_pago}</td>
      <td>${new Date(pago.fecha_pago).toLocaleDateString('es-AR')}</td>
      <td>${pago.Proveedor.nombre_prov}</td>
      <td>${pago.FormaPago.nombre}</td>
      <td class="has-text-right has-text-weight-bold">$${Number(pago.total_pago).toFixed(2)}</td>
      <td>
        <a href="/compras/pagos/${pago.id_pago}" class="button is-small is-info is-light">Ver Detalle</a>
      </td>
    </tr>
  `).join('');

  return layout({
    content: `
      <section class="inventory-card">
        <div class="level">
          <div class="level-left"><h1 class="title">Órdenes de Pago</h1></div>
          <div class="level-right">
            <a href="/compras/pagos/new" class="button is-primary">
              <span class="icon is-small"><i class="fas fa-plus"></i></span>
              <span>Nueva Orden de Pago</span>
            </a>
          </div>
        </div>

        <table class="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Forma de Pago</th>
              <th class="has-text-right">Total Pagado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${pagos.length ? renderRows : '<tr><td colspan="6" class="has-text-centered">No se han registrado órdenes de pago.</td></tr>'}
          </tbody>
        </table>
      </section>
    `
  });
};