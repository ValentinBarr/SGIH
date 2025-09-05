const layout = require('../layout');

module.exports = ({ deps, depSel }) => {
  const depOpts = deps.map(d => `
    <option value="${d.id_dep}" ${String(depSel)===String(d.id_dep)?'selected':''}>
      ${d.nombre_dep}
    </option>`).join('');

  return layout({
    content: `
<section class="inventory-card">
  <div class="inventory-toolbar">
    <h2 class="title is-5">Conteo de inventario</h2>
    <div style="flex:1"></div>
    <a class="btn btn--subtle" href="/inventarios/depositos/${depSel}">Volver</a>
  </div>

  <div class="box">
    <form id="frm-conteo">
      <div class="field">
        <label class="label">Depósito</label>
        <div class="select is-fullwidth">
          <select name="depId" id="dep" required>
            <option value="">Seleccionar…</option>
            ${depOpts}
          </select>
        </div>
      </div>

      <h4 class="title is-6">Productos</h4>
      <div id="lineas"></div>
      <button type="button" class="button is-light is-small" id="add">+ Agregar producto</button>

      <div class="is-flex is-justify-content-flex-end mt-4">
        <button class="button is-warning">Confirmar Conteo</button>
      </div>
      <p class="help" id="msg" style="display:none"></p>
    </form>
  </div>
</section>
<script src="/js/acciones-conteo.js" defer></script>
`
  });
};
