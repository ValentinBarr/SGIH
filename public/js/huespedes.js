document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modalHuesped');
  const form = document.getElementById('formHuesped');
  const title = document.getElementById('modalTitle');
  const idField = document.getElementById('id_huesped');
  
  // Campos del formulario
  const nombreField = document.getElementById('nombre');
  const apellidoField = document.getElementById('apellido');
  const documentoField = document.getElementById('documento');
  const telefonoField = document.getElementById('telefono');
  const emailField = document.getElementById('email');

  const openModal = () => modal.classList.add('is-active');

  // --- Abrir modal para NUEVO huésped ---
  document.getElementById('btnNuevoHuesped').addEventListener('click', () => {
    title.innerHTML = `<span class="icon mr-2"><i class="fas fa-user-plus"></i></span>Nuevo Huésped`;
    form.reset(); 
    idField.value = '';
    form.action = '/hoteleria/huespedes/new';
    openModal();
  });

  // --- Abrir modal para EDITAR huésped ---
  document.querySelectorAll('.btnEditar').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = btn.dataset;
      
      title.innerHTML = `<span class="icon mr-2"><i class="fas fa-user-edit"></i></span>Editar Huésped`;
      // Construimos la acción del formulario preservando los query params (para la paginación/búsqueda)
      form.action = `/hoteleria/huespedes/${data.id}/edit${window.location.search}`;

      // Poblar campos del modal
      idField.value = data.id;
      nombreField.value = data.nombre;
      apellidoField.value = data.apellido;
      documentoField.value = data.documento || '';
      telefonoField.value = data.telefono || '';
      emailField.value = data.email || '';

      openModal();
    });
  });

  // --- Acción de Guardar (Submit) ---
  document.getElementById('btnGuardarHuesped').addEventListener('click', () => {
    // Si htmx está presente, él se encargará del submit.
    // Si no (por si acaso), esto actúa como fallback.
    if (typeof htmx === 'undefined') {
      form.submit();
    }
  });
  
});