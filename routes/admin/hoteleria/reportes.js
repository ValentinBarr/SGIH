const express = require('express');
const router = express.Router();
const ReportesRepo = require('../../../repositories/hoteleria/reportes');
const reportesView = require('../../../views/admin/products/hoteleria/reportes/index');
const ExportService = require('../../../services/exportService');
const path = require('path');
const fs = require('fs').promises;

// Ruta principal de reportes
router.get('/hoteleria/reportes', async (req, res) => {
    try {
        console.log('📊 Accediendo a reportes de hotelería');
        
        const { tipo = 'diario', fecha } = req.query;
        let fechaSeleccionada = new Date();
        
        // Procesar fecha seleccionada
        if (fecha) {
            if (tipo === 'diario') {
                fechaSeleccionada = new Date(fecha + 'T00:00:00');
            } else if (tipo === 'mensual') {
                // Para tipo mensual, fecha viene como "2025-10"
                const [year, month] = fecha.split('-');
                fechaSeleccionada = new Date(parseInt(year), parseInt(month) - 1, 1);
            }
        }
        
        console.log(`Generando reporte ${tipo} para fecha:`, fechaSeleccionada);
        
        let reporteData = {
            tipoReporte: tipo,
            fechaSeleccionada: fechaSeleccionada
        };
        
        try {
            // Obtener huéspedes frecuentes (siempre se muestra)
            reporteData.huespedesFrecuentes = await ReportesRepo.getHuespedesFrecuentes(10);
            
            // Generar reporte según el tipo
            switch (tipo) {
                case 'diario':
                    reporteData.reporteDiario = await ReportesRepo.getReporteDiario(fechaSeleccionada);
                    break;
                    
                case 'mensual':
                    reporteData.reporteMensual = await ReportesRepo.getReporteMensual(fechaSeleccionada);
                    break;
                    
                case 'comparativo':
                    reporteData.comparativas = await ReportesRepo.getEstadisticasComparativas(fechaSeleccionada);
                    break;
                    
                default:
                    console.log('Tipo de reporte no válido, mostrando página vacía');
            }
            
        } catch (error) {
            console.error('Error al generar reporte:', error);
            // En caso de error, mostrar la página con mensaje de error
            reporteData.error = error.message;
        }
        
        res.send(reportesView(reporteData));
        
    } catch (error) {
        console.error('Error en ruta de reportes:', error);
        res.status(500).send(`
            <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
                <h2 style="color: #ef4444;">❌ Error al cargar reportes</h2>
                <p style="color: #64748b;">Ha ocurrido un error al generar el reporte solicitado.</p>
                <p style="color: #64748b; font-size: 0.9rem;">Error: ${error.message}</p>
                <a href="/hoteleria/reportes" style="
                    display: inline-block; 
                    margin-top: 20px; 
                    padding: 10px 20px; 
                    background: #0ea5e9; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 8px;
                ">🔄 Intentar de nuevo</a>
            </div>
        `);
    }
});

