(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const depSel = $('#pos-dep');
  const note = $('#pos-note');
  const tbody = $('#cart-body');
  const totalEl = $('#pos-total');
  const errorEl = $('#pos-error');
  const okEl = $('#pos-ok');
  const search = $('#pos-search');

  const cart = new Map(); // key: prodId, value: {name, price, qty}

  function money(n) {
    return (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderCart() {
    tbody.innerHTML = '';
    if (cart.size === 0) {
      tbody.innerHTML = `<tr class="is-empty"><td colspan="5" class="has-text-grey has-text-centered">Sin items</td></tr>`;
      totalEl.textContent = '$0.00';
      return;
    }
    let total = 0;
    for (const [id, it] of cart) {
      const line = it.price * it.qty;
      total += line;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${it.name}</td>
        <td class="has-text-centered">
          <div class="field has-addons is-justify-content-center">
            <p class="control"><button class="button is-small js-minus" data-id="${id}">-</button></p>
            <p class="control"><input class="input is-small js-qty" data-id="${id}" style="width:56px" type="number" min="1" step="1" value="${it.qty}"></p>
            <p class="control"><button class="button is-small js-plus" data-id="${id}">+</button></p>
          </div>
        </td>
        <td class="has-text-right">$${money(it.price)}</td>
        <td class="has-text-right">$${money(line)}</td>
        <td class="is-narrow"><button class="button is-small is-danger js-del" data-id="${id}"><i class="fas fa-times"></i></button></td>
      `;
      tbody.appendChild(tr);
    }
    totalEl.textContent = '$' + money(total);
  }

  function addProductRowEvents() {
    $$('#pos-products .js-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        const row = btn.closest('tr');
        const name = row.children[1].textContent.trim();
        const price = Number(row.dataset.price || 0);
        const it = cart.get(id) || { name, price, qty: 0 };
        it.qty += 1;
        cart.set(id, it);
        renderCart();
      });
    });
  }

  // qty controls
  tbody.addEventListener('click', (e) => {
    const id = Number(e.target?.dataset?.id);
    if (e.target.classList.contains('js-plus')) {
      const it = cart.get(id); it.qty += 1; cart.set(id, it); renderCart();
    }
    if (e.target.classList.contains('js-minus')) {
      const it = cart.get(id); it.qty = Math.max(1, it.qty - 1); cart.set(id, it); renderCart();
    }
    if (e.target.classList.contains('js-del')) {
      cart.delete(id); renderCart();
    }
  });

  tbody.addEventListener('change', (e) => {
    if (e.target.classList.contains('js-qty')) {
      const id = Number(e.target.dataset.id);
      const it = cart.get(id);
      const v = Math.max(1, Number(e.target.value || 1));
      it.qty = v; cart.set(id, it); renderCart();
    }
  });

  // filtro de productos en la tabla (simple contains)
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    $$('#pos-products tbody tr').forEach(tr => {
      const name = tr.children[1].textContent.toLowerCase();
      tr.style.display = name.includes(q) ? '' : 'none';
    });
  });

  function flash(el, msg) {
    okEl.style.display = 'none';
    errorEl.style.display = 'none';
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => (el.style.display = 'none'), 4000);
  }

  async function checkStock() {
    const depId = Number(depSel.value);
    const items = Array.from(cart.entries()).map(([prodId, it]) => ({
      prodId, qty: it.qty,
    }));
    const r = await fetch('/pos/check', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depId, items }),
    });
    return r.json();
  }

  $('#pos-pay').addEventListener('click', async () => {
    if (cart.size === 0) return flash(errorEl, 'Agregá al menos un producto.');
    const depId = Number(depSel.value);
    // 1) validar
    const res = await checkStock();
    if (!res.ok) {
      const msg = res.faltantes.map(f => `${f.nombre}: stock ${f.stock}, pedido ${f.qty}`).join(' | ');
      return flash(errorEl, 'Sin stock suficiente → ' + msg);
    }
    // 2) checkout
    const payload = {
      depId,
      nota: note.value || 'Ticket POS',
      items: Array.from(cart.entries()).map(([prodId, it]) => ({ prodId, qty: it.qty })),
    };
    const r = await fetch('/pos/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!data.ok) {
      return flash(errorEl, data.error || 'Error al procesar el pago');
    }
    cart.clear(); renderCart();
    flash(okEl, `Venta registrada. Doc #${data.docId}`);
  });

  // arrancar
  addProductRowEvents();
})();
