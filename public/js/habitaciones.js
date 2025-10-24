document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modalHabitacion');
  const form = document.getElementById('formHabitacion');
  const title = document.getElementById('modalTitle');
  const idField = document.getElementById('id_hab');
  
  // Campos del formulario
  const numeroField = document.getElementById('numero');
  const pisoField = document.getElementById('piso');
  const tipoHabField = document.getElementById('id_tipoHab');
  const estadoField = document.getElementById('estado');

  const openModal = () => modal.classList.add('is-active');

  // --- Abrir modal para NUEVA habitación ---
  document.getElementById('btnNuevaHabitacion').addEventListener('click', () => {
    title.innerHTML = `<span class="icon mr-2"><i class="fas fa-door-open"></i></span>Nueva Habitación`;
    form.reset(); 
    idField.value = '';
    estadoField.value = 'DISPONIBLE'; // Valor por defecto
    tipoHabField.value = ''; // Resetear select
    form.action = '/hoteleria/habitaciones/new';
    openModal();
  });

  // --- Abrir modal para EDITAR habitación ---
  document.querySelectorAll('.btnEditar').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = btn.dataset;
      
      title.innerHTML = `<span class="icon mr-2"><i class="fas fa-edit"></i></span>Editar Habitación ${data.numero}`;
      form.action = `/hoteleria/habitaciones/${data.id}/edit`;

      // Poblar campos del modal
      idField.value = data.id;
      numeroField.value = data.numero;
      pisoField.value = data.piso || '';
      tipoHabField.value = data.idTipohab; // El data-attribute es 'data-id-tipohab'
      estadoField.value = data.estado;

      openModal();
    });
  });

  // --- Acción de Guardar (Submit) ---
  document.getElementById('btnGuardarHabitacion').addEventListener('click', () => {
    form.submit();
  });
  
});