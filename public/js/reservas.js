document.addEventListener('DOMContentLoaded', () => {
  // --- MODAL DE EDICIÓN (Existente) ---
  const modalEditar = document.getElementById('modalReserva');
  if (modalEditar) {
    const formEditar = document.getElementById('formReserva');
    const titleEditar = modalEditar.querySelector('.modal-card-title'); // Búsqueda más segura
    const idFieldEditar = document.getElementById('id_reserva');
    const btnGuardarEditar = document.getElementById('btnGuardarReserva');

    const openModalEditar = () => modalEditar.classList.add('is-active');

    // Helper para convertir fecha a YYYY-MM-DD
    const toISODate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // Ajuste de zona horaria
      return date.toISOString().split('T')[0];
    };

    // Asigna listeners a los botones "Editar"
    const assignEditListeners = () => {
      document.querySelectorAll('.btnEditarReserva').forEach((btn) => {
        // Evita duplicar listeners si htmx recarga
        if (btn.dataset.listenerAttached) return;
        btn.dataset.listenerAttached = true;

        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            // 1. Pedir datos al servidor
            const response = await fetch(`/hoteleria/reservas/${id}/data`);
            if (!response.ok) throw new Error('No se pudieron cargar los datos');
            const data = await response.json();

            // 2. Poblar el modal
            titleEditar.textContent = `Editar Reserva ${data.codigoReserva}`;
            formEditar.action = `/hoteleria/reservas/${id}/edit${window.location.search}`;
            idFieldEditar.value = data.id_reserva;

            document.getElementById('huesped_nombre').value =
              `${data.Huesped?.apellido}, ${data.Huesped?.nombre}`;
            document.getElementById('fechaCheckIn').value = toISODate(
              data.fechaCheckIn
            );
            document.getElementById('fechaCheckOut').value = toISODate(
              data.fechaCheckOut
            );
            document.getElementById('total').value = data.total;

            openModalEditar();
          } catch (err) {
            console.error(err);
            alert('Error al cargar datos de la reserva.');
          }
        });
      });
    };

    // Asignar listeners al cargar y después de recargas de htmx
    assignEditListeners();
    document.body.addEventListener('htmx:afterOnLoad', assignEditListeners);

    // Acción de guardar
    btnGuardarEditar.addEventListener('click', () => {
      formEditar.submit();
    });
  }

  // --- MODAL DE NUEVA RESERVA (con Validación) ---
  const modalNuevo = document.getElementById('modalNuevaReserva');
  if (modalNuevo) {
    const formNuevo = document.getElementById('formNuevaReserva');
    const btnAbrirNuevo = document.getElementById('btnNuevaReserva');
    const btnGuardarNuevo = document.getElementById('btnGuardarNuevaReserva');
    const errorBox = document.getElementById('errorNuevaReserva');

    // Función para mostrar errores
    const mostrarError = (mensaje) => {
      if (errorBox) {
        errorBox.textContent = mensaje;
        errorBox.style.display = 'block';
      } else {
        alert(mensaje); // Fallback si el div no existe
      }
    };

    // Abrir el modal
    btnAbrirNuevo.addEventListener('click', () => {
      formNuevo.reset(); // Limpia el formulario
      if (errorBox) errorBox.style.display = 'none'; // Ocultar errores anteriores
      modalNuevo.classList.add('is-active');
    });

    // Guardar (submit) con validación
    btnGuardarNuevo.addEventListener('click', () => {
      if (errorBox) errorBox.style.display = 'none';

      // --- Validación de Fechas ---
      const checkInDate = document.getElementById('fechaCheckIn_new').value;
      const checkOutDate = document.getElementById('fechaCheckOut_new').value;

      if (!checkInDate || !checkOutDate) {
        mostrarError('Debe seleccionar una fecha de Check-in y Check-out.');
        return;
      }
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Establece a medianoche

      // Convertimos las fechas del input (que vienen como YYYY-MM-DD)
      // a objetos Date de forma segura (considerando zona horaria local)
      // Asume GMT-3 (Argentina). Ajusta '-03:00' si tu servidor está en otra zona.
      const inDate = new Date(checkInDate + 'T00:00:00-03:00'); 
      const outDate = new Date(checkOutDate + 'T00:00:00-03:00');

      if (inDate < hoy) {
         mostrarError('La fecha de Check-in no puede ser anterior a hoy.');
         return;
      }
      
      if (outDate <= inDate) {
        mostrarError(
          'La fecha de Check-out debe ser posterior a la fecha de Check-in.'
        );
        return;
      }
      
      // --- Validación de campos requeridos ---
      const huespedId = document.getElementById('id_huesped_select').value;
      if (!huespedId) {
        mostrarError('Debe seleccionar un huésped.');
        return;
      }
      // (Otros campos son 'required' en HTML, el navegador los validará)

      // --- Confirmación antes de guardar ---
      const confirmacion = confirm('¿Está seguro de que desea crear esta reserva?');
      if (confirmacion) {
        formNuevo.submit();
      }
    });
  }
});