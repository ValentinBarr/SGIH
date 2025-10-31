// js/reportes.js
console.log('Reportes JS cargado correctamente');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando funcionalidades de reportes...');
    
    // Inicializar botones de exportación
    initExportButtons();
    
    // Inicializar gráficos si están disponibles
    initCharts();
    
    // Inicializar tooltips
    initTooltips();
    
    console.log('Reportes inicializados correctamente');
});

// Funciones de exportación
function initExportButtons() {
    const btnExportPDF = document.getElementById('exportarPDF');
    const btnExportExcel = document.getElementById('exportarExcel');
    
    if (btnExportPDF) {
        btnExportPDF.addEventListener('click', exportToPDF);
    }
    
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', exportToExcel);
    }
}

async function exportToPDF() {
    console.log('Exportando a PDF...');
    
    // Mostrar loading
    const btn = document.getElementById('exportarPDF');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando PDF...';
    btn.disabled = true;
    
    try {
        // Obtener datos del reporte actual
        const reporteData = getReportData();
        
        console.log('Enviando solicitud de exportación PDF:', reporteData);
        
        // Hacer petición al servidor
        const response = await fetch('/hoteleria/reportes/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tipo: reporteData.tipo,
                formato: 'pdf',
                fecha: reporteData.fecha
            })
        });
        
        if (response.ok) {
            // Obtener el archivo como blob
            const blob = await response.blob();
            
            // Crear URL temporal para descargar
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // Generar nombre de archivo
            const fechaStr = reporteData.fecha || new Date().toISOString().split('T')[0];
            const timestamp = new Date().toLocaleTimeString('es-AR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }).replace(':', '');
            a.download = `reporte-${reporteData.tipo}-${fechaStr}-${timestamp}.pdf`;
            
            // Descargar archivo
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            console.log('✅ PDF descargado exitosamente');
            
            // Mostrar mensaje de éxito
            showNotification('📄 PDF generado y descargado exitosamente', 'success');
            
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al generar PDF');
        }
        
    } catch (error) {
        console.error('Error exportando PDF:', error);
        showNotification('❌ Error al generar PDF: ' + error.message, 'error');
    } finally {
        // Restaurar botón
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

async function exportToExcel() {
    console.log('Exportando a Excel...');
    
    // Mostrar loading
    const btn = document.getElementById('exportarExcel');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando Excel...';
    btn.disabled = true;
    
    try {
        // Obtener datos del reporte actual
        const reporteData = getReportData();
        
        console.log('Enviando solicitud de exportación Excel:', reporteData);
        
        // Hacer petición al servidor
        const response = await fetch('/hoteleria/reportes/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tipo: reporteData.tipo,
                formato: 'excel',
                fecha: reporteData.fecha
            })
        });
        
        if (response.ok) {
            // Obtener el archivo como blob
            const blob = await response.blob();
            
            // Crear URL temporal para descargar
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // Generar nombre de archivo
            const fechaStr = reporteData.fecha || new Date().toISOString().split('T')[0];
            const timestamp = new Date().toLocaleTimeString('es-AR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }).replace(':', '');
            a.download = `reporte-${reporteData.tipo}-${fechaStr}-${timestamp}.xlsx`;
            
            // Descargar archivo
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            console.log('✅ Excel descargado exitosamente');
            
            // Mostrar mensaje de éxito
            showNotification('📊 Excel generado y descargado exitosamente', 'success');
            
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al generar Excel');
        }
        
    } catch (error) {
        console.error('Error exportando Excel:', error);
        showNotification('❌ Error al generar Excel: ' + error.message, 'error');
    } finally {
        // Restaurar botón
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

function getReportData() {
    // Extraer datos del reporte actual para exportación
    const reporteData = {
        tipo: new URLSearchParams(window.location.search).get('tipo') || 'diario',
        fecha: new URLSearchParams(window.location.search).get('fecha') || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
    };
    
    // Extraer estadísticas si están disponibles
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length > 0) {
        reporteData.estadisticas = [];
        statCards.forEach(card => {
            const titulo = card.querySelector('.stat-content h3')?.textContent;
            const numero = card.querySelector('.stat-number')?.textContent;
            const descripcion = card.querySelector('.stat-content p')?.textContent;
            
            if (titulo && numero) {
                reporteData.estadisticas.push({
                    titulo: titulo.trim(),
                    valor: numero.trim(),
                    descripcion: descripcion?.trim()
                });
            }
        });
    }
    
    // Extraer datos de movimientos si están disponibles
    const movimientos = document.querySelectorAll('.movimiento-item');
    if (movimientos.length > 0) {
        reporteData.movimientos = [];
        movimientos.forEach(item => {
            const info = item.querySelector('.movimiento-info');
            const hora = item.querySelector('.movimiento-hora');
            
            if (info && hora) {
                reporteData.movimientos.push({
                    habitacion: info.querySelector('strong')?.textContent,
                    huesped: info.querySelector('span')?.textContent,
                    hora: hora.textContent.trim()
                });
            }
        });
    }
    
    return reporteData;
}

