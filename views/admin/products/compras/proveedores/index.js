const layout = require('../../layout');

const fmtBool = v => v
  ? '<span class="tag is-success is-light">Sí</span>'
  : '<span class="tag is-danger is-light">No</span>';

module.exports = ({ proveedores = [], filters = {}, basePath = '/compras/proveedores' }) => {
  const f = { q:'', activo:'', ok:'', ...filters };

  const rows = proveedores.map(p => `
    <tr>
      <td>${p.id_prov}</td>
      <td>${p.nombre_prov}</td>
      <td>${p.cuit_prov}</td>
      <td>${p.email_prov || '—'}</td>
      <td>${p.telefono_prov || '—'}</td>
      <td class="has-text-centered">${fmtBool(p.activo_prov)}</td>
      <td class="is-narrow">
        <a href="/compras/proveedores/${p.id_prov}/edit" class="button is-link is-light is-small">Editar</a>
      </td>
      <td class="is-narrow">
        <button class="button is-small ${p.activo_prov ? 'is-warning' : 'is-success'} is-light is-rounded js-open-toggle" 
                data-id="${p.id_prov}" 
                data-name="${p.nombre_prov}" 
                data-action="${p.activo_prov ? 'desactivar' : 'activar'}">
          ${p.activo_prov ? 'Desactivar' : 'Activar'}
        </button>
      </td>
    </tr>
  `).join('');

  return layout({
    content: `
    <section class="inventory-card">
      ${f.ok === 'created' ? `<div class="notification is-success">✅ Proveedor creado</div>` : ''}
      ${f.ok === 'updated' ? `<div class="notification is-success">✅ Proveedor actualizado</div>` : ''}
      ${f.ok === 'toggled' ? `<div class="notification is-success">✅ Estado actualizado</div>` : ''}

      <div class="inventory-toolbar">
        <div style="flex: 1"></div>
        <a href="/compras/proveedores/new" class="btn btn--primary">
          <span class="icon"><i class="fas fa-plus"></i></span>
          Nuevo Proveedor
        </a>
      </div>

      <form method="GET" action="${basePath}" class="filters-bar">
        <div>
          <label class="label">Buscar</label>
          <input class="input" name="q" placeholder="ID, nombre o CUIT" value="${f.q}">
        </div>
        <div>
          <label class="label">Activo</label>
          <div class="select is-fullwidth">
            <select name="activo" onchange="this.form.submit()">
              <option value="">Todos</option>
              <option value="1" ${f.activo === '1' ? 'selected' : ''}>Sí</option>
              <option value="0" ${f.activo === '0' ? 'selected' : ''}>No</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn--subtle btn-apply" type="submit">
            <span class="icon"><i class="fas fa-filter"></i></span>Aplicar
          </button>
          <a class="btn btn-clear" href="${basePath}">Limpiar</a>
        </div>
      </form>

      <div class="table-container" style="box-shadow:none;border:0;padding:0;margin-top:8px;">
        <table class="table is-fullwidth">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>CUIT</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th class="has-text-centered">Activo</th>
              <th colspan="2" class="has-text-centered">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="8" class="has-text-centered has-text-grey">Sin proveedores</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Modal toggle -->
    <div class="modal" id="toggle-modal">
      <div class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Confirmar acción</p>
          <button class="delete js-close-modal" aria-label="close"></button>
        </header>
        <section class="modal-card-body">
          <p id="toggle-msg">¿Seguro que deseas cambiar el estado?</p>
        </section>
        <footer class="modal-card-foot">
          <form id="toggle-form" method="POST">
            <button class="button" id="toggle-btn">Confirmar</button>
          </form>
          <button class="button js-close-modal">Cancelar</button>
        </footer>
      </div>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', () => {
      const modal = document.getElementById('toggle-modal');
      const msg = document.getElementById('toggle-msg');
      const form = document.getElementById('toggle-form');
      const btn = document.getElementById('toggle-btn');

      document.querySelectorAll('.js-open-toggle').forEach(el => {
        el.addEventListener('click', () => {
          const id = el.dataset.id;
          const name = el.dataset.name;
          const action = el.dataset.action;

          msg.textContent = '⚠️ ¿Seguro que deseas ' + action + ' el proveedor #' + id + ' (' + name + ')?';
          form.action = '/compras/proveedores/' + id + '/toggle';

          if (action === 'desactivar') {
            btn.className = 'button is-warning';
            btn.textContent = 'Desactivar';
          } else {
            btn.className = 'button is-success';
            btn.textContent = 'Activar';
          }
          modal.classList.add('is-active');
        });
      });
      document.querySelectorAll('.js-close-modal').forEach(b => {
        b.addEventListener('click', () => modal.classList.remove('is-active'));
      });
    });
    </script>
    `
  });
};
