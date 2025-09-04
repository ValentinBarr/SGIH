// views/admin/products/inventario/stock.js
const layout = require('../layout');

function opt(v, t, cur) {
  return `<option value="${v}" ${String(cur||'')===String(v)?'selected':''}>${t}</option>`;
}

module.exports = ({ basePath, filters, rows, productos }) => {
  const f = { prodId: filters?.prodId || '', depId: filters?.depId || '', onlyLow: filters?.onlyLow || '' };

  const prodOptions = `<option value="">Todos</option>` +
    (productos||[]).map(p => opt(p.id_prod, `${p.id_prod} - ${p.nombre_prod}`, f.prodId)).join('');

  const tableRows = (rows||[])
    .map(r => {
      const low = r.estado === 'BAJO';
      const suggest = Math.max(0, (r.par || 0) - r.stock); // sugerido para llegar al par
      return `
        <tr data-prod="${r.id_prod}" data-dep="${r.id_dep}">
          <td>${r.producto}</td>
          <td>${r.deposito}</td>
          <td class="has-text-right">${r.stock}</td>
          <td class="has-text-right">${r.minimo}</td>
          <td class="has-text-right">${r.par ?? '—'}</td>
          <td class="has-text-right">${r.max ?? '—'}</td>
          <td>${low ? '<span class="tag is-danger is-light">Bajo</span>' : '<span class="tag is-success is-light">OK</span>'}</td>
          <td class="is-narrow">
            <input class="input is-small js-qty" type="number" min="0" step="1" style="width:90px" value="${suggest}">
          </td>
          <td class="is-narrow">
            <label class="checkbox"><input class="js-pick" type="checkbox" ${low ? 'checked':''}></label>
          </td>
        </tr>`;
    })
    .join('');

  return layout({
    content: `
    <section class="inventory-card">
      <div class="inventory-toolbar">
        <h2 class="title is-5" style="margin:0;">Visor de Stock</h2>
        <div style="flex:1"></div>
        <a class="btn btn--subtle" href="/inventarios/movimientos">Historial</a>
      </div>

      <!-- Filtros -->
      <form class="filters-bar" method="GET" action="${basePath}">
        <div>
          <label class="label">Artículo</label>
          <div class="select is-fullwidth">
            <select name="prodId" onchange="this.form.submit()">${prodOptions}</select>
          </div>
        </div>
        <div>
          <label class="label">Depósito (ID)</label>
          <input class="input" name="depId" placeholder="ej: 7" value="${f.depId}">
        </div>
        <div>
          <label class="label">Solo bajo mínimo</label>
          <div class="select is-fullwidth">
            <select name="onlyLow" onchange="this.form.submit()">
              ${opt('', 'No', f.onlyLow)}
              ${opt('1', 'Sí', f.onlyLow)}
            </select>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn--subtle btn-apply" type="submit">
            <span class="icon"><i class="fas fa-filter"></i></span> Aplicar
          </button>
          <a class="btn btn-clear" href="${basePath}">Limpiar</a>
        </div>
      </form>

      <div class="box" style="padding:12px;">
        <div class="table-container">
          <table class="table is-fullwidth is-striped is-hoverable" id="stock-table">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Depósito</th>
                <th class="has-text-right">Stock</th>
                <th class="has-text-right">Mínimo</th>
                <th class="has-text-right">Par</th>
                <th class="has-text-right">Máximo</th>
                <th>Estado</th>
                <th style="width:110px;">Cant.</th>
                <th style="width:40px;"></th>
              </tr>
            </thead>
            <tbody>${tableRows || '<tr><td colspan="9" class="has-text-centered has-text-grey">Sin datos</td></tr>'}</tbody>
          </table>
        </div>

        <div class="level" style="margin-top:10px;">
          <div class="level-left">
            <div class="field has-addons">
              <p class="control"><span class="button is-static">Origen</span></p>
              <p class="control"><input id="fromDep" class="input" placeholder="ID Origen p/transfer"></p>
              <p class="control"><span class="button is-static">Destino</span></p>
              <p class="control"><input id="toDep" class="input" placeholder="ID Destino p/transfer"></p>
            </div>
          </div>
          <div class="level-right buttons">
            <button id="btn-transfer" class="button is-link">
              <span class="icon"><i class="fas fa-exchange-alt"></i></span>
              <span>Crear transferencia sugerida</span>
            </button>
            <button id="btn-entrada" class="button is-primary">
              <span class="icon"><i class="fas fa-arrow-down"></i></span>
              <span>Registrar entrada</span>
            </button>
          </div>
        </div>
        <p id="stock-msg" class="help" style="display:none;"></p>
      </div>
    </section>

    <script src="/js/stock.js" defer></script>
    `
  });
};
