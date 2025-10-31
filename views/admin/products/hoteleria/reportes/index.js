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
  comparativas = null,
  huespedesFrecuentes = [],
  fechaSeleccionada = new Date(),
  tipoReporte = 'diario'
}) => {
  
  const fechaHoy = format(new Date(), 'yyyy-MM-dd');
  const fechaSeleccionadaStr = format(fechaSeleccionada, 'yyyy-MM-dd');

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
              <select name="tipo" class="filtro-select" onchange="this.form.submit()">
                <option value="diario" ${tipoReporte === 'diario' ? 'selected' : ''}>📅 Reporte Diario</option>
                <option value="mensual" ${tipoReporte === 'mensual' ? 'selected' : ''}>📊 Reporte Mensual</option>
                <option value="comparativo" ${tipoReporte === 'comparativo' ? 'selected' : ''}>📈 Comparativo</option>
              </select>
            </div>
            
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
                onchange="this.form.submit()"
              >
            </div>
            
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
          ${tipoReporte === 'comparativo' && comparativas ? renderReporteComparativo(comparativas) : ''}
          
          ${!reporteDiario && !reporteMensual && !comparativas ? `
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
