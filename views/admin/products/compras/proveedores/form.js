const layout = require('../../layout');

module.exports = ({ mode = 'new', proveedor = {}, errors = {} }) => {
  const isEdit = mode === 'edit';
  const title = isEdit ? `Editar proveedor #${proveedor.id_prov}` : 'Nuevo proveedor';

  const val = (k, d='') => (proveedor?.[k] ?? d);

  const err = (k) => errors?.[k] ? `<p class="help is-danger">${errors[k]}</p>` : '';

  return layout({
    content: `
    <section class="inventory-card">
      ${errors.general ? `<div class="notification is-danger">❌ ${errors.general}</div>` : ''}

      <h2 class="title is-5">${title}</h2>

      <form method="POST" action="${isEdit ? '/compras/proveedores/'+proveedor.id_prov+'/edit' : '/compras/proveedores/new'}" class="form">
        <div class="columns is-multiline">
          <div class="column is-6">
            <label class="label">Nombre *</label>
            <input class="input" name="nombre_prov" value="${val('nombre_prov','')}" required>
            ${err('nombre_prov')}
          </div>

          <div class="column is-6">
            <label class="label">CUIT *</label>
            <input class="input" name="cuit_prov" value="${val('cuit_prov','')}" required>
            ${err('cuit_prov')}
          </div>

          <div class="column is-6">
            <label class="label">Email</label>
            <input class="input" type="email" name="email_prov" value="${val('email_prov','')}">
          </div>

          <div class="column is-6">
            <label class="label">Teléfono</label>
            <input class="input" name="telefono_prov" value="${val('telefono_prov','')}">
          </div>

          <div class="column is-12">
            <label class="label">Dirección</label>
            <input class="input" name="direccion_prov" value="${val('direccion_prov','')}">
          </div>

          <div class="column is-12">
            <label class="checkbox">
              <input type="checkbox" name="activo_prov" ${val('activo_prov', true) ? 'checked' : ''}>
              Activo
            </label>
          </div>
        </div>

        <div class="buttons">
          <button class="button is-primary">${isEdit ? 'Guardar cambios' : 'Crear'}</button>
          <a class="button" href="/compras/proveedores">Cancelar</a>
        </div>
      </form>
    </section>
    `
  });
};
