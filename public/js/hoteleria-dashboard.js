// ====================================================================
// DASHBOARD EJECUTIVO HOTELERO - JAVASCRIPT
// ====================================================================

// Variables globales para los gráficos
let chartOcupacionADR, chartRevenueTipo, chartEstados, chartForecast, chartRentabilidad;

// Variables para filtros de fecha
let fechaDesdeGlobal = null;
let fechaHastaGlobal = null;

// ====================================================================
// UTILIDADES
// ====================================================================

function formatCurrency(value) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat('es-AR').format(value);
}

function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const updateElement = document.getElementById('lastUpdate');
    if (updateElement) {
        updateElement.textContent = `Última actualización: ${timeString}`;
    }
}

// Función auxiliar para hacer fetch con manejo de errores
async function fetchData(url, errorMessage) {
    try {
        console.log(`Fetching: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`${errorMessage} - Datos recibidos:`, data);
        return data;
    } catch (error) {
        console.error(`${errorMessage}:`, error);
        throw error;
    }
}

// ====================================================================
// CARGA DE KPIS
// ====================================================================

async function loadKPIs() {
    try {
        // Usar filtros de fecha si existen
        let url = '/api/hoteleria/dashboard/kpis';
        if (fechaDesdeGlobal && fechaHastaGlobal) {
            url = `/api/hoteleria/dashboard/kpis?fechaDesde=${fechaDesdeGlobal}&fechaHasta=${fechaHastaGlobal}`;
        }
        
        const data = await fetchData(url, 'KPIs');
        console.log('KPIs cargados:', data);
        
        // Actualizar labels según si hay filtro o no
        const conFiltro = fechaDesdeGlobal && fechaHastaGlobal;
        
        // Actualizar labels de las cards
        document.getElementById('kpi-ocupacion-label').textContent = conFiltro ? 'Ocupación Promedio' : 'Ocupación Actual';
        document.getElementById('kpi-adr-label').textContent = conFiltro ? 'Precio Promedio del Período' : 'Precio Promedio (ADR)';
        document.getElementById('kpi-revpar-label').textContent = conFiltro ? 'RevPAR del Período' : 'Ingreso por Habitación (RevPAR)';
        document.getElementById('kpi-revenue-label').textContent = conFiltro ? 'Ingresos Totales' : 'Ingresos del Día';
        
        // KPI 1: Ocupación
        const ocupacion = data.ocupacionActual;
        document.getElementById('kpi-ocupacion').textContent = `${ocupacion.porcentaje}%`;
        
        document.getElementById('kpi-ocupacion-rooms').textContent = 
            `${ocupacion.habitacionesOcupadas} de ${ocupacion.totalHabitaciones} habitaciones`;
        
        const trendElement = document.getElementById('kpi-ocupacion-trend');
        if (ocupacion.tendencia !== undefined && ocupacion.tendencia !== null) {
            const isPositive = ocupacion.tendencia >= 0;
            trendElement.className = `kpi-trend ${isPositive ? 'positive' : 'negative'}`;
            trendElement.innerHTML = `
                <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
                ${Math.abs(ocupacion.tendencia)}% vs anterior
            `;
        } else {
            trendElement.innerHTML = `<span style="color: #64748b;">Promedio del período</span>`;
        }
        
        // Color del card según nivel de ocupación
        const ocupacionCard = document.querySelectorAll('.kpi-card')[0];
        if (ocupacion.porcentaje >= 70) {
            ocupacionCard.style.borderLeft = '4px solid #10b981';
        } else if (ocupacion.porcentaje >= 40) {
            ocupacionCard.style.borderLeft = '4px solid #f59e0b';
        } else {
            ocupacionCard.style.borderLeft = '4px solid #ef4444';
        }
        
        // KPI 2: Precio Promedio por Noche
        document.getElementById('kpi-adr').textContent = formatCurrency(data.adr.valor);
        const adrPeriodoTexto = fechaDesdeGlobal && fechaHastaGlobal ? 'Promedio del período' : `Promedio últimos ${data.adr.periodo}`;
        document.getElementById('kpi-adr-periodo').textContent = adrPeriodoTexto;
        
        // KPI 3: Ingreso por Habitación Disponible
        document.getElementById('kpi-revpar').textContent = formatCurrency(data.revpar.valor);
        document.getElementById('kpi-revpar-progress').style.width = `${data.revpar.progreso}%`;
        
        // KPI 4: Ingresos
        document.getElementById('kpi-revenue').textContent = formatCurrency(data.revenueHoy.valor);
        const revenuePeriodoTexto = fechaDesdeGlobal && fechaHastaGlobal 
            ? `Total del período seleccionado` 
            : `Proyección mensual: ${formatCurrency(data.revenueHoy.proyeccionMensual)}`;
        document.getElementById('kpi-revenue-proyeccion').textContent = revenuePeriodoTexto;
        
    } catch (error) {
        console.error('Error al cargar KPIs:', error);
    }
}

// ====================================================================
// GRÁFICO 1: OCUPACIÓN Y ADR
// ====================================================================

async function loadChartOcupacionADR() {
    try {
        // Usar filtros de fecha si existen
        let url = '/api/hoteleria/dashboard/ocupacion-adr?dias=30';
        if (fechaDesdeGlobal && fechaHastaGlobal) {
            url = `/api/hoteleria/dashboard/ocupacion-adr?fechaDesde=${fechaDesdeGlobal}&fechaHasta=${fechaHastaGlobal}`;
        }
        
        const data = await fetchData(url, 'Ocupación y ADR');
        
        const ctx = document.getElementById('chartOcupacionADR').getContext('2d');
        
        // Destruir gráfico anterior si existe
        if (chartOcupacionADR) {
            chartOcupacionADR.destroy();
        }
        
        // Calcular insights
        const ocupacionPromedio = (data.reduce((sum, d) => sum + d.ocupacionPorcentaje, 0) / data.length).toFixed(1);
        const adrPromedio = (data.reduce((sum, d) => sum + d.adr, 0) / data.length).toFixed(2);
        
        // Encontrar mejor y peor día
        const mejorDia = data.reduce((max, d) => d.ocupacionPorcentaje > max.ocupacionPorcentaje ? d : max, data[0]);
        const peorDia = data.reduce((min, d) => d.ocupacionPorcentaje < min.ocupacionPorcentaje ? d : min, data[0]);
        
        // Crear gráfico de líneas de ocupación
        chartOcupacionADR = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => {
                    const date = new Date(d.fecha);
                    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
                }),
                datasets: [
                    {
                        label: 'Ocupación %',
                        data: data.map(d => d.ocupacionPorcentaje),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 13,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 12
                        },
                        callbacks: {
                            title: function(context) {
                                return `📅 ${context[0].label}`;
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const item = data[index];
                                return [
                                    `🏨 Ocupación: ${item.ocupacionPorcentaje}%`,
                                    `💵 Tarifa Promedio: ${formatCurrency(item.adr)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 100,
                        grace: '5%',
                        title: {
                            display: true,
                            text: 'Ocupación (%)',
                            font: { 
                                weight: '600',
                                size: 13
                            },
                            color: '#1f2937',
                            padding: { bottom: 10 }
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                            font: {
                                size: 11
                            },
                            stepSize: 10,
                            padding: 8
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        });
        
        // Insights para toma de decisiones
        const mejorFecha = new Date(mejorDia.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
        const peorFecha = new Date(peorDia.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
        
        // Determinar recomendación
        let recomendacion = '';
        if (ocupacionPromedio < 50) {
            recomendacion = '⚠️ <strong>Acción requerida:</strong> Ocupación baja. Considere promociones o ajuste de tarifas.';
        } else if (ocupacionPromedio >= 70) {
            recomendacion = '✅ <strong>Excelente:</strong> Alta ocupación. Mantener estrategia actual.';
        } else {
            recomendacion = '📊 <strong>Rendimiento moderado:</strong> Busque equilibrio entre ocupación y tarifas.';
        }
        
        document.getElementById('insightsOcupacion').innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <strong style="color: #10b981;">🏨 Ocupación Promedio</strong><br>
                    <span style="font-size: 1.25rem; font-weight: 700; color: #1f2937;">${ocupacionPromedio}%</span>
                </div>
                <div>
                    <strong style="color: #8b5cf6;">💵 Tarifa Promedio (ADR)</strong><br>
                    <span style="font-size: 1.25rem; font-weight: 700; color: #1f2937;">${formatCurrency(adrPromedio)}</span>
                </div>
                <div>
                    <strong style="color: #3b82f6;">📊 Mejor Día</strong><br>
                    <span style="font-size: 1rem; font-weight: 600; color: #1f2937;">${mejorFecha} (${mejorDia.ocupacionPorcentaje}%)</span>
                </div>
            </div>
            <div style="margin-top: 1rem; padding: 0.75rem; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                ${recomendacion}
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar gráfico Ocupación/ADR:', error);
    }
}

// ====================================================================
// GRÁFICO 2: INGRESOS POR TIPO
// ====================================================================

async function loadChartRevenueTipo() {
    try {
        // Usar filtros de fecha si existen
        let url = '/api/hoteleria/dashboard/revenue-tipo';
        if (fechaDesdeGlobal && fechaHastaGlobal) {
            url = `/api/hoteleria/dashboard/revenue-tipo?fechaDesde=${fechaDesdeGlobal}&fechaHasta=${fechaHastaGlobal}`;
        }
        
        const data = await fetchData(url, 'Revenue por Tipo');
        
        const ctx = document.getElementById('chartRevenueTipo').getContext('2d');
        
        if (chartRevenueTipo) {
            chartRevenueTipo.destroy();
        }
        
        const colores = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
        
        chartRevenueTipo = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.tipoHabitacion),
                datasets: [{
                    label: 'Ingresos',
                    data: data.map(d => d.revenue),
                    backgroundColor: colores.slice(0, data.length),
                    borderRadius: 8,
                    barThickness: 40
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const item = data[context.dataIndex];
                                return [
                                    `Ingresos: ${formatCurrency(context.parsed.x)}`,
                                    `Porcentaje: ${item.porcentaje}%`,
                                    `Noches vendidas: ${item.noches}`,
                                    `Precio promedio: ${formatCurrency(item.precioPromedio)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        },
                        grid: {
                            display: true
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error al cargar gráfico Ingresos por Tipo:', error);
    }
}

// ====================================================================
// GRÁFICO 3: ESTADOS DE HABITACIONES
// ====================================================================

async function loadChartEstados() {
    try {
        const response = await fetch('/api/hoteleria/dashboard/estados-habitaciones');
        const data = await response.json();
        
        const ctx = document.getElementById('chartEstados').getContext('2d');
        
        if (chartEstados) {
            chartEstados.destroy();
        }
        
        chartEstados = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Disponible', 'Ocupada', 'Limpieza', 'Mantenimiento'],
                datasets: [{
                    data: [
                        data.disponible.cantidad,
                        data.ocupada.cantidad,
                        data.limpieza.cantidad,
                        data.mantenimiento.cantidad
                    ],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Detalle de estados
        const totalHabs = data.disponible.cantidad + data.ocupada.cantidad + data.limpieza.cantidad + data.mantenimiento.cantidad;
        document.getElementById('estadosDetalle').innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                <div>🟢 Disponible: <strong>${data.disponible.cantidad}</strong> (${data.disponible.porcentaje}%)</div>
                <div>🔵 Ocupada: <strong>${data.ocupada.cantidad}</strong> (${data.ocupada.porcentaje}%)</div>
                <div>🟡 Limpieza: <strong>${data.limpieza.cantidad}</strong> (${data.limpieza.porcentaje}%)</div>
                <div>🔴 Mantenimiento: <strong>${data.mantenimiento.cantidad}</strong> (${data.mantenimiento.porcentaje}%)</div>
            </div>
            <div style="margin-top: 0.5rem; text-align: center; font-weight: 600; color: #1f2937;">
                Total: ${totalHabs} habitaciones
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar gráfico Estados:', error);
    }
}

// ====================================================================
// GRÁFICO 4: FORECAST DE OCUPACIÓN
// ====================================================================

async function loadChartForecast() {
    try {
        const response = await fetch('/api/hoteleria/dashboard/forecast-ocupacion?dias=30');
        const data = await response.json();
        
        console.log('Datos de forecast recibidos:', data);
        
        if (!data || data.length === 0) {
            console.warn('No hay datos de forecast disponibles');
            return;
        }
        
        const ctx = document.getElementById('chartForecast').getContext('2d');
        
        if (chartForecast) {
            chartForecast.destroy();
        }
        
        chartForecast = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => {
                    const date = new Date(d.fecha);
                    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
                }),
                datasets: [{
                    label: 'Ocupación Proyectada',
                    data: data.map(d => d.ocupacionProyectada),
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.3)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#06b6d4',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const item = data[context.dataIndex];
                                return [
                                    `Ocupación: ${context.parsed.y}%`,
                                    `Confirmadas: ${item.confirmada} hab.`,
                                    `Disponibles: ${item.disponible} hab.`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            display: true,
                            drawBorder: true
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error al cargar gráfico Forecast:', error);
    }
}

// ====================================================================
// TABLAS OPERATIVAS
// ====================================================================

async function loadTablaHabitacionesCriticas() {
    try {
        const response = await fetch('/api/hoteleria/dashboard/habitaciones-criticas');
        const data = await response.json();
        
        const tbody = document.getElementById('tablaHabitacionesCriticas');
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #10b981;">✓ No hay habitaciones que requieran atención</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(item => {
            const prioridadBadge = item.prioridad === 'Alta' ? 'badge-danger' : 'badge-warning';
            const estadoBadge = item.estado === 'MANTENIMIENTO' ? 'badge-danger' : 'badge-warning';
            
            return `
                <tr>
                    <td><strong>${item.habitacion}</strong></td>
                    <td>${item.tipo}</td>
                    <td>${item.alerta}</td>
                    <td><span class="badge ${prioridadBadge}">${item.prioridad}</span></td>
                    <td><span class="badge ${estadoBadge}">${item.estado}</span></td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error al cargar tabla habitaciones críticas:', error);
    }
}

// ====================================================================
// GRÁFICO 6: RENTABILIDAD (INGRESOS VS EGRESOS)
// ====================================================================

async function loadChartRentabilidad() {
    try {
        let url = '/api/hoteleria/dashboard/rentabilidad?dias=30';
        
        // Aplicar filtros de fecha si existen
        if (fechaDesdeGlobal && fechaHastaGlobal) {
            url = `/api/hoteleria/dashboard/rentabilidad?fechaDesde=${fechaDesdeGlobal}&fechaHasta=${fechaHastaGlobal}`;
        }
        
        const data = await fetchData(url, 'Rentabilidad');
        
        const ctx = document.getElementById('chartRentabilidad').getContext('2d');
        
        if (chartRentabilidad) {
            chartRentabilidad.destroy();
        }
        
        chartRentabilidad = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => {
                    const date = new Date(d.fecha);
                    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
                }),
                datasets: [
                    {
                        label: 'Ingresos',
                        data: data.map(d => d.ingresos),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3
                    },
                    {
                        label: 'Egresos',
                        data: data.map(d => d.egresos),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3
                    },
                    {
                        label: 'Utilidad',
                        data: data.map(d => d.utilidad),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: false,
                        tension: 0.4,
                        borderWidth: 2,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${formatCurrency(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        },
                        grid: {
                            drawOnChartArea: true
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        // Calcular insights
        const totalIngresos = data.reduce((sum, d) => sum + d.ingresos, 0);
        const totalEgresos = data.reduce((sum, d) => sum + d.egresos, 0);
        const utilidadTotal = totalIngresos - totalEgresos;
        const margenUtilidad = totalIngresos > 0 ? ((utilidadTotal / totalIngresos) * 100).toFixed(1) : 0;
        
        document.getElementById('insightsRentabilidad').innerHTML = `
            <strong>📊 Resumen del período:</strong><br>
            • Ingresos totales: <strong class="has-text-success">${formatCurrency(totalIngresos)}</strong><br>
            • Egresos totales: <strong class="has-text-danger">${formatCurrency(totalEgresos)}</strong><br>
            • Utilidad neta: <strong class="${utilidadTotal >= 0 ? 'has-text-success' : 'has-text-danger'}">${formatCurrency(utilidadTotal)}</strong><br>
            • Margen de utilidad: <strong>${margenUtilidad}%</strong>
        `;
        
    } catch (error) {
        console.error('Error al cargar gráfico de rentabilidad:', error);
    }
}

// ====================================================================
// FUNCIÓN PRINCIPAL DE CARGA
// ====================================================================

async function loadDashboard() {
    const refreshBtn = document.getElementById('refreshDashboard');
    const icon = refreshBtn.querySelector('i');
    
    refreshBtn.disabled = true;
    icon.classList.add('fa-spin');
    
    try {
        // Cargar todo en paralelo
        await Promise.all([
            loadKPIs(),
            loadChartOcupacionADR(),
            loadChartRevenueTipo(),
            loadChartEstados(),
            loadChartRentabilidad(),
            loadChartForecast(),
            loadTablaHabitacionesCriticas()
        ]);
        
        updateLastUpdate();
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        alert('Error al cargar algunos datos del dashboard. Por favor, recargue la página.');
    } finally {
        icon.classList.remove('fa-spin');
        refreshBtn.disabled = false;
    }
}

// ====================================================================
// INICIALIZACIÓN
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar que Chart.js esté cargado
    if (typeof Chart === 'undefined') {
        console.error('Chart.js no está cargado!');
        alert('Error: La librería de gráficos no se cargó correctamente. Por favor, recargue la página.');
        return;
    }
    
    console.log('Dashboard inicializando...');
    
    // Inicializar fechas por defecto (últimos 30 días)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    const fechaDesdeInput = document.getElementById('fechaDesde');
    const fechaHastaInput = document.getElementById('fechaHasta');
    
    if (fechaDesdeInput && fechaHastaInput) {
        fechaDesdeInput.valueAsDate = hace30Dias;
        fechaHastaInput.valueAsDate = hoy;
    }
    
    // Cargar dashboard al inicio
    loadDashboard();
    
    // Botón de refresh manual
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboard);
    }
    
    // Filtro de fechas
    const aplicarFiltroBtn = document.getElementById('aplicarFiltroFechas');
    if (aplicarFiltroBtn) {
        aplicarFiltroBtn.addEventListener('click', () => {
        const fechaDesde = document.getElementById('fechaDesde').value;
        const fechaHasta = document.getElementById('fechaHasta').value;
        
        if (!fechaDesde || !fechaHasta) {
            alert('Por favor seleccione ambas fechas');
            return;
        }
        
        if (new Date(fechaDesde) > new Date(fechaHasta)) {
            alert('La fecha "Desde" no puede ser mayor que la fecha "Hasta"');
            return;
        }
        
        // Actualizar variables globales
        fechaDesdeGlobal = fechaDesde;
        fechaHastaGlobal = fechaHasta;
        
        // Recargar dashboard con filtros
        loadDashboard();
        });
    }
    
    // Auto-refresh cada 5 minutos
    setInterval(loadDashboard, 5 * 60 * 1000);
});
