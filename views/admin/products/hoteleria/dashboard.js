const layout = require('../layout');

module.exports = () => {
  return layout({
    content: `
    <style>
      .dashboard-header {
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        padding: 1.5rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        color: white;
      }
      
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }
      
      .kpi-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border: 1px solid rgba(0,0,0,0.05);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .kpi-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 12px rgba(0,0,0,0.15);
      }
      
      .kpi-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }
      
      .kpi-label {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      
      .kpi-value {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: #1f2937;
      }
      
      .kpi-secondary {
        font-size: 0.875rem;
        color: #9ca3af;
      }
      
      .kpi-trend {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        margin-top: 0.5rem;
      }
      
      .kpi-trend.positive {
        background: #d1fae5;
        color: #065f46;
      }
      
      .kpi-trend.negative {
        background: #fee2e2;
        color: #991b1b;
      }
      
      .chart-container {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
        min-height: 300px;
      }
      
      .chart-container canvas {
        max-height: 350px !important;
        height: auto !important;
      }
      
      .chart-container-small {
        min-height: 150px;
      }
      
      .chart-container-small canvas {
        max-height: 140px !important;
        height: auto !important;
      }
      
      .chart-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      
      .chart-title i {
        font-size: 0.9rem;
      }
      
      .charts-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      
      .chart-full {
        grid-column: 1 / -1;
      }
      
      .progress-bar {
        height: 8px;
        background: #e5e7eb;
        border-radius: 999px;
        overflow: hidden;
        margin-top: 0.5rem;
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #8b5cf6, #a78bfa);
        transition: width 0.5s ease;
      }
      
      .table-container {
        overflow-x: auto;
        margin-top: 1rem;
      }
      
      .dashboard-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }
      
      .dashboard-table thead th {
        background: #f9fafb;
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 600;
        color: #374151;
        font-size: 0.875rem;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .dashboard-table tbody td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f3f4f6;
        font-size: 0.875rem;
      }
      
      .dashboard-table tbody tr:hover {
        background: #f9fafb;
      }
      
      .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      
      .badge-success {
        background: #d1fae5;
        color: #065f46;
      }
      
      .badge-warning {
        background: #fef3c7;
        color: #92400e;
      }
      
      .badge-danger {
        background: #fee2e2;
        color: #991b1b;
      }
      
      .badge-info {
        background: #dbeafe;
        color: #1e40af;
      }
      
      .refresh-btn {
        background: white;
        border: 1px solid #e5e7eb;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        transition: all 0.2s;
      }
      
      .refresh-btn:hover {
        background: #f9fafb;
        border-color: #3b82f6;
        color: #3b82f6;
      }
      
      .loading {
        opacity: 0.6;
        pointer-events: none;
      }
      
      @media (max-width: 768px) {
        .charts-row {
          grid-template-columns: 1fr;
        }
        
        .kpi-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>

    <section class="inventory-card">
      <!-- Header -->
      <div class="dashboard-header">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 class="title" style="color: white; margin-bottom: 0.25rem;">Dashboard de Hotelería</h1>
            <p style="opacity: 0.9; font-size: 0.875rem;">Vista general del estado operativo y financiero</p>
          </div>
          <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
            <!-- Filtro de Rango de Fechas -->
            <div style="display: flex; gap: 0.5rem; align-items: center; background: rgba(255,255,255,0.15); padding: 0.5rem 1rem; border-radius: 8px;">
              <i class="fas fa-calendar-alt" style="color: white;"></i>
              <input type="date" id="fechaDesde" class="input is-small" style="background: white; border: none; border-radius: 6px; padding: 0.25rem 0.5rem; font-size: 0.875rem;" />
              <span style="color: white;">hasta</span>
              <input type="date" id="fechaHasta" class="input is-small" style="background: white; border: none; border-radius: 6px; padding: 0.25rem 0.5rem; font-size: 0.875rem;" />
              <button class="button is-small is-light" id="aplicarFiltroFechas" style="border-radius: 6px;">
                <i class="fas fa-filter"></i>
              </button>
            </div>
            <button class="refresh-btn" id="refreshDashboard">
              <i class="fas fa-sync-alt"></i>
              <span>Actualizar</span>
            </button>
            <p style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.5rem; text-align: right;" id="lastUpdate">
              Última actualización: --:--
            </p>
          </div>
        </div>
      </div>

      <!-- KPIs Grid -->
      <div class="kpi-grid" id="kpisContainer">
        <!-- KPI 1: Ocupación -->
        <div class="kpi-card">
          <div class="kpi-icon">🏨</div>
          <div class="kpi-label" id="kpi-ocupacion-label">Ocupación</div>
          <div class="kpi-value" id="kpi-ocupacion">--%</div>
          <div class="kpi-secondary" id="kpi-ocupacion-rooms">-- de -- habitaciones</div>
          <div class="kpi-trend" id="kpi-ocupacion-trend">
            <i class="fas fa-arrow-up"></i> --% vs ayer
          </div>
        </div>

        <!-- KPI 2: Precio Promedio por Noche -->
        <div class="kpi-card">
          <div class="kpi-icon">💰</div>
          <div class="kpi-label" id="kpi-adr-label">Precio Promedio (ADR)</div>
          <div class="kpi-value" id="kpi-adr">$--</div>
          <div class="kpi-secondary" id="kpi-adr-periodo">Promedio últimos 7 días</div>
        </div>

        <!-- KPI 3: Ingreso por Habitación Disponible -->
        <div class="kpi-card">
          <div class="kpi-icon">📊</div>
          <div class="kpi-label" id="kpi-revpar-label">Ingreso por Habitación (RevPAR)</div>
          <div class="kpi-value" id="kpi-revpar">$--</div>
          <div class="kpi-secondary" id="kpi-revpar-secondary">RevPAR - Métrica clave</div>
          <div class="kpi-progress">
            <div class="kpi-progress-bar" id="kpi-revpar-progress"></div>
          </div>
        </div>

        <!-- KPI 4: Ingresos -->
        <div class="kpi-card">
          <div class="kpi-icon">💵</div>
          <div class="kpi-label" id="kpi-revenue-label">Ingresos</div>
          <div class="kpi-value" id="kpi-revenue">$--</div>
          <div class="kpi-secondary" id="kpi-revenue-proyeccion">Proyección mensual: $--</div>
        </div>
      </div>

      <!-- Gráficos Principales -->
      <div class="charts-row">
        <!-- Gráfico 1: Ocupación -->
        <div class="chart-container" style="grid-column: 1 / -1;">
          <div class="chart-title">
            <i class="fas fa-chart-line" style="color: #3b82f6;"></i>
            Tendencia de Ocupación
          </div>
          <canvas id="chartOcupacionADR" height="100"></canvas>
          <div id="insightsOcupacion" style="margin-top: 0.5rem; padding: 0.75rem; background: #f9fafb; border-radius: 6px; font-size: 0.875rem;"></div>
        </div>

        <!-- Gráfico 2: Ingresos por Tipo -->
        <div class="chart-container">
          <div class="chart-title">
            <i class="fas fa-chart-bar" style="color: #10b981;"></i>
            Ingresos por Tipo de Habitación
          </div>
          <canvas id="chartRevenueTipo" height="120"></canvas>
        </div>

        <!-- Gráfico 3: Estados de Habitaciones -->
        <div class="chart-container chart-container-small">
          <div class="chart-title">
            <i class="fas fa-chart-pie" style="color: #8b5cf6;"></i>
            Estados de Habitaciones
          </div>
          <canvas id="chartEstados" height="100"></canvas>
          <div id="estadosDetalle" style="margin-top: 0.5rem; font-size: 0.75rem;"></div>
        </div>

        <!-- Gráfico 4: Rentabilidad (Ingresos vs Egresos) -->
        <div class="chart-container" style="grid-column: 1 / -1;">
          <div class="chart-title">
            <i class="fas fa-chart-area" style="color: #10b981;"></i>
            Rentabilidad - Ingresos vs Egresos
          </div>
          <canvas id="chartRentabilidad" height="60"></canvas>
          <div id="insightsRentabilidad" style="margin-top: 0.5rem; padding: 0.75rem; background: #f9fafb; border-radius: 6px; font-size: 0.8rem;"></div>
        </div>

        <!-- Gráfico 5: Forecast Ocupación -->
        <div class="chart-container" style="grid-column: 1 / -1;">
          <div class="chart-title">
            <i class="fas fa-calendar-alt" style="color: #06b6d4;"></i>
            Curva de Ocupación - Próximos 30 Días
          </div>
          <canvas id="chartForecast" height="60"></canvas>
        </div>
      </div>

      <!-- Tablas Operativas -->
      <div class="chart-container">
        <div class="chart-title">
          <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
          Habitaciones Críticas (Alertas)
        </div>
        <div class="table-container">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>Habitación</th>
                <th>Tipo</th>
                <th>Alerta</th>
                <th>Prioridad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody id="tablaHabitacionesCriticas">
              <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #9ca3af;">
                  Cargando datos...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </section>

    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    
    <!-- Dashboard JavaScript -->
    <script src="/js/hoteleria-dashboard.js"></script>
    `
  });
};
