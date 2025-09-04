const layout = require('../../layout');

module.exports = ({ deposito, filter }) => {
  const stockRows = deposito.stock
    .map(
      (s) => `
      <tr>
        <td>${s.articulo}</td>
        <td>${s.cantidad}</td>
      </tr>
    `
    )
    .join('');

  const paramRows = deposito.parametros
    .map(
      (p) => `
      <tr>
        <td>${p.articulo}</td>
        <td>${p.valor}</td>
      </tr>
    `
    )
    .join('');

  const movRows = deposito.movimientos
    .map(
      (m) => `
      <tr>
        <td>${m.fecha}</td>
        <td>${m.descripcion}</td>
      </tr>
    `
    )
    .join('');

  return layout({
    content: `
      <section class="section">
        <h1 class="title">Depósito ${deposito.nombre}</h1>
        <p><strong>Código:</strong> ${deposito.codigo}</p>
        <p><strong>Tipo:</strong> ${deposito.tipo}</p>
        <p><strong>Activo:</strong> ${deposito.activo ? 'Si' : 'No'}</p>
        <hr/>
        <h2 class="subtitle">Stock actual</h2>
        <form method="GET">
          <div class="field has-addons">
            <div class="control is-expanded">
              <input class="input" name="q" value="${filter || ''}" placeholder="Filtrar artículo" />
            </div>
            <div class="control">
              <button class="button is-info" type="submit">Filtrar</button>
            </div>
          </div>
        </form>
        <table class="table is-fullwidth">
          <thead><tr><th>Artículo</th><th>Cantidad</th></tr></thead>
          <tbody>${stockRows}</tbody>
        </table>
        <h2 class="subtitle">Parámetros</h2>
        <form method="POST" action="/inventario/depositos/${deposito.id}/parametros">
          <div class="field is-horizontal">
            <div class="field-body">
              <div class="field">
                <input class="input" name="articulo" placeholder="Artículo" />
              </div>
              <div class="field">
                <input class="input" name="valor" placeholder="Valor" />
              </div>
              <div class="field">
                <button class="button is-primary" type="submit">Agregar</button>
              </div>
            </div>
          </div>
        </form>
        <table class="table is-fullwidth">
          <thead><tr><th>Artículo</th><th>Valor</th></tr></thead>
          <tbody>${paramRows}</tbody>
        </table>
        <h2 class="subtitle">Movimientos recientes</h2>
        <form method="POST" action="/inventario/depositos/${deposito.id}/movimientos">
          <div class="field has-addons">
            <div class="control is-expanded">
              <input class="input" name="descripcion" placeholder="Descripción" />
            </div>
            <div class="control">
              <button class="button is-primary" type="submit">Agregar</button>
            </div>
          </div>
        </form>
        <table class="table is-fullwidth">
          <thead><tr><th>Fecha</th><th>Descripción</th></tr></thead>
          <tbody>${movRows}</tbody>
        </table>
      </section>
    `
  });
};