// Inicialización de gráficos
function initCharts() {
    // Verificar si Chart.js está disponible
    if (typeof Chart === 'undefined') {
        console.log('Chart.js no está disponible, cargando desde CDN...');
        loadChartJS();
        return;
    }
    
    // Inicializar gráficos disponibles
    initOcupacionChart();
}

function loadChartJS() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
        console.log('Chart.js cargado exitosamente');
        initOcupacionChart();
    };
    document.head.appendChild(script);
}

function initOcupacionChart(ocupacionData = null) {
    const canvas = document.getElementById('ocupacionChart');
    if (!canvas || typeof Chart === 'undefined') return;
    
    // Si no se pasan datos, intentar obtenerlos de la variable global
    if (!ocupacionData && typeof window.ocupacionData !== 'undefined') {
        ocupacionData = window.ocupacionData;
    }
    
    // Datos de ejemplo si no hay datos reales
    if (!ocupacionData) {
        ocupacionData = generateSampleOcupacionData();
    }
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ocupacionData.map(d => d.fecha),
            datasets: [{
                label: 'Ocupación (%)',
                data: ocupacionData.map(d => parseFloat(d.porcentaje)),
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#0ea5e9',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#0ea5e9',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `Ocupación: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#0ea5e9'
                }
            }
        }
    });
    
    console.log('Gráfico de ocupación inicializado');
}

function generateSampleOcupacionData() {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        data.push({
            fecha: date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
            ocupadas: Math.floor(Math.random() * 20) + 5,
            porcentaje: (Math.random() * 60 + 20).toFixed(1)
        });
    }
    
    return data;
}

// Tooltips
function initTooltips() {
    const elementsWithTooltip = document.querySelectorAll('[data-tooltip]');
    
    elementsWithTooltip.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(event) {
    const element = event.target;
    const tooltipText = element.getAttribute('data-tooltip');
    
    if (!tooltipText) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = tooltipText;
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.8rem;
        z-index: 1000;
        pointer-events: none;
        white-space: nowrap;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
    
    element._tooltip = tooltip;
}

function hideTooltip(event) {
    const element = event.target;
    if (element._tooltip) {
        document.body.removeChild(element._tooltip);
        delete element._tooltip;
    }
}

// Funciones de utilidad
function formatCurrency(value) {
    return new Intl.NumberFormat('es-AR', { 
        style: 'currency', 
        currency: 'ARS' 
    }).format(value || 0);
}

function formatDate(dateStr, format = 'dd/MM/yyyy') {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Fecha Inválida';
        
        if (format === 'dd/MM/yyyy') {
            return date.toLocaleDateString('es-AR');
        } else if (format === 'HH:mm') {
            return date.toLocaleTimeString('es-AR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        return date.toLocaleDateString('es-AR');
    } catch {
        return 'Fecha Inválida';
    }
}

// Funciones para animaciones
function animateNumbers() {
    const numbers = document.querySelectorAll('.stat-number');
    
    numbers.forEach(number => {
        const finalValue = parseFloat(number.textContent.replace(/[^\d.-]/g, ''));
        if (isNaN(finalValue)) return;
        
        let currentValue = 0;
        const increment = finalValue / 30;
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(timer);
            }
            
            if (number.textContent.includes('%')) {
                number.textContent = currentValue.toFixed(1) + '%';
            } else if (number.textContent.includes('$')) {
                number.textContent = formatCurrency(currentValue);
            } else {
                number.textContent = Math.floor(currentValue);
            }
        }, 50);
    });
}

// Ejecutar animaciones cuando la página esté visible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(animateNumbers, 500);
    });
} else {
    setTimeout(animateNumbers, 500);
}

// Función global para inicializar gráfico de ocupación (llamada desde el HTML)
window.initOcupacionChart = initOcupacionChart;

// Sistema de notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Estilos inline para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        max-width: 500px;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        animation: slideInRight 0.3s ease-out;
        ${type === 'success' ? 'background: #10b981; color: white;' : ''}
        ${type === 'error' ? 'background: #ef4444; color: white;' : ''}
        ${type === 'warning' ? 'background: #f59e0b; color: white;' : ''}
        ${type === 'info' ? 'background: #3b82f6; color: white;' : ''}
    `;
    
    // Estilos para el contenido
    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
    `;
    
    // Estilos para el botón de cerrar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        opacity: 0.8;
        transition: opacity 0.2s;
    `;
    
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.8');
    
    // Añadir animación CSS si no existe
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Manejo de errores global
window.addEventListener('error', (event) => {
    console.error('Error en reportes.js:', event.error);
});

console.log('Reportes JS inicializado completamente');
