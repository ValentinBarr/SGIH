(() => {
  const $ = (s,r=document)=>r.querySelector(s);
  const depSel = $('#dep');
  const body = $('#cart-body');
  const totalEl = $('#cart-total');
  const payBtn = $('#btn-pay');
  const msg = $('#msg');

  let cart = []; // {id, nombre, uom, precio?, qty}

  function flash(ok, t){
    msg.className = 'help ' + (ok?'is-success':'is-danger');
    msg.textContent = t;
    msg.style.display = 'block';
    setTimeout(()=> msg.style.display='none', 3000);
  }

  function render(){
    if (!cart.length) {
      body.innerHTML = '<tr><td colspan="5" class="has-text-grey has-text-centered">Sin items</td></tr>';
      totalEl.textContent = '$0.00';
      payBtn.disabled = true;
      return;
    }
    const rows = cart.map(i => {
      const pu = i.precio ? Number(i.precio) : 0;
      const t = pu * i.qty;
      return `<tr>
        <td>${i.nombre}</td>
        <td class="has-text-centered">
          <div class="qty-box">
            <button class="button is-small is-light js-dec" data-id="${i.id}">-</button>
            <input class="input is-small js-qty" style="width:56px;text-align:center" type="number" min="1" step="1" value="${i.qty}" data-id="${i.id}">
            <button class="button is-small is-light js-inc" data-id="${i.id}">+</button>
          </div>
        </td>
        <td class="has-text-right">${pu ? '$'+pu.toFixed(2) : '—'}</td>
        <td class="has-text-right">${pu ? '$'+t.toFixed(2) : '—'}</td>
        <td class="has-text-right"><button class="button is-small is-light js-del" data-id="${i.id}">✕</button></td>
      </tr>`;
    }).join('');
    body.innerHTML = rows;

    const total = cart.reduce((a,i)=> a + (i.precio?Number(i.precio):0) * i.qty, 0);
    totalEl.textContent = '$' + total.toFixed(2);
    payBtn.disabled = !depSel.value || !cart.length;
  }

  // agregar desde catálogo
  document.addEventListener('click',(e)=>{
    if(e.target.classList.contains('js-add')){
      if(!depSel.value) return flash(false,'Elegí el Depósito POS primero');
      const host = e.target.closest('.pos-item');
      const id = Number(host.dataset.id);
      const found = cart.find(i=>i.id===id);
      if(found){ found.qty++; } else {
        cart.push({ id, nombre: host.dataset.nombre, uom: host.dataset.uom || 'UN', precio: host.dataset.precio || null, qty:1 });
      }
      render();
    }
  });

  // eventos del carrito
  body.addEventListener('click',(e)=>{
    const id = Number(e.target.dataset.id);
    if(e.target.classList.contains('js-del')){
      cart = cart.filter(i=>i.id!==id);
      render();
    }
    if(e.target.classList.contains('js-inc')){
      const it = cart.find(i=>i.id===id); if(it){ it.qty++; render(); }
    }
    if(e.target.classList.contains('js-dec')){
      const it = cart.find(i=>i.id===id); if(it){ it.qty = Math.max(1, it.qty-1); render(); }
    }
  });
  body.addEventListener('change',(e)=>{
    if(e.target.classList.contains('js-qty')){
      const id = Number(e.target.dataset.id);
      const it = cart.find(i=>i.id===id);
      if(it){ it.qty = Math.max(1, Number(e.target.value)||1); render(); }
    }
  });

  depSel.addEventListener('change', render);

  // checkout
  payBtn.addEventListener('click', async ()=>{
    const depId = depSel.value;
    if(!depId || !cart.length) return;

    const items = cart.map(i => ({ prodId: i.id, qty: i.qty, uom: i.uom }));
    const r = await fetch('/pos/checkout', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ depId: Number(depId), items })
    });
    const data = await r.json();

    if (!r.ok) {
      if (data.faltantes) {
        const txt = data.faltantes.map(f=>`${f.nombre}: stock ${f.stock} < qty ${f.qty}`).join(' | ');
        return flash(false, 'Faltantes: ' + txt);
      }
      return flash(false, data.error || 'Error al procesar');
    }
    flash(true, `Venta registrada. Doc #${data.docId}`);
    cart = []; render();
  });

  // init
  render();
})();
