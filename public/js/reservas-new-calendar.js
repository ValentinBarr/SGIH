// ====================================================================
// CALENDARIO MODAL PARA NUEVA RESERVA
// ====================================================================

(function() {
    'use strict';

    // Elementos del formulario
    const checkInInput = document.getElementById('fechaCheckIn_new');
    const checkOutInput = document.getElementById('fechaCheckOut_new');

    // -------------------------------------------------------------------
    // Modal de Calendario
    // -------------------------------------------------------------------
    let calendarioMes = new Date();
    let tempCheckIn = null;
    let tempCheckOut = null;
    
    const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    function abrirModalCalendario() {
        // Cargar fechas actuales
        tempCheckIn = checkInInput.value ? new Date(checkInInput.value + 'T00:00:00') : null;
        tempCheckOut = checkOutInput.value ? new Date(checkOutInput.value + 'T00:00:00') : null;
        
        const modal = document.getElementById('modal-calendario-new');
        modal.classList.add('is-active');
        
        actualizarDisplayFechas();
        renderizarModalCalendario();
    }
    
    function cerrarModalCalendario() {
        document.getElementById('modal-calendario-new').classList.remove('is-active');
    }
    
    function actualizarDisplayFechas() {
        const checkinDisplay = document.getElementById('modal-checkin-display-new');
        const checkoutDisplay = document.getElementById('modal-checkout-display-new');
        
        if (tempCheckIn) {
            checkinDisplay.textContent = tempCheckIn.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
            checkinDisplay.classList.remove('is-light');
            checkinDisplay.classList.add('is-info');
        } else {
            checkinDisplay.textContent = 'No seleccionado';
            checkinDisplay.classList.add('is-light');
            checkinDisplay.classList.remove('is-info');
        }
        
        if (tempCheckOut) {
            checkoutDisplay.textContent = tempCheckOut.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
            checkoutDisplay.classList.remove('is-light');
            checkoutDisplay.classList.add('is-success');
        } else {
            checkoutDisplay.textContent = 'No seleccionado';
            checkoutDisplay.classList.add('is-light');
            checkoutDisplay.classList.remove('is-success');
        }
    }
    
    function renderizarModalCalendario() {
        const titulo = document.getElementById('modal-cal-titulo-new');
        const grid = document.getElementById('modal-cal-grid-new');
        
        titulo.textContent = `${MESES[calendarioMes.getMonth()]} ${calendarioMes.getFullYear()}`;
        
        // Limpiar grid
        grid.innerHTML = '';
        
        // Headers de días
        DIAS_SEMANA.forEach(dia => {
            const div = document.createElement('div');
            div.className = 'calendario-modal-dia header';
            div.textContent = dia;
            grid.appendChild(div);
        });
        
        // Obtener primer y último día del mes
        const primerDia = new Date(calendarioMes.getFullYear(), calendarioMes.getMonth(), 1);
        const ultimoDia = new Date(calendarioMes.getFullYear(), calendarioMes.getMonth() + 1, 0);
        
        // Días vacíos al inicio
        const diaSemanaInicio = primerDia.getDay();
        for (let i = 0; i < diaSemanaInicio; i++) {
            const div = document.createElement('div');
            grid.appendChild(div);
        }
        
        // Días del mes
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const fecha = new Date(calendarioMes.getFullYear(), calendarioMes.getMonth(), dia);
            fecha.setHours(0, 0, 0, 0);
            
            const div = document.createElement('div');
            div.className = 'calendario-modal-dia';
            div.textContent = dia;
            
            // Marcar hoy
            if (fecha.getTime() === hoy.getTime()) {
                div.classList.add('today');
            }
            
            // Deshabilitar días pasados
            if (fecha < hoy) {
                div.classList.add('disabled');
            } else {
                // Marcar check-in
                if (tempCheckIn && fecha.getTime() === tempCheckIn.getTime()) {
                    div.classList.add('checkin');
                }
                
                // Marcar check-out
                if (tempCheckOut && fecha.getTime() === tempCheckOut.getTime()) {
                    div.classList.add('checkout');
                }
                
                // Marcar rango
                if (tempCheckIn && tempCheckOut && fecha > tempCheckIn && fecha < tempCheckOut) {
                    div.classList.add('in-range');
                }
                
                // Event listener
                div.addEventListener('click', () => {
                    if (!tempCheckIn || (tempCheckIn && tempCheckOut)) {
                        // Seleccionar check-in
                        tempCheckIn = fecha;
                        tempCheckOut = null;
                    } else if (fecha > tempCheckIn) {
                        // Seleccionar check-out
                        tempCheckOut = fecha;
                    } else {
                        // Si selecciona una fecha anterior, reiniciar
                        tempCheckIn = fecha;
                        tempCheckOut = null;
                    }
                    
                    actualizarDisplayFechas();
                    renderizarModalCalendario();
                });
            }
            
            grid.appendChild(div);
        }
    }
    
    function aplicarFechas() {
        if (tempCheckIn) {
            const isoCheckIn = tempCheckIn.toISOString().split('T')[0];
            checkInInput.value = isoCheckIn;
            checkInInput.dispatchEvent(new Event('change'));
        }
        
        if (tempCheckOut) {
            const isoCheckOut = tempCheckOut.toISOString().split('T')[0];
            checkOutInput.value = isoCheckOut;
            checkOutInput.dispatchEvent(new Event('change'));
        }
        
        cerrarModalCalendario();
    }
    
    // Event listeners del modal
    document.getElementById('btn-calendario-checkin-new').addEventListener('click', abrirModalCalendario);
    document.getElementById('btn-calendario-checkout-new').addEventListener('click', abrirModalCalendario);
    
    // También abrir al hacer click en los inputs
    checkInInput.addEventListener('click', abrirModalCalendario);
    checkOutInput.addEventListener('click', abrirModalCalendario);
    
    document.getElementById('modal-cal-close-new').addEventListener('click', cerrarModalCalendario);
    document.getElementById('modal-cal-cancelar-new').addEventListener('click', cerrarModalCalendario);
    document.querySelector('#modal-calendario-new .modal-background').addEventListener('click', cerrarModalCalendario);
    
    document.getElementById('modal-cal-prev-new').addEventListener('click', () => {
        calendarioMes.setMonth(calendarioMes.getMonth() - 1);
        renderizarModalCalendario();
    });
    
    document.getElementById('modal-cal-next-new').addEventListener('click', () => {
        calendarioMes.setMonth(calendarioMes.getMonth() + 1);
        renderizarModalCalendario();
    });
    
    document.getElementById('modal-cal-aplicar-new').addEventListener('click', aplicarFechas);
})();
