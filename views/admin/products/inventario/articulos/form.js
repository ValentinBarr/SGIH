const layout = require('../../layout');

const UNIDADES = ['UN','KG','LT','ML','SRV'];
const TIPOS = ['VENDIBLE','INSUMO','AMENITY','LINEN','SERVICE'];

module.exports = ({ mode = 'new', producto = {}, errors = {} }) => {
  const p = {
    nombre_prod: '',
    unidad_prod: 'UN',
    tipo_prod: 'VENDIBLE',
    stockeable_prod: false,
    vendible_prod: false,
    descuentaStockVenta_prod: false,
    activo_prod: true,
    precio_prod: '',
    stockMinimoGlobal_prod: '',
    ...producto
  };
  const title = mode === 'new' ? 'Nuevo Artículo' : `Editar Artículo #${p.id_prod||''}`;
  const action = mode === 'new' ? '/inventarios/articulos/new' : `/inventarios/articulos/${p.id_prod}/edit`;

  return layout({
    content: `
      <div class="level">
        <div class="level-left"><h1 class="title">${title}</h1></div>
        <div class="level-right"><a class="button" href="/inventarios/articulos">Volver</a></div>
      </div>

      ${errors.general ? `<div class="notification is-danger">${errors.general}</div>` : ''}

      <form method="POST" action="${action}" class="box">
        <div class="columns is-multiline">
          <div class="column is-6">
            <label class="label">Nombre</label>
            <input class="input" name="nombre_prod" required value="${p.nombre_prod || ''}">
          </div>

          <div class="column is-2">
            <label class="label">Unidad</label>
            <div class="select is-fullwidth">
              <select name="unidad_prod">
                ${UNIDADES.map(u => `<option value="${u}" ${p.unidad_prod===u?'selected':''}>${u}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="column is-4">
            <label class="label">Tipo</label>
            <div class="select is-fullwidth">
              <select name="tipo_prod">
                ${TIPOS.map(t => `<option value="${t}" ${p.tipo_prod===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="column is-3">
            <label class="label">Precio</label>
            <input class="input" type="number" step="0.01" name="precio_prod" value="${p.precio_prod ?? ''}">
          </div>

          <div class="column is-3">
            <label class="label">Stock mínimo global</label>
            <input class="input" type="number" step="0.001" name="stockMinimoGlobal_prod" value="${p.stockMinimoGlobal_prod ?? ''}">
          </div>

          <div class="column is-6">
            <label class="label">Flags</label>
            <label class="checkbox" style="margin-right:12px;">
              <input type="checkbox" name="stockeable_prod" ${p.stockeable_prod ? 'checked':''}> Stockeable
            </label>
            <label class="checkbox" style="margin-right:12px;">
              <input type="checkbox" name="vendible_prod" ${p.vendible_prod ? 'checked':''}> Vendible
            </label>
            <label class="checkbox" style="margin-right:12px;">
              <input type="checkbox" name="descuentaStockVenta_prod" ${p.descuentaStockVenta_prod ? 'checked':''}> Descuenta stock en venta
            </label>
            <label class="checkbox">
              <input type="checkbox" name="activo_prod" ${p.activo_prod ? 'checked':''}> Activo
            </label>
          </div>

          <div class="column is-12" style="display:flex;gap:8px;justify-content:flex-end;">
            <a class="button is-light" href="/admin/products">Cancelar</a>
            <button class="button is-primary">${mode==='new'?'Crear':'Guardar cambios'}</button>
          </div>
        </div>
      </form>
    `
  });
};
