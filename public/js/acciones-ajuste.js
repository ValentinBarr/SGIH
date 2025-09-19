(() => {
  const $=(s,r=document)=>r.querySelector(s);
  const depSel=$('#dep'); const lines=$('#lineas'); const msg=$('#msg');
  function flash(ok,t){ msg.className='help '+(ok?'is-success':'is-danger'); msg.textContent=t; msg.style.display='block'; setTimeout(()=>msg.style.display='none',3000); }

  let idx=0;
  function lineTpl(i){
    return `<div class="field has-addons" data-idx="${i}">
      <p class="control is-expanded"><input class="input" name="prodId[${i}]" placeholder="ID producto" required></p>
      <p class="control"><input class="input" type="number" step="1" name="qty[${i}]" placeholder="Cantidad" required></p>
      <p class="control">
        <span class="select">
          <select name="dir[${i}]"><option value="IN">IN (+)</option><option value="OUT">OUT (-)</option></select>
        </span>
      </p>
      <p class="control"><button type="button" class="button is-light js-del">✕</button></p>
    </div>`;
  }

  $('#add').addEventListener('click',()=>lines.insertAdjacentHTML('beforeend',lineTpl(idx++)));
  lines.addEventListener('click',e=>{if(e.target.classList.contains('js-del')) e.target.closest('.field').remove();});

  $('#frm-ajuste').addEventListener('submit',async e=>{
    e.preventDefault();
    const depId=depSel.value;
    if(!depId) return flash(false,'Elegí un depósito');

    const fd=new FormData(e.target); const items=[];
    for(let i=0;i<idx;i++){
      const prodId=Number(fd.get(`prodId[${i}]`));
      const qty=Number(fd.get(`qty[${i}]`));
      const dir=fd.get(`dir[${i}]`);
      if(prodId && qty>0) items.push({prodId,qty,dir});
    }
    if(!items.length) return flash(false,'Agregá al menos una línea');

    const r=await fetch('/inventarios/stock/ajuste',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({depId:Number(depId),items})});
    const data=await r.json();
    flash(r.ok&&data.ok,r.ok?`Doc #${data.docId}`:(data.error||'Error'));
  });
})();
