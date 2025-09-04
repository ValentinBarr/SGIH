const layout = require('./layout'); // tu layout general

// views/pos/index.js
//const layout = require('../admin/products/layout'); // usa el layout que ya tenés

function money(n) {
  if (n == null) return '—';
  const v = Number(n);
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

module.exports = ({ productos, depositos }) => {
  const rows = productos
    .map(
      (p) => `
    <tr data-pid="${p.id_prod}" data-price="${p.precio_prod ?? 0}">
      <td>${p.id_prod}</td>
      <td>${p.nombre_prod}</td>
      <td class="has-text-right">$${money(p.precio_prod)}</td>
      <td class="is-narrow">
        <button class="button is-small is-primary js-add" data-id="${p.id_prod}">
          <span class="icon"><i class="fas fa-plus"></i></span>
        </button>
      </td>
    </tr>`
    )
    .join('');

  const depOptions = (depositos || [])
    .map((d) => `<option value="${d.id_dep}">${d.nombre_dep}</option>`)
    .join('');

  return layout({
    content: `
    <section class="inventory-card">
      <div class="inventory-toolbar">
        <h2 class="title is-5" style="margin:0;">POS • Punto de Venta</h2>
        <div style="flex:1"></div>
        <a class="btn btn--subtle" href="/inventarios/movimientos">Historial</a>
      </div>

      <div class="columns">
        <!-- Productos -->
        <div class="column is-7">
          <div class="box" style="padding:12px;">
            <div class="field is-grouped">
              <div class="control is-expanded">
                <input id="pos-search" class="input" placeholder="Buscar producto..." />
              </div>
              <div class="control">
                <div class="select">
                  <select id="pos-dep">
                    ${depOptions}
                  </select>
                </div>
              </div>
            </div>

            <div class="table-container" style="max-height:480px;overflow:auto">
              <table class="table is-fullwidth is-striped is-hoverable" id="pos-products">
                <thead>
                  <tr>
                    <th>ID</th><th>Producto</th><th class="has-text-right">Precio</th><th></th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Carrito -->
        <div class="column is-5">
          <div class="box" style="padding:12px;">
            <h3 class="title is-6">Caja Registradora</h3>
            <div class="table-container">
              <table class="table is-fullwidth" id="pos-cart">
                <thead>
                  <tr>
                    <th>Items</th><th class="has-text-centered">Cant.</th>
                    <th class="has-text-right">Precio</th><th class="has-text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="cart-body">
                  <tr class="is-empty"><td colspan="5" class="has-text-grey has-text-centered">Sin items</td></tr>
                </tbody>
              </table>
            </div>

            <div class="level">
              <div class="level-left">
                <input id="pos-note" class="input" placeholder="Nota / Ticket" style="max-width:260px;">
              </div>
              <div class="level-right">
                <div class="has-text-right">
                  <div class="is-size-7 has-text-grey">Total:</div>
                  <div id="pos-total" class="is-size-4">$0.00</div>
                </div>
              </div>
            </div>

            <div class="buttons is-right">
              <button id="pos-pay" class="button is-link">
                <span class="icon"><i class="fas fa-cash-register"></i></span>
                <span>Procesar Pago</span>
              </button>
            </div>

            <p id="pos-error" class="help is-danger" style="display:none;"></p>
            <p id="pos-ok" class="help is-success" style="display:none;"></p>
          </div>
        </div>
      </div>
    </section>

    <script src="/js/pos.js" defer></script>
    `,
  });
};

