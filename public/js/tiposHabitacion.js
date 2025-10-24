document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modalTipoHab');
  const form = document.getElementById('formTipoHab');
  const title = document.getElementById('modalTitle');
  const idField = document.getElementById('id_tipoHab');

  // --- NUEVO: Elementos del filtro de comodidades ---
  const filtroInput = document.getElementById('filtroComodidades');
  const comodidadesContainer = document.getElementById('comodidades-container');
  const noResultMessage = document.getElementById('noComodidadResult');
  // Obtenemos solo las columnas que son items (no el mensaje de "no resultados")
  const itemsComodidad = comodidadesContainer ? comodidadesContainer.querySelectorAll('.item-comodidad') : [];

  const openModal = () => modal.classList.add('is-active');
  const closeModal = () => modal.classList.remove('is-active');

  // --- NUEVO: Función para resetear el filtro ---
  const resetearFiltroComodidades = () => {
    if (filtroInput) {
      filtroInput.value = ''; // Limpia el texto del buscador
    }
    itemsComodidad.forEach(item => {
      item.style.display = 'block'; // Muestra todos los items
    });
    if (noResultMessage) {
      noResultMessage.style.display = 'none'; // Oculta el mensaje de "no resultados"
    }
  };

  // --- NUEVO: Event listener para el input del filtro ---
  if (filtroInput) {
    filtroInput.addEventListener('keyup', () => {
      const filtroTexto = filtroInput.value.toLowerCase().trim();
      let visibles = 0;

      itemsComodidad.forEach(item => {
        const label = item.querySelector('label.checkbox');
        const textoLabel = label ? label.textContent.toLowerCase().trim() : '';

        if (textoLabel.includes(filtroTexto)) {
          item.style.display = 'block'; // Mostrar
          visibles++;
        } else {
          item.style.display = 'none'; // Ocultar
        }
      });

      // Mostrar/ocultar mensaje de "no resultados"
      if (noResultMessage) {
        noResultMessage.style.display = (visibles === 0) ? 'block' : 'none';
      }
    });
  }

  // --- Abrir modal para NUEVO tipo ---
  document.getElementById('btnNuevoTipo').addEventListener('click', () => {
    title.innerHTML = `<span class="icon mr-2"><i class="fas fa-bed"></i></span>Registrar Tipo de Habitación`;
    form.reset(); 
    idField.value = '';
    form.action = '/hoteleria/tipos-habitacion/new';
    
    resetearFiltroComodidades(); // <--- AÑADIDO: Resetea el filtro
    
    openModal();
  });

  // --- Abrir modal para EDITAR tipo ---
  document.querySelectorAll('.btnEditar').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = btn.dataset;
      title.innerHTML = `<span class="icon mr-2"><i class="fas fa-edit"></i></span>Editar Tipo de Habitación`;
      form.action = `/hoteleria/tipos-habitacion/${data.id}/edit`;

      // Poblar campos
      document.getElementById('id_tipoHab').value = data.id;
      document.getElementById('nombre').value = data.nombre;
      document.getElementById('descripcion').value = data.descripcion || '';
      document.getElementById('capacidad').value = data.capacidad;
      document.getElementById('precioBase').value = data.precio;

      // Lógica para Checkboxes
      const seleccionadas = JSON.parse(data.comodidades || '[]');
      
      // (Ajustamos el selector para que coincida con el nuevo HTML)
      document.querySelectorAll('#comodidades-container .item-comodidad input[type="checkbox"]').forEach(chk => {
        const idCheckbox = Number(chk.value);
        chk.checked = seleccionadas.includes(idCheckbox);
      });

      resetearFiltroComodidades(); // <--- AÑADIDO: Resetea el filtro
      
      openModal();
    });
  });

  // --- Acción de Guardar (Submit) ---
  document.getElementById('btnGuardarTipo').addEventListener('click', () => {
    form.submit();
  });
  
});