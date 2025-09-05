// views/admin/inventario/dashboard.js
const layout = require('../layout');

function pill(n){ return `<span class="tag is-rounded ${n>=0?'is-success':'is-danger'} is-light">${n>=0?'+':''}${n}</span>`; }

module.exports = ({ low, top30, vencidos, feed }) => {
  const lowList = (low.breakdown || [])
    .slice(0,6)
    .map(d => `<li><a href="/inventarios/stock?depId=${d.id_dep}&onlyLow=1">${d.nombre_dep}</a> — <strong>${d.count}</strong></li>`)
    .join('') || '<li class="has-text-grey">Sin faltantes</li>';

  const ejemplosLow = (low.ejemplos||[])
    .map(e => `<li>${e.prod} <small class="has-text-grey">(${e.dep})</small> — ${e.stock}/${e.min}</li>`)
    .join('');

  const topRows = (top30||[])
    .map(t => `<tr><td>${t.nombre_prod}</td><td class="has-text-right">${t.qty}</td><td>${t.uom||''}</td></tr>`)
    .join('') || '<tr><td colspan="3" class="has-text-grey has-text-centered">Sin datos</td></tr>';

  const vencidosRows = (vencidos||[])
    .map(v => `<tr><td><a href="/inventarios/depositos/${v.id_dep}">${v.nombre_dep}</a></td><td>${v.tipo||''}</td><td class="has-text-right">${v.diasSinConteo}</td></tr>`)
    .join('') || '<tr><td colspan="3" class="has-text-grey has-text-centered">OK</td></tr>';

  const feedRows = (feed||[])
    .map(m => `<tr>
      <td>${new Date(m.fecha).toLocaleString()}</td>
      <td>${m.docType||''}</td>
      <td>${m.producto||''}</td>
      <td>${m.dep||''}</td>
      <td class="has-text-centered">${pill(m.qty)}</td>
    </tr>`).join('') || '<tr><td colspan="5" class="has-text-grey has-text-centered">Sin movimientos recientes</td></tr>';

  return layout({
    content: `
    <section class="inventory-card">
      <div class="inventory-toolbar">
        <h2 class="title is-5" style="margin:0;">Dashboard de Inventarios</h2>
        <div style="flex:1"></div>
        <a class="btn btn--subtle" href="/inventarios/stock">Visor de stock</a>
        <a class="btn btn--subtle" href="/inventarios/depositos">Depósitos</a>
      </div>

      <div class="columns is-multiline">
        <div class="column is-4">
          <div class="box">
            <p class="heading">Artículos bajo mínimo</p>
            <p class="title is-3" style="margin-top:4px;">${low.total}</p>
            <p><a href="/inventarios/stock?onlyLow=1">Ir al visor</a></p>
            <ul class="mt-2">${lowList}</ul>
            ${ejemplosLow ? `<p class="mt-2"><strong>Ejemplos:</strong></p><ul>${ejemplosLow}</ul>`:''}
          </div>
        </div>

        <div class="column is-4">
          <div class="box">
            <p class="heading">Top salidas últimos 30 días</p>
            <div class="table-container">
              <table class="table is-fullwidth is-striped is-narrow">
                <thead><tr><th>Artículo</th><th class="has-text-right">Qty</th><th>UoM</th></tr></thead>
                <tbody>${topRows}</tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="column is-4">
          <div class="box">
            <p class="heading">Depósitos sin conteo &gt; frecuencia</p>
            <div class="table-container">
              <table class="table is-fullwidth is-narrow">
                <thead><tr><th>Depósito</th><th>Tipo</th><th class="has-text-right">Días</th></tr></thead>
                <tbody>${vencidosRows}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div class="box">
        <h3 class="title is-6">Acciones rápidas</h3>
        <div class="columns">
          <div class="column">
            <h4 class="subtitle is-6">Registrar Entrada</h4>
            <form id="quick-in">
              <div class="field has-addons">
                <p class="control"><span class="button is-static">Depósito</span></p>
                <p class="control is-expanded"><input class="input" name="depId" placeholder="ID destino"></p>
              </div>
              <div id="in-lines"></div>
              <button type="button" class="button is-light is-small" id="add-in">+ Línea</button>
              <button type="submit" class="button is-primary is-small">Confirmar</button>
              <p class="help" id="msg-in" style="display:none"></p>
            </form>
          </div>

          <div class="column">
            <h4 class="subtitle is-6">Transferencia</h4>
            <form id="quick-tr">
              <div class="field has-addons">
                <p class="control"><span class="button is-static">Origen</span></p>
                <p class="control is-expanded"><input class="input" name="fromDepId" placeholder="ID origen"></p>
              </div>
              <div class="field has-addons">
                <p class="control"><span class="button is-static">Destino</span></p>
                <p class="control is-expanded"><input class="input" name="toDepId" placeholder="ID destino"></p>
              </div>
              <div id="tr-lines"></div>
              <button type="button" class="button is-light is-small" id="add-tr">+ Línea</button>
              <button type="submit" class="button is-link is-small">Confirmar</button>
              <p class="help" id="msg-tr" style="display:none"></p>
            </form>
          </div>
        </div>
      </div>

      <!-- Feed -->
      <div class="box">
        <h3 class="title is-6">Movimientos recientes</h3>
        <div class="table-container">
          <table class="table is-fullwidth is-striped">
            <thead><tr><th>Fecha</th><th>Doc</th><th>Artículo</th><th>Depósito</th><th class="has-text-centered">Δ</th></tr></thead>
            <tbody>${feedRows}</tbody>
          </table>
        </div>
      </div>
    </section>

    <script src="/js/dashboard-inv.js" defer></script>
    `
  });
};
