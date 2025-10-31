// js/room-board.js
console.log('Room Board JS cargado correctamente');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando Room Board...');
    
    // -------------------------------------------------------------------
    // 1. LÓGICA DE PESTAÑAS (Tabs) - Actualizada para nueva estructura
    // -------------------------------------------------------------------
    const tabs = document.querySelectorAll('.room-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    console.log(`Encontradas ${tabs.length} pestañas y ${tabContents.length} contenidos`);

    if (tabs.length > 0 && tabContents.length > 0) {
        tabs.forEach((tab, index) => {
            console.log(`Configurando pestaña ${index}:`, tab.dataset.tab);
            
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = tab.dataset.tab; // ej: "tab-checkin"
                const targetContent = document.getElementById(targetId);
                
                console.log(`Cambiando a pestaña: ${targetId}`);

                // Quitar 'is-active' de todas las pestañas y ocultar todo el contenido
                tabs.forEach(t => t.classList.remove('is-active'));
                tabContents.forEach(tc => tc.classList.add('is-hidden'));

                // Activar la pestaña clickeada y mostrar su contenido
                tab.classList.add('is-active');
                if (targetContent) {
                    targetContent.classList.remove('is-hidden');
                    console.log(`Mostrando contenido: ${targetId}`);
                } else {
                    console.error(`No se encontró el contenido para: ${targetId}`);
                }
            });
        });
    } else {
        console.warn('No se encontraron pestañas o contenidos para configurar');
    }

    // -------------------------------------------------------------------
    // 2. LÓGICA DE BÚSQUEDA (Check-in y Ocupadas)
    // -------------------------------------------------------------------
    const searchCheckinInput = document.getElementById('search-checkin-input');
    const checkinListWrapper = document.getElementById('checkin-list-wrapper');
    const searchCheckoutInput = document.getElementById('search-checkout-input');
    const checkoutListWrapper = document.getElementById('checkout-list-wrapper');

    // Función genérica para filtrar tarjetas - Actualizada para nueva estructura
    const filterCardList = (input, listWrapper) => {
        const searchQuery = input.value.toLowerCase().trim();
        // Busca las tarjetas con la nueva clase
        const cards = listWrapper.querySelectorAll('.room-card'); 
        let visibleCount = 0;

        cards.forEach(card => {
            const nombreHuesped = card.dataset.nombreHuesped || ''; 
            const documentoHuesped = card.dataset.documentoHuesped || '';
            const habitacionNumero = card.querySelector('.room-card-header span')?.textContent || '';
            
            if (nombreHuesped.includes(searchQuery) || 
                documentoHuesped.includes(searchQuery) ||
                habitacionNumero.toLowerCase().includes(searchQuery)) {
                card.classList.remove('is-hidden'); // Mostrar
                visibleCount++;
            } else {
                card.classList.add('is-hidden'); // Ocultar
            }
        });
        
        // Manejar mensaje de "no hay resultados"
        const noResultsMsg = listWrapper.querySelector('.no-results-message');
        if (visibleCount === 0 && cards.length > 0) {
            if (!noResultsMsg) {
                listWrapper.insertAdjacentHTML('beforeend', '<div class="empty-state no-results-message"><p>No se encontraron coincidencias para "' + input.value + '"</p></div>');
            }
        } else {
            if (noResultsMsg) noResultsMsg.remove();
        }
    };

    if (searchCheckinInput) {
        searchCheckinInput.addEventListener('input', () => filterCardList(searchCheckinInput, checkinListWrapper));
    }
    if (searchCheckoutInput) {
        searchCheckoutInput.addEventListener('input', () => filterCardList(searchCheckoutInput, checkoutListWrapper));
    }

    // -------------------------------------------------------------------
    // 3. LÓGICA DE FILTROS DEL TABLERO COMPLETO
    // -------------------------------------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    const roomBoard = document.getElementById('room-board');

    if (filterButtons.length > 0 && roomBoard) {
        filterButtons.forEach(filterBtn => {
            filterBtn.addEventListener('click', () => {
                const filterStatus = filterBtn.dataset.statusFilter;
                const allRoomCards = roomBoard.querySelectorAll('.room-card');

                // Actualizar botones activos
                filterButtons.forEach(btn => btn.classList.remove('is-active'));
                filterBtn.classList.add('is-active');

                // Filtrar tarjetas
                allRoomCards.forEach(card => {
                    const cardStatus = card.dataset.status;
                    if (filterStatus === 'TODOS' || cardStatus === filterStatus) {
                        card.classList.remove('is-hidden');
                    } else {
                        card.classList.add('is-hidden');
                    }
                });
            });
        });
    }

    // -------------------------------------------------------------------
    // 4. LÓGICA DE ACCIONES (Botones de Check-out, Disponible, etc.)
    // -------------------------------------------------------------------
    const statusMessage = document.getElementById('status-message');

    // Se usa document.body para que funcione en las 3 pestañas
    document.body.addEventListener('click', async (event) => {
        // Buscar tanto botones antiguos como nuevos
        const button = event.target.closest('.btn-action') || event.target.closest('.room-action-btn');
        if (!button) return; 

        const action = button.dataset.action;
        const habId = button.dataset.habId;
        const reservaId = button.dataset.reservaId; 

        let url = '';
        let nuevoEstado = '';
        let confirmMessage = '';
        let method = 'POST'; 

        switch (action) {
            case 'checkout': 
                if (!habId || !reservaId) return alert('Error: Faltan IDs para el Check-out.');
                url = `/hoteleria/habitaciones/${habId}/checkout`; 
                confirmMessage = `¿Confirmar Check-out para la habitación ${habId}?`;
                break;
            case 'disponible':
                url = `/hoteleria/habitaciones/${habId}/cambiar-estado`;
                nuevoEstado = 'DISPONIBLE';
                confirmMessage = `¿Marcar habitación ${habId} como Disponible?`;
                break;
            case 'limpieza':
                 url = `/hoteleria/habitaciones/${habId}/cambiar-estado`;
                 nuevoEstado = 'LIMPIEZA';
                 confirmMessage = `¿Marcar habitación ${habId} para Limpieza?`;
                 break;
            case 'mantenimiento':
                 url = `/hoteleria/habitaciones/${habId}/cambiar-estado`;
                 nuevoEstado = 'MANTENIMIENTO';
                 confirmMessage = `¿Marcar habitación ${habId} en Mantenimiento?`;
                 break;
            default:
                return; 
        }

        if (!confirm(confirmMessage)) return; 

        button.classList.add('is-loading');
        if (statusMessage) statusMessage.classList.add('is-hidden');

        try {
            const bodyData = nuevoEstado ? { nuevoEstado: nuevoEstado } : {};
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData) 
            });

            if (!response.ok) {
                 const errorText = await response.text();
                 let errorMsg = `Error ${response.status}`;
                 try {
                     const errorData = JSON.parse(errorText);
                     errorMsg = errorData.error || errorMsg;
                 } catch (e) {}
                 throw new Error(errorMsg);
            }
            
            if (statusMessage) {
                statusMessage.textContent = `Acción "${action}" realizada con éxito. Recargando...`;
                statusMessage.className = 'status-message status-message--success'; 
                statusMessage.classList.remove('is-hidden');
            }
            
             setTimeout(() => { window.location.reload(); }, 1500);

        } catch (error) {
            console.error(`Error en acción ${action}:`, error);
            if (statusMessage) {
                statusMessage.textContent = `Error: ${error.message}`;
                statusMessage.className = 'status-message status-message--error';
                statusMessage.classList.remove('is-hidden');
            }
            button.classList.remove('is-loading'); 
        } 
    });

});

