(() => {
  const $ = (s,r=document)=>r.querySelector(s);

  let productos = []; // cache por depósito
  const lines = $('#lineas');
  const depSel = $('#dep');
  const msg = $('#msg');

  function flash(ok, t){
    msg.className = 'help ' + (ok?'is-success':'is-danger');
    msg.textContent = t;
    msg.style.display = 'block';
    setTimeout(()=> msg.style.display='none', 3000);
  }

  function lineTpl(idx, items) {
    const opts = items.map(p => `<option value="${p.id}">${p.nombre} (${p.uom})</option>`).join('');
    return `
      <div class="field has-addons" data-idx="${idx}">
        <p class="control is-expanded">
          <span class="select is-fullwidth">
            <select name="prodId[${idx}]" class="js-prod" required>
              <option value="">Producto…</option>${opts}
            </select>
          </span>
        </p>
        <p class="control"><input class="input" name="qty[${idx}]" type="number" step="1" min="1" placeholder="Qty" required></p>
        <p class="control"><button class="button is-light js-del" type="button">✕</button></p>
      </div>`;
  }

  async function loadProductos(depId){
    if (!depId) return [];
    if (productos[depId]) return productos[depId];
    const r = await fetch(`/api/depositos/${depId}/productos`);
    const data = await r.json();
    productos[depId] = data.map(p=>({ id:p.id, nombre:p.nombre, uom:p.uom }));
    return productos[depId];
  }

  let idx=0;
  $('#add').addEventListener('click', async () => {
    const depId = depSel.value;
    if(!depId) return flash(false,'Seleccioná un depósito primero');
    const items = await loadProductos(depId);
    if(!items.length) return flash(false,'No hay productos permitidos para este depósito');
    lines.insertAdjacentHTML('beforeend', lineTpl(idx++, items));
  });

  lines.addEventListener('click', (e)=>{
    if(e.target.classList.contains('js-del')) e.target.closest('.field').remove();
  });

  depSel.addEventListener('change', ()=> { lines.innerHTML=''; idx=0; });

  $('#frm-in').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const depId = depSel.value;
    if(!depId) return;

    const fd = new FormData(e.target);
    const items = [];
    for (let i=0;i<idx;i++){
      const prodId = Number(fd.get(`prodId[${i}]`));
      const qty    = Number(fd.get(`qty[${i}]`));
      if (prodId && qty>0) items.push({ prodId, qty });
    }
    if(!items.length) return flash(false,'Agregá al menos una línea');

    const r = await fetch('/inventarios/stock/entrada', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ depId: Number(depId), items, nota: 'Entrada desde formulario' })
    });
    const data = await r.json();
    flash(r.ok && data.ok, r.ok ? `OK Doc #${data.docId}` : (data.error||'Error'));
    if (r.ok) { e.target.reset(); lines.innerHTML=''; idx=0; }
  });
})();
