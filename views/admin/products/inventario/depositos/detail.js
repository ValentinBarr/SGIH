const layout = require('../../layout');

module.exports = ({ dep, grid, movimientos, productos, tiposComprobantes, tiposMovimientos, pagination, error }) => {
  const totalProds = pagination?.total || grid.length;
  const bajos = grid.filter(r => r.estado === 'Bajo').length;
  const ultimosMovs = movimientos.length;

  return layout({
    content: `
      <link rel="stylesheet" href="/css/deposito-detail.css" />
      
      <section class="section">
        <div class="container is-max-desktop"> 
          
        ${error ? `
            <div class="notification is-danger is-light mb-5">
              <button class="delete"></button>
              <strong>Error al registrar:</strong> ${error}
            </div>
          ` : ''}

          <div class="box p-5 mb-6 has-background-white">
            <div class="level is-mobile mb-4">
              <div class="level-left">
                <div class="level-item">
                  <h1 class="title is-3 is-capitalized mb-0">${dep.nombre_dep}</h1>
                </div>
              </div>
              <div class="level-right">
                <div class="level-item">
                  <span class="tag is-info is-light is-medium">
                    <span class="icon is-small"><i class="fas fa-warehouse"></i></span>
                    <span>${dep.TipoDeposito?.nombre_tipoDep || 'N/A'}</span>
                  </span>
                </div>
              </div>
            </div>
            ${dep.ubicacion_dep ? `
            <p class="subtitle is-6 has-text-grey">
              <span class="icon-text">
                <span class="icon is-small"><i class="fas fa-map-marker-alt"></i></span>
                <span>Ubicación: ${dep.ubicacion_dep}</span>
              </span>
            </p>
            ` : ''}
            <hr class="my-3">

            <div class="buttons is-centered">
              <button 
                class="button is-primary is-large has-text-weight-bold"
                onclick="abrirModalMovimiento()">
                <span class="icon"><i class="fas fa-exchange-alt"></i></span>
                <span>Registrar Movimiento</span>
              </button>
              <a href="/inventarios/depositos/${dep.id_dep}/parametros" 
                class="button is-info is-large has-text-weight-bold">
                <span class="icon"><i class="fas fa-cog"></i></span>
                <span>Parámetros</span>
              </a>
            </div>
          </div>

          <div class="columns is-multiline is-variable is-4 mb-6">
            <div class="column is-one-third-desktop is-half-tablet">
              <div class="box has-background-primary-light has-text-centered p-4">
                <p class="heading has-text-primary">PRODUCTOS REGISTRADOS</p>
                <p class="title is-4 has-text-primary-dark">${totalProds}</p>
              </div>
            </div>
            <div class="column is-one-third-desktop is-half-tablet">
              <div class="box has-background-warning-light has-text-centered p-4">
                <p class="heading has-text-warning">STOCK BAJO</p>
                <p class="title is-4 has-text-warning-dark">${bajos}</p>
              </div>
            </div>
            <div class="column is-one-third-desktop is-full-tablet">
              <div class="box has-background-info-light has-text-centered p-4">
                <p class="heading has-text-info">ÚLTIMOS MOVIMIENTOS</p>
                <p class="title is-4 has-text-info-dark">${ultimosMovs}</p>
              </div>
            </div>
          </div>

          <div class="columns is-multiline is-variable is-4">
            
            <div class="column is-full-desktop is-half-tablet">
              <div class="box">
                <div class="mb-5">
                  <h4 class="title is-4">
                    <span class="icon-text">
                      <span class="icon"><i class="fas fa-boxes"></i></span>
                      <span>Stock Actual</span>
                    </span>
                  </h4>
                  <div class="field mt-4">
                    <div class="control has-icons-left">
                      <input 
                        type="text" 
                        id="stockFilter" 
                        class="input is-medium is-rounded" 
                        placeholder="Filtrar productos..." 
                        onkeyup="filtrarStock()">
                      <span class="icon is-left is-medium"><i class="fas fa-search"></i></span>
                    </div>
                  </div>
                </div>
                <div class="table-container">
                  <table class="table is-fullwidth is-hoverable is-striped" id="stockTable">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th class="has-text-centered">Stock</th>
                        <th class="has-text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${grid.length ? grid.map(r => `
                        <tr>
                          <td>${r.nombre}</td>
                          <td class="has-text-centered has-text-weight-bold">${r.stock}</td>
                          <td class="has-text-right">
                            <span class="tag is-medium ${r.estado === 'Bajo' ? 'is-danger' : 'is-success'}">
                              ${r.estado === 'Bajo' ? '<span class="icon"><i class="fas fa-minus-circle"></i></span>' : '<span class="icon"><i class="fas fa-check-circle"></i></span>'}
                              <span>${r.estado}</span>
                            </span>
                          </td>
                        </tr>
                      `).join('') : `
                        <tr><td colspan="3" class="has-text-centered py-5 has-text-grey">No hay productos registrados en este depósito.</td></tr>
                      `}
                    </tbody>
                  </table>
                </div>
                ${pagination && pagination.pages > 1 ? `
                <nav class="pagination is-centered mt-5" role="navigation">
                  <ul class="pagination-list" style="list-style:none; margin:0; padding:0;">
                    ${Array.from({ length: pagination.pages }, (_, i) => `
                      <li>
                        <a href="/inventarios/depositos/${dep.id_dep}?page=${i+1}"
                          class="pagination-link ${pagination.page === i+1 ? 'is-current has-background-link' : ''}">
                          ${i+1}
                        </a>
                      </li>
                    `).join('')}
                  </ul>
                </nav>
                ` : ''}
              </div>
            </div>

            <div class="column is-full-desktop is-half-tablet">
              <div class="box">
                <div class="mb-5">
                  <h4 class="title is-4">
                    <span class="icon-text">
                      <span class="icon"><i class="fas fa-history"></i></span>
                      <span>Historial de Movimientos</span>
                    </span>
                  </h4>
                </div>
                <div class="table-container" style="max-height: 575px; overflow-y: auto;">
                  <table class="table is-fullwidth is-hoverable is-striped">
                    <thead>
                      <tr>
                        <th class="has-text-grey">Fecha</th>
                        <th class="has-text-grey">Tipo</th>
                        <th class="has-text-grey">Productos Detallados</th>
                        <th class="has-text-grey">Observación</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${movimientos.length ? movimientos.map(m => `
                        <tr>
                          <td>${new Date(m.fecha_mov).toLocaleDateString()}</td>
                          <td>
                            <span class="tag is-medium is-light ${m.TipoMovimiento?.direccion === 'IN' ? 'is-success' : 'is-danger'}">
                              <span class="icon is-small">
                                <i class="fas ${m.TipoMovimiento?.direccion === 'IN' ? 'fa-arrow-circle-down' : 'fa-arrow-circle-up'}"></i>
                              </span>
                              <span>${m.TipoMovimiento?.nombre || '-'}</span>
                            </span>
                          </td>
                          <td>
                            <div class="tags">
                              ${m.Detalles.map(d => `
                                <span class="tag is-info is-light">
                                  ${d.ProductoDeposito.Producto.nombre_prod} 
                                  <span class="has-text-weight-bold ml-1">(${d.cantidad})</span>
                                </span>
                              `).join('')}
                            </div>
                          </td>
                          <td>${m.observacion || '<span class="has-text-grey-light is-italic">Sin observación</span>'}</td>
                        </tr>
                      `).join('') : `
                        <tr><td colspan="4" class="has-text-centered py-5 has-text-grey">No hay movimientos registrados para este depósito.</td></tr>
                      `}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          <!-- Modal Unificado de Movimientos -->
          <div class="modal" id="movimientoModal">
            <div class="modal-background"></div>
            <div class="modal-card">
              <header class="modal-card-head has-background-primary-light">
                <p class="modal-card-title has-text-primary-dark">
                  <span class="icon mr-2"><i class="fas fa-exchange-alt"></i></span>
                  Registrar Movimiento
                </p>
                <button class="delete" aria-label="close" onclick="cerrarModalMovimiento()"></button>
              </header>
              <section class="modal-card-body">
                <form method="POST" action="/inventarios/depositos/${dep.id_dep}/movimientos" id="formMovimiento">
                  
                  <!-- Selector de Tipo de Movimiento -->
                  <div class="field">
                    <label class="label">Tipo de Movimiento *</label>
                    <div class="control">
                      <div class="select is-fullwidth is-rounded">
                        <select name="id_tipoMov" id="tipoMovSelect" required onchange="cambiarTipoMovimiento()">
                          <option value="">Seleccione un tipo de movimiento</option>
                          ${tiposMovimientos && tiposMovimientos.length ? tiposMovimientos.map(tm => `
                            <option value="${tm.id_tipoMov}" data-direccion="${tm.direccion}">
                              ${tm.direccion === 'IN' ? '📥' : '📤'} ${tm.nombre}
                            </option>
                          `).join('') : '<option value="">No hay tipos de movimientos disponibles</option>'}
                        </select>
                      </div>
                    </div>
                    <p class="help" id="tipoMovHelp">Seleccione el tipo de movimiento que desea registrar</p>
                  </div>

                  <!-- Tipo de Comprobante (solo para entradas) -->
                  <div class="field" id="tipoCompField" style="display: none;">
                    <label class="label">Tipo de Comprobante</label>
                    <div class="control">
                      <div class="select is-fullwidth is-rounded">
                        <select name="id_tipoComp" id="tipoCompSelect">
                          <option value="">Sin comprobante</option>
                          ${tiposComprobantes && tiposComprobantes.length ? tiposComprobantes.map(tc => `
                            <option value="${tc.id_tipoComp}">${tc.nombre_tipoComp}</option>
                          `).join('') : ''}
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Observación -->
                  <div class="field">
                    <label class="label">Observación</label>
                    <div class="control">
                      <input type="text" name="observacion" class="input is-rounded" placeholder="Detalle u observación opcional">
                    </div>
                  </div>

                  <hr>

                  <!-- Productos -->
                  <div id="productosSection" style="display: none;">
                    <h4 class="title is-6 mb-3" id="productosTitle">Productos:</h4>
                    <div id="productosContainer">
                      <div class="field is-grouped producto-row mb-3">
                        <div class="control is-expanded">
                          <div class="select is-fullwidth is-rounded">
                            <select name="producto_1" required onchange="actualizarOpcionesProductos(); validarFormulario();">
                              <option value="">Seleccione un producto</option>
                              ${productos.map(p => `<option value="${p.id_prodDep}">${p.Producto.nombre_prod}</option>`).join('')}
                            </select>
                          </div>
                        </div>
                        <div class="control">
                          <input type="number" name="cantidad_1" min="1" step="any" class="input is-rounded" placeholder="Cantidad" required oninput="validarFormulario()">
                        </div>
                        <div class="control">
                          <button type="button" class="button is-danger is-light removeBtn is-rounded" title="Eliminar producto">
                            <span class="icon"><i class="fas fa-times"></i></span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="field">
                      <button type="button" class="button is-small is-info is-light is-rounded" onclick="agregarProducto()">
                        <span class="icon"><i class="fas fa-plus"></i></span>
                        <span>Agregar producto</span>
                      </button>
                    </div>
                  </div>

                  <footer class="modal-card-foot mt-5">
                    <button type="submit" class="button is-primary is-rounded has-text-weight-bold" id="btnConfirmar" disabled>
                      <span class="icon"><i class="fas fa-check"></i></span>
                      <span>Confirmar Movimiento</span>
                    </button>
                    <button type="button" class="button is-light is-rounded" onclick="cerrarModalMovimiento()">
                      <span class="icon"><i class="fas fa-ban"></i></span>
                      <span>Cancelar</span>
                    </button>
                  </footer>
                </form>
              </section>
            </div>
          </div>

        </div>
      </section>

      <script>
        document.addEventListener('DOMContentLoaded', () => {
          (document.querySelectorAll('.notification .delete') || []).forEach(($delete) => {
            const $notification = $delete.parentNode;
            $delete.addEventListener('click', () => {
              $notification.parentNode.removeChild($notification);
            });
          });
        });

        function filtrarStock() {
          const input = document.getElementById('stockFilter');
          const filter = input.value.toLowerCase();
          const rows = document.querySelectorAll('#stockTable tbody tr');
          rows.forEach(row => {
            const prod = row.cells[0].innerText.toLowerCase();
            row.style.display = prod.includes(filter) ? '' : 'none';
          });
        }

        // Variables para el modal unificado
        let productoIndex = 1;

        // Función para abrir el modal
        function abrirModalMovimiento() {
          const modal = document.getElementById('movimientoModal');
          modal.classList.add('is-active');
          
          // Inicializar opciones de productos
          setTimeout(() => {
            actualizarOpcionesProductos();
            validarFormulario();
          }, 10);
        }

        // Función para cambiar el tipo de movimiento
        function cambiarTipoMovimiento() {
          const select = document.getElementById('tipoMovSelect');
          const selectedOption = select.options[select.selectedIndex];
          const direccion = selectedOption.getAttribute('data-direccion');
          const tipoCompField = document.getElementById('tipoCompField');
          const productosSection = document.getElementById('productosSection');
          const productosTitle = document.getElementById('productosTitle');
          const btnConfirmar = document.getElementById('btnConfirmar');
          const tipoMovHelp = document.getElementById('tipoMovHelp');

          if (select.value) {
            // Mostrar sección de productos
            productosSection.style.display = 'block';

            // Actualizar título y ayuda según el tipo
            if (direccion === 'IN') {
              productosTitle.textContent = 'Productos a Ingresar:';
              tipoMovHelp.innerHTML = '<span class="has-text-success"><i class="fas fa-plus-circle"></i> Movimiento de entrada</span> - Los productos se añadirán al stock del depósito';
              tipoCompField.style.display = 'block';
              btnConfirmar.className = 'button is-success is-rounded has-text-weight-bold';
              btnConfirmar.innerHTML = '<span class="icon"><i class="fas fa-arrow-down"></i></span><span>Confirmar Entrada</span>';
            } else if (direccion === 'OUT') {
              productosTitle.textContent = 'Productos a Consumir/Despachar:';
              tipoMovHelp.innerHTML = '<span class="has-text-danger"><i class="fas fa-minus-circle"></i> Movimiento de salida</span> - Los productos se descontarán del stock (se verificará disponibilidad)';
              tipoCompField.style.display = 'none';
              btnConfirmar.className = 'button is-danger is-rounded has-text-weight-bold';
              btnConfirmar.innerHTML = '<span class="icon"><i class="fas fa-arrow-up"></i></span><span>Confirmar Salida</span>';
            } else {
              productosTitle.textContent = 'Productos:';
              tipoMovHelp.innerHTML = '<span class="has-text-info"><i class="fas fa-exchange-alt"></i> Movimiento personalizado</span> - Se procesará según la configuración del tipo';
              tipoCompField.style.display = 'none';
              btnConfirmar.className = 'button is-primary is-rounded has-text-weight-bold';
              btnConfirmar.innerHTML = '<span class="icon"><i class="fas fa-check"></i></span><span>Confirmar Movimiento</span>';
            }

            // Actualizar opciones de productos y validar formulario
            setTimeout(() => {
              actualizarOpcionesProductos();
              validarFormulario();
            }, 10);
          } else {
            // Ocultar secciones si no hay selección
            productosSection.style.display = 'none';
            tipoCompField.style.display = 'none';
            btnConfirmar.disabled = true;
            tipoMovHelp.textContent = 'Seleccione el tipo de movimiento que desea registrar';
            btnConfirmar.className = 'button is-primary is-rounded has-text-weight-bold';
            btnConfirmar.innerHTML = '<span class="icon"><i class="fas fa-check"></i></span><span>Confirmar Movimiento</span>';
          }
        }

        // Función para obtener productos ya seleccionados
        function getProductosSeleccionados() {
          const selects = document.querySelectorAll('#productosContainer select[name^="producto_"]');
          const seleccionados = [];
          selects.forEach(select => {
            if (select.value) {
              seleccionados.push(select.value);
            }
          });
          return seleccionados;
        }

        // Función para actualizar opciones disponibles en todos los selects
        function actualizarOpcionesProductos() {
          const seleccionados = getProductosSeleccionados();
          const selects = document.querySelectorAll('#productosContainer select[name^="producto_"]');
          
          selects.forEach(select => {
            const valorActual = select.value;
            
            // Limpiar opciones
            select.innerHTML = '<option value="">Seleccione un producto</option>';
            
            // Añadir productos disponibles
            ${JSON.stringify(productos)}.forEach(p => {
              const option = document.createElement('option');
              option.value = p.id_prodDep;
              option.textContent = p.Producto.nombre_prod;
              
              // Deshabilitar si ya está seleccionado en otro select (excepto el actual)
              if (seleccionados.includes(p.id_prodDep.toString()) && p.id_prodDep.toString() !== valorActual) {
                option.disabled = true;
                option.textContent += ' (Ya seleccionado)';
                option.style.color = '#999';
              }
              
              select.appendChild(option);
            });
            
            // Restaurar valor actual si sigue siendo válido
            if (valorActual) {
              select.value = valorActual;
            }
          });
        }

        // Función para agregar productos
        function agregarProducto() {
          const productosDisponibles = ${JSON.stringify(productos)}.length;
          const productosSeleccionados = getProductosSeleccionados().length;
          
          // Verificar si hay productos disponibles para seleccionar
          if (productosSeleccionados >= productosDisponibles) {
            alert('Ya ha seleccionado todos los productos disponibles en este depósito.');
            return;
          }
          
          productoIndex++;
          const cont = document.getElementById('productosContainer');
          const newRow = \`
            <div class="field is-grouped producto-row mb-3">
              <div class="control is-expanded">
                <div class="select is-fullwidth is-rounded">
                  <select name="producto_\${productoIndex}" required onchange="actualizarOpcionesProductos(); validarFormulario();">
                    <option value="">Seleccione un producto</option>
                  </select>
                </div>
              </div>
              <div class="control">
                <input type="number" name="cantidad_\${productoIndex}" min="1" step="any" class="input is-rounded" placeholder="Cantidad" required oninput="validarFormulario()">
              </div>
              <div class="control">
                <button type="button" class="button is-danger is-light removeBtn is-rounded" title="Eliminar producto">
                  <span class="icon"><i class="fas fa-times"></i></span>
                </button>
              </div>
            </div>\`;
          cont.insertAdjacentHTML('beforeend', newRow);
          
          // Actualizar opciones después de agregar la nueva fila
          setTimeout(() => {
            actualizarOpcionesProductos();
            validarFormulario();
          }, 10);
        }

        // Función para validar el formulario
        function validarFormulario() {
          const tipoMovSelect = document.getElementById('tipoMovSelect');
          const btnConfirmar = document.getElementById('btnConfirmar');
          const rows = document.querySelectorAll('#productosContainer .producto-row');
          
          let formularioValido = tipoMovSelect.value !== '';
          
          // Verificar que cada fila tenga producto y cantidad válidos
          rows.forEach(row => {
            const productoSelect = row.querySelector('select[name^="producto_"]');
            const cantidadInput = row.querySelector('input[name^="cantidad_"]');
            
            if (!productoSelect.value || !cantidadInput.value || parseFloat(cantidadInput.value) <= 0) {
              formularioValido = false;
            }
          });
          
          btnConfirmar.disabled = !formularioValido;
        }

        // Función para cerrar el modal
        function cerrarModalMovimiento() {
          const modal = document.getElementById('movimientoModal');
          const form = document.getElementById('formMovimiento');
          
          modal.classList.remove('is-active');
          form.reset();
          productoIndex = 1;
          
          // Resetear estado del modal
          document.getElementById('productosSection').style.display = 'none';
          document.getElementById('tipoCompField').style.display = 'none';
          document.getElementById('btnConfirmar').disabled = true;
          document.getElementById('tipoMovHelp').textContent = 'Seleccione el tipo de movimiento que desea registrar';
          
          // Limpiar productos adicionales
          const container = document.getElementById('productosContainer');
          const rows = container.querySelectorAll('.producto-row');
          for (let i = 1; i < rows.length; i++) {
            rows[i].remove();
          }
        }

        // Event listener para remover productos
        document.addEventListener('click', (e) => {
          if (e.target.classList.contains('removeBtn') || e.target.closest('.removeBtn')) {
            const row = e.target.closest('.producto-row');
            const container = document.getElementById('productosContainer');
            
            // No permitir eliminar si es la única fila
            if (container.querySelectorAll('.producto-row').length > 1) {
              row.remove();
              
              // Actualizar opciones y validar después de eliminar
              setTimeout(() => {
                actualizarOpcionesProductos();
                validarFormulario();
              }, 10);
            } else {
              alert('Debe mantener al menos un producto en el movimiento.');
            }
          }
        });

        // Cerrar modal al hacer click en el fondo
        document.getElementById('movimientoModal').addEventListener('click', (e) => {
          if (e.target.classList.contains('modal-background')) {
            cerrarModalMovimiento();
          }
        });
      </script>
    `
  });
};