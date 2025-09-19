(() => {
  const $ = (s,r=document)=>r.querySelector(s);
  const msg = $('#msg');
  function flash(ok,t){ msg.className='help '+(ok?'is-success':'is-danger'); msg.textContent=t; msg.style.display='block'; setTimeout(()=>msg.style.display='none',3000); }

  const fromSel = $('#from'); const toSel = $('#to'); const lines = $('#lineas');
  let cache = {}; let idx=0;

  async function loadProductos(depId){
    if(!depId) return [];
    if(cache[depId]) return cache[depId];
    const r = await fetch(`/api/depositos/${depId}/productos`);
    const data = await r.json();
    cache[depId] = data.map(p=>({ id:p.id, nombre:p.nombre, uom:p.uom }));
    return cache[depId];
  }

  function lineTpl(i, items){
    const opts = items.map(p=>`<option value="${p.id}">${p.nombre} (${p.uom})</option>`).join('');
    return `
      <div class="field has-addons" data-idx="${i}">
        <p class="control is-expanded"><span class="select is-fullwidth">
            <select name="prodId[${i}]" required><option value="">Producto…</option>${opts}</select>
        </span></p>
        <p class="control"><input class="input" name="qty[${i}]" type="number" step="1" min="1" placeholder="Qty" required></p>
        <p class="control"><button class="button is-light js-del" type="button">✕</button></p>
      </div>`;
  }

  $('#add').addEventListener('click', async ()=>{
    const depId = fromSel.value;
    if(!depId) return flash(false,'Elegí el depósito ORIGEN primero');
    const items = await loadProductos(depId);
    if(!items.length) return flash(false,'El origen no tiene productos permitidos');
    lines.insertAdjacentHTML('beforeend', lineTpl(idx++, items));
  });

  lines.addEventListener('click', (e)=>{
    if(e.target.classList.contains('js-del')) e.target.closest('.field').remove();
  });

  fromSel.addEventListener('change', ()=> { lines.innerHTML=''; idx=0; });

  $('#frm-tr').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fromDepId = Number(fromSel.value);
    const toDepId   = Number(toSel.value);
    if(!fromDepId || !toDepId || fromDepId===toDepId) return flash(false,'Revisá depósitos origen/destino');

    const fd=new FormData(e.target); const items=[];
    for(let i=0;i<idx;i++){
      const prodId=Number(fd.get(`prodId[${i}]`)); const qty=Number(fd.get(`qty[${i}]`));
      if(prodId && qty>0) items.push({ prodId, qty });
    }
    if(!items.length) return flash(false,'Agregá al menos una línea');

    const r = await fetch('/inventarios/stock/transfer', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ fromDepId, toDepId, items, nota:'Transfer desde formulario' })
    });
    const data = await r.json();

    if(!r.ok && data.faltantes){
      const s = data.faltantes.map(f=>`${f.nombre}: stock ${f.stock} < qty ${f.qty}`).join(' | ');
      return flash(false, 'Faltantes: '+s);
    }
    flash(r.ok && data.ok, r.ok ? `OK Doc #${data.docId}` : (data.error||'Error'));
    if (r.ok) { e.target.reset(); lines.innerHTML=''; idx=0; }
  });
})();
