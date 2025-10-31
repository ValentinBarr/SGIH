// Sistema de Calendario de Disponibilidad Hotelera
(function() {
  'use strict';

  // Tipos de habitación - se cargarán de la API
  let TIPOS_HABITACION = [];

  // Cargar tipos de habitación reales desde la API
  async function cargarTiposHabitacionReales() {
    try {
      const response = await fetch('/api/calendario/tipos-habitacion');
      if (response.ok) {
        const data = await response.json();
        if (data.tiposHabitacion && data.tiposHabitacion.length > 0) {
          // Mapear los tipos reales al formato del calendario
          TIPOS_HABITACION = data.tiposHabitacion.map((tipo, index) => ({
            id: tipo.id_tipoHab,
            nombre: tipo.nombre,
            capacidad: tipo.capacidad,
            precio: parseFloat(tipo.precioBase),
            total: [10, 15, 12, 8, 10][index] || 10, // Totales variados para simular diferentes cantidades
            amenidades: index === 0 || index === 3 ? ['wifi', 'desayuno', 'estacionamiento'] : 
                       index === 1 || index === 4 ? ['wifi', 'desayuno'] : 
                       ['wifi']
          }));
          console.log('Tipos de habitación cargados desde la BD:', TIPOS_HABITACION);
          return true;
        }
      }
      console.log('Usando tipos de habitación simulados');
      return false;
    } catch (error) {
      console.error('Error al cargar tipos de habitación:', error);
      console.log('Usando tipos de habitación simulados');
      return false;
    }
  }

  // Iconos de amenidades
  const ICONOS_AMENIDADES = {
    wifi: '<i class="fas fa-wifi"></i>',
    desayuno: '<i class="fas fa-coffee"></i>',
    estacionamiento: '<i class="fas fa-car"></i>'
  };

  const NOMBRES_AMENIDADES = {
    wifi: 'WiFi',
    desayuno: 'Desayuno incluido',
    estacionamiento: 'Estacionamiento'
  };

  // Estado de la aplicación
  let estado = {
    fechaActual: new Date(),
    vistaActiva: 'mes',
    fechaSeleccionada: null,
    rangoSeleccion: {
      inicio: null,
      fin: null,
      seleccionando: false
    }
  };

  // Nombres de meses y días en español
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const DIAS_SEMANA_COMPLETO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Simular disponibilidad de habitaciones para una fecha
  function obtenerDisponibilidad(fecha, tipoHabitacionId) {
    const seed = fecha.getTime() + tipoHabitacionId;
    const random = Math.sin(seed) * 10000;
    const tipo = TIPOS_HABITACION.find(t => t.id === tipoHabitacionId);
    
    // Si no se encuentra el tipo, retornar 0
    if (!tipo) {
      console.warn('Tipo de habitación no encontrado:', tipoHabitacionId);
      return 0;
    }
    
    const porcentaje = (Math.abs(random) % 100) / 100;
    const disponibles = Math.floor(tipo.total * porcentaje);
    return Math.max(1, disponibles);
  }

  // Calcular porcentaje de disponibilidad
  function calcularPorcentaje(disponibles, total) {
    return Math.round((disponibles / total) * 100);
  }

  // Obtener color según disponibilidad
  function obtenerColorDisponibilidad(porcentaje) {
    if (porcentaje > 60) return '#10b981'; // Verde
    if (porcentaje >= 30) return '#f59e0b'; // Amarillo
    return '#ef4444'; // Rojo
  }

  // Verificar si dos fechas son el mismo día
  function esMismoDia(fecha1, fecha2) {
    return fecha1.getDate() === fecha2.getDate() &&
           fecha1.getMonth() === fecha2.getMonth() &&
           fecha1.getFullYear() === fecha2.getFullYear();
  }

  // Verificar si una fecha está en el rango seleccionado
  function estaEnRango(fecha) {
    if (!estado.rangoSeleccion.inicio || !estado.rangoSeleccion.fin) return false;
    const tiempo = fecha.getTime();
    const inicio = estado.rangoSeleccion.inicio.getTime();
    const fin = estado.rangoSeleccion.fin.getTime();
    return tiempo >= inicio && tiempo <= fin;
  }

  // Manejar selección de fecha para rango
  function manejarSeleccionFecha(fecha) {
    // Si no hay inicio o ya se completó una selección, iniciar nueva
    if (!estado.rangoSeleccion.inicio || estado.rangoSeleccion.fin) {
      estado.rangoSeleccion.inicio = fecha;
      estado.rangoSeleccion.fin = null;
      estado.rangoSeleccion.seleccionando = true;
      estado.fechaSeleccionada = null;
      console.log('Inicio de rango:', fecha);
    } else {
      // Ya hay inicio, establecer fin
      if (fecha < estado.rangoSeleccion.inicio) {
        // Si la fecha es anterior al inicio, intercambiar
        estado.rangoSeleccion.fin = estado.rangoSeleccion.inicio;
        estado.rangoSeleccion.inicio = fecha;
      } else {
        estado.rangoSeleccion.fin = fecha;
      }
      estado.rangoSeleccion.seleccionando = false;
      console.log('Rango completo:', estado.rangoSeleccion.inicio, '-', estado.rangoSeleccion.fin);
      
      // Mostrar habitaciones disponibles para el rango
      mostrarHabitacionesDisponibles();
    }
    
    renderizarCalendario();
  }

  // Calcular número de noches entre dos fechas
  function calcularNoches(inicio, fin) {
    const unDia = 24 * 60 * 60 * 1000;
    return Math.round((fin - inicio) / unDia);
  }

  // Formatear fecha legible
  function formatearFechaLegible(fecha) {
    const dia = DIAS_SEMANA_COMPLETO[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1];
    const numero = fecha.getDate();
    const mes = MESES[fecha.getMonth()].toLowerCase();
    const anio = fecha.getFullYear();
    return `${dia}, ${numero} de ${mes} de ${anio}`;
  }

  // Actualizar título del período
  function actualizarTituloPeriodo() {
    const titulo = document.getElementById('periodo-actual-funcional');
    const fecha = estado.fechaActual;
    
    if (estado.vistaActiva === 'mes') {
      titulo.textContent = `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
    } else if (estado.vistaActiva === 'semana') {
      const inicioSemana = new Date(fecha);
      inicioSemana.setDate(fecha.getDate() - (fecha.getDay() === 0 ? 6 : fecha.getDay() - 1));
      titulo.textContent = `Semana del ${inicioSemana.getDate()} de ${MESES[inicioSemana.getMonth()].substring(0, 3)}`;
    } else {
      titulo.textContent = formatearFechaLegible(fecha);
    }
  }

  // Renderizar vista de mes
  function renderizarVistaMes() {
    const container = document.getElementById('calendario-container-funcional');
    const fecha = estado.fechaActual;
    const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
    
    // Ajustar para que la semana empiece en lunes
    let diaSemanaInicio = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;
    
    let html = '<div class="calendario-mes">';
    
    // Encabezados de días
    html += '<div class="calendario-mes-header">';
    DIAS_SEMANA.forEach(dia => {
      html += `<div class="dia-header">${dia}</div>`;
    });
    html += '</div>';
    
    // Días del mes
    html += '<div class="calendario-mes-grid">';
    
    // Días vacíos al inicio
    for (let i = 0; i < diaSemanaInicio; i++) {
      html += '<div class="dia-celda vacio"></div>';
    }
    
    // Días del mes
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear horas para comparación correcta
    
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fechaDia = new Date(fecha.getFullYear(), fecha.getMonth(), dia);
      fechaDia.setHours(0, 0, 0, 0);
      
      const esHoy = esMismoDia(fechaDia, hoy);
      const esPasado = fechaDia < hoy;
      const esInicio = estado.rangoSeleccion.inicio && esMismoDia(fechaDia, estado.rangoSeleccion.inicio);
      const esFin = estado.rangoSeleccion.fin && esMismoDia(fechaDia, estado.rangoSeleccion.fin);
      const enRango = estaEnRango(fechaDia);
      
      // Calcular disponibilidad total del día
      let totalDisponibles = 0;
      let totalHabitaciones = 0;
      TIPOS_HABITACION.forEach(tipo => {
        const disponibles = obtenerDisponibilidad(fechaDia, tipo.id);
        totalDisponibles += disponibles;
        totalHabitaciones += tipo.total;
      });
      
      const porcentaje = calcularPorcentaje(totalDisponibles, totalHabitaciones);
      const color = obtenerColorDisponibilidad(porcentaje);
      
      const clases = ['dia-celda'];
      if (esHoy) clases.push('hoy');
      if (esPasado) clases.push('dia-pasado');
      if (esInicio) clases.push('rango-inicio');
      if (esFin) clases.push('rango-fin');
      if (enRango && !esInicio && !esFin) clases.push('en-rango');
      
      html += `
        <div class="${clases.join(' ')}" data-fecha="${fechaDia.toISOString()}" ${esPasado ? 'data-pasado="true"' : ''}>
          <div class="dia-numero">${dia}</div>
          ${esInicio ? '<div class="etiqueta-fecha">Check-in</div>' : ''}
          ${esFin ? '<div class="etiqueta-fecha">Check-out</div>' : ''}
          ${esPasado ? '<div class="dia-bloqueado"><i class="fas fa-ban"></i></div>' : ''}
          <div class="dia-indicador" style="background-color: ${color};"></div>
          <div class="dia-disponibilidad">${totalDisponibles} disponibles</div>
        </div>
      `;
    }
    
    html += '</div></div>';
    container.innerHTML = html;
    
    // Agregar event listeners
    document.querySelectorAll('.dia-celda:not(.vacio)').forEach(celda => {
      celda.addEventListener('click', function() {
        // No permitir seleccionar días pasados
        if (this.getAttribute('data-pasado') === 'true') {
          return;
        }
        
        const fechaStr = this.getAttribute('data-fecha');
        const fecha = new Date(fechaStr);
        manejarSeleccionFecha(fecha);
      });
    });
  }

  // Renderizar vista de semana
  function renderizarVistaSemana() {
    const container = document.getElementById('calendario-container-funcional');
    const fecha = estado.fechaActual;
    
    // Calcular inicio de la semana (lunes)
    const inicioSemana = new Date(fecha);
    inicioSemana.setDate(fecha.getDate() - (fecha.getDay() === 0 ? 6 : fecha.getDay() - 1));
    
    let html = '<div class="calendario-semana">';
    
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      
      const esHoy = esMismoDia(dia, new Date());
      const esSeleccionado = estado.fechaSeleccionada && esMismoDia(dia, estado.fechaSeleccionada);
      
      const clases = ['semana-dia'];
      if (esHoy) clases.push('hoy');
      if (esSeleccionado) clases.push('seleccionado');
      
      html += `<div class="${clases.join(' ')}" data-fecha="${dia.toISOString()}">`;
      html += `<div class="semana-dia-header">`;
      html += `<div class="semana-dia-nombre">${DIAS_SEMANA[i]}</div>`;
      html += `<div class="semana-dia-numero">${dia.getDate()}</div>`;
      html += `</div>`;
      html += `<div class="semana-disponibilidad">`;
      
      // Mostrar resumen de disponibilidad por tipo
      TIPOS_HABITACION.forEach(tipo => {
        const disponibles = obtenerDisponibilidad(dia, tipo.id);
        const porcentaje = calcularPorcentaje(disponibles, tipo.total);
        const color = obtenerColorDisponibilidad(porcentaje);
        
        html += `
          <div class="tipo-resumen">
            <span class="tipo-indicador" style="background-color: ${color};"></span>
            <span class="tipo-nombre-corto">${tipo.nombre.substring(0, 10)}...</span>
            <span class="tipo-cantidad">${disponibles}/${tipo.total}</span>
          </div>
        `;
      });
      
      html += `</div></div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Agregar event listeners
    document.querySelectorAll('.semana-dia').forEach(celda => {
      celda.addEventListener('click', function() {
        const fechaStr = this.getAttribute('data-fecha');
        estado.fechaSeleccionada = new Date(fechaStr);
        renderizarCalendario();
        mostrarHabitacionesDisponibles();
      });
    });
  }

  // Renderizar vista de día
  function renderizarVistaDia() {
    const container = document.getElementById('calendario-container-funcional');
    const fecha = estado.fechaActual;
    
    let html = '<div class="calendario-dia">';
    html += `<h3 class="dia-titulo">${formatearFechaLegible(fecha)}</h3>`;
    html += '<div class="dia-habitaciones">';
    
    TIPOS_HABITACION.forEach(tipo => {
      const disponibles = obtenerDisponibilidad(fecha, tipo.id);
      const porcentaje = calcularPorcentaje(disponibles, tipo.total);
      const color = obtenerColorDisponibilidad(porcentaje);
      
      html += renderizarTarjetaHabitacion(tipo, disponibles, porcentaje, color);
    });
    
    html += '</div></div>';
    container.innerHTML = html;
  }

  // Renderizar tarjeta de habitación
  function renderizarTarjetaHabitacion(tipo, disponibles, porcentaje, color, noches = 1) {
    const precioTotal = tipo.precio * noches;
    
    return `
      <div class="habitacion-card">
        <div class="habitacion-header">
          <h4 class="habitacion-nombre">${tipo.nombre}</h4>
          <div class="habitacion-precio-container">
            <div class="habitacion-precio-noche">$${tipo.precio}/noche</div>
            ${noches > 1 ? `<div class="habitacion-precio-total">Total: $${precioTotal}</div>` : ''}
          </div>
        </div>
        
        <div class="habitacion-info">
          <div class="habitacion-capacidad">
            <i class="fas fa-user"></i>
            <span>${tipo.capacidad} ${tipo.capacidad === 1 ? 'persona' : 'personas'}</span>
          </div>
        </div>
        
        <div class="habitacion-amenidades">
          ${tipo.amenidades.map(amenidad => `
            <div class="amenidad" title="${NOMBRES_AMENIDADES[amenidad]}">
              ${ICONOS_AMENIDADES[amenidad]}
              <span>${NOMBRES_AMENIDADES[amenidad]}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="habitacion-disponibilidad">
          <div class="disponibilidad-info">
            <i class="fas fa-bed"></i>
            <span>${disponibles} de ${tipo.total} disponibles</span>
          </div>
          <div class="disponibilidad-barra">
            <div class="disponibilidad-progreso" style="width: ${porcentaje}%; background-color: ${color};"></div>
          </div>
          <div class="disponibilidad-porcentaje" style="color: ${color};">
            ${porcentaje}% disponible
          </div>
        </div>
        
        <button class="btn-reservar" data-tipo-id="${tipo.id}" data-tipo-nombre="${tipo.nombre}" data-precio="${tipo.precio}">
          Reservar ahora
        </button>
      </div>
    `;
  }

  // Mostrar habitaciones disponibles para fecha seleccionada
  function mostrarHabitacionesDisponibles() {
    const section = document.getElementById('habitaciones-section-funcional');
    const titulo = document.getElementById('fecha-seleccionada-title-funcional');
    const container = document.getElementById('habitaciones-container-funcional');
    
    // Verificar si hay un rango completo seleccionado
    if (!estado.rangoSeleccion.inicio || !estado.rangoSeleccion.fin) {
      section.style.display = 'none';
      return;
    }
    
    const noches = calcularNoches(estado.rangoSeleccion.inicio, estado.rangoSeleccion.fin);
    
    console.log('Mostrando habitaciones para rango:', estado.rangoSeleccion.inicio, '-', estado.rangoSeleccion.fin);
    console.log('Noches:', noches);
    console.log('Total de tipos de habitación:', TIPOS_HABITACION.length);
    
    titulo.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">
          Disponibilidad para tu estadía
        </div>
        <div style="font-size: 1rem; color: #6b7280;">
          <i class="fas fa-calendar-check"></i> 
          ${formatearFechaCorta(estado.rangoSeleccion.inicio)} - ${formatearFechaCorta(estado.rangoSeleccion.fin)}
          <span style="margin-left: 1rem;">
            <i class="fas fa-moon"></i> ${noches} ${noches === 1 ? 'noche' : 'noches'}
          </span>
        </div>
      </div>
    `;
    
    let html = '';
    TIPOS_HABITACION.forEach((tipo, index) => {
      console.log(`Procesando tipo ${index + 1}:`, tipo);
      const disponibles = obtenerDisponibilidad(estado.rangoSeleccion.inicio, tipo.id);
      const porcentaje = calcularPorcentaje(disponibles, tipo.total);
      const color = obtenerColorDisponibilidad(porcentaje);
      
      console.log(`  - Disponibles: ${disponibles}/${tipo.total} (${porcentaje}%)`);
      
      html += renderizarTarjetaHabitacion(tipo, disponibles, porcentaje, color, noches);
    });
    
    console.log('HTML generado, longitud:', html.length);
    
    container.innerHTML = html;
    section.style.display = 'block';
    
    // Scroll suave a la sección
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Formatear fecha corta
  function formatearFechaCorta(fecha) {
    const dia = fecha.getDate();
    const mes = MESES[fecha.getMonth()];
    return `${dia} ${mes}`;
  }

  // Renderizar calendario según vista activa
  function renderizarCalendario() {
    if (estado.vistaActiva === 'mes') {
      renderizarVistaMes();
    } else if (estado.vistaActiva === 'semana') {
      renderizarVistaSemana();
    } else {
      renderizarVistaDia();
    }
    
    actualizarTituloPeriodo();
  }

  // Navegar hacia adelante
  function navegarSiguiente() {
    if (estado.vistaActiva === 'mes') {
      estado.fechaActual.setMonth(estado.fechaActual.getMonth() + 1);
    } else if (estado.vistaActiva === 'semana') {
      estado.fechaActual.setDate(estado.fechaActual.getDate() + 7);
    } else {
      estado.fechaActual.setDate(estado.fechaActual.getDate() + 1);
    }
    renderizarCalendario();
  }

  // Navegar hacia atrás
  function navegarAnterior() {
    if (estado.vistaActiva === 'mes') {
      estado.fechaActual.setMonth(estado.fechaActual.getMonth() - 1);
    } else if (estado.vistaActiva === 'semana') {
      estado.fechaActual.setDate(estado.fechaActual.getDate() - 7);
    } else {
      estado.fechaActual.setDate(estado.fechaActual.getDate() - 1);
    }
    renderizarCalendario();
  }

  // Volver a hoy
  function volverAHoy() {
    estado.fechaActual = new Date();
    estado.fechaSeleccionada = null;
    estado.rangoSeleccion = {
      inicio: null,
      fin: null,
      seleccionando: false
    };
    renderizarCalendario();
    const section = document.getElementById('habitaciones-section-funcional');
    if (section) section.style.display = 'none';
  }

  // Alias para compatibilidad
  const retrocederPeriodo = navegarAnterior;
  const avanzarPeriodo = navegarSiguiente;

  // Cambiar vista
  function cambiarVista(nuevaVista) {
    estado.vistaActiva = nuevaVista;
    estado.fechaSeleccionada = null;
    
    // Actualizar botones activos (solo en el calendario funcional)
    document.querySelectorAll('#calendario-funcional-container .btn-vista').forEach(btn => {
      btn.classList.remove('active');
    });
    const btnActivo = document.querySelector(`#calendario-funcional-container [data-vista="${nuevaVista}"]`);
    if (btnActivo) btnActivo.classList.add('active');
    
    renderizarCalendario();
    const section = document.getElementById('habitaciones-section-funcional');
    if (section) section.style.display = 'none';
  }

  // ====================================================================
  // FUNCIONALIDAD DE RESERVA
  // ====================================================================

  let datosReserva = {
    tipoHabitacionId: null,
    tipoHabitacionNombre: '',
    precio: 0,
    fechaSeleccionada: null
  };

  let huespedes = [];

  // Cargar huéspedes desde la API
  async function cargarHuespedes() {
    try {
      const response = await fetch('/api/calendario/huespedes');
      const data = await response.json();
      huespedes = data.huespedes || [];
      
      const select = document.getElementById('select-huesped');
      select.innerHTML = '<option value="">Seleccione un huésped</option>';
      
      huespedes.forEach(huesped => {
        const option = document.createElement('option');
        option.value = huesped.id_huesped;
        option.textContent = `${huesped.apellido}, ${huesped.nombre}${huesped.documento ? ' - ' + huesped.documento : ''}`;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error al cargar huéspedes:', error);
    }
  }

  // Abrir modal de reserva
  function abrirModalReserva(tipoHabitacion, fecha) {
    datosReserva = {
      tipoHabitacionId: tipoHabitacion.id,
      tipoHabitacionNombre: tipoHabitacion.nombre,
      precio: tipoHabitacion.precio,
      fechaSeleccionada: fecha
    };

    // Llenar datos del formulario
    document.getElementById('tipo-habitacion-nombre').value = tipoHabitacion.nombre;
    document.getElementById('tipo-habitacion-id').value = tipoHabitacion.id;
    document.getElementById('precio-habitacion').value = `$${tipoHabitacion.precio}`;
    
    // Establecer fechas por defecto
    const checkIn = new Date(fecha);
    const checkOut = new Date(fecha);
    checkOut.setDate(checkOut.getDate() + 1);
    
    document.getElementById('fecha-checkin').value = checkIn.toISOString().split('T')[0];
    document.getElementById('fecha-checkout').value = checkOut.toISOString().split('T')[0];
    
    // Calcular total inicial
    calcularTotal();
    
    // Cargar huéspedes
    cargarHuespedes();
    
    // Mostrar modal
    document.getElementById('modal-reserva').style.display = 'flex';
  }

  // Cerrar modal de reserva
  function cerrarModalReserva() {
    document.getElementById('modal-reserva').style.display = 'none';
    document.getElementById('form-reserva').reset();
  }

  // Calcular total de la reserva
  function calcularTotal() {
    const checkIn = new Date(document.getElementById('fecha-checkin').value);
    const checkOut = new Date(document.getElementById('fecha-checkout').value);
    
    if (checkIn && checkOut && checkOut > checkIn) {
      const noches = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const total = noches * datosReserva.precio;
      document.getElementById('total-estimado').textContent = `$${total.toFixed(2)} (${noches} ${noches === 1 ? 'noche' : 'noches'})`;
    } else {
      document.getElementById('total-estimado').textContent = '$0';
    }
  }

  // Crear reserva
  async function crearReserva(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
      id_huesped: formData.get('id_huesped'),
      tipoHabitacionId: formData.get('tipoHabitacionId'),
      fechaCheckIn: formData.get('fechaCheckIn'),
      fechaCheckOut: formData.get('fechaCheckOut'),
      cantAdultos: formData.get('cantAdultos'),
      cantNinos: formData.get('cantNinos'),
      observaciones: formData.get('observaciones')
    };

    try {
      const btnConfirmar = document.getElementById('btn-confirmar-reserva');
      btnConfirmar.disabled = true;
      btnConfirmar.textContent = 'Creando reserva...';

      const response = await fetch('/api/calendario/reservar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`✅ ${result.mensaje}\n\nLa reserva ha sido creada exitosamente.`);
        cerrarModalReserva();
        renderizarCalendario();
      } else {
        alert(`❌ Error: ${result.error || 'No se pudo crear la reserva'}`);
      }
    } catch (error) {
      console.error('Error al crear reserva:', error);
      alert('❌ Error al crear la reserva. Por favor intente nuevamente.');
    } finally {
      const btnConfirmar = document.getElementById('btn-confirmar-reserva');
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = 'Confirmar Reserva';
    }
  }

  // Abrir modal de nuevo huésped
  function abrirModalNuevoHuesped() {
    document.getElementById('modal-nuevo-huesped').style.display = 'flex';
  }

  // Cerrar modal de nuevo huésped
  function cerrarModalNuevoHuesped() {
    document.getElementById('modal-nuevo-huesped').style.display = 'none';
    document.getElementById('form-nuevo-huesped').reset();
  }

  // Crear nuevo huésped
  async function crearNuevoHuesped(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
      nombre: formData.get('nombre'),
      apellido: formData.get('apellido'),
      documento: formData.get('documento'),
      telefono: formData.get('telefono'),
      email: formData.get('email')
    };

    try {
      const response = await fetch('/api/calendario/huesped', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ Huésped creado exitosamente');
        cerrarModalNuevoHuesped();
        await cargarHuespedes();
        // Seleccionar el nuevo huésped
        document.getElementById('select-huesped').value = result.huesped.id_huesped;
      } else {
        alert(`❌ Error: ${result.error || 'No se pudo crear el huésped'}`);
      }
    } catch (error) {
      console.error('Error al crear huésped:', error);
      alert('❌ Error al crear el huésped. Por favor intente nuevamente.');
    }
  }

  // Modificar renderizarTarjetaHabitacion para agregar evento al botón
  function renderizarTarjetaHabitacionConReserva(tipo, disponibles, porcentaje, color, fecha) {
    const card = document.createElement('div');
    card.className = 'habitacion-card';
    card.innerHTML = `
      <div class="habitacion-header">
        <h4 class="habitacion-nombre">${tipo.nombre}</h4>
        <div class="habitacion-precio">$${tipo.precio}</div>
      </div>
      
      <div class="habitacion-info">
        <div class="habitacion-capacidad">
          <i class="fas fa-user"></i>
          <span>${tipo.capacidad} ${tipo.capacidad === 1 ? 'persona' : 'personas'}</span>
        </div>
      </div>
      
      <div class="habitacion-amenidades">
        ${tipo.amenidades.map(amenidad => `
          <div class="amenidad" title="${NOMBRES_AMENIDADES[amenidad]}">
            ${ICONOS_AMENIDADES[amenidad]}
            <span>${NOMBRES_AMENIDADES[amenidad]}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="habitacion-disponibilidad">
        <div class="disponibilidad-info">
          <i class="fas fa-bed"></i>
          <span>${disponibles} de ${tipo.total} disponibles</span>
        </div>
        <div class="disponibilidad-barra">
          <div class="disponibilidad-progreso" style="width: ${porcentaje}%; background-color: ${color};"></div>
        </div>
        <div class="disponibilidad-porcentaje" style="color: ${color};">
          ${porcentaje}% disponible
        </div>
      </div>
      
      <button class="btn-reservar" data-tipo-id="${tipo.id}" data-tipo-nombre="${tipo.nombre}" data-precio="${tipo.precio}">
        Reservar ahora
      </button>
    `;

    // Agregar evento al botón de reservar
    const btnReservar = card.querySelector('.btn-reservar');
    btnReservar.addEventListener('click', function() {
      abrirModalReserva({
        id: tipo.id,
        nombre: tipo.nombre,
        precio: tipo.precio
      }, fecha || estado.fechaSeleccionada || estado.fechaActual);
    });

return card;
}

// Inicializar la aplicación
function inicializar() {
    // Verificar si estamos en la página correcta
    const container = document.getElementById('calendario-funcional-container');
    if (!container) {
      console.log('Calendario funcional: contenedor no encontrado');
      return;
    }

    // Event listeners para navegación
    const btnPrev = document.getElementById('btn-prev-funcional');
    const btnNext = document.getElementById('btn-next-funcional');
    const btnHoy = document.getElementById('btn-hoy-funcional');
    
    if (btnPrev) btnPrev.addEventListener('click', retrocederPeriodo);
    if (btnNext) btnNext.addEventListener('click', avanzarPeriodo);
    if (btnHoy) btnHoy.addEventListener('click', volverAHoy);
    
    // Event listeners para cambio de vista (solo para el calendario funcional)
    document.querySelectorAll('#calendario-funcional-container .btn-vista').forEach(btn => {
      btn.addEventListener('click', function() {
        cambiarVista(this.getAttribute('data-vista'));
      });
    });

    // Event listeners para modales (solo si existen)
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const btnCancelarReserva = document.getElementById('btn-cancelar-reserva');
    const btnCerrarModalHuesped = document.getElementById('btn-cerrar-modal-huesped');
    const btnCancelarHuesped = document.getElementById('btn-cancelar-huesped');
    const btnNuevoHuesped = document.getElementById('btn-nuevo-huesped');
    const formReserva = document.getElementById('form-reserva');
    const formNuevoHuesped = document.getElementById('form-nuevo-huesped');
    const fechaCheckin = document.getElementById('fecha-checkin');
    const fechaCheckout = document.getElementById('fecha-checkout');
    const modalReserva = document.getElementById('modal-reserva');
    const modalNuevoHuesped = document.getElementById('modal-nuevo-huesped');

    if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModalReserva);
    if (btnCancelarReserva) btnCancelarReserva.addEventListener('click', cerrarModalReserva);
    if (btnCerrarModalHuesped) btnCerrarModalHuesped.addEventListener('click', cerrarModalNuevoHuesped);
    if (btnCancelarHuesped) btnCancelarHuesped.addEventListener('click', cerrarModalNuevoHuesped);
    if (btnNuevoHuesped) btnNuevoHuesped.addEventListener('click', abrirModalNuevoHuesped);
    if (formReserva) formReserva.addEventListener('submit', crearReserva);
    if (formNuevoHuesped) formNuevoHuesped.addEventListener('submit', crearNuevoHuesped);
    if (fechaCheckin) fechaCheckin.addEventListener('change', calcularTotal);
    if (fechaCheckout) fechaCheckout.addEventListener('change', calcularTotal);
    
    if (modalReserva) {
      modalReserva.addEventListener('click', function(e) {
        if (e.target === this) cerrarModalReserva();
      });
    }
    
    if (modalNuevoHuesped) {
      modalNuevoHuesped.addEventListener('click', function(e) {
        if (e.target === this) cerrarModalNuevoHuesped();
      });
    }
    
    // Cargar tipos de habitación reales y renderizar calendario
    cargarTiposHabitacionReales().then(() => {
      renderizarCalendario();
    });

    // Agregar delegación de eventos para botones de reservar dinámicos
    document.addEventListener('click', function(e) {
      // Buscar el botón, incluso si se hizo click en un elemento hijo
      const boton = e.target.closest('.btn-reservar');
      
      if (boton) {
        e.preventDefault();
        e.stopPropagation();
        
        const tipoId = boton.getAttribute('data-tipo-id');
        const tipoNombre = boton.getAttribute('data-tipo-nombre');
        const precio = boton.getAttribute('data-precio');
        
        console.log('Botón Reservar clickeado:', { tipoId, tipoNombre, precio });
        
        if (tipoId && tipoNombre && precio) {
          // Usar el rango seleccionado o fecha actual
          let checkIn, checkOut;
          
          if (estado.rangoSeleccion.inicio && estado.rangoSeleccion.fin) {
            checkIn = estado.rangoSeleccion.inicio;
            checkOut = estado.rangoSeleccion.fin;
          } else {
            // Si no hay rango, usar fecha actual + 1 día
            checkIn = new Date();
            checkOut = new Date();
            checkOut.setDate(checkOut.getDate() + 1);
          }
          
          const params = new URLSearchParams({
            fechaCheckIn: checkIn.toISOString().split('T')[0],
            fechaCheckOut: checkOut.toISOString().split('T')[0],
            id_tipoHab: tipoId,
            cantAdultos: 1,
            cantNinos: 0
          });
          
          const url = `/hoteleria/reservas/new?${params.toString()}`;
          console.log('Redirigiendo a:', url);
          console.log('Rango seleccionado:', checkIn, '-', checkOut);
          
          window.location.href = url;
        } else {
          console.error('Faltan datos en el botón:', { tipoId, tipoNombre, precio });
        }
      }
    });
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }
})();
