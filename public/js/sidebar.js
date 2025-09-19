// ---- Submenú Compras (desplegar hacia abajo)
(() => {
  const cmpToggle = document.getElementById('compras-toggle');
  const cmpSub    = document.getElementById('compras-sub');
  const cmpLink   = document.getElementById('compras-link');

  const openCmp = () => {
    if (!cmpSub) return;
    cmpSub.hidden = false;
    cmpToggle?.classList.add('open');
    cmpToggle?.setAttribute('aria-expanded', 'true');
    localStorage.setItem('submenu:compras', 'open');
  };

  const closeCmp = () => {
    if (!cmpSub) return;
    cmpSub.hidden = true;
    cmpToggle?.classList.remove('open');
    cmpToggle?.setAttribute('aria-expanded', 'false');
    localStorage.setItem('submenu:compras', 'closed');
  };

  // Mantener abierto al entrar a /compras/* o por preferencia guardada
  const saved = localStorage.getItem('submenu:compras');
  if (location.pathname.startsWith('/compras') || saved === 'open') openCmp();

  // Chevron: solo expandir/colapsar (sin navegar)
  cmpToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    cmpSub.hidden ? openCmp() : closeCmp();
  });

  // Click en el texto "Compras": navegar y mantener abierto
  cmpLink?.addEventListener('click', () => openCmp());

  // Marcar sub-link activo
  const markActiveCmp = () => {
    if (!cmpSub) return;
    const path = window.location.pathname.replace(/\/$/, '');
    cmpSub.querySelectorAll('a').forEach(a => {
      const href = new URL(a.href, location.origin).pathname.replace(/\/$/, '');
      a.classList.toggle(
        'is-active',
        href === path || (href === '/compras/dashboard' && path === '/compras')
      );
    });
  };
  markActiveCmp();
  window.addEventListener('popstate', markActiveCmp);
})();