// -------------------------------------------------------------------
// 5. FUNCIONALIDAD ADICIONAL - Navegación y utilidades
// -------------------------------------------------------------------

// Función para mostrar mensajes de estado
function showStatusMessage(message, type = 'success') {
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message status-message--${type}`;
        statusMessage.classList.remove('is-hidden');
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            statusMessage.classList.add('is-hidden');
        }, 5000);
    }
}

// Función para manejar errores de navegación
function handleNavigationError(error) {
    console.error('Error de navegación:', error);
    showStatusMessage('Error al navegar. Por favor, inténtelo de nuevo.', 'error');
}

// Verificar que todos los enlaces funcionen correctamente
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (link && link.href) {
        // Verificar si es un enlace interno
        try {
            const url = new URL(link.href, window.location.origin);
            if (url.origin === window.location.origin) {
                // Es un enlace interno, verificar que no esté roto
                console.log('Navegando a:', url.pathname);
                
                // Verificar rutas específicas
                if (url.pathname === '/hoteleria/reservas/new') {
                    console.log('✓ Enlace a Nueva Reserva - OK');
                } else if (url.pathname === '/hoteleria/walk-in') {
                    console.log('✓ Enlace a Walk-in - OK');
                }
            }
        } catch (error) {
            console.error('Error al procesar URL:', error);
        }
    }
});

// Verificar que las rutas existan al cargar la página
function verifyRoutes() {
    const routes = [
        '/hoteleria/reservas/new',
        '/hoteleria/walk-in',
        '/hoteleria/checkin-checkout'
    ];
    
    console.log('Verificando rutas importantes:');
    routes.forEach(route => {
        console.log(`- ${route}: Configurado`);
    });
}

// Inicializar tooltips y otros elementos interactivos
function initializeInteractiveElements() {
    // Añadir efectos hover a las tarjetas
    const roomCards = document.querySelectorAll('.room-card');
    roomCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
}

// Ejecutar inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeInteractiveElements();
        verifyRoutes();
    });
} else {
    initializeInteractiveElements();
    verifyRoutes();
}