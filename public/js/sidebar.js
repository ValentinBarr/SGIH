//puse de ejemplo pueden cambiarle el nombre para que sea que lo usen. porque sino le ponia una rchivo no aparecia en githun
(() => {
  const root = document.documentElement;
  const toggleBtn = document.getElementById('toggleSidebar');
  const openMobileBtn = document.getElementById('openMobile');

  // ---- Restaurar estado colapsado desde localStorage
  const saved = localStorage.getItem('sidebar:collapsed');
  if (saved === 'true') {
    root.classList.add('sidebar-collapsed');
    toggleBtn && toggleBtn.setAttribute('aria-expanded', 'false');
  }

  // ---- Toggle desktop/tablet
  toggleBtn && toggleBtn.addEventListener('click', () => {
    const collapsed = root.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebar:collapsed', collapsed ? 'true' : 'false');
    toggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  });

  // ---- Mobile drawer open/close
  const openMobile = () => root.classList.add('sidebar-open');
  const closeMobile = () => root.classList.remove('sidebar-open');

  openMobileBtn && openMobileBtn.addEventListener('click', openMobile);

  document.addEventListener('click', (e) => {
    if (!root.classList.contains('sidebar-open')) return;
    const sidebar = document.querySelector('.sidebar');
    const topBtn = document.getElementById('openMobile');
    if (!sidebar.contains(e.target) && !topBtn.contains(e.target)) closeMobile();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobile();
  });

  // ---- Marcar link activo según la URL actual
  const current = window.location.pathname.replace(/\/+$/,''); // sin slash final
  document.querySelectorAll('.sidebar__nav a').forEach(a => {
    const href = new URL(a.href, window.location.origin).pathname.replace(/\/+$/,'');
    if (href === current || (href !== '/' && current.startsWith(href))) {
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'page');
    }
  });
})();

// ---- Submenú Inventarios (desplegar hacia abajo)
(() => {
  const invToggle = document.getElementById('inv-toggle');
  const invSub    = document.getElementById('inv-sub');
  const invLink   = document.getElementById('inv-link');

  const openInv = () => {
    if (!invSub) return;
    invSub.hidden = false;
    invToggle?.classList.add('open');
    invToggle?.setAttribute('aria-expanded', 'true');
    localStorage.setItem('submenu:inventarios', 'open');
  };

  const closeInv = () => {
    if (!invSub) return;
    invSub.hidden = true;
    invToggle?.classList.remove('open');
    invToggle?.setAttribute('aria-expanded', 'false');
    localStorage.setItem('submenu:inventarios', 'closed');
  };

  // Mantener abierto al entrar a /inventarios/* o por preferencia guardada
  const saved = localStorage.getItem('submenu:inventarios');
  if (location.pathname.startsWith('/inventarios') || saved === 'open') openInv();

  // Chevron: solo expandir/colapsar (sin navegar)
  invToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    invSub.hidden ? openInv() : closeInv();
  });

  // Click en el texto "Inventarios": navegar y mantener abierto
  invLink?.addEventListener('click', () => openInv());

  // Marcar sub-link activo
  const markActiveInv = () => {
    if (!invSub) return;
    const path = window.location.pathname.replace(/\/$/, '');
    invSub.querySelectorAll('a').forEach(a => {
      const href = new URL(a.href, location.origin).pathname.replace(/\/$/, '');
      a.classList.toggle(
        'is-active',
        href === path || (href === '/inventarios/dashboard' && path === '/inventarios')
      );
    });
  };
  markActiveInv();
  window.addEventListener('popstate', markActiveInv);
})();
