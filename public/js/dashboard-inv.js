(() => {
  const $ = (s,r=document)=>r.querySelector(s);
  function fieldLine(prefix, idx){
    return `
      <div class="field has-addons mb-2" data-idx="${idx}">
        <p class="control"><span class="button is-static">Prod</span></p>
        <p class="control"><input class="input" name="${prefix}[${idx}][prodId]" placeholder="id"></p>
        <p class="control"><span class="button is-static">Qty</span></p>
        <p class="control"><input class="input" name="${prefix}[${idx}][qty]" placeholder="cantidad"></p>
        ${prefix==='itemsIn' ? `
        <p class="control"><span class="button is-static">Costo</span></p>
        <p class="control"><input class="input" name="${prefix}[${idx}][costo]" placeholder="opcional"></p>`:''}
      </div>`;
  }

  // ---- ENTRADA
  const inC = $('#in-lines'); let inIdx=0; inC.innerHTML = fieldLine('itemsIn', inIdx++);
  $('#add-in').addEventListener('click', ()=> inC.insertAdjacentHTML('beforeend', fieldLine('itemsIn', inIdx++)));

  $('#quick-in').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const depId = Number(fd.get('depId'));
    if(!depId) return flash('#msg-in', false, 'Depósito inválido');

    const items = [];
    for (let i=0;i<inIdx;i++){
      const prodId = Number(fd.get(`itemsIn[${i}][prodId]`));
      const qty    = Number(fd.get(`itemsIn[${i}][qty]`));
      const costo  = fd.get(`itemsIn[${i}][costo]`);
      if(prodId && qty>0) items.push({ prodId, qty, costo: costo?Number(costo):null });
    }
    if(!items.length) return flash('#msg-in', false, 'Agregá al menos una línea');

    const r = await fetch('/inventarios/stock/entrada', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ depId, items, nota:'Entrada rápida dashboard' })
    });
    const data = await r.json();
    flash('#msg-in', r.ok && data.ok, r.ok ? `OK Doc #${data.docId}` : (data.error||'Error'));
  });

  // ---- TRANSFER
  const trC = $('#tr-lines'); let trIdx=0; trC.innerHTML = fieldLine('itemsTr', trIdx++);
  $('#add-tr').addEventListener('click', ()=> trC.insertAdjacentHTML('beforeend', fieldLine('itemsTr', trIdx++)));

  $('#quick-tr').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const fromDepId = Number(fd.get('fromDepId'));
    const toDepId   = Number(fd.get('toDepId'));
    if(!fromDepId || !toDepId || fromDepId===toDepId) return flash('#msg-tr', false, 'Origen/Destino inválidos');

    const items = [];
    for (let i=0;i<trIdx;i++){
      const prodId = Number(fd.get(`itemsTr[${i}][prodId]`));
      const qty    = Number(fd.get(`itemsTr[${i}][qty]`));
      if(prodId && qty>0) items.push({ prodId, qty });
    }
    if(!items.length) return flash('#msg-tr', false, 'Agregá al menos una línea');

    const r = await fetch('/inventarios/stock/transfer', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ fromDepId, toDepId, items, nota:'Transfer rápida dashboard' })
    });
    const data = await r.json();
    if(!r.ok && data.faltantes){
      const msg = data.faltantes.map(f=>`${f.nombre} (${f.stock}<${f.qty})`).join(' | ');
      return flash('#msg-tr', false, 'Faltantes: ' + msg);
    }
    flash('#msg-tr', r.ok && data.ok, r.ok ? `OK Doc #${data.docId}` : (data.error||'Error'));
  });

  function flash(sel, ok, text){
    const el = $(sel);
    el.className = 'help ' + (ok?'is-success':'is-danger');
    el.textContent = text;
    el.style.display='block';
    setTimeout(()=> el.style.display='none', 3500);
  }
})();
