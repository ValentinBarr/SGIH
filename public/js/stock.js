(() => {
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

  const msg = $('#stock-msg');
  function flash(type, text){
    msg.className = 'help ' + (type==='ok' ? 'is-success':'is-danger');
    msg.textContent = text;
    msg.style.display = 'block';
    setTimeout(()=> msg.style.display='none', 4000);
  }

  function selectedItems() {
    const items = [];
    $$('#stock-table tbody tr').forEach(tr => {
      const chk = tr.querySelector('.js-pick');
      const qty = tr.querySelector('.js-qty');
      if (chk && chk.checked) {
        const prodId = Number(tr.dataset.prod);
        const depId = Number(tr.dataset.dep);
        const q = Math.max(0, Number(qty.value || 0));
        if (q > 0) items.push({ prodId, depId, qty: q });
      }
    });
    return items;
  }

  // Transferencia sugerida: usa origen/destino ingresados
  $('#btn-transfer')?.addEventListener('click', async () => {
    const fromDepId = Number($('#fromDep').value);
    const toDepId   = Number($('#toDep').value);
    if (!fromDepId || !toDepId) return flash('err','Ingresá IDs de origen y destino');
    const picks = selectedItems();
    if (!picks.length) return flash('err','Seleccioná filas (check) y cantidad > 0');

    // agrupamos por prodId, suma de qty
    const map = new Map();
    for (const it of picks) {
      const prev = map.get(it.prodId) || 0;
      map.set(it.prodId, prev + it.qty);
    }
    const items = Array.from(map.entries()).map(([prodId, qty]) => ({ prodId, qty }));

    const r = await fetch('/inventarios/stock/transfer', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ fromDepId, toDepId, items })
    });
    const data = await r.json();
    if (!r.ok || !data.ok) {
      const reason = data.faltantes?.map(f => `${f.nombre} (${f.stock} < ${f.qty})`).join(' | ') || data.error || 'Error';
      return flash('err','No se pudo transferir: ' + reason);
    }
    flash('ok', `Transferencia creada. Doc #${data.docId}`);
  });

  // Entrada directa al depósito de cada fila (usa el depId de la fila)
  $('#btn-entrada')?.addEventListener('click', async () => {
    const picks = selectedItems();
    if (!picks.length) return flash('err','Seleccioná filas (check) y cantidad > 0');

    // por simplicidad: agrupamos por depósito y disparamos una entrada por depósito
    const byDep = new Map();
    for (const it of picks) {
      const arr = byDep.get(it.depId) || [];
      arr.push({ prodId: it.prodId, qty: it.qty });
      byDep.set(it.depId, arr);
    }

    for (const [depId, items] of byDep.entries()) {
      const r = await fetch('/inventarios/stock/entrada', {
        method: 'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ depId, items, nota: 'Entrada rápida desde stock' })
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        return flash('err', `Error en entrada (dep ${depId}): ` + (data.error || ''));
      }
      flash('ok', `Entrada registrada (dep ${depId}). Doc #${data.docId}`);
    }
  });
})();
