const layout = require('../../layout');
const { format } = require('date-fns');
const { es } = require('date-fns/locale');

// Helper para formatear moneda
const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);

// Helper para formatear fecha
const formatDate = (dateStr, formatStr = 'dd/MM/yyyy') => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Fecha Inválida';
    return format(date, formatStr, { locale: es });
  } catch {
    return 'Fecha Inválida';
  }
};

module.exports = ({ 
  reporteDiario = null, 
  reporteMensual = null, 
  reporteRango = null,
  comparativas = null,
  huespedesFrecuentes = [],
  fechaSeleccionada = new Date(),
  fechaDesde = null,
  fechaHasta = null,
  tipoReporte = 'diario'
}) => {
  
  const fechaHoy = format(new Date(), 'yyyy-MM-dd');
  const fechaSeleccionadaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
  const fechaDesdeStr = fechaDesde ? format(new Date(fechaDesde), 'yyyy-MM-dd') : '';
  const fechaHastaStr = fechaHasta ? format(new Date(fechaHasta), 'yyyy-MM-dd') : '';

  return layout({
    content: `
      <link rel="stylesheet" href="/css/reportes.css">
      
      <div class="reportes-page">
        <!-- Header -->
        <div class="reportes-header">
          <div class="reportes-header-content">
            <div>
              <h1 class="reportes-title">
                <i class="fas fa-chart-bar"></i>
                Reportes de Hotelería
              </h1>
              <p class="reportes-subtitle">
                Análisis detallado de ocupación, ingresos y estadísticas operativas
              </p>
            </div>
            <div class="reportes-actions">
              <button class="btn-reportes btn-reportes--primary" id="exportarPDF">
                <i class="fas fa-file-pdf"></i>
                Exportar PDF
              </button>
              <button class="btn-reportes btn-reportes--success" id="exportarExcel">
                <i class="fas fa-file-excel"></i>
                Exportar Excel
              </button>
            </div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="reportes-filtros">
          <form method="GET" action="/hoteleria/reportes" class="filtros-form">
            <div class="filtro-grupo">
              <label class="filtro-label">Tipo de Reporte</label>
              <select name="tipo" class="filtro-select" id="tipoReporteSelect">
                <option value="diario" ${tipoReporte === 'diario' ? 'selected' : ''}>📅 Reporte Diario</option>
                <option value="mensual" ${tipoReporte === 'mensual' ? 'selected' : ''}>📊 Reporte Mensual</option>
                <option value="rango" ${tipoReporte === 'rango' ? 'selected' : ''}>📆 Rango de Fechas</option>
              </select>
            </div>
            
            ${tipoReporte === 'rango' ? `
            <div class="filtro-grupo">
              <label class="filtro-label">Desde</label>
              <input 
                type="date" 
                name="fechaDesde" 
                id="fechaDesdeInput"
                class="filtro-input"
                value="${fechaDesdeStr || ''}"
                max="${fechaHoy}"
                required
              >
            </div>
            
            <div class="filtro-grupo">
              <label class="filtro-label">Hasta</label>
              <input 
                type="date" 
                name="fechaHasta" 
                id="fechaHastaInput"
                class="filtro-input"
                value="${fechaHastaStr || ''}"
                max="${fechaHoy}"
                required
              >
            </div>
            ` : `
            <div class="filtro-grupo">
              <label class="filtro-label">
                ${tipoReporte === 'diario' ? 'Fecha' : 'Mes'}
              </label>
              <input 
                type="${tipoReporte === 'diario' ? 'date' : 'month'}" 
                name="fecha" 
                class="filtro-input"
                value="${tipoReporte === 'diario' ? fechaSeleccionadaStr : format(fechaSeleccionada, 'yyyy-MM')}"
                max="${tipoReporte === 'diario' ? fechaHoy : format(new Date(), 'yyyy-MM')}"
              >
            </div>
            `}
            
            <button type="submit" class="btn-reportes btn-reportes--primary">
              <i class="fas fa-search"></i>
              Generar
            </button>
          </form>
        </div>

        <!-- Contenido del Reporte -->
        <div class="reportes-contenido">
          ${tipoReporte === 'diario' && reporteDiario ? renderReporteDiario(reporteDiario) : ''}
          ${tipoReporte === 'mensual' && reporteMensual ? renderReporteMensual(reporteMensual) : ''}
          ${tipoReporte === 'rango' && reporteRango ? renderReporteRango(reporteRango, fechaDesde, fechaHasta) : ''}
          
          ${!reporteDiario && !reporteMensual && !reporteRango ? `
            <div class="reporte-vacio">
              <div class="vacio-icono">
                <i class="fas fa-chart-line"></i>
              </div>
              <h3>Selecciona un tipo de reporte</h3>
              <p>Elige el tipo de reporte y la fecha para generar el análisis correspondiente.</p>
            </div>
          ` : ''}
        </div>

        <!-- Huéspedes Frecuentes (siempre visible) -->
        ${huespedesFrecuentes.length > 0 ? `
          <div class="reportes-seccion">
            <div class="seccion-header">
              <h2>
                <i class="fas fa-users"></i>
                Huéspedes Más Frecuentes
              </h2>
            </div>
            <div class="huespedes-grid">
              ${huespedesFrecuentes.map((huesped, index) => `
                <div class="huesped-card">
                  <div class="huesped-ranking">#${index + 1}</div>
                  <div class="huesped-info">
                    <h4>${huesped.apellido}, ${huesped.nombre}</h4>
                    <p class="huesped-documento">${huesped.documento || 'Sin documento'}</p>
                    <div class="huesped-stats">
                      <span class="stat-item">
                        <i class="fas fa-bed"></i>
                        ${huesped.totalReservas} reservas
                      </span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <script>
        // Manejar cambio de tipo de reporte
        document.addEventListener('DOMContentLoaded', function() {
          const tipoSelect = document.getElementById('tipoReporteSelect');
          const form = tipoSelect ? tipoSelect.form : null;
          
          if (tipoSelect && form) {
            // Guardar fechas en localStorage cuando se cambian
            const fechaDesdeInput = document.getElementById('fechaDesdeInput');
            const fechaHastaInput = document.getElementById('fechaHastaInput');
            
            if (fechaDesdeInput) {
              fechaDesdeInput.addEventListener('change', function() {
                localStorage.setItem('reporteFechaDesde', this.value);
              });
              
              // Restaurar fecha guardada si existe
              const fechaGuardada = localStorage.getItem('reporteFechaDesde');
              if (fechaGuardada && !fechaDesdeInput.value) {
                fechaDesdeInput.value = fechaGuardada;
              }
            }
            
            if (fechaHastaInput) {
              fechaHastaInput.addEventListener('change', function() {
                localStorage.setItem('reporteFechaHasta', this.value);
              });
              
              // Restaurar fecha guardada si existe
              const fechaGuardada = localStorage.getItem('reporteFechaHasta');
              if (fechaGuardada && !fechaHastaInput.value) {
                fechaHastaInput.value = fechaGuardada;
              }
            }
            
            tipoSelect.addEventListener('change', function() {
              const tipo = this.value;
              if (tipo === 'diario' || tipo === 'mensual') {
                // Limpiar fechas guardadas cuando se cambia a otro tipo
                localStorage.removeItem('reporteFechaDesde');
                localStorage.removeItem('reporteFechaHasta');
                form.submit();
              } else if (tipo === 'rango') {
                // Solo recargar para mostrar los campos de rango
                form.submit();
              }
            });
          }
        });
      </script>
      
      <script src="/js/reportes.js"></script>
    `,
  });
};

// Función para renderizar reporte diario
function renderReporteDiario(reporte) {
  return `
    <div class="reporte-diario">
      <div class="reporte-titulo">
        <h2>
          <i class="fas fa-calendar-day"></i>
          Reporte Diario - ${reporte.fechaFormateada}
        </h2>
      </div>

      <!-- Estadísticas Generales -->
      <div class="stats-grid">
        <div class="stat-card stat-card--primary">
          <div class="stat-icon">
            <i class="fas fa-bed"></i>
          </div>
          <div class="stat-content">
            <h3>Ocupación</h3>
            <div class="stat-number">${reporte.estadisticasGenerales.porcentajeOcupacion}%</div>
            <p>${reporte.estadisticasGenerales.habitacionesOcupadas}/${reporte.estadisticasGenerales.totalHabitaciones} habitaciones</p>
          </div>
        </div>

        <div class="stat-card stat-card--success">
          <div class="stat-icon">
            <i class="fas fa-sign-in-alt"></i>
          </div>
          <div class="stat-content">
            <h3>Check-ins</h3>
            <div class="stat-number">${reporte.movimientos.checkins.cantidad}</div>
            <p>Ingresos realizados</p>
          </div>
        </div>

        <div class="stat-card stat-card--warning">
          <div class="stat-icon">
            <i class="fas fa-sign-out-alt"></i>
          </div>
          <div class="stat-content">
            <h3>Check-outs</h3>
            <div class="stat-number">${reporte.movimientos.checkouts.cantidad}</div>
            <p>Salidas realizadas</p>
          </div>
        </div>

        <div class="stat-card stat-card--info">
          <div class="stat-icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <h3>Ingresos</h3>
            <div class="stat-number">${formatCurrency(reporte.ingresos.total)}</div>
            <p>${reporte.ingresos.cantidad} pagos</p>
          </div>
        </div>
      </div>

      <!-- Movimientos del Día -->
      <div class="movimientos-grid">
        <!-- Llegadas Esperadas -->
        <div class="movimiento-seccion">
          <h3>
            <i class="fas fa-plane-arrival"></i>
            Llegadas Esperadas (${reporte.movimientos.llegadasEsperadas.cantidad})
          </h3>
          <div class="movimiento-lista">
            ${reporte.movimientos.llegadasEsperadas.lista.length > 0 ? 
              reporte.movimientos.llegadasEsperadas.lista.map(reserva => `
                <div class="movimiento-item">
                  <div class="movimiento-info">
                    <strong>Hab. ${reserva.Habitacion?.numero}</strong>
                    <span>${reserva.Huesped?.apellido}, ${reserva.Huesped?.nombre}</span>
                  </div>
                  <div class="movimiento-hora">
                    ${formatDate(reserva.fechaCheckIn, 'HH:mm')}
                  </div>
                </div>
              `).join('') : 
              '<p class="texto-vacio">No hay llegadas esperadas</p>'
            }
          </div>
        </div>

        <!-- Check-ins Realizados -->
        <div class="movimiento-seccion">
          <h3>
            <i class="fas fa-check-circle"></i>
            Check-ins Realizados (${reporte.movimientos.checkins.cantidad})
          </h3>
          <div class="movimiento-lista">
            ${reporte.movimientos.checkins.lista.length > 0 ? 
              reporte.movimientos.checkins.lista.map(reserva => `
                <div class="movimiento-item movimiento-item--realizado">
                  <div class="movimiento-info">
                    <strong>Hab. ${reserva.Habitacion?.numero}</strong>
                    <span>${reserva.Huesped?.apellido}, ${reserva.Huesped?.nombre}</span>
                  </div>
                  <div class="movimiento-hora">
                    ${formatDate(reserva.fechaCheckInReal, 'HH:mm')}
                  </div>
                </div>
              `).join('') : 
              '<p class="texto-vacio">No se realizaron check-ins</p>'
            }
          </div>
        </div>

        <!-- Salidas Esperadas -->
        <div class="movimiento-seccion">
          <h3>
            <i class="fas fa-plane-departure"></i>
            Salidas Esperadas (${reporte.movimientos.salidasEsperadas.cantidad})
          </h3>
          <div class="movimiento-lista">
            ${reporte.movimientos.salidasEsperadas.lista.length > 0 ? 
              reporte.movimientos.salidasEsperadas.lista.map(reserva => `
                <div class="movimiento-item">
                  <div class="movimiento-info">
                    <strong>Hab. ${reserva.Habitacion?.numero}</strong>
                    <span>${reserva.Huesped?.apellido}, ${reserva.Huesped?.nombre}</span>
                  </div>
                  <div class="movimiento-hora">
                    ${formatDate(reserva.fechaCheckOut, 'HH:mm')}
                  </div>
                </div>
              `).join('') : 
              '<p class="texto-vacio">No hay salidas esperadas</p>'
            }
          </div>
        </div>

        <!-- Check-outs Realizados -->
        <div class="movimiento-seccion">
          <h3>
            <i class="fas fa-check-circle"></i>
            Check-outs Realizados (${reporte.movimientos.checkouts.cantidad})
          </h3>
          <div class="movimiento-lista">
            ${reporte.movimientos.checkouts.lista.length > 0 ? 
              reporte.movimientos.checkouts.lista.map(reserva => `
                <div class="movimiento-item movimiento-item--realizado">
                  <div class="movimiento-info">
                    <strong>Hab. ${reserva.Habitacion?.numero}</strong>
                    <span>${reserva.Huesped?.apellido}, ${reserva.Huesped?.nombre}</span>
                  </div>
                  <div class="movimiento-hora">
                    ${formatDate(reserva.fechaCheckOutReal, 'HH:mm')}
                  </div>
                </div>
              `).join('') : 
              '<p class="texto-vacio">No se realizaron check-outs</p>'
            }
          </div>
        </div>
      </div>

      <!-- Detalle de Pagos -->
      ${reporte.ingresos.pagos.length > 0 ? `
        <div class="pagos-seccion">
          <h3>
            <i class="fas fa-credit-card"></i>
            Detalle de Ingresos del Día
          </h3>
          <div class="pagos-tabla-container">
            <table class="pagos-tabla">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Reserva</th>
                  <th>Huésped</th>
                  <th>Forma de Pago</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                ${reporte.ingresos.pagos.map(pago => `
                  <tr>
                    <td>${formatDate(pago.fechaPago, 'HH:mm')}</td>
                    <td>${pago.Reserva?.codigoReserva || 'N/A'}</td>
                    <td>${pago.Reserva?.Huesped?.apellido}, ${pago.Reserva?.Huesped?.nombre}</td>
                    <td>${pago.FormaPago?.nombre || 'N/A'}</td>
                    <td class="monto">${formatCurrency(pago.monto)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="4"><strong>Total del Día</strong></td>
                  <td class="monto"><strong>${formatCurrency(reporte.ingresos.total)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Función para renderizar reporte mensual
function renderReporteMensual(reporte) {
  return `
    <div class="reporte-mensual">
      <div class="reporte-titulo">
        <h2>
          <i class="fas fa-calendar-alt"></i>
          Reporte Mensual - ${reporte.fechaFormateada}
        </h2>
      </div>

      <!-- Resumen Mensual -->
      <div class="stats-grid">
        <div class="stat-card stat-card--primary">
          <div class="stat-icon">
            <i class="fas fa-bookmark"></i>
          </div>
          <div class="stat-content">
            <h3>Reservas</h3>
            <div class="stat-number">${reporte.resumen.totalReservas}</div>
            <p>Total del mes</p>
          </div>
        </div>

        <div class="stat-card stat-card--success">
          <div class="stat-icon">
            <i class="fas fa-percentage"></i>
          </div>
          <div class="stat-content">
            <h3>Ocupación Promedio</h3>
            <div class="stat-number">${reporte.resumen.promedioOcupacion}%</div>
            <p>Promedio mensual</p>
          </div>
        </div>

        <div class="stat-card stat-card--info">
          <div class="stat-icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <h3>Ingresos</h3>
            <div class="stat-number">${formatCurrency(reporte.resumen.totalIngresos)}</div>
            <p>Total del mes</p>
          </div>
        </div>

        <div class="stat-card stat-card--warning">
          <div class="stat-icon">
            <i class="fas fa-exchange-alt"></i>
          </div>
          <div class="stat-content">
            <h3>Movimientos</h3>
            <div class="stat-number">${reporte.resumen.checkinsRealizados + reporte.resumen.checkoutsRealizados}</div>
            <p>${reporte.resumen.checkinsRealizados} in / ${reporte.resumen.checkoutsRealizados} out</p>
          </div>
        </div>
      </div>

      <!-- Gráfico de Ocupación Diaria -->
      <div class="grafico-seccion">
        <h3>
          <i class="fas fa-chart-line"></i>
          Ocupación Diaria del Mes
        </h3>
        <div class="ocupacion-chart">
          <canvas id="ocupacionChart" width="800" height="300"></canvas>
        </div>
      </div>

      <!-- Habitaciones Más Utilizadas -->
      ${reporte.habitacionesMasUtilizadas.length > 0 ? `
        <div class="habitaciones-top">
          <h3>
            <i class="fas fa-trophy"></i>
            Habitaciones Más Utilizadas
          </h3>
          <div class="habitaciones-ranking">
            ${reporte.habitacionesMasUtilizadas.map((hab, index) => `
              <div class="habitacion-rank-item">
                <div class="rank-numero">#${index + 1}</div>
                <div class="habitacion-info">
                  <strong>Habitación ${hab.numero}</strong>
                  <span>${hab.TipoHabitacion?.nombre || 'Sin tipo'}</span>
                </div>
                <div class="habitacion-stats">
                  <span class="reservas-count">${hab.reservas} reservas</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Ingresos por Forma de Pago -->
      ${Object.keys(reporte.ingresosPorFormaPago).length > 0 ? `
        <div class="ingresos-formas-pago">
          <h3>
            <i class="fas fa-credit-card"></i>
            Ingresos por Forma de Pago
          </h3>
          <div class="formas-pago-grid">
            ${Object.entries(reporte.ingresosPorFormaPago).map(([forma, monto]) => `
              <div class="forma-pago-item">
                <div class="forma-pago-nombre">${forma}</div>
                <div class="forma-pago-monto">${formatCurrency(monto)}</div>
                <div class="forma-pago-porcentaje">
                  ${((monto / reporte.resumen.totalIngresos) * 100).toFixed(1)}%
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <script>
      // Datos para el gráfico de ocupación
      const ocupacionData = ${JSON.stringify(reporte.ocupacionDiaria)};
      
      // Inicializar gráfico cuando se cargue la página
      document.addEventListener('DOMContentLoaded', function() {
        if (typeof Chart !== 'undefined') {
          initOcupacionChart(ocupacionData);
        }
      });
    </script>
  `;
}

// Función para renderizar reporte comparativo
function renderReporteComparativo(comparativas) {
  const getChangeIcon = (cambio) => {
    const num = parseFloat(cambio);
    if (num > 0) return '<i class="fas fa-arrow-up text-success"></i>';
    if (num < 0) return '<i class="fas fa-arrow-down text-danger"></i>';
    return '<i class="fas fa-minus text-muted"></i>';
  };

  const getChangeClass = (cambio) => {
    const num = parseFloat(cambio);
    if (num > 0) return 'cambio-positivo';
    if (num < 0) return 'cambio-negativo';
    return 'cambio-neutro';
  };

  return `
    <div class="reporte-comparativo">
      <div class="reporte-titulo">
        <h2>
          <i class="fas fa-chart-line"></i>
          Comparativo: ${comparativas.mesActual} vs ${comparativas.mesAnterior}
        </h2>
      </div>

      <div class="comparativo-grid">
        <div class="comparativo-card">
          <div class="comparativo-header">
            <h3>
              <i class="fas fa-bookmark"></i>
              Reservas
            </h3>
          </div>
          <div class="comparativo-content">
            <div class="comparativo-valores">
              <div class="valor-actual">
                <span class="label">Este mes</span>
                <span class="numero">${comparativas.comparacion.reservas.actual}</span>
              </div>
              <div class="valor-anterior">
                <span class="label">Mes anterior</span>
                <span class="numero">${comparativas.comparacion.reservas.anterior}</span>
              </div>
            </div>
            <div class="comparativo-cambio ${getChangeClass(comparativas.comparacion.reservas.cambio)}">
              ${getChangeIcon(comparativas.comparacion.reservas.cambio)}
              <span>${Math.abs(comparativas.comparacion.reservas.cambio)}%</span>
            </div>
          </div>
        </div>

        <div class="comparativo-card">
          <div class="comparativo-header">
            <h3>
              <i class="fas fa-dollar-sign"></i>
              Ingresos
            </h3>
          </div>
          <div class="comparativo-content">
            <div class="comparativo-valores">
              <div class="valor-actual">
                <span class="label">Este mes</span>
                <span class="numero">${formatCurrency(comparativas.comparacion.ingresos.actual)}</span>
              </div>
              <div class="valor-anterior">
                <span class="label">Mes anterior</span>
                <span class="numero">${formatCurrency(comparativas.comparacion.ingresos.anterior)}</span>
              </div>
            </div>
            <div class="comparativo-cambio ${getChangeClass(comparativas.comparacion.ingresos.cambio)}">
              ${getChangeIcon(comparativas.comparacion.ingresos.cambio)}
              <span>${Math.abs(comparativas.comparacion.ingresos.cambio)}%</span>
            </div>
          </div>
        </div>

        <div class="comparativo-card">
          <div class="comparativo-header">
            <h3>
              <i class="fas fa-percentage"></i>
              Ocupación Promedio
            </h3>
          </div>
          <div class="comparativo-content">
            <div class="comparativo-valores">
              <div class="valor-actual">
                <span class="label">Este mes</span>
                <span class="numero">${comparativas.comparacion.ocupacion.actual}%</span>
              </div>
              <div class="valor-anterior">
                <span class="label">Mes anterior</span>
                <span class="numero">${comparativas.comparacion.ocupacion.anterior}%</span>
              </div>
            </div>
            <div class="comparativo-cambio ${getChangeClass(comparativas.comparacion.ocupacion.cambio)}">
              ${getChangeIcon(comparativas.comparacion.ocupacion.cambio)}
              <span>${Math.abs(comparativas.comparacion.ocupacion.cambio)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Función para renderizar reporte analítico por rango de fechas
function renderReporteRango(reporte, fechaDesde, fechaHasta) {
  const fechaDesdeFormateada = formatDate(fechaDesde, 'dd/MM/yyyy');
  const fechaHastaFormateada = formatDate(fechaHasta, 'dd/MM/yyyy');
  
  // Determinar alertas y recomendaciones
  const alertas = [];
  if (reporte.ocupacionPromedio < 50) {
    alertas.push({ tipo: 'warning', mensaje: 'Ocupación baja. Considere estrategias de promoción.' });
  }
  if (reporte.tasaCancelacion > 15) {
    alertas.push({ tipo: 'danger', mensaje: `Tasa de cancelación alta (${reporte.tasaCancelacion}%). Revise políticas de reserva.` });
  }
  if (reporte.revpar < reporte.adr * 0.5) {
    alertas.push({ tipo: 'info', mensaje: 'RevPAR bajo. Oportunidad de optimizar tarifas.' });
  }
  
  return `
    <div class="reporte-diario">
      <div class="reporte-titulo">
        <h2>
          <i class="fas fa-chart-line"></i>
          Análisis de Rendimiento
        </h2>
        <p class="reporte-subtitulo" style="margin-top: 0.5rem; color: #64748b; font-size: 0.95rem;">
          📅 <strong>${fechaDesdeFormateada}</strong> → <strong>${fechaHastaFormateada}</strong> 
          <span style="margin-left: 1rem; color: #3b82f6;">📊 ${reporte.diasEnRango} días analizados</span>
        </p>
      </div>

      <!-- Alertas y Recomendaciones -->
      ${alertas.length > 0 ? `
      <div style="margin-bottom: 1.5rem;">
        ${alertas.map(alerta => `
          <div class="notification is-${alerta.tipo} is-light" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem;">
            <i class="fas fa-${alerta.tipo === 'danger' ? 'exclamation-triangle' : alerta.tipo === 'warning' ? 'exclamation-circle' : 'info-circle'}"></i>
            <strong>Alerta:</strong> ${alerta.mensaje}
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- KPIs Principales de Rendimiento -->
      <div class="stats-grid">
        <div class="stat-card stat-card--success" style="border-left: 4px solid #10b981;">
          <div class="stat-icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <h3>Ingresos Totales</h3>
            <div class="stat-number">${formatCurrency(reporte.ingresosTotal)}</div>
            <p style="color: #10b981; font-weight: 600;">
              <i class="fas fa-chart-line"></i> ${formatCurrency(reporte.ingresoDiarioPromedio)}/día
            </p>
          </div>
        </div>

        <div class="stat-card stat-card--primary" style="border-left: 4px solid #3b82f6;">
          <div class="stat-icon">
            <i class="fas fa-bed"></i>
          </div>
          <div class="stat-content">
            <h3>Ocupación Promedio</h3>
            <div class="stat-number">${reporte.ocupacionPromedio}%</div>
            <p style="color: ${reporte.ocupacionPromedio >= 70 ? '#10b981' : reporte.ocupacionPromedio >= 50 ? '#f59e0b' : '#ef4444'}; font-weight: 600;">
              ${reporte.ocupacionPromedio >= 70 ? '✓ Excelente' : reporte.ocupacionPromedio >= 50 ? '⚠ Moderado' : '⚠ Bajo'}
            </p>
          </div>
        </div>

        <div class="stat-card stat-card--info" style="border-left: 4px solid #06b6d4;">
          <div class="stat-icon">
            <i class="fas fa-chart-bar"></i>
          </div>
          <div class="stat-content">
            <h3>ADR (Tarifa Promedio)</h3>
            <div class="stat-number">${formatCurrency(reporte.adr)}</div>
            <p style="color: #64748b;">Por habitación ocupada</p>
          </div>
        </div>

        <div class="stat-card stat-card--warning" style="border-left: 4px solid #8b5cf6;">
          <div class="stat-icon">
            <i class="fas fa-chart-pie"></i>
          </div>
          <div class="stat-content">
            <h3>RevPAR</h3>
            <div class="stat-number">${formatCurrency(reporte.revpar)}</div>
            <p style="color: #64748b;">Ingreso por hab. disponible</p>
          </div>
        </div>
      </div>

      <!-- Análisis de Conversión -->
      <div class="reporte-seccion">
        <div class="seccion-header">
          <h3>
            <i class="fas fa-funnel-dollar"></i>
            Análisis de Conversión y Eficiencia
          </h3>
        </div>
        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); gap: 1rem;">
          <div class="stat-card" style="padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <div class="stat-content">
              <h4 style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Total Reservas</h4>
              <div class="stat-number" style="font-size: 2.5rem; color: white;">${reporte.totalReservas}</div>
            </div>
          </div>
          <div class="stat-card" style="padding: 1.5rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
            <div class="stat-content">
              <h4 style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Tasa de Completación</h4>
              <div class="stat-number" style="font-size: 2.5rem; color: white;">${reporte.tasaCompletacion}%</div>
              <p style="opacity: 0.9; font-size: 0.875rem; margin-top: 0.5rem;">${reporte.reservasCompletadas} completadas</p>
            </div>
          </div>
          <div class="stat-card" style="padding: 1.5rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">
            <div class="stat-content">
              <h4 style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Tasa de Cancelación</h4>
              <div class="stat-number" style="font-size: 2.5rem; color: white;">${reporte.tasaCancelacion}%</div>
              <p style="opacity: 0.9; font-size: 0.875rem; margin-top: 0.5rem;">${reporte.reservasCanceladas} canceladas</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Rendimiento por Tipo de Habitación -->
      ${reporte.rendimientoPorTipo && reporte.rendimientoPorTipo.length > 0 ? `
      <div class="reporte-seccion">
        <div class="seccion-header">
          <h3>
            <i class="fas fa-building"></i>
            Rendimiento por Tipo de Habitación
          </h3>
          <p style="color: #64748b; font-size: 0.875rem; margin-top: 0.25rem;">Identifique los tipos más rentables</p>
        </div>
        <div class="tabla-wrapper">
          <table class="tabla-reporte">
            <thead>
              <tr>
                <th style="width: 30%;">Tipo de Habitación</th>
                <th style="width: 15%; text-align: center;">Reservas</th>
                <th style="width: 15%; text-align: center;">Participación</th>
                <th style="width: 20%; text-align: right;">Ingreso Total</th>
                <th style="width: 20%; text-align: right;">Ingreso Promedio</th>
              </tr>
            </thead>
            <tbody>
              ${reporte.rendimientoPorTipo.map((tipo, index) => `
                <tr style="background: ${index === 0 ? '#f0fdf4' : 'transparent'};">
                  <td>
                    <strong>${tipo.nombre}</strong>
                    ${index === 0 ? '<span class="badge badge-success" style="margin-left: 0.5rem;">Top Performer</span>' : ''}
                  </td>
                  <td style="text-align: center;">
                    <span class="badge badge-primary">${tipo.reservas}</span>
                  </td>
                  <td style="text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                      <div style="width: 60px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${tipo.participacion}%; height: 100%; background: #3b82f6;"></div>
                      </div>
                      <span style="font-weight: 600;">${tipo.participacion}%</span>
                    </div>
                  </td>
                  <td style="text-align: right;">
                    <strong style="color: #10b981;">${formatCurrency(tipo.ingresos)}</strong>
                  </td>
                  <td style="text-align: right;">
                    <strong>${formatCurrency(tipo.ingresoPromedio)}</strong>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Top 5 Habitaciones por Rentabilidad -->
      ${reporte.topHabitaciones && reporte.topHabitaciones.length > 0 ? `
      <div class="reporte-seccion">
        <div class="seccion-header">
          <h3>
            <i class="fas fa-trophy"></i>
            Top 5 Habitaciones por Rentabilidad
          </h3>
          <p style="color: #64748b; font-size: 0.875rem; margin-top: 0.25rem;">Las habitaciones que más ingresos generaron</p>
        </div>
        <div class="tabla-wrapper">
          <table class="tabla-reporte">
            <thead>
              <tr>
                <th style="width: 20%;">Ranking</th>
                <th style="width: 25%;">Tipo</th>
                <th style="width: 15%; text-align: center;">Reservas</th>
                <th style="width: 20%; text-align: right;">Ingreso Total</th>
                <th style="width: 20%; text-align: right;">Por Reserva</th>
              </tr>
            </thead>
            <tbody>
              ${reporte.topHabitaciones.map((hab, index) => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <span style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: ${index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : index === 1 ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' : index === 2 ? 'linear-gradient(135deg, #cd7f32 0%, #b87333 100%)' : '#e2e8f0'};
                        color: white;
                        font-weight: 700;
                        font-size: 0.875rem;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                      ">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
                      <strong style="font-size: 1.1rem;">Hab. ${hab.numero}</strong>
                    </div>
                  </td>
                  <td>${hab.tipo}</td>
                  <td style="text-align: center;">
                    <span class="badge badge-info">${hab.reservas}</span>
                  </td>
                  <td style="text-align: right;">
                    <strong style="color: #10b981; font-size: 1.1rem;">${formatCurrency(hab.ingresos)}</strong>
                  </td>
                  <td style="text-align: right;">
                    <span style="color: #64748b;">${formatCurrency(hab.ingresoPorReserva)}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}
    </div>
  `;
}
