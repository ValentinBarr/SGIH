// views/admin/compras/pagos/form.js

const layout = require('../../layout');

module.exports = ({ proveedores, formasDePago, errors }) => {
  return layout({
    content: `
      <section class="inventory-card">
        <h1 class="title">Nueva Orden de Pago</h1>
        
        ${errors?.general ? `<div class="notification is-danger">${errors.general}</div>` : ''}

        <form method="POST" action="/compras/pagos/new">
          <div class="columns">
            <div class="column">
              <label class="label">Proveedor</label>
              <div class="select is-fullwidth">
                <select name="id_prov" id="proveedor-select" required>
                  <option value="">Seleccione un proveedor...</option>
                  ${proveedores.map(p => `<option value="${p.id_prov}">${p.nombre_prov}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="column">
              <label class="label">Fecha de Pago</label>
              <input class="input" type="date" name="fecha_pago" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="column">
              <label class="label">Forma de Pago</label>
              <div class="select is-fullwidth">
                <select name="id_fp" required>
                  <option value="">Seleccione...</option>
                  ${formasDePago.map(fp => `<option value="${fp.id_fp}">${fp.nombre}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
          <div class="field">
            <label class="label">Observaciones</label>
            <div class="control">
              <textarea class="textarea" name="observacion" placeholder="Ej: Pago parcial de facturas de Septiembre"></textarea>
            </div>
          </div>
          
          <hr>
          
          <h2 class="subtitle is-5">Facturas Pendientes de Pago</h2>
          <div class="table-container">
            <table class="table is-fullwidth is-hoverable">
              <thead>
                <tr>
                  <th>Pagar</th>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th class="has-text-right">Total</th>
                  <th class="has-text-right">Saldo Pendiente</th>
                  <th style="width: 200px;">Monto a Pagar</th>
                </tr>
              </thead>
              <tbody id="facturas-tbody">
                <tr><td colspan="6" class="has-text-centered has-text-grey">Seleccione un proveedor para ver sus facturas pendientes.</td></tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5" class="has-text-right has-text-weight-bold">Total a Pagar:</td>
                  <td class="has-text-right has-text-weight-bold is-size-5" id="total-a-pagar">$0.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <hr>
          
          <div class="field is-grouped">
            <div class="control">
              <button class="button is-primary">Guardar Orden de Pago</button>
            </div>
            <div class="control">
              <a href="/compras/pagos" class="button is-light">Cancelar</a>
            </div>
          </div>
        </form>
      </section>

      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const proveedorSelect = document.getElementById('proveedor-select');
          const facturasTbody = document.getElementById('facturas-tbody');
          const totalCell = document.getElementById('total-a-pagar');

          // 1. FUNCIÓN PARA BUSCAR FACTURAS
          async function fetchFacturas() {
            const id_prov = proveedorSelect.value;
            facturasTbody.innerHTML = '<tr><td colspan="6" class="has-text-centered">Cargando facturas...</td></tr>';
            
            if (!id_prov) {
              facturasTbody.innerHTML = '<tr><td colspan="6" class="has-text-centered has-text-grey">Seleccione un proveedor...</td></tr>';
              updateTotal();
              return;
            }
            
            try {
              const response = await fetch(\`/api/proveedores/\${id_prov}/facturas-pendientes\`);
              if (!response.ok) throw new Error('Error al buscar facturas');
              const facturas = await response.json();
              renderFacturas(facturas);
            } catch (error) {
              facturasTbody.innerHTML = \`<tr><td colspan="6" class="has-text-centered has-text-danger">\${error.message}</td></tr>\`;
            }
          }

          // 2. FUNCIÓN PARA DIBUJAR LA TABLA DE FACTURAS
          function renderFacturas(facturas) {
            if (facturas.length === 0) {
              facturasTbody.innerHTML = '<tr><td colspan="6" class="has-text-centered">Este proveedor no tiene facturas pendientes de pago.</td></tr>';
              updateTotal();
              return;
            }
            facturasTbody.innerHTML = facturas.map(f => \`
              <tr>
                <td><input class="factura-checkbox" type="checkbox" data-id="\${f.id_comp}"></td>
                <td>\${f.letra_comp} \${f.sucursal_comp}-\${f.numero_comp}</td>
                <td>\${new Date(f.fecha).toLocaleDateString('es-AR')}</td>
                <td class="has-text-right">$ \${Number(f.total_comp).toFixed(2)}</td>
                <td class="has-text-right">$ \${Number(f.saldo_comp).toFixed(2)}</td>
                <td>
                  <input 
                    class="input is-small monto-a-pagar" 
                    type="number" 
                    name="facturas[\${f.id_comp}][monto_pagar]"
                    data-id="\${f.id_comp}"
                    max="\${f.saldo_comp}"
                    step="0.01" 
                    placeholder="0.00" 
                    disabled>
                  <input type="hidden" name="facturas[\${f.id_comp}][id_comp]" value="\${f.id_comp}" disabled>
                </td>
              </tr>
            \`).join('');
          }

          // 3. FUNCIÓN PARA CALCULAR EL TOTAL
          function updateTotal() {
            let total = 0;
            facturasTbody.querySelectorAll('.monto-a-pagar:not(:disabled)').forEach(input => {
              total += parseFloat(input.value) || 0;
            });
            totalCell.textContent = '$' + total.toFixed(2);
          }

          // --- EVENT LISTENERS (LOS "MOTORES" DE LA PÁGINA) ---

          // Al cambiar el proveedor, buscar sus facturas
          proveedorSelect.addEventListener('change', fetchFacturas);

          // Al hacer clic en la tabla (para checkboxes y montos)
          facturasTbody.addEventListener('click', (e) => {
            // Si hago clic en un checkbox
            if (e.target.classList.contains('factura-checkbox')) {
              const checkbox = e.target;
              const id = checkbox.dataset.id;
              const montoInput = facturasTbody.querySelector(\`.monto-a-pagar[data-id="\${id}"]\`);
              const hiddenIdInput = facturasTbody.querySelector(\`input[type="hidden"][name*="id_comp"][value="\${id}"]\`);
              
              if (checkbox.checked) {
                montoInput.disabled = false;
                hiddenIdInput.disabled = false;
                // Opcional: autocompletar con el saldo total
                // montoInput.value = montoInput.max; 
              } else {
                montoInput.disabled = true;
                hiddenIdInput.disabled = true;
                montoInput.value = '';
              }
              updateTotal();
            }
          });

          // Al escribir en un campo de "Monto a Pagar", recalcular el total
          facturasTbody.addEventListener('input', (e) => {
            if (e.target.classList.contains('monto-a-pagar')) {
              updateTotal();
            }
          });
        });
      </script>
    `
  });
};