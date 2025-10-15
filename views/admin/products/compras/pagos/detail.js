// views/admin/products/compras/pagos/detail.js
const layout = require('../../layout');

const formatARS = (number) => {
    const value = Number(number) || 0;
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

module.exports = ({ pago }) => {
    const detailRows = pago.DetallesPagos.map(det => `
        <tr>
            <td>${new Date(det.Comprobante.fecha).toLocaleDateString('es-AR')}</td>
            <td>${det.Comprobante.letra_comp}${det.Comprobante.sucursal_comp}-${det.Comprobante.numero_comp}</td>
            <td class="has-text-right">${formatARS(det.Comprobante.total_comp)}</td>
            <td class="has-text-right has-text-weight-bold">${formatARS(det.monto_pagar)}</td>
        </tr>
    `).join('');

    return layout({
        content: `
            <section class="inventory-card">
                <div class="level">
                    <div class="level-left">
                        <div>
                            <h1 class="title">Orden de Pago #${pago.id_pago}</h1>
                            <h2 class="subtitle">Proveedor: ${pago.Proveedor?.nombre_prov || 'N/A'}</h2>
                        </div>
                    </div>
                    <div class="level-right">
                        <span class="tag is-large is-success">PAGADO</span>
                    </div>
                </div>
                
                <div class="box">
                    <div class="columns">
                        <div class="column">
                            <strong>Fecha de Pago:</strong> ${new Date(pago.fecha_pago).toLocaleDateString('es-AR')}
                        </div>
                        <div class="column">
                            <strong>Forma de Pago:</strong> ${pago.FormaPago?.nombre || 'N/A'}
                        </div>
                        <div class="column">
                            <strong>Total Pagado:</strong> 
                            <span class="has-text-weight-bold is-size-5">
                                ${formatARS(pago.total_pago)}
                            </span>
                        </div>
                    </div>
                    ${pago.observacion ? `<p><strong>Observaciones:</strong> ${pago.observacion}</p>` : ''}
                </div>

                <h2 class="subtitle is-5">Facturas Pagadas en esta Orden</h2>
                <table class="table is-fullwidth is-striped">
                    <thead>
                        <tr>
                            <th>Fecha Factura</th>
                            <th>Número Factura</th>
                            <th class="has-text-right">Total Factura</th>
                            <th class="has-text-right">Monto Pagado</th>
                        </tr>
                    </thead>
                    <tbody>${detailRows}</tbody>
                </table>
                
                <hr>
                
                <div class="field">
                    <div class="control">
                        <a href="/compras/pagos" class="button">Volver a la lista</a>
                    </div>
                </div>
            </section>
        `
    });
};