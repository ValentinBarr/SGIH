//Ejemplo aqui va el layout principal
// views/layout.js
module.exports = ({ content }) => {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SGIH</title>

    <link rel="stylesheet" href="/css/main.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.5/css/bulma.min.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/css/all.min.css" />
  </head>
  <body class="admin">

    <div class="layout">
      <aside class="sidebar" aria-label="Barra lateral">
        <div class="sidebar__header">
          <button id="toggleSidebar" class="sidebar__toggle" aria-expanded="true" aria-controls="sidebarNav">☰</button>
          <span class="sidebar__brand">SGIH</span>
        </div>

        <nav id="sidebarNav" class="sidebar__nav">
          <a class="sidebar__link" href="/"><span class="sidebar__icon">🏠</span><span class="sidebar__label">Inicio</span></a>

          <a class="sidebar__link" href="/reservas"><span class="sidebar__icon">📅</span><span class="sidebar__label">Reservas</span></a>
          <a class="sidebar__link" href="/check-in"><span class="sidebar__icon">🟢</span><span class="sidebar__label">Check In</span></a>
          <a class="sidebar__link" href="/check-out"><span class="sidebar__icon">🔴</span><span class="sidebar__label">Check Out</span></a>
          <a class="sidebar__link" href="/habitaciones"><span class="sidebar__icon">🛏️</span><span class="sidebar__label">Habitaciones</span></a>
          <a class="sidebar__link" href="/pos"><span class="sidebar__icon">🧾</span><span class="sidebar__label">POS</span></a>
          <a class="sidebar__link" href="/inventarios/dashboard"><span class="sidebar__icon">📦</span><span class="sidebar__label">Inventarios</span></a>
          <a class="sidebar__link" href="/clientes"><span class="sidebar__icon">👥</span><span class="sidebar__label">Clientes</span></a>
        </nav>
      </aside>

      <main class="content">
        <header class="topbar">
          <button id="openMobile" class="topbar__btn" aria-label="Abrir menú">☰</button>
          <h1 class="title is-5">Panel</h1>
        </header>

        <section class="page container">
          ${content}
        </section>
      </main>
    </div>

    <script src="/js/sidebar.js" defer></script>
  </body>
  </html>
  `;
};
