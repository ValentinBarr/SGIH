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
          <a class="sidebar__link" href="/"><span class="sidebar__icon"></span><span class="sidebar__label">Inicio</span></a>

          <!-- Inventarios -->
          <div class="sidebar__group" id="inventarios-group">
            <a id="inventarios-link" class="sidebar__link sidebar__link--parent" href="/inventarios/dashboard">
              <span class="sidebar__icon"></span><span class="sidebar__label">Inventarios</span>
            </a>
            <button
              id="inventarios-toggle"
              class="sidebar__chevron"
              type="button"
              aria-label="Expandir Inventarios"
              aria-expanded="false"
              aria-controls="inventarios-sub"
            >▸</button>

            <ul id="inventarios-sub" class="sidebar__submenu" hidden>
              <li><a class="sidebar__sublink" href="/inventarios/articulos">Artículos</a></li>
              <li><a class="sidebar__sublink" href="/inventarios/depositos">Depósitos</a></li>
              <li><a class="sidebar__sublink" href="/inventarios/movimientos">Movimientos</a></li>
            </ul>
          </div>

          <!-- Compras -->
          <div class="sidebar__group" id="compras-group">
            <a id="compras-link" class="sidebar__link sidebar__link--parent" href="/compras/dashboard">
              <span class="sidebar__icon"></span><span class="sidebar__label">Compras</span>
            </a>
            <button
              id="compras-toggle"
              class="sidebar__chevron"
              type="button"
              aria-label="Expandir Compras"
              aria-expanded="false"
              aria-controls="compras-sub"
            >▸</button>

            <ul id="compras-sub" class="sidebar__submenu" hidden>
              <li><a class="sidebar__sublink" href="/compras/proveedores">Proveedores</a></li>
              <li><a class="sidebar__sublink" href="/compras/ordenes">Ordenes de Compra</a></li>
              <li><a class="sidebar__sublink" href="/compras/facturas">Facturas</a></li>
              <li><a class="sidebar__sublink" href="/compras/remitos">Remitos</a></li>

            </ul>
          </div>

          <a class="sidebar__link" href="/clientes"><span class="sidebar__icon"></span><span class="sidebar__label">Clientes</span></a>
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
