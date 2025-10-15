document.addEventListener('DOMContentLoaded', () => {
  // --- LÓGICA PARA LA SIDEBAR PRINCIPAL (DESKTOP) ---
  const sidebarToggleButton = document.getElementById('sidebar-toggle');
  const body = document.body;

  // Función para guardar el estado en localStorage
  const saveSidebarState = () => {
    if (body.classList.contains('sidebar-collapsed')) {
      localStorage.setItem('sidebarState', 'collapsed');
    } else {
      localStorage.setItem('sidebarState', 'expanded');
    }
  };

  // Función para cargar el estado desde localStorage
  const loadSidebarState = () => {
    const state = localStorage.getItem('sidebarState');
    if (state === 'collapsed') {
      body.classList.add('sidebar-collapsed');
    }
  };

  // Cargar el estado al iniciar la página
  loadSidebarState();

  // Evento para el botón de toggle de la sidebar
  if (sidebarToggleButton) {
    sidebarToggleButton.addEventListener('click', () => {
      body.classList.toggle('sidebar-collapsed');
      saveSidebarState(); // Guardar el nuevo estado cada vez que se hace clic
    });
  }

  // --- LÓGICA PARA LA SIDEBAR EN MÓVIL (MENÚ HAMBURGUESA) ---
  const burger = document.querySelector('.navbar-burger');
  const sidebar = document.getElementById('admin-sidebar');

  if (burger && sidebar) {
    burger.addEventListener('click', () => {
      // Toggle .is-active en el burger y en la sidebar
      burger.classList.toggle('is-active');
      sidebar.classList.toggle('is-active-mobile');
    });
  }
});