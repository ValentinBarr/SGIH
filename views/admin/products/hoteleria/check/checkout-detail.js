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
      <section class="section">
        <div class="container is-max-desktop">
          <nav class="breadcrumb mb-5" aria-label="breadcrumbs">
            <ul>
              <li><a href="/hoteleria/checkin-checkout">Tablero</a></li>
              <li class="is-active"><a href="#" aria-current="page">Confirmar Check-out</a></li>
            </ul>
          </nav>

          <div class="box p-5">
            <form method="POST" action="/hoteleria/checkout/${reserva.id_reserva}/confirm">

              <div class="level mb-5">
                <div class="level-left">
                  <div>
                    <h1 class="title is-3 mb-1">Confirmar Check-out</h1>
                    <h2 class="subtitle is-5 has-text-danger">Reserva #${reserva.codigoReserva}</h2>
                  </div>
                </div>
                <div class="level-right">
                  <a href="/hoteleria/checkin-checkout" class="button is-light is-rounded is-medium">Cancelar</a>
                  <button type="submit" class="button is-warning is-medium is-rounded ml-2"
                          id="btnConfirmarCheckout" ${saldoPendiente > 0 ? 'disabled' : ''}>
                    <span class="icon"><i class="fas fa-door-open"></i></span>
                    <span>Confirmar Salida</span>
                  </button>
                </div>
              </div>

              <hr class="mt-0">

              <div class="columns is-multiline">
                <!-- DATOS DE LA ESTANCIA -->
                <div class="column is-half">
                  <h3 class="title is-5 mb-3">Detalles de la Estancia</h3>
                  <div class="box has-background-light">
                    <p><strong>Habitación:</strong> <span class="tag is-dark is-medium">${habitacion?.numero || 'N/A'}</span></p>
                    <p><strong>Tipo:</strong> ${tipoHab?.nombre || 'N/A'}</p>
                    <p><strong>Check-in:</strong> ${formatDate(reserva.fechaCheckInReal || reserva.fechaCheckIn)}</p>
                    <p><strong>Check-out Programado:</strong> ${formatDate(reserva.fechaCheckOut)}</p>
                    <p><strong>Noches:</strong> ${noches}</p>
                  </div>
                </div>

                <!-- HUÉSPED -->
                <div class="column is-half">
                  <h3 class="title is-5 mb-3">Huésped Principal</h3>
                  <div class="box has-background-white-ter">
                    <p class="title is-5 mb-1">${huesped?.apellido || ''}, ${huesped?.nombre || ''}</p>
                    <p class="subtitle is-6 has-text-grey">ID Huésped: ${huesped?.id_huesped || 'N/A'}</p>
                    <p><strong>DNI:</strong> ${huesped?.documento || '-'}</p>
                    <p><strong>Teléfono:</strong> ${huesped?.telefono || '-'}</p>
                    <p><strong>Email:</strong> ${huesped?.email || '-'}</p>
                  </div>
                </div>

                <!-- PAGOS -->
                <div class="column is-full">
                  <h3 class="title is-5 mt-4 mb-3">Pagos Registrados</h3>
                  ${pagosHtml}

                  <div class="notification ${saldoPendiente > 0 ? 'is-danger' : 'is-success'} is-light mt-4">
                    <div class="level">
                      <div class="level-left">
                        <div>
                          <p>Total Reserva: <strong>${formatCurrency(reserva.total)}</strong></p>
                          <p>Total Pagado: <strong>${formatCurrency(totalPagado)}</strong></p>
                          <p class="title is-6 ${saldoPendiente > 0 ? 'has-text-danger' : 'has-text-success'} mt-2">
                            SALDO FINAL: ${formatCurrency(saldoPendiente)}
                          </p>
                        </div>
                      </div>
                      <div class="level-right">
                        ${
                          saldoPendiente > 0
                            ? `
                              <a class="button is-danger is-rounded" id="btnRegistrarPago">
                                <span class="icon"><i class="fas fa-dollar-sign"></i></span>
                                <span>Registrar Pago Final</span>
                              </a>`
                            : `<span class="icon is-large has-text-success"><i class="fas fa-check-circle fa-2x"></i></span>`
                        }
                      </div>
                    </div>
                  </div>
                  ${
                    saldoPendiente > 0
                      ? '<p class="help has-text-danger has-text-centered">El check-out se habilita solo cuando el saldo esté en $0.</p>'
                      : ''
                  }
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      <!-- 🧾 MODAL DE PAGO FINAL -->
      <div class="modal" id="modalPago">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Registrar Pago Final</p>
            <button class="delete" aria-label="close"></button>
          </header>
          <section class="modal-card-body">
            <form id="formPago">
              <div class="field">
                <label class="label">Forma de Pago</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select name="id_fp" required>
                      <option value="">Seleccionar...</option>
                      ${formasPago
                        .map((fp) => `<option value="${fp.id_fp}">${fp.nombre || fp.nombre_fp}</option>`)
                        .join('')}
                    </select>
                  </div>
                </div>
              </div>
              <div class="field">
                <label class="label">Monto</label>
                <div class="control">
                  <input class="input" type="number" name="monto" min="0" step="0.01" required value="${saldoPendiente}">
                </div>
              </div>
              <div class="field">
                <label class="label">Referencia / Observaciones</label>
                <div class="control">
                  <input class="input" type="text" name="referencia" placeholder="Ej: Ticket #123 o MP-001">
                </div>
              </div>
            </form>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" id="btnGuardarPago">Guardar Pago</button>
            <button class="button" id="btnCancelarPago">Cancelar</button>
          </footer>
        </div>
      </div>

      <script>
        const modal = document.getElementById('modalPago');
        const btnOpen = document.getElementById('btnRegistrarPago');
        const btnClose = modal.querySelector('.delete');
        const btnCancel = document.getElementById('btnCancelarPago');
        const btnGuardar = document.getElementById('btnGuardarPago');
        const formPago = document.getElementById('formPago');

        const toggleModal = (show) => modal.classList.toggle('is-active', show);

        if (btnOpen) btnOpen.addEventListener('click', () => toggleModal(true));
        btnClose.addEventListener('click', () => toggleModal(false));
        btnCancel.addEventListener('click', () => toggleModal(false));

        btnGuardar.addEventListener('click', async () => {
          const data = Object.fromEntries(new FormData(formPago).entries());
          data.id_reserva = ${reserva.id_reserva};
          if (!data.id_fp || !data.monto) return alert('Debe completar todos los campos');

          const res = await fetch('/hoteleria/pagos/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (res.ok) {
            alert('Pago registrado con éxito');
            location.reload();
          } else {
            const err = await res.text();
            alert('Error al registrar el pago: ' + err);
          }
        });
      </script>
    `,
  });
};
