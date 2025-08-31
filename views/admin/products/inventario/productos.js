const layout = require('../layout'); // tu layout general

module.exports = ({ products }) => {
  const renderedProducts = products.map(product => {
    return `
      <tr>
        <td>${product.id_prod}</td>
        <td>${product.name_prod}</td>
        <td>${new Date(product.fecha_alta_prod).toISOString().split('T')[0]}</td>
        <td>
          <a href="/admin/products/${product.id_prod}/edit">
            <button class="button is-link">Edit</button>
          </a>
        </td>
        <td>
          <form method="POST" action="/admin/products/${product.id_prod}/delete">
            <button class="button is-danger">Delete</button>
          </form>
        </td>
      </tr>
    `;
  }).join('');

  return layout({
    content: `
      <h1 class="title">Listado de Productos</h1>
      <table class="table is-fullwidth is-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Fecha Alta</th>
            <th colspan="2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${renderedProducts}
        </tbody>
      </table>
    `
  });
};