// Ruta para exportar reportes
router.post('/hoteleria/reportes/export', async (req, res) => {
    try {
        const { tipo, formato, fecha } = req.body;
        
        console.log(`📤 Solicitud de exportación: ${formato} para reporte ${tipo}`);
        
        // Validar parámetros
        if (!tipo || !formato) {
            return res.status(400).json({
                success: false,
                error: 'Faltan parámetros requeridos: tipo y formato'
            });
        }

        if (!['pdf', 'excel'].includes(formato)) {
            return res.status(400).json({
                success: false,
                error: 'Formato no válido. Use "pdf" o "excel"'
            });
        }

        // Procesar fecha
        let fechaSeleccionada = new Date();
        if (fecha) {
            if (tipo === 'diario') {
                fechaSeleccionada = new Date(fecha + 'T00:00:00');
            } else if (tipo === 'mensual') {
                const [year, month] = fecha.split('-');
                fechaSeleccionada = new Date(parseInt(year), parseInt(month) - 1, 1);
            }
        }

        // Generar datos del reporte
        let reporteData = {
            fecha: fechaSeleccionada,
            tipo: tipo
        };

        switch (tipo) {
            case 'diario':
                reporteData.reporteDiario = await ReportesRepo.getReporteDiario(fechaSeleccionada);
                break;
            case 'mensual':
                reporteData.reporteMensual = await ReportesRepo.getReporteMensual(fechaSeleccionada);
                break;
            case 'comparativo':
                reporteData.comparativas = await ReportesRepo.getEstadisticasComparativas(fechaSeleccionada);
                break;
            default:
                throw new Error('Tipo de reporte no válido');
        }

        // Exportar según el formato
        let result;
        if (formato === 'excel') {
            result = await ExportService.exportToExcel(reporteData, tipo);
        } else if (formato === 'pdf') {
            result = await ExportService.exportToPDF(reporteData, tipo);
        }

        // Enviar el archivo
        res.download(result.filePath, result.fileName, async (err) => {
            if (err) {
                console.error('Error enviando archivo:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        error: 'Error al enviar el archivo'
                    });
                }
            } else {
                console.log('✅ Archivo enviado exitosamente:', result.fileName);
                
                // Limpiar archivo después de enviarlo (opcional)
                setTimeout(async () => {
                    try {
                        await fs.unlink(result.filePath);
                        console.log('🗑️ Archivo temporal eliminado:', result.fileName);
                    } catch (cleanupError) {
                        console.error('Error eliminando archivo temporal:', cleanupError);
                    }
                }, 5000); // Esperar 5 segundos antes de eliminar
            }
        });
        
    } catch (error) {
        console.error('Error en exportación:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta para obtener datos de gráficos vía AJAX
router.get('/hoteleria/reportes/api/ocupacion/:periodo', async (req, res) => {
    try {
        const { periodo } = req.params;
        const { fecha } = req.query;
        
        let fechaBase = fecha ? new Date(fecha) : new Date();
        let datos = [];
        
        switch (periodo) {
            case 'mensual':
                const reporteMensual = await ReportesRepo.getReporteMensual(fechaBase);
                datos = reporteMensual.ocupacionDiaria;
                break;
                
            case 'semanal':
                // Implementar lógica para datos semanales
                datos = await generarDatosSemanales(fechaBase);
                break;
                
            default:
                throw new Error('Período no válido');
        }
        
        res.json({
            success: true,
            datos,
            periodo,
            fecha: fechaBase.toISOString()
        });
        
    } catch (error) {
        console.error('Error al obtener datos de ocupación:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Función auxiliar para generar datos semanales
async function generarDatosSemanales(fechaBase) {
    // Esta función generaría datos de ocupación para la semana
    // Por ahora, devolver datos de ejemplo
    const datos = [];
    const inicioSemana = new Date(fechaBase);
    inicioSemana.setDate(fechaBase.getDate() - fechaBase.getDay());
    
    for (let i = 0; i < 7; i++) {
        const fecha = new Date(inicioSemana);
        fecha.setDate(inicioSemana.getDate() + i);
        
        datos.push({
            fecha: fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
            ocupadas: Math.floor(Math.random() * 15) + 5,
            porcentaje: (Math.random() * 40 + 30).toFixed(1)
        });
    }
    
    return datos;
}

// Ruta para obtener estadísticas rápidas (para dashboard)
router.get('/hoteleria/reportes/api/stats/hoy', async (req, res) => {
    try {
        const reporteHoy = await ReportesRepo.getReporteDiario(new Date());
        
        const statsRapidas = {
            ocupacion: reporteHoy.estadisticasGenerales.porcentajeOcupacion,
            checkins: reporteHoy.movimientos.checkins.cantidad,
            checkouts: reporteHoy.movimientos.checkouts.cantidad,
            ingresos: reporteHoy.ingresos.total,
            llegadasEsperadas: reporteHoy.movimientos.llegadasEsperadas.cantidad,
            salidasEsperadas: reporteHoy.movimientos.salidasEsperadas.cantidad
        };
        
        res.json({
            success: true,
            fecha: new Date().toISOString(),
            stats: statsRapidas
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas rápidas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
