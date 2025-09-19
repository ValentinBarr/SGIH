(() => {
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

  const depId = window.__DEP_ID__;
  const msg = $('#msg');

  function flash(ok, text){
    msg.className = 'help ' + (ok ? 'is-success' : 'is-danger');
    msg.textContent = text;
    msg.style.display = 'block';
    setTimeout(()=> msg.style.display='none', 2500);
  }

  // Guardar una fila (parámetros)
  async function saveRow(tr){
    const prodId = Number(tr.dataset.prod);
    const minimo = tr.querySelector('.js-min').value;
    const par = tr.querySelector('.js-par').value;
    const max = tr.querySelector('.js-max').value;
    const ubicacion = tr.querySelector('.js-ubi').value;

    const r = await fetch(`/inventarios/depositos/${depId}/param`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ prodId, minimo, par, max, ubicacion }),
    });
    const data = await r.json();
    if (!r.ok || !data.ok) return flash(false, data.error || 'Error al guardar');
    flash(true, 'Parámetros guardados');
  }

  $('#grid')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('js-save')) {
      saveRow(e.target.closest('tr'));
    }
  });

  // Filtros: redirige con querystring
  $('#btn-apply')?.addEventListener('click', () => {
    const tipo = $('#f-tipo').value;
    const low = $('#f-low').value;
    const q = new URLSearchParams();
    if (tipo) q.set('tipo', tipo);
    if (low) q.set('soloBajo', low);
    location.search = q.toString();
  });
})();
