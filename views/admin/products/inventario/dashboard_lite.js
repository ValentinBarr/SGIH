const layout = require('../layout');

module.exports = ({ low, vencidos, feed }) => {
  const lowList = (low.breakdown || [])
    .map(d => `<li><a href="/inventarios/stock?depId=${d.id_dep}&onlyLow=1">${d.nombre_dep}</a> — <strong>${d.count}</strong></li>`)
    .join('') || '<li class="has-text-grey">Sin faltantes</li>';

  const vencidosRows = (vencidos||[])
    .map(v => `<tr><td><a href="/inventarios/depositos/${v.id_dep}">${v.nombre_dep}</a></td><td>${v.tipo||''}</td><td class="has-text-right">${v.diasSinConteo}</td></tr>`)
    .join('') || '<tr><td colspan="3" class="has-text-grey has-text-centered">OK</td></tr>';

  const feedRows = (feed||[])
    .map(m => `<tr>
      <td>${new Date(m.fecha).toLocaleString()}</td>
      <td>${m.docType||''}</td>
      <td>${m.producto||''}</td>
      <td>${m.dep||''}</td>
      <td class="has-text-centered ${m.qty<0?'has-text-danger':'has-text-success'}">${m.qty<0?m.qty:'+'+m.qty}</td>
    </tr>`).join('') || '<tr><td colspan="5" class="has-text-grey has-text-centered">Sin movimientos recientes</td></tr>';

  return layout({
    content: `
    <section class="inventory-card">
      <div class="inventory-toolbar">
        <div>
          <h2 class="title is-5" style="margin:0;">Dashboard de Inventarios</h2>
          <p class="subtitle is-6" style="margin:0;">Resumen y alertas</p>
        </div>
        <div style="flex:1"></div>
        <a class="btn btn--primary" href="/inventarios/acciones/entrada">Registrar Entrada</a>
        <a class="btn btn--subtle" href="/inventarios/acciones/transfer">Transferencia</a>
        <a class="btn btn--subtle" href="/inventarios/stock">Visor de stock</a>
        <a class="btn btn--subtle" href="/inventarios/depositos">Depósitos</a>
      </div>

      <div class="columns is-multiline">
        <div class="column is-6">
          <div class="box">
            <p class="heading">Artículos bajo mínimo</p>
            <p class="title is-3" style="margin-top:4px;">${low.total}</p>
            <p><a href="/inventarios/stock?onlyLow=1">Ir al visor</a></p>
            <ul class="mt-2">${lowList}</ul>
          </div>
        </div>

        <div class="column is-6">
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
    `
  });
};
