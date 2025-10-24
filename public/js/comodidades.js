document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modalComodidad');
  const form = document.getElementById('formComodidad');
  const title = document.getElementById('modalTitle');
  const idField = document.getElementById('id_comodidad');
  
  // Campos del formulario
  const nombreField = document.getElementById('nombre');
  const descField = document.getElementById('descripcion');

  const openModal = () => modal.classList.add('is-active');

  // --- Abrir modal para NUEVA comodidad ---
  document.getElementById('btnNuevaComodidad').addEventListener('click', () => {
    title.innerHTML = `<span class="icon mr-2"><i class="fas fa-wifi"></i></span>Nueva Comodidad`;
    form.reset(); 
    idField.value = '';
    form.action = '/hoteleria/comodidades/new'; // Ruta para crear
    openModal();
  });

  // --- Abrir modal para EDITAR comodidad ---
  document.querySelectorAll('.btnEditar').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = btn.dataset;
      
      title.innerHTML = `<span class="icon mr-2"><i class="fas fa-edit"></i></span>Editar Comodidad`;
      form.action = `/hoteleria/comodidades/${data.id}/edit`; // Ruta para editar

      // Poblar campos del modal
      idField.value = data.id;
      nombreField.value = data.nombre;
      descField.value = data.descripcion || '';

      openModal();
    });
  });

  // --- Acción de Guardar (Submit) ---
  document.getElementById('btnGuardarComodidad').addEventListener('click', () => {
    form.submit();
  });
  
  // (Los botones de cerrar/cancelar ya tienen 'onclick' en el HTML)
});