const layout = require('../layout');

module.exports = ({ deps }) => {
  const opts = deps.map(d => `<option value="${d.id_dep}">${d.nombre_dep}</option>`).join('');
  return layout({
    content: `
    <section class="inventory-card">
      <div class="inventory-toolbar">
        <h2 class="title is-5" style="margin:0;">Transferencia</h2>
        <div style="flex:1"></div>
        <a class="btn btn--subtle" href="/inventarios/dashboard">Volver</a>
      </div>

      <div class="box">
        <form id="frm-tr">
          <div class="columns">
            <div class="column">
              <label class="label">Origen</label>
              <div class="select is-fullwidth">
                <select name="fromDepId" id="from" required>
                  <option value="">Seleccionar…</option>
                  ${opts}
                </select>
              </div>
            </div>
            <div class="column">
              <label class="label">Destino</label>
              <div class="select is-fullwidth">
                <select name="toDepId" id="to" required>
                  <option value="">Seleccionar…</option>
                  ${opts}
                </select>
              </div>
            </div>
          </div>

          <h4 class="title is-6">Líneas</h4>
          <div id="lineas"></div>
          <button type="button" class="button is-light is-small" id="add">+ Agregar línea</button>

          <div class="is-flex is-justify-content-flex-end mt-4">
            <button class="button is-link">Confirmar</button>
          </div>
          <p class="help" id="msg" style="display:none"></p>
        </form>
      </div>
    </section>
    <script src="/js/acciones-transfer.js" defer></script>
    `
  });
};
