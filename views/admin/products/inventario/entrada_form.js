const layout = require('../layout');

module.exports = ({ deps }) => {
  const depOptions = deps.map(d => `<option value="${d.id_dep}">${d.nombre_dep}</option>`).join('');
  return layout({
    content: `
    <section class="inventory-card">
      <div class="inventory-toolbar">
        <h2 class="title is-5" style="margin:0;">Registrar entrada</h2>
        <div style="flex:1"></div>
        <a class="btn btn--subtle" href="/inventarios/dashboard">Volver</a>
      </div>

      <div class="box">
        <form id="frm-in">
          <div class="field">
            <label class="label">Depósito destino</label>
            <div class="select is-fullwidth">
              <select name="depId" id="dep" required>
                <option value="">Seleccionar…</option>
                ${depOptions}
              </select>
            </div>
          </div>

          <h4 class="title is-6">Líneas</h4>
          <div id="lineas"></div>
          <button type="button" class="button is-light is-small" id="add">+ Agregar línea</button>

          <div class="is-flex is-justify-content-flex-end mt-4">
            <button class="button is-primary">Confirmar</button>
          </div>
          <p class="help" id="msg" style="display:none"></p>
        </form>
      </div>
    </section>
    <script src="/js/acciones-entrada.js" defer></script>
    `
  });
};
