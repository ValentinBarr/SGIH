// views/admin/pos/index.js
const layout = require('./layout');

module.exports = ({ productos, depositos }) => {
  const depOpts = depositos.map(d => `<option value="${d.id_dep}">${d.nombre_dep}</option>`).join('');
  const prodCards = productos.map(p => `
    <div class="pos-item" data-id="${p.id_prod}" data-nombre="${p.nombre_prod}" data-uom="${p.unidad_prod||'UN'}" data-precio="${p.precio_prod ?? ''}">
      <div class="pos-item__title">${p.nombre_prod}</div>
      <div class="pos-item__meta">${p.unidad_prod||'UN'}${p.precio_prod ? ` · $${Number(p.precio_prod).toFixed(2)}` : ''}</div>
      <button class="button is-small is-light js-add">Agregar</button>
    </div>
  `).join('');

  return layout({
    content: `
<section class="inventory-card">
  <div class="inventory-toolbar">
    <h2 class="title is-5" style="margin:0;">POS</h2>
    <div style="flex:1"></div>
    <div class="select">
      <select id="dep">
        <option value="">Depósito POS…</option>
        ${depOpts}
      </select>
    </div>
  </div>

  <div class="columns">
    <div class="column is-7">
      <div class="box">
        <h3 class="title is-6">Productos</h3>
        <div class="pos-grid">
          ${prodCards || '<p class="has-text-grey">No hay productos vendibles.</p>'}
        </div>
      </div>
    </div>

    <div class="column is-5">
      <div class="box">
        <h3 class="title is-6">Caja Registradora</h3>
        <div id="cart">
          <table class="table is-fullwidth is-narrow">
            <thead>
              <tr><th>Item</th><th class="has-text-centered">Cant.</th><th class="has-text-right">Precio</th><th class="has-text-right">Total</th><th></th></tr>
            </thead>
            <tbody id="cart-body"><tr><td colspan="5" class="has-text-grey has-text-centered">Sin items</td></tr></tbody>
            <tfoot>
              <tr>
                <th colspan="3" class="has-text-right">Total:</th>
                <th class="has-text-right" id="cart-total">$0.00</th>
                <th></th>
              </tr>
            </tfoot>
          </table>

          <div class="buttons is-right">
            <button id="btn-pay" class="button is-primary" disabled>Procesar Pago</button>
          </div>
          <p class="help" id="msg" style="display:none"></p>
        </div>
      </div>
    </div>
  </div>
</section>
<script src="/js/pos.js" defer></script>
<style>
.pos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.pos-item{border:1px solid #e6e6e6;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px}
.pos-item__title{font-weight:600}
.pos-item__meta{font-size:.85rem;color:#7a7a7a}
.qty-box{display:flex;align-items:center;gap:6px}
.qty-box button{width:28px}
</style>
`
  });
};
