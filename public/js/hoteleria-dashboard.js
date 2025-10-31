// ====================================================================
// DASHBOARD EJECUTIVO HOTELERO - JAVASCRIPT
// ====================================================================

// Variables globales para los gráficos
let chartOcupacionADR, chartRevenueTipo, chartEstados, chartForecast;

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
    document.getElementById('lastUpdate').textContent = `Última actualización: ${timeString}`;
}

// ====================================================================
// CARGA DE KPIS
// ====================================================================

async function loadKPIs() {
    try {
        const response = await fetch('/api/hoteleria/dashboard/kpis');
        const data = await response.json();
        
        // KPI 1: Ocupación
        const ocupacion = data.ocupacionActual;
        document.getElementById('kpi-ocupacion').textContent = `${ocupacion.porcentaje}%`;
        document.getElementById('kpi-ocupacion-rooms').textContent = 
            `${ocupacion.habitacionesOcupadas} de ${ocupacion.totalHabitaciones} habitaciones`;
        
        const trendElement = document.getElementById('kpi-ocupacion-trend');
        const isPositive = ocupacion.tendencia >= 0;
        trendElement.className = `kpi-trend ${isPositive ? 'positive' : 'negative'}`;
        trendElement.innerHTML = `
            <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
            ${Math.abs(ocupacion.tendencia)}% vs ayer
        `;
        
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
        document.getElementById('kpi-adr-periodo').textContent = `Promedio últimos ${data.adr.periodo}`;
        
        // KPI 3: Ingreso por Habitación Disponible
        document.getElementById('kpi-revpar').textContent = formatCurrency(data.revpar.valor);
        document.getElementById('kpi-revpar-progress').style.width = `${data.revpar.progreso}%`;
        
        // KPI 4: Ingresos Hoy
        document.getElementById('kpi-revenue').textContent = formatCurrency(data.revenueHoy.valor);
        document.getElementById('kpi-revenue-proyeccion').textContent = 
            `Proyección mensual: ${formatCurrency(data.revenueHoy.proyeccionMensual)}`;
        
    } catch (error) {
        console.error('Error al cargar KPIs:', error);
    }
}

// ====================================================================
// GRÁFICO 1: OCUPACIÓN Y ADR
// ====================================================================

async function loadChartOcupacionADR() {
    try {
        const response = await fetch('/api/hoteleria/dashboard/ocupacion-adr?dias=30');
        const data = await response.json();
        
        const ctx = document.getElementById('chartOcupacionADR').getContext('2d');
        
        // Destruir gráfico anterior si existe
        if (chartOcupacionADR) {
            chartOcupacionADR.destroy();
        }
        
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
                        yAxisID: 'y',
                        borderWidth: 3
                    },
                    {
                        label: 'Precio Promedio ($)',
                        data: data.map(d => d.adr),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y1',
                        borderWidth: 3
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
                                if (label.includes('Precio Promedio')) {
                                    return `${label}: ${formatCurrency(value)}`;
                                } else {
                                    return `${label}: ${value}%`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Ocupación (%)',
                            font: { weight: '600' }
                        },
                        min: 0,
                        max: 100,
                        grid: {
                            drawOnChartArea: true
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Precio Promedio ($)',
                            font: { weight: '600' }
                        },
                        grid: {
                            drawOnChartArea: false
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
        const ocupacionPromedio = (data.reduce((sum, d) => sum + d.ocupacionPorcentaje, 0) / data.length).toFixed(1);
        const adrPromedio = (data.reduce((sum, d) => sum + d.adr, 0) / data.length).toFixed(2);
        const revparPromedio = (data.reduce((sum, d) => sum + d.revpar, 0) / data.length).toFixed(2);
        const mejorDia = data.reduce((max, d) => d.ocupacionPorcentaje > max.ocupacionPorcentaje ? d : max, data[0]);
        
        const mejorFecha = new Date(mejorDia.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
        
        document.getElementById('insightsOcupacion').innerHTML = `
            <strong>📊 Insights del período:</strong><br>
            • Ocupación promedio: <strong>${ocupacionPromedio}%</strong><br>
            • Precio promedio: <strong>${formatCurrency(adrPromedio)}</strong><br>
            • Ingreso por habitación: <strong>${formatCurrency(revparPromedio)}</strong><br>
            • Mejor día: <strong>${mejorFecha}</strong> con <strong>${mejorDia.ocupacionPorcentaje}%</strong> de ocupación
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
        const response = await fetch('/api/hoteleria/dashboard/revenue-tipo');
        const data = await response.json();
        
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
// FUNCIÓN PRINCIPAL DE CARGA
// ====================================================================

async function loadDashboard() {
    const refreshBtn = document.getElementById('refreshDashboard');
    const icon = refreshBtn.querySelector('i');
    
    // Animación de carga
    icon.classList.add('fa-spin');
    refreshBtn.disabled = true;
    
    try {
        // Cargar todo en paralelo
        await Promise.all([
            loadKPIs(),
            loadChartOcupacionADR(),
            loadChartRevenueTipo(),
            loadChartEstados(),
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
    // Cargar dashboard al inicio
    loadDashboard();
    
    // Botón de refresh manual
    document.getElementById('refreshDashboard').addEventListener('click', loadDashboard);
    
    // Auto-refresh cada 5 minutos
    setInterval(loadDashboard, 5 * 60 * 1000);
});
