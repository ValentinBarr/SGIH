// js/room-board.js
document.addEventListener('DOMContentLoaded', () => {
    
    // -------------------------------------------------------------------
    // 1. LÓGICA DE PESTAÑAS (Tabs)
    // -------------------------------------------------------------------
    const tabs = document.querySelectorAll('.tabs li');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabs.length > 0 && tabContents.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.tab; // ej: "tab-checkin"
                const targetContent = document.getElementById(targetId);

                // Quitar 'is-active' de todas las pestañas y ocultar todo el contenido
                tabs.forEach(t => t.classList.remove('is-active'));
                tabContents.forEach(tc => tc.classList.add('is-hidden'));

                // Activar la pestaña clickeada y mostrar su contenido
                tab.classList.add('is-active');
                if (targetContent) {
                    targetContent.classList.remove('is-hidden');
                }
            });
        });
    }

    // -------------------------------------------------------------------
    // 2. LÓGICA DE BÚSQUEDA (Check-in y Ocupadas)
    // -------------------------------------------------------------------
    const searchCheckinInput = document.getElementById('search-checkin-input');
    const checkinListWrapper = document.getElementById('checkin-list-wrapper');
    const searchCheckoutInput = document.getElementById('search-checkout-input');
    const checkoutListWrapper = document.getElementById('checkout-list-wrapper');

    // Función genérica para filtrar tarjetas (wrapper)
    const filterCardList = (input, listWrapper) => {
        const searchQuery = input.value.toLowerCase().trim();
        // Busca las tarjetas (columnas)
        const cards = listWrapper.querySelectorAll('.room-card-wrapper'); 
        let visibleCount = 0;

        cards.forEach(card => {
            const nombreHuesped = card.dataset.nombreHuesped || ''; 
            const documentoHuesped = card.dataset.documentoHuesped || '';
            
            if (nombreHuesped.includes(searchQuery) || documentoHuesped.includes(searchQuery)) {
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
                listWrapper.insertAdjacentHTML('beforeend', '<div class="column is-full has-text-grey-light has-text-centered no-results-message">No hay coincidencias.</div>');
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

    // --- (SECCIÓN DE FILTROS DEL TABLERO ELIMINADA) ---

    // -------------------------------------------------------------------
    // 3. LÓGICA DE ACCIONES (Botones de Check-out, Disponible, etc.)
    // -------------------------------------------------------------------
    const statusMessage = document.getElementById('status-message');

    // Se usa document.body para que funcione en las 3 pestañas
    document.body.addEventListener('click', async (event) => {
        const button = event.target.closest('.btn-action');
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
                statusMessage.className = 'notification is-success mt-4'; 
            }
            
             setTimeout(() => { window.location.reload(); }, 1500);

        } catch (error) {
            console.error(`Error en acción ${action}:`, error);
            if (statusMessage) {
                statusMessage.textContent = `Error: ${error.message}`;
                statusMessage.className = 'notification is-danger mt-4';
            }
            button.classList.remove('is-loading'); 
        } 
    });
});