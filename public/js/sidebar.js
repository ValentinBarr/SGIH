// js/sidebar.js
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;

  // --- 1. LÓGICA PARA COLAPSAR/EXPANDIR SIDEBAR (DESKTOP) ---
  const sidebarToggleBtn = document.getElementById('sidebar-toggle');
  const SIDEBAR_STATE_KEY = 'sidebarState';

  if (sidebarToggleBtn) {
    // Cargar estado inicial desde localStorage
    if (localStorage.getItem(SIDEBAR_STATE_KEY) === 'collapsed') {
      body.classList.add('sidebar-collapsed');
    }

    sidebarToggleBtn.addEventListener('click', () => {
      body.classList.toggle('sidebar-collapsed');
      // Guardar el nuevo estado
      const isCollapsed = body.classList.contains('sidebar-collapsed');
      localStorage.setItem(SIDEBAR_STATE_KEY, isCollapsed ? 'collapsed' : 'expanded');
    });
  }

  // --- 2. LÓGICA PARA SUBMENÚS DESPLEGABLES (INVENTARIOS, COMPRAS) ---
  function initSubmenu(prefix) {
    const group = document.getElementById(`${prefix}-group`);
    if (!group) return;

    const toggleBtn = group.querySelector('.sidebar__chevron');
    const submenu = group.querySelector('.sidebar__submenu');
    const SUBMENU_STATE_KEY = `submenu:${prefix}`;

    if (!toggleBtn || !submenu) return;

    const openSubmenu = () => {
      submenu.hidden = false;
      toggleBtn.classList.add('open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      localStorage.setItem(SUBMENU_STATE_KEY, 'open');
    };

    const closeSubmenu = () => {
      submenu.hidden = true;
      toggleBtn.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      localStorage.setItem(SUBMENU_STATE_KEY, 'closed');
    };

    // Mantener abierto si la página actual pertenece al submenú o si estaba guardado
    const isCurrentPageInSection = window.location.pathname.startsWith(`/${prefix}/`);
    if (isCurrentPageInSection || localStorage.getItem(SUBMENU_STATE_KEY) === 'open') {
      openSubmenu();
    } else {
      closeSubmenu();
    }

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submenu.hidden ? openSubmenu() : closeSubmenu();
    });

    // Marcar el link activo dentro del submenú
    submenu.querySelectorAll('a.sidebar__sublink').forEach(link => {
      if (link.href === window.location.href) {
        link.classList.add('is-active');
        // También marcar el link padre como activo
        group.querySelector('.sidebar__divider')?.classList.add('is-active');
      }
    });
  }

  // Inicializar todos los submenús definidos
// Inicializar todos los submenús definidos
['inventarios', 'compras', 'hoteleria'].forEach(initSubmenu);

  // --- 3. LÓGICA PARA SIDEBAR EN MÓVIL (MENÚ HAMBURGUESA) ---
  const mobileToggleBtn = document.getElementById('openMobile');
  const sidebar = document.querySelector('.sidebar');

  if (mobileToggleBtn && sidebar) {
    mobileToggleBtn.addEventListener('click', () => {
      // En lugar de clases en el elemento, usamos una clase en el body
      // para controlar el estado globalmente (ej. para mostrar un overlay)
      body.classList.toggle('sidebar-open-mobile');
    });
  }
});
