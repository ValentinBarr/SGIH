// Sistema de Pestañas para Calendarios
(function() {
  'use strict';

  function inicializarTabs() {
    const tabs = document.querySelectorAll('.calendario-tabs li');
    const tabContents = document.querySelectorAll('.calendario-tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const targetTab = this.getAttribute('data-tab');
        
        // Remover clase active de todas las pestañas
        tabs.forEach(t => t.classList.remove('is-active'));
        
        // Agregar clase active a la pestaña clickeada
        this.classList.add('is-active');
        
        // Ocultar todos los contenidos
        tabContents.forEach(content => {
          content.classList.remove('active');
        });
        
        // Mostrar el contenido correspondiente
        let targetContent;
        if (targetTab === 'tabla') {
          targetContent = document.getElementById('tabla-reservas-container');
        } else {
          targetContent = document.getElementById(`calendario-${targetTab}-container`);
        }
        
        if (targetContent) {
          targetContent.classList.add('active');
          
          // Trigger resize event para que los calendarios se ajusten
          window.dispatchEvent(new Event('resize'));
          
          // Si es el calendario visual, reinicializar
          if (targetTab === 'visual' && window.calendarioVisualReservas) {
            setTimeout(() => {
              window.calendarioVisualReservas.cargarReservas();
            }, 100);
          }
          
          console.log(`Cambiado a pestaña: ${targetTab}`);
        }
      });
    });
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarTabs);
  } else {
    inicializarTabs();
  }
})();
