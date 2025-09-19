// js/sidebar.js
(() => {
  function initSubmenu(prefix) {
    const toggle = document.getElementById(`${prefix}-toggle`);
    const sub = document.getElementById(`${prefix}-sub`);
    const link = document.getElementById(`${prefix}-link`);

    if (!toggle || !sub) return;

    const open = () => {
      sub.hidden = false;
      toggle.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      localStorage.setItem(`submenu:${prefix}`, 'open');
    };

    const close = () => {
      sub.hidden = true;
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      localStorage.setItem(`submenu:${prefix}`, 'closed');
    };

    // mantener abierto si corresponde
    const saved = localStorage.getItem(`submenu:${prefix}`);
    if (location.pathname.startsWith(`/${prefix}`) || saved === 'open') open();

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      sub.hidden ? open() : close();
    });

    link?.addEventListener('click', () => open());

    // marcar activo
    const markActive = () => {
      const path = window.location.pathname.replace(/\/$/, '');
      sub.querySelectorAll('a').forEach(a => {
        const href = new URL(a.href, location.origin).pathname.replace(/\/$/, '');
        a.classList.toggle(
          'is-active',
          href === path || (href === `/${prefix}/dashboard` && path === `/${prefix}`)
        );
      });
    };
    markActive();
    window.addEventListener('popstate', markActive);
  }

  // inicializar todos los submenús que existan
  ['inventarios', 'compras'].forEach(initSubmenu);
})();
