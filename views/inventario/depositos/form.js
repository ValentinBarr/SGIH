const layout = require('../../layout');

module.exports = ({ deposito, action }) => {
  return layout({
    content: `
      <section class="section">
        <h1 class="title">${deposito.id ? 'Editar' : 'Nuevo'} depósito</h1>
        <form method="POST" action="${action}">
          <div class="field">
            <label class="label">Tipo de depósito</label>
            <div class="control">
              <input class="input" name="tipo" value="${deposito.tipo || ''}" />
            </div>
          </div>
          <div class="field">
            <label class="label">Código</label>
            <div class="control">
              <input class="input" name="codigo" value="${deposito.codigo || ''}" />
            </div>
          </div>
          <div class="field">
            <label class="label">Nombre</label>
            <div class="control">
              <input class="input" name="nombre" value="${deposito.nombre || ''}" />
            </div>
          </div>
          <div class="field">
            <label class="checkbox">
              <input type="checkbox" name="activo" ${deposito.activo ? 'checked' : ''} />
              Activo
            </label>
          </div>
          <button class="button is-primary" type="submit">Guardar</button>
        </form>
      </section>
    `
  });
};
