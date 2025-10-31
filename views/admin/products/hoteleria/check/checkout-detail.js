const layout = require('../../layout');
const { format, differenceInDays } = require('date-fns');
const { es } = require('date-fns/locale');

// === Helper de Fecha ===
const formatDate = (dateStr, formatStr = 'dd/MM/yyyy HH:mm') => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Fecha Inválida';
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return format(date, formatStr, { locale: es });
  } catch {
    return 'Fecha Inválida';
  }
};

// === Helper de Moneda ===
const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);

// === Vista Principal ===
module.exports = ({ reserva, formasPago = [] }) => {
  const huesped = reserva.Huesped;
  const habitacion = reserva.Habitacion;
  const tipoHab = habitacion?.TipoHabitacion;

  const noches = differenceInDays(
    new Date(reserva.fechaCheckOut),
    new Date(reserva.fechaCheckIn)
  );

  // --- Pagos de la reserva ---
  const pagos = reserva.PagoReserva || [];
  const totalPagado = pagos.reduce((acc, p) => acc + parseFloat(p.monto || 0), 0);
  const saldoPendiente = Math.max(0, parseFloat(reserva.total) - totalPagado);

  // --- Tabla de pagos ---
  const pagosHtml = pagos.length
    ? `
      <table class="table is-striped is-fullwidth">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Forma de Pago</th>
            <th>Monto</th>
            <th>Referencia</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${pagos
            .map(
              (p) => `
              <tr>
                <td>${formatDate(p.fechaPago)}</td>
                <td>${p.FormaPago?.nombre || p.FormaPago?.nombre_fp || 'N/A'}</td>
                <td>${formatCurrency(p.monto)}</td>
                <td>${p.referencia || '-'}</td>
                <td>
                  <span class="tag ${
                    p.estado === 'COMPLETADO'
                      ? 'is-success'
                      : p.estado === 'PENDIENTE'
                      ? 'is-warning'
                      : 'is-danger'
                  } is-light">${p.estado}</span>
                </td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>`
    : '<p class="has-text-grey-light">No se registraron pagos.</p>';

  // --- Render principal ---
  return layout({
    content: `
      <link rel="stylesheet" href="/css/checkin-detail.css">

      <div class="checkin-detail-page">
        <nav class="breadcrumb-nav">
          <a href="/hoteleria/checkin-checkout">
            <i class="fas fa-home"></i> Tablero de Habitaciones
          </a>
          <span class="separator">›</span>
          <span class="current">Confirmar Check-out</span>
        </nav>

        <div class="detail-card">
          <form method="POST" action="/hoteleria/checkout/${reserva.id_reserva}/confirm">
            <div class="detail-header">
              <div class="detail-header-content">
                <div>
                  <div class="detail-title">
                    <i class="fas fa-door-closed icon" style="color: var(--warning-color);"></i>
                    <h1>Confirmar Check-out</h1>
                  </div>
                  <p class="detail-subtitle">
                    <i class="fas fa-bookmark"></i>
                    Reserva #${reserva.codigoReserva}
                  </p>
                </div>
                <div class="detail-actions">
                  <a href="/hoteleria/checkin-checkout" class="btn-detail btn-detail--outline">
                    <i class="fas fa-arrow-left"></i>
                    Cancelar
                  </a>
                  <button type="submit" class="btn-detail btn-detail--warning"
                          id="btnConfirmarCheckout" ${saldoPendiente > 0 ? 'disabled' : ''}>
                    <i class="fas fa-sign-out-alt"></i>
                    Confirmar Salida
                  </button>
                </div>
              </div>
            </div>

            <div class="detail-content">
              <div class="detail-grid">
                <!-- DATOS DE LA ESTANCIA -->
                <div class="detail-section">
                  <h3>
                    <i class="fas fa-bed section-icon"></i>
                    Resumen de la Estancia
                  </h3>
                  <div class="info-item">
                    <span class="info-label">Habitación</span>
                    <span class="room-badge">${habitacion?.numero || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Tipo</span>
                    <span class="info-value">${tipoHab?.nombre || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Check-in Real</span>
                    <span class="info-value">${formatDate(reserva.fechaCheckInReal || reserva.fechaCheckIn)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Check-out Programado</span>
                    <span class="info-value">${formatDate(reserva.fechaCheckOut)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Noches Totales</span>
                    <span class="info-value">${noches}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Hora Actual</span>
                    <span class="info-value" id="currentTime"></span>
                  </div>
                </div>

                <!-- HUÉSPED PRINCIPAL -->
                <div class="detail-section">
                  <h3>
                    <i class="fas fa-user-circle section-icon"></i>
                    Huésped Principal
                  </h3>
                  <div class="guest-info">
                    <div class="guest-avatar" style="background: linear-gradient(135deg, var(--warning-color) 0%, #ff6b6b 100%);">
                      ${(huesped?.nombre?.charAt(0) || '') + (huesped?.apellido?.charAt(0) || '')}
                    </div>
                    <p class="guest-name">${huesped?.apellido || ''}, ${huesped?.nombre || ''}</p>
                    <p class="guest-id">ID: ${huesped?.id_huesped || 'N/A'}</p>
                  </div>
                  <div class="info-item">
                    <span class="info-label">DNI</span>
                    <span class="info-value">${huesped?.documento || '-'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Teléfono</span>
                    <span class="info-value">${huesped?.telefono || '-'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value" style="word-break: break-all;">${huesped?.email || '-'}</span>
                  </div>
                </div>

                <!-- RESUMEN FINAL DE PAGOS -->
                <div class="payment-section">
                  <div class="payment-header">
                    <h3>
                      <i class="fas fa-receipt"></i>
                      Resumen Final de Pagos
                    </h3>
                  </div>
                  <div class="payment-content">
                    ${pagos.length > 0 ? `
                      <table class="payment-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Forma de Pago</th>
                            <th>Monto</th>
                            <th>Referencia</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${pagos.map(p => `
                            <tr>
                              <td>${formatDate(p.fechaPago)}</td>
                              <td>${p.FormaPago?.nombre || 'N/A'}</td>
                              <td>${formatCurrency(p.monto)}</td>
                              <td>${p.referencia || '-'}</td>
                              <td>
                                <span class="status-badge status-badge--${
                                  p.estado === 'COMPLETADO' ? 'success' :
                                  p.estado === 'PENDIENTE' ? 'warning' : 'danger'
                                }">${p.estado}</span>
                              </td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    ` : '<p class="text-center" style="color: #64748b; padding: 20px;">No se registraron pagos.</p>'}

                    <div class="payment-summary">
                      <div class="summary-grid">
                        <div class="summary-item">
                          <p class="summary-label">Total Reserva</p>
                          <p class="summary-value summary-value--total">${formatCurrency(reserva.total)}</p>
                        </div>
                        <div class="summary-item">
                          <p class="summary-label">Total Pagado</p>
                          <p class="summary-value summary-value--paid">${formatCurrency(totalPagado)}</p>
                        </div>
                        <div class="summary-item">
                          <p class="summary-label">Saldo Final</p>
                          <p class="summary-value summary-value--pending">${formatCurrency(saldoPendiente)}</p>
                        </div>
                      </div>

                      <div class="summary-actions">
                        <div>
                          ${saldoPendiente > 0 ? 
                            '<div class="status-message status-message--error"><i class="fas fa-exclamation-triangle"></i> El check-out se habilita solo cuando el saldo esté en $0.</div>' :
                            '<div class="status-message status-message--success"><i class="fas fa-check-circle"></i> ¡Excelente! Todos los pagos están al día. Puede proceder con el check-out.</div>'
                          }
                        </div>
                        ${saldoPendiente > 0 ? `
                          <button class="btn-detail btn-detail--danger" id="btnRegistrarPago">
                            <i class="fas fa-dollar-sign"></i>
                            Pago Final
                          </button>
                        ` : `
                          <div class="text-center">
                            <i class="fas fa-check-circle" style="font-size: 2rem; color: var(--success-color);"></i>
                          </div>
                        `}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL DE PAGO FINAL -->
      <div class="modal-overlay is-hidden" id="modalPago">
        <div class="modal-card">
          <div class="modal-header" style="background: var(--warning-color);">
            <h3 class="modal-title">
              <i class="fas fa-receipt"></i>
              Pago Final - Check-out
            </h3>
            <button class="modal-close" aria-label="close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="status-message status-message--warning mb-4">
              <i class="fas fa-exclamation-triangle"></i>
              <div>
                <strong>Saldo Pendiente Final:</strong> ${formatCurrency(saldoPendiente)}
              </div>
            </div>
            
            <form id="formPago">
              <div class="form-field">
                <label class="form-label">Forma de Pago</label>
                <select class="form-select" name="id_fp" required>
                  <option value="">Seleccionar forma de pago...</option>
                  ${formasPago.map((fp) => `<option value="${fp.id_fp}">${fp.nombre || fp.nombre_fp}</option>`).join('')}
                </select>
              </div>
              
              <div class="form-field">
                <label class="form-label">Monto Final</label>
                <input class="form-input" type="number" name="monto" min="0" step="0.01" 
                       placeholder="0.00" value="${saldoPendiente}" required>
                <p class="form-help">Monto exacto para completar el pago: ${formatCurrency(saldoPendiente)}</p>
              </div>
              
              <div class="form-field">
                <label class="form-label">Referencia / Observaciones</label>
                <input class="form-input" type="text" name="referencia" 
                       placeholder="Ej: Pago final check-out, Comprobante #123, etc.">
                <p class="form-help">Opcional: Nota sobre el pago final</p>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-detail btn-detail--success" id="btnGuardarPago">
              <i class="fas fa-check-circle"></i>
              Completar Pago
            </button>
            <button class="btn-detail btn-detail--outline" id="btnCancelarPago">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <script>
        console.log('Inicializando modal de pago - Checkout Detail');
        
        // Real-time clock update
        function updateClock() {
          const now = new Date();
          const timeString = now.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          const clockElement = document.getElementById('currentTime');
          if (clockElement) {
            clockElement.textContent = timeString;
          }
        }
        
        // Update clock immediately and then every second
        updateClock();
        setInterval(updateClock, 1000);
        
        // Modal functionality
        const modal = document.getElementById('modalPago');
        const btnOpen = document.getElementById('btnRegistrarPago');
        const btnClose = modal?.querySelector('.modal-close');
        const btnCancel = document.getElementById('btnCancelarPago');
        const btnGuardar = document.getElementById('btnGuardarPago');
        const formPago = document.getElementById('formPago');

        console.log('Elementos encontrados:', {
          modal: !!modal,
          btnOpen: !!btnOpen,
          btnClose: !!btnClose,
          btnCancel: !!btnCancel,
          btnGuardar: !!btnGuardar,
          formPago: !!formPago
        });

        const toggleModal = (show) => {
          console.log('Toggle modal:', show);
          if (show) {
            modal.classList.remove('is-hidden');
            document.body.style.overflow = 'hidden';
            // Focus on first input when modal opens
            setTimeout(() => {
              const firstInput = modal.querySelector('select[name="id_fp"]');
              if (firstInput) firstInput.focus();
            }, 300);
          } else {
            modal.classList.add('is-hidden');
            document.body.style.overflow = '';
          }
        };

        // Abrir modal
        if (btnOpen) {
          btnOpen.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Abriendo modal de pago final');
            toggleModal(true);
          });
        }

        // Cerrar modal
        if (btnClose) {
          btnClose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Cerrando modal (X)');
            toggleModal(false);
          });
        }

        if (btnCancel) {
          btnCancel.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Cancelando modal');
            toggleModal(false);
          });
        }

        // Close modal on background click
        if (modal) {
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              console.log('Cerrando modal (fondo)');
              toggleModal(false);
            }
          });
        }

        // Guardar pago final
        if (btnGuardar) {
          btnGuardar.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Intentando guardar pago final...');
            
            const formData = new FormData(formPago);
            const data = Object.fromEntries(formData.entries());
            data.id_reserva = ${reserva.id_reserva};
            
            console.log('Datos del formulario:', data);
            
            // Validación
            if (!data.id_fp || !data.monto) {
              console.log('Validación fallida:', { id_fp: data.id_fp, monto: data.monto });
              alert('⚠️ Debe completar todos los campos obligatorios');
              return;
            }

            // Validar monto
            const monto = parseFloat(data.monto);
            if (isNaN(monto) || monto <= 0) {
              alert('⚠️ El monto debe ser un número mayor a 0');
              return;
            }

            // Add loading state
            const originalHTML = btnGuardar.innerHTML;
            btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            btnGuardar.disabled = true;

            try {
              console.log('Enviando solicitud a /hoteleria/pagos/new');
              
              const res = await fetch('/hoteleria/pagos/new', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify(data)
              });

              console.log('Respuesta recibida:', res.status, res.statusText);

              if (res.ok) {
                const result = await res.json().catch(() => ({}));
                console.log('Pago final guardado exitosamente:', result);
                alert('✅ Pago registrado con éxito. Recargando página...');
                setTimeout(() => {
                  location.reload();
                }, 1000);
              } else {
                const err = await res.text().catch(() => 'Error desconocido');
                console.error('Error del servidor:', err);
                alert('❌ Error al registrar el pago: ' + err);
                btnGuardar.innerHTML = originalHTML;
                btnGuardar.disabled = false;
              }
            } catch (error) {
              console.error('Error de conexión:', error);
              alert('❌ Error de conexión: ' + error.message);
              btnGuardar.innerHTML = originalHTML;
              btnGuardar.disabled = false;
            }
          });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal && !modal.classList.contains('is-hidden')) {
            console.log('Cerrando modal (ESC)');
            toggleModal(false);
          }
        });
        
        console.log('Modal de pago final inicializado correctamente');
      </script>
    `,
  });
};
