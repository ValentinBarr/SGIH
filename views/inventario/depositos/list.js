const layout = require('../../layout');

module.exports = ({ depositos }) => {
  const rows = depositos
    .map(
      (d) => `
      <tr>
        <td>${d.codigo}</td>
        <td>${d.nombre}</td>
        <td>${d.tipo}</td>
        <td>${d.activo ? 'Si' : 'No'}</td>
        <td>${d.ultimaFechaConteo}</td>
        <td>
          <a href="/inventario/depositos/${d.id}">Detalle</a>
          <a href="/inventario/depositos/${d.id}/edit">Editar</a>
        </td>
      </tr>
    `
    )
    .join('');

  return layout({
    content: `
      <section class="section">
        <h1 class="title">Depósitos</h1>
        <a class="button is-primary" href="/inventario/depositos/new">Nuevo depósito</a>
        <table class="table is-fullwidth">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Activo</th>
              <th>Última fecha de conteo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </section>
    `
  });
};
