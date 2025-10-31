// Calendario Visual de Reservas - Solo Vista
(function() {
  'use strict';

  let estado = {
    fechaActual: new Date(),
    vistaActiva: 'mes',
    reservas: []
  };

  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Cargar reservas desde la API
  async function cargarReservas() {
    try {
      console.log('🔄 Cargando reservas desde API...');
      const response = await fetch('/hoteleria/reservas/api/calendario');
      
      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        estado.reservas = data.reservas || [];
        console.log('✅ Reservas cargadas exitosamente:', estado.reservas.length);
        
        if (estado.reservas.length > 0) {
          console.log('📋 Primera reserva de ejemplo:', estado.reservas[0]);
        }
        
        renderizarCalendario();
      } else {
        console.error('❌ Error en la respuesta:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('📄 Contenido del error:', errorText);
      }
    } catch (error) {
      console.error('💥 Error al cargar reservas:', error);
    }
  }

  // Obtener reservas para una fecha específica
  function obtenerReservasPorFecha(fecha) {
    const fechaStr = fecha.toISOString().split('T')[0];
    return estado.reservas.filter(reserva => {
      const checkIn = new Date(reserva.fechaCheckIn).toISOString().split('T')[0];
      const checkOut = new Date(reserva.fechaCheckOut).toISOString().split('T')[0];
      return fechaStr >= checkIn && fechaStr < checkOut;
    });
  }

  // Obtener check-ins del día
  function obtenerCheckIns(fecha) {
    const fechaStr = fecha.toISOString().split('T')[0];
    return estado.reservas.filter(reserva => {
      const checkIn = new Date(reserva.fechaCheckIn).toISOString().split('T')[0];
      return fechaStr === checkIn;
    });
  }

  // Obtener check-outs del día
  function obtenerCheckOuts(fecha) {
    const fechaStr = fecha.toISOString().split('T')[0];
    return estado.reservas.filter(reserva => {
      const checkOut = new Date(reserva.fechaCheckOut).toISOString().split('T')[0];
      return fechaStr === checkOut;
    });
  }

  // Formatear fecha legible
  function formatearFechaLegible(fecha) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `${dias[fecha.getDay()]}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
  }

  // Actualizar título del período
  function actualizarTituloPeriodo() {
    const titulo = document.getElementById('periodo-actual-visual');
    if (!titulo) return;
    
    if (estado.vistaActiva === 'mes') {
      titulo.textContent = `${MESES[estado.fechaActual.getMonth()]} ${estado.fechaActual.getFullYear()}`;
    } else {
      const inicioSemana = new Date(estado.fechaActual);
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1);
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(finSemana.getDate() + 6);
      
      titulo.textContent = `${inicioSemana.getDate()} ${MESES[inicioSemana.getMonth()]} - ${finSemana.getDate()} ${MESES[finSemana.getMonth()]} ${finSemana.getFullYear()}`;
    }
  }

  // Renderizar vista de mes - Solo mostrar reservas
  function renderizarVistaMes() {
    const container = document.getElementById('calendario-container-visual');
    if (!container) return;
    
    const primerDia = new Date(estado.fechaActual.getFullYear(), estado.fechaActual.getMonth(), 1);
    const ultimoDia = new Date(estado.fechaActual.getFullYear(), estado.fechaActual.getMonth() + 1, 0);
    
    // Ajustar para empezar en domingo (0)
    let diaSemanaInicio = primerDia.getDay();
    
    let html = '<div class="calendario-mes">';
    
    // Header con días de la semana
    html += '<div class="calendario-mes-header">';
    DIAS_SEMANA.forEach(dia => {
      html += `<div class="dia-header">${dia}</div>`;
    });
    html += '</div>';
    
    html += '<div class="calendario-mes-grid">';
    
    // Días del mes anterior (para completar la primera semana)
    const mesAnterior = new Date(estado.fechaActual.getFullYear(), estado.fechaActual.getMonth(), 0);
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const dia = mesAnterior.getDate() - i;
      html += `<div class="dia-celda otro-mes">
        <div class="dia-numero">${dia}</div>
      </div>`;
    }
    
    // Días del mes actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(estado.fechaActual.getFullYear(), estado.fechaActual.getMonth(), dia);
      fecha.setHours(0, 0, 0, 0);
      const esHoy = fecha.getTime() === hoy.getTime();
      
      // Obtener eventos del día
      const checkIns = obtenerCheckIns(fecha);
      const checkOuts = obtenerCheckOuts(fecha);
      const reservasActivas = obtenerReservasPorFecha(fecha);
      
      html += `<div class="dia-celda ${esHoy ? 'dia-hoy' : ''}" data-fecha="${fecha.toISOString()}" onclick="mostrarDetallesDia('${fecha.toISOString()}')">`;
      html += `<div class="dia-numero">${dia}</div>`;
      
      // Mostrar eventos si los hay
      if (checkIns.length > 0 || checkOuts.length > 0 || reservasActivas.length > 0) {
        html += '<div class="dia-eventos">';
        
        // Check-ins del día
        if (checkIns.length > 0) {
          html += `<div class="evento-badge checkin" title="${checkIns.length} Check-in(s) hoy">
            <i class="fas fa-sign-in-alt"></i> ${checkIns.length}
          </div>`;
        }
        
        // Check-outs del día
        if (checkOuts.length > 0) {
          html += `<div class="evento-badge checkout" title="${checkOuts.length} Check-out(s) hoy">
            <i class="fas fa-sign-out-alt"></i> ${checkOuts.length}
          </div>`;
        }
        
        // Habitaciones ocupadas (sin contar check-outs del mismo día)
        const ocupadas = reservasActivas.filter(r => {
          const checkOutFecha = new Date(r.fechaCheckOut);
          checkOutFecha.setHours(0, 0, 0, 0);
          return checkOutFecha.getTime() !== fecha.getTime();
        });
        
        if (ocupadas.length > 0) {
          html += `<div class="evento-badge ocupado" title="${ocupadas.length} habitación(es) ocupada(s)">
            <i class="fas fa-bed"></i> ${ocupadas.length}
          </div>`;
        }
        
        html += '</div>';
      }
      
      html += '</div>';
    }
    
    // Días del mes siguiente
    const diasMostrados = diaSemanaInicio + ultimoDia.getDate();
    const diasRestantes = 7 - (diasMostrados % 7);
    if (diasRestantes < 7) {
      for (let dia = 1; dia <= diasRestantes; dia++) {
        html += `<div class="dia-celda otro-mes">${dia}</div>`;
      }
    }
    
    html += '</div></div>';
    container.innerHTML = html;
    
    // Agregar event listeners para mostrar detalles
    document.querySelectorAll('.dia-celda:not(.otro-mes)').forEach(celda => {
      celda.addEventListener('click', function() {
        const fechaStr = this.getAttribute('data-fecha');
        if (fechaStr) {
          mostrarDetallesDia(new Date(fechaStr));
        }
      });
    });
  }

  // Renderizar vista de semana
  function renderizarVistaSemana() {
    const container = document.getElementById('calendario-container-visual');
    if (!container) return;
    
    const inicioSemana = new Date(estado.fechaActual);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1);
    
    let html = '<div class="calendario-semana">';
    
    const hoy = new Date();
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(fecha.getDate() + i);
      const esHoy = fecha.toDateString() === hoy.toDateString();
      
      const reservasActivas = obtenerReservasPorFecha(fecha);
      const checkIns = obtenerCheckIns(fecha);
      const checkOuts = obtenerCheckOuts(fecha);
      
      html += `<div class="semana-dia ${esHoy ? 'dia-hoy' : ''}" data-fecha="${fecha.toISOString()}">`;
      html += `<div class="semana-dia-header">`;
      html += `<div class="semana-dia-nombre">${DIAS_SEMANA[i]}</div>`;
      html += `<div class="semana-dia-numero">${fecha.getDate()}</div>`;
      html += `</div>`;
      
      html += '<div class="semana-dia-contenido">';
      
      if (checkIns.length > 0) {
        html += `<div class="evento-item checkin">
          <i class="fas fa-sign-in-alt"></i>
          <span>${checkIns.length} Check-in${checkIns.length > 1 ? 's' : ''}</span>
        </div>`;
      }
      
      if (reservasActivas.length > 0) {
        html += `<div class="evento-item ocupado">
          <i class="fas fa-bed"></i>
          <span>${reservasActivas.length} Ocupada${reservasActivas.length > 1 ? 's' : ''}</span>
        </div>`;
      }
      
      if (checkOuts.length > 0) {
        html += `<div class="evento-item checkout">
          <i class="fas fa-sign-out-alt"></i>
          <span>${checkOuts.length} Check-out${checkOuts.length > 1 ? 's' : ''}</span>
        </div>`;
      }
      
      if (checkIns.length === 0 && checkOuts.length === 0 && reservasActivas.length === 0) {
        html += '<div class="sin-eventos">Sin eventos</div>';
      }
      
      html += '</div></div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Agregar event listeners
    document.querySelectorAll('.semana-dia').forEach(celda => {
      celda.addEventListener('click', function() {
        const fechaStr = this.getAttribute('data-fecha');
        if (fechaStr) {
          mostrarDetallesDia(new Date(fechaStr));
        }
      });
    });
  }

  // Mostrar detalles de un día específico
  function mostrarDetallesDia(fecha) {
    const section = document.getElementById('habitaciones-section-visual');
    const titulo = document.getElementById('fecha-seleccionada-title-visual');
    const container = document.getElementById('habitaciones-container-visual');
    
    if (!section || !titulo || !container) return;
    
    const checkIns = obtenerCheckIns(fecha);
    const checkOuts = obtenerCheckOuts(fecha);
    const reservasActivas = obtenerReservasPorFecha(fecha);
    
    titulo.textContent = `Detalles para ${formatearFechaLegible(fecha)}`;
    
    let html = '';
    
    if (checkIns.length > 0) {
      html += '<div class="detalle-seccion">';
      html += `<h5 class="subtitle is-5"><i class="fas fa-sign-in-alt has-text-success"></i> Check-ins (${checkIns.length})</h5>`;
      html += '<div class="reservas-lista">';
      checkIns.forEach(reserva => {
        html += renderizarTarjetaReserva(reserva, 'checkin');
      });
      html += '</div></div>';
    }
    
    if (reservasActivas.length > 0) {
      html += '<div class="detalle-seccion">';
      html += `<h5 class="subtitle is-5"><i class="fas fa-bed has-text-info"></i> Habitaciones Ocupadas (${reservasActivas.length})</h5>`;
      html += '<div class="reservas-lista">';
      reservasActivas.forEach(reserva => {
        html += renderizarTarjetaReserva(reserva, 'ocupado');
      });
      html += '</div></div>';
    }
    
    if (checkOuts.length > 0) {
      html += '<div class="detalle-seccion">';
      html += `<h5 class="subtitle is-5"><i class="fas fa-sign-out-alt has-text-warning"></i> Check-outs (${checkOuts.length})</h5>`;
      html += '<div class="reservas-lista">';
      checkOuts.forEach(reserva => {
        html += renderizarTarjetaReserva(reserva, 'checkout');
      });
      html += '</div></div>';
    }
    
    if (checkIns.length === 0 && checkOuts.length === 0 && reservasActivas.length === 0) {
      html = '<div class="notification is-light">No hay eventos programados para este día.</div>';
    }
    
    container.innerHTML = html;
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Renderizar tarjeta de reserva
  function renderizarTarjetaReserva(reserva, tipo) {
    const colorClass = tipo === 'checkin' ? 'is-success' : tipo === 'checkout' ? 'is-warning' : 'is-info';
    const huesped = reserva.Huesped ? `${reserva.Huesped.apellido}, ${reserva.Huesped.nombre}` : 'N/A';
    const habitacion = reserva.Habitacion ? `Hab. ${reserva.Habitacion.numero}` : 'N/A';
    
    return `
      <div class="box reserva-card ${colorClass}">
        <div class="level is-mobile">
          <div class="level-left">
            <div>
              <p class="has-text-weight-bold">${huesped}</p>
              <p class="is-size-7 has-text-grey">${reserva.codigoReserva}</p>
            </div>
          </div>
          <div class="level-right">
            <div class="has-text-right">
              <p class="has-text-weight-semibold">${habitacion}</p>
              <p class="is-size-7">${formatearFecha(reserva.fechaCheckIn)} - ${formatearFecha(reserva.fechaCheckOut)}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Formatear fecha corta
  function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return `${fecha.getDate()}/${fecha.getMonth() + 1}`;
  }

  // Renderizar calendario
  function renderizarCalendario() {
    if (estado.vistaActiva === 'mes') {
      renderizarVistaMes();
    } else {
      renderizarVistaSemana();
    }
    actualizarTituloPeriodo();
  }

  // Mostrar detalles del día seleccionado
  function mostrarDetallesDia(fechaISO) {
    const fecha = new Date(fechaISO);
    const checkIns = obtenerCheckIns(fecha);
    const checkOuts = obtenerCheckOuts(fecha);
    const reservasActivas = obtenerReservasPorFecha(fecha);
    
    const habitacionesSection = document.getElementById('habitaciones-section-visual');
    const fechaTitleElement = document.getElementById('fecha-seleccionada-title-visual');
    const habitacionesContainer = document.getElementById('habitaciones-container-visual');
    
    if (!habitacionesSection || !fechaTitleElement || !habitacionesContainer) return;
    
    // Actualizar título
    fechaTitleElement.textContent = formatearFechaLegible(fecha);
    
    // Generar contenido
    let html = '';
    
    if (checkIns.length === 0 && checkOuts.length === 0 && reservasActivas.length === 0) {
      html = '<div class="no-eventos"><i class="fas fa-calendar-day"></i> No hay eventos para este día</div>';
    } else {
      // Check-ins
      if (checkIns.length > 0) {
        html += '<div class="eventos-grupo">';
        html += '<h5 class="eventos-titulo"><i class="fas fa-sign-in-alt"></i> Check-ins del día</h5>';
        checkIns.forEach(reserva => {
          html += `<div class="evento-item checkin">
            <div class="evento-info">
              <strong>${reserva.Huesped?.apellido}, ${reserva.Huesped?.nombre}</strong>
              <span class="evento-detalle">Habitación ${reserva.Habitacion?.numero} - ${reserva.codigoReserva}</span>
            </div>
          </div>`;
        });
        html += '</div>';
      }
      
      // Check-outs
      if (checkOuts.length > 0) {
        html += '<div class="eventos-grupo">';
        html += '<h5 class="eventos-titulo"><i class="fas fa-sign-out-alt"></i> Check-outs del día</h5>';
        checkOuts.forEach(reserva => {
          html += `<div class="evento-item checkout">
            <div class="evento-info">
              <strong>${reserva.Huesped?.apellido}, ${reserva.Huesped?.nombre}</strong>
              <span class="evento-detalle">Habitación ${reserva.Habitacion?.numero} - ${reserva.codigoReserva}</span>
            </div>
          </div>`;
        });
        html += '</div>';
      }
      
      // Habitaciones ocupadas
      const ocupadas = reservasActivas.filter(r => {
        const checkOutFecha = new Date(r.fechaCheckOut);
        checkOutFecha.setHours(0, 0, 0, 0);
        return checkOutFecha.getTime() !== fecha.getTime();
      });
      
      if (ocupadas.length > 0) {
        html += '<div class="eventos-grupo">';
        html += '<h5 class="eventos-titulo"><i class="fas fa-bed"></i> Habitaciones ocupadas</h5>';
        ocupadas.forEach(reserva => {
          const checkIn = new Date(reserva.fechaCheckIn);
          const checkOut = new Date(reserva.fechaCheckOut);
          const noches = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
          
          html += `<div class="evento-item ocupado">
            <div class="evento-info">
              <strong>${reserva.Huesped?.apellido}, ${reserva.Huesped?.nombre}</strong>
              <span class="evento-detalle">Habitación ${reserva.Habitacion?.numero} - ${reserva.codigoReserva}</span>
              <span class="evento-fechas">${formatearFecha(reserva.fechaCheckIn)} - ${formatearFecha(reserva.fechaCheckOut)} (${noches} noches)</span>
            </div>
          </div>`;
        });
        html += '</div>';
      }
    }
    
    habitacionesContainer.innerHTML = html;
    habitacionesSection.style.display = 'block';
  }
  
  // Formatear fecha simple
  function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
  }
  
  // Hacer la función global para que pueda ser llamada desde el HTML
  window.mostrarDetallesDia = mostrarDetallesDia;

  // Inicializar
  function inicializar() {
    // Verificar si el contenedor existe
    const container = document.getElementById('calendario-container-visual');
    if (!container) {
      console.log('❌ Calendario visual: contenedor no encontrado');
      return;
    }

    console.log('🚀 Inicializando calendario visual...');
    console.log('📦 Contenedor encontrado:', container);
    
    // Botones de navegación
    const btnPrev = document.getElementById('btn-prev-visual');
    const btnNext = document.getElementById('btn-next-visual');
    const btnHoy = document.getElementById('btn-hoy-visual');
    
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (estado.vistaActiva === 'mes') {
          estado.fechaActual.setMonth(estado.fechaActual.getMonth() - 1);
        } else {
          estado.fechaActual.setDate(estado.fechaActual.getDate() - 7);
        }
        renderizarCalendario();
      });
    }
    
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (estado.vistaActiva === 'mes') {
          estado.fechaActual.setMonth(estado.fechaActual.getMonth() + 1);
        } else {
          estado.fechaActual.setDate(estado.fechaActual.getDate() + 7);
        }
        renderizarCalendario();
      });
    }
    
    if (btnHoy) {
      btnHoy.addEventListener('click', () => {
        estado.fechaActual = new Date();
        renderizarCalendario();
      });
    }
    
    // Botones de vista (solo para el calendario visual)
    document.querySelectorAll('#calendario-visual-container .btn-vista').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('#calendario-visual-container .btn-vista').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        estado.vistaActiva = this.getAttribute('data-vista');
        renderizarCalendario();
      });
    });
    
    // Renderizar calendario vacío primero
    renderizarCalendario();
    
    // Luego cargar reservas y re-renderizar
    cargarReservas();
  }

  // Exponer funciones globales
  window.calendarioVisualReservas = {
    inicializar: inicializar,
    cargarReservas: cargarReservas
  };

  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

})();
