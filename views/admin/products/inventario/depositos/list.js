const layout = require('../../layout');

module.exports = ({ deps }) => {
  const cards = deps.map(d => `
    <div class="card deposito-card">
      <div class="card-content">
        <h3 class="title is-6">${d.nombre_dep}</h3>
        <p class="help">Tipo: ${d.TipoDeposito?.nombre_tipoDep || '-'}</p>
        <a href="/inventarios/depositos/${d.id_dep}" class="button is-small is-link mt-2">Ver detalle</a>
      </div>
    </div>
  `).join('');

  return layout({
    content: `
      <section class="inventory-card">
        <h2 class="title is-5">Depósitos</h2>
        <div class="depositos-grid">${cards}</div>
      </section>

      <style>
        .depositos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill,minmax(250px,1fr));
          gap: 16px;
        }
        .deposito-card {
          border: 1px solid #e6e6e6;
          border-radius: 10px;
        }
      </style>
    `
  });
};
