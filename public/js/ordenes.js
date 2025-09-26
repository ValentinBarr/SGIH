document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('details-tbody');
  const addBtn = document.getElementById('add-row-btn');
  const totalCell = document.getElementById('total-cell');

  function updateTotals() {
    let total = 0;
    tbody.querySelectorAll('.detail-row').forEach(row => {
      const cantidad = parseFloat(row.querySelector('.cantidad-input')?.value) || 0;
      const precio = parseFloat(row.querySelector('.precio-input')?.value) || 0;
      const subtotal = cantidad * precio;
      row.querySelector('.subtotal-cell').textContent = '$' + subtotal.toFixed(2);
      total += subtotal;
    });
    totalCell.textContent = '$' + total.toFixed(2);
  }

  addBtn.addEventListener('click', () => {
    const template = document.getElementById('template-row');
    const newRow = template.cloneNode(true);
    newRow.removeAttribute('id');
    newRow.style.display = 'table-row';
    tbody.appendChild(newRow);
  });

  tbody.addEventListener('input', updateTotals);
  tbody.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-row-btn')) {
      e.target.closest('tr.detail-row').remove();
      updateTotals();
    }
  });

  updateTotals();
});
