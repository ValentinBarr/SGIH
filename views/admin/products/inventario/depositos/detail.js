const layout = require('../../layout');

module.exports = ({ dep, grid }) => {
  const depId = dep.id_dep;
  const tipo = dep.TipoDeposito?.nombre_tipoDep || '';

  const tbody = grid.length
    ? grid.map(r => `
        <tr>
          <td>
            <div class="prod-name">${r.nombre}</div>
            <div class="meta">${r.uom}</div>
          </td>
          <td class="has-text-centered">${r.stock}</td>
          <td class="has-text-right">
            <span class="tag ${r.estado === 'Bajo' ? 'is-danger' : 'is-success'}">${r.estado}</span>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" class="has-text-centered has-text-grey">Sin productos en este depósito</td></tr>`;

  return layout({
    content: `
<section class="inventory-card">
  <div class="inventory-toolbar">
    <div>
      <h2 class="title is-5">Depósito: ${dep.nombre_dep}</h2>
      <p class="help">Tipo: ${tipo}</p>
    </div>
    <div style="flex:1"></div>
    <div class="buttons">
      <a class="button is-primary is-light" href="/inventarios/acciones/entrada?depId=${depId}">Entrada</a>
      <a class="button is-link is-light" href="/inventarios/acciones/transfer?fromId=${depId}">Transferencia</a>
      <a class="button is-warning is-light" href="/inventarios/acciones/conteo?depId=${depId}">Conteo</a>
      <a class="button is-danger is-light" href="/inventarios/acciones/ajuste?depId=${depId}">Ajuste</a>
    </div>
  </div>

  <div class="box">
    <h3 class="title is-6">Stock</h3>
    <div class="table-container">
      <table class="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Producto</th>
            <th class="has-text-centered">Stock</th>
            <th class="has-text-right">Estado</th>
          </tr>
        </thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
  </div>
</section>

<style>
.prod-name { font-weight: 600 }
.meta { font-size:.85rem;color:#7a7a7a }
</style>
`
  });
};
