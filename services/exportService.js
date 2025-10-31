const XLSX = require('xlsx');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { format } = require('date-fns');
const { es } = require('date-fns/locale');

class ExportService {

    /**
     * Exporta un reporte a Excel
     */
    async exportToExcel(reporteData, tipoReporte) {
        try {
            console.log('📊 Generando archivo Excel para reporte:', tipoReporte);

            // Crear un nuevo workbook
            const workbook = XLSX.utils.book_new();

            // Generar hojas según el tipo de reporte
            switch (tipoReporte) {
                case 'diario':
                    this.addDailyReportSheets(workbook, reporteData);
                    break;
                case 'mensual':
                    this.addMonthlyReportSheets(workbook, reporteData);
                    break;
                case 'comparativo':
                    this.addComparativeReportSheets(workbook, reporteData);
                    break;
            }

            // Generar el archivo
            const fileName = this.generateFileName(tipoReporte, reporteData.fecha, 'xlsx');
            const filePath = path.join(__dirname, '../temp', fileName);

            // Crear directorio temp si no existe
            await this.ensureTempDir();

            // Escribir el archivo
            XLSX.writeFile(workbook, filePath);

            console.log('✅ Archivo Excel generado:', fileName);
            return { filePath, fileName };

        } catch (error) {
            console.error('❌ Error generando Excel:', error);
            throw new Error('Error al generar archivo Excel: ' + error.message);
        }
    }

    /**
     * Exporta un reporte a PDF
     */
    async exportToPDF(reporteData, tipoReporte, htmlContent) {
        try {
            console.log('📄 Generando archivo PDF para reporte:', tipoReporte);

            // Generar HTML optimizado para PDF con gráficos
            const pdfHtml = this.generatePDFHTML(reporteData, tipoReporte, htmlContent);

            // Configurar Puppeteer
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // Configurar viewport para mejor calidad de gráficos
            await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

            // Configurar la página
            await page.setContent(pdfHtml, { waitUntil: 'networkidle0' });

            // Esperar a que los gráficos se rendericen completamente
            await page.waitForTimeout(3000);

            // Ejecutar JavaScript para asegurar que los gráficos estén listos
            await page.evaluate(() => {
                return new Promise((resolve) => {
                    // Si hay gráficos de Chart.js, esperar a que se rendericen
                    if (typeof Chart !== 'undefined') {
                        setTimeout(resolve, 2000);
                    } else {
                        resolve();
                    }
                });
            });

            // Generar PDF
            const fileName = this.generateFileName(tipoReporte, reporteData.fecha, 'pdf');
            const filePath = path.join(__dirname, '../temp', fileName);

            await this.ensureTempDir();

            await page.pdf({
                path: filePath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                },
                preferCSSPageSize: true
            });

            await browser.close();

            console.log('✅ Archivo PDF generado:', fileName);
            return { filePath, fileName };

        } catch (error) {
            console.error('❌ Error generando PDF:', error);
            throw new Error('Error al generar archivo PDF: ' + error.message);
        }
    }

    /**
     * Añade hojas para reporte diario
     */
    addDailyReportSheets(workbook, reporteData) {
        const reporte = reporteData.reporteDiario;

        // Hoja 1: Resumen Ejecutivo
        const resumenData = [
            ['REPORTE DIARIO DE HOTELERÍA'],
            ['Fecha del Reporte: ' + reporte.fechaFormateada],
            ['Generado el: ' + this.formatDateTime(new Date(), 'dd/MM/yyyy HH:mm')],
            [''],
            ['=== RESUMEN EJECUTIVO ==='],
            [''],
            ['OCUPACIÓN Y CAPACIDAD'],
            ['Total de Habitaciones Activas', reporte.estadisticasGenerales.totalHabitaciones],
            ['Habitaciones Ocupadas', reporte.estadisticasGenerales.habitacionesOcupadas],
            ['Habitaciones Disponibles', reporte.estadisticasGenerales.totalHabitaciones - reporte.estadisticasGenerales.habitacionesOcupadas],
            ['Porcentaje de Ocupación', reporte.estadisticasGenerales.porcentajeOcupacion + '%'],
            [''],
            ['ESTADO DE HABITACIONES POR CATEGORÍA'],
            ...Object.entries(reporte.estadisticasGenerales.habitacionesPorEstado || {}).map(([estado, cantidad]) => [
                estado.replace('_', ' '), cantidad
            ]),
            [''],
            ['MOVIMIENTOS DEL DÍA'],
            ['Check-ins Realizados', reporte.movimientos.checkins.cantidad],
            ['Check-outs Realizados', reporte.movimientos.checkouts.cantidad],
            ['Llegadas Esperadas Pendientes', reporte.movimientos.llegadasEsperadas.cantidad],
            ['Salidas Esperadas Pendientes', reporte.movimientos.salidasEsperadas.cantidad],
            ['Total de Movimientos', reporte.movimientos.checkins.cantidad + reporte.movimientos.checkouts.cantidad],
            [''],
            ['ANÁLISIS FINANCIERO'],
            ['Total de Ingresos del Día', this.formatCurrency(reporte.ingresos.total)],
            ['Número de Transacciones', reporte.ingresos.cantidad],
            ['Ingreso Promedio por Transacción', reporte.ingresos.cantidad > 0 ? this.formatCurrency(reporte.ingresos.total / reporte.ingresos.cantidad) : '$0'],
            [''],
            ['INDICADORES CLAVE'],
            ['Tasa de Ocupación', reporte.estadisticasGenerales.porcentajeOcupacion + '%'],
            ['Eficiencia de Check-in', reporte.movimientos.llegadasEsperadas.cantidad > 0 ? 
                Math.round((reporte.movimientos.checkins.cantidad / (reporte.movimientos.checkins.cantidad + reporte.movimientos.llegadasEsperadas.cantidad)) * 100) + '%' : 'N/A'],
            ['Eficiencia de Check-out', reporte.movimientos.salidasEsperadas.cantidad > 0 ? 
                Math.round((reporte.movimientos.checkouts.cantidad / (reporte.movimientos.checkouts.cantidad + reporte.movimientos.salidasEsperadas.cantidad)) * 100) + '%' : 'N/A'],
            ['Revenue per Available Room (RevPAR)', this.formatCurrency((reporte.ingresos.total / reporte.estadisticasGenerales.totalHabitaciones) || 0)]
        ];

        const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
        XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen Ejecutivo');

        // Hoja 2: Check-ins Detallados
        const checkinsData = [
            ['CHECK-INS REALIZADOS - DETALLE COMPLETO'],
            ['Fecha: ' + reporte.fechaFormateada],
            [''],
            ['Habitación', 'Tipo', 'Huésped', 'Documento', 'Teléfono', 'Email', 'Hora Check-in', 'Adultos', 'Niños', 'Noches', 'Total Reserva', 'Estado Pago']
        ];

        if (reporte.movimientos.checkins.lista.length > 0) {
            reporte.movimientos.checkins.lista.forEach(reserva => {
                checkinsData.push([
                    reserva.Habitacion?.numero || 'N/A',
                    reserva.Habitacion?.TipoHabitacion?.nombre || 'N/A',
                    `${reserva.Huesped?.apellido || ''}, ${reserva.Huesped?.nombre || ''}`,
                    reserva.Huesped?.documento || 'N/A',
                    reserva.Huesped?.telefono || 'N/A',
                    reserva.Huesped?.email || 'N/A',
                    this.formatDateTime(reserva.fechaCheckInReal, 'HH:mm'),
                    reserva.cantAdultos || 0,
                    reserva.cantNinos || 0,
                    reserva.noches || 0,
                    parseFloat(reserva.total || 0),
                    reserva.estadoPago || 'Pendiente'
                ]);
            });
        } else {
            checkinsData.push(['No se realizaron check-ins en esta fecha']);
        }

        const checkinsSheet = XLSX.utils.aoa_to_sheet(checkinsData);
        XLSX.utils.book_append_sheet(workbook, checkinsSheet, 'Check-ins Detallados');

        // Hoja 3: Check-outs Detallados
        const checkoutsData = [
            ['CHECK-OUTS REALIZADOS - DETALLE COMPLETO'],
            ['Fecha: ' + reporte.fechaFormateada],
            [''],
            ['Habitación', 'Tipo', 'Huésped', 'Documento', 'Check-in Real', 'Check-out Real', 'Noches Reales', 'Total Pagado', 'Forma de Pago']
        ];

        if (reporte.movimientos.checkouts.lista.length > 0) {
            reporte.movimientos.checkouts.lista.forEach(reserva => {
                checkoutsData.push([
                    reserva.Habitacion?.numero || 'N/A',
                    reserva.Habitacion?.TipoHabitacion?.nombre || 'N/A',
                    `${reserva.Huesped?.apellido || ''}, ${reserva.Huesped?.nombre || ''}`,
                    reserva.Huesped?.documento || 'N/A',
                    this.formatDateTime(reserva.fechaCheckInReal, 'dd/MM/yyyy HH:mm'),
                    this.formatDateTime(reserva.fechaCheckOutReal, 'dd/MM/yyyy HH:mm'),
                    reserva.nochesReales || 0,
                    parseFloat(reserva.totalPagado || 0),
                    reserva.formaPagoFinal || 'N/A'
                ]);
            });
        } else {
            checkoutsData.push(['No se realizaron check-outs en esta fecha']);
        }

        const checkoutsSheet = XLSX.utils.aoa_to_sheet(checkoutsData);
        XLSX.utils.book_append_sheet(workbook, checkoutsSheet, 'Check-outs Detallados');

        // Hoja 4: Llegadas Esperadas
        const llegadasData = [
            ['LLEGADAS ESPERADAS PARA HOY'],
            ['Fecha: ' + reporte.fechaFormateada],
            [''],
            ['Habitación', 'Tipo', 'Huésped', 'Documento', 'Teléfono', 'Hora Esperada', 'Adultos', 'Niños', 'Noches', 'Total', 'Estado Reserva', 'Observaciones']
        ];

        if (reporte.movimientos.llegadasEsperadas.lista.length > 0) {
            reporte.movimientos.llegadasEsperadas.lista.forEach(reserva => {
                llegadasData.push([
                    reserva.Habitacion?.numero || 'N/A',
                    reserva.Habitacion?.TipoHabitacion?.nombre || 'N/A',
                    `${reserva.Huesped?.apellido || ''}, ${reserva.Huesped?.nombre || ''}`,
                    reserva.Huesped?.documento || 'N/A',
                    reserva.Huesped?.telefono || 'N/A',
                    this.formatDateTime(reserva.fechaCheckIn, 'HH:mm'),
                    reserva.cantAdultos || 0,
                    reserva.cantNinos || 0,
                    reserva.noches || 0,
                    parseFloat(reserva.total || 0),
                    reserva.estado || 'CONFIRMADA',
                    reserva.observaciones || ''
                ]);
            });
        } else {
            llegadasData.push(['No hay llegadas esperadas para esta fecha']);
        }

        const llegadasSheet = XLSX.utils.aoa_to_sheet(llegadasData);
        XLSX.utils.book_append_sheet(workbook, llegadasSheet, 'Llegadas Esperadas');

        // Hoja 5: Salidas Esperadas
        const salidasData = [
            ['SALIDAS ESPERADAS PARA HOY'],
            ['Fecha: ' + reporte.fechaFormateada],
            [''],
            ['Habitación', 'Tipo', 'Huésped', 'Documento', 'Check-in Real', 'Salida Esperada', 'Noches', 'Total', 'Saldo Pendiente']
        ];

        if (reporte.movimientos.salidasEsperadas.lista.length > 0) {
            reporte.movimientos.salidasEsperadas.lista.forEach(reserva => {
                salidasData.push([
                    reserva.Habitacion?.numero || 'N/A',
                    reserva.Habitacion?.TipoHabitacion?.nombre || 'N/A',
                    `${reserva.Huesped?.apellido || ''}, ${reserva.Huesped?.nombre || ''}`,
                    reserva.Huesped?.documento || 'N/A',
                    this.formatDateTime(reserva.fechaCheckInReal, 'dd/MM/yyyy HH:mm'),
                    this.formatDateTime(reserva.fechaCheckOut, 'HH:mm'),
                    reserva.noches || 0,
                    parseFloat(reserva.total || 0),
                    parseFloat(reserva.saldoPendiente || 0)
                ]);
            });
        } else {
            salidasData.push(['No hay salidas esperadas para esta fecha']);
        }

        const salidasSheet = XLSX.utils.aoa_to_sheet(salidasData);
        XLSX.utils.book_append_sheet(workbook, salidasSheet, 'Salidas Esperadas');

        // Hoja 6: Análisis Detallado de Pagos
        const pagosData = [
            ['ANÁLISIS DETALLADO DE PAGOS DEL DÍA'],
            ['Fecha: ' + reporte.fechaFormateada],
            [''],
            ['Hora', 'Código Reserva', 'Habitación', 'Huésped', 'Documento', 'Forma de Pago', 'Monto', 'Referencia', 'Estado', 'Observaciones']
        ];

        if (reporte.ingresos.pagos.length > 0) {
            reporte.ingresos.pagos.forEach(pago => {
                pagosData.push([
                    this.formatDateTime(pago.fechaPago, 'HH:mm:ss'),
                    pago.Reserva?.codigoReserva || 'N/A',
                    pago.Reserva?.Habitacion?.numero || 'N/A',
                    `${pago.Reserva?.Huesped?.apellido || ''}, ${pago.Reserva?.Huesped?.nombre || ''}`,
                    pago.Reserva?.Huesped?.documento || 'N/A',
                    pago.FormaPago?.nombre || 'N/A',
                    parseFloat(pago.monto || 0),
                    pago.referencia || '',
                    pago.estado || 'COMPLETADO',
                    pago.observaciones || ''
                ]);
            });

            // Añadir análisis de totales
            pagosData.push(['']);
            pagosData.push(['=== RESUMEN DE PAGOS ===']);
            pagosData.push(['Total General', '', '', '', '', '', parseFloat(reporte.ingresos.total)]);
            pagosData.push(['Cantidad de Transacciones', '', '', '', '', '', reporte.ingresos.cantidad]);
            pagosData.push(['Promedio por Transacción', '', '', '', '', '', reporte.ingresos.cantidad > 0 ? parseFloat(reporte.ingresos.total / reporte.ingresos.cantidad) : 0]);

            // Análisis por forma de pago
            const pagosPorForma = {};
            reporte.ingresos.pagos.forEach(pago => {
                const forma = pago.FormaPago?.nombre || 'Sin especificar';
                pagosPorForma[forma] = (pagosPorForma[forma] || 0) + parseFloat(pago.monto || 0);
            });

            pagosData.push(['']);
            pagosData.push(['=== ANÁLISIS POR FORMA DE PAGO ===']);
            Object.entries(pagosPorForma).forEach(([forma, total]) => {
                const porcentaje = ((total / reporte.ingresos.total) * 100).toFixed(1);
                pagosData.push([forma, '', '', '', '', '', parseFloat(total), `${porcentaje}%`]);
            });

        } else {
            pagosData.push(['No se registraron pagos en esta fecha']);
        }

        const pagosSheet = XLSX.utils.aoa_to_sheet(pagosData);
        XLSX.utils.book_append_sheet(workbook, pagosSheet, 'Análisis de Pagos');

        // Hoja 7: Estado Actual de Habitaciones
        const habitacionesData = [
            ['ESTADO ACTUAL DE TODAS LAS HABITACIONES'],
            ['Fecha: ' + reporte.fechaFormateada],
            ['Hora de Generación: ' + this.formatDateTime(new Date(), 'HH:mm:ss')],
            [''],
            ['Habitación', 'Tipo', 'Estado', 'Huésped Actual', 'Check-in', 'Check-out Esperado', 'Noches', 'Próxima Reserva']
        ];

        // Esta información vendría del reporte expandido
        // Por ahora, añadimos un placeholder
        habitacionesData.push(['Información detallada de habitaciones disponible en próxima versión']);

        const habitacionesSheet = XLSX.utils.aoa_to_sheet(habitacionesData);
        XLSX.utils.book_append_sheet(workbook, habitacionesSheet, 'Estado Habitaciones');

        // Hoja 8: Análisis de Rendimiento
        const rendimientoData = [
            ['ANÁLISIS DE RENDIMIENTO OPERATIVO'],
            ['Fecha: ' + reporte.fechaFormateada],
            [''],
            ['=== MÉTRICAS CLAVE ==='],
            ['Tasa de Ocupación', reporte.estadisticasGenerales.porcentajeOcupacion + '%'],
            ['Revenue per Available Room (RevPAR)', this.formatCurrency((reporte.ingresos.total / reporte.estadisticasGenerales.totalHabitaciones) || 0)],
            ['Average Daily Rate (ADR)', reporte.estadisticasGenerales.habitacionesOcupadas > 0 ? this.formatCurrency(reporte.ingresos.total / reporte.estadisticasGenerales.habitacionesOcupadas) : '$0'],
            [''],
            ['=== EFICIENCIA OPERATIVA ==='],
            ['Check-ins Programados vs Realizados', `${reporte.movimientos.checkins.cantidad} / ${reporte.movimientos.checkins.cantidad + reporte.movimientos.llegadasEsperadas.cantidad}`],
            ['Check-outs Programados vs Realizados', `${reporte.movimientos.checkouts.cantidad} / ${reporte.movimientos.checkouts.cantidad + reporte.movimientos.salidasEsperadas.cantidad}`],
            ['Eficiencia de Check-in', reporte.movimientos.llegadasEsperadas.cantidad > 0 ? 
                Math.round((reporte.movimientos.checkins.cantidad / (reporte.movimientos.checkins.cantidad + reporte.movimientos.llegadasEsperadas.cantidad)) * 100) + '%' : 'N/A'],
            ['Eficiencia de Check-out', reporte.movimientos.salidasEsperadas.cantidad > 0 ? 
                Math.round((reporte.movimientos.checkouts.cantidad / (reporte.movimientos.checkouts.cantidad + reporte.movimientos.salidasEsperadas.cantidad)) * 100) + '%' : 'N/A'],
            [''],
            ['=== ANÁLISIS FINANCIERO ==='],
            ['Total de Ingresos', this.formatCurrency(reporte.ingresos.total)],
            ['Ingresos por Habitación Ocupada', reporte.estadisticasGenerales.habitacionesOcupadas > 0 ? this.formatCurrency(reporte.ingresos.total / reporte.estadisticasGenerales.habitacionesOcupadas) : '$0'],
            ['Ingresos por Transacción', reporte.ingresos.cantidad > 0 ? this.formatCurrency(reporte.ingresos.total / reporte.ingresos.cantidad) : '$0'],
            ['Número de Transacciones', reporte.ingresos.cantidad],
            [''],
            ['=== RECOMENDACIONES ==='],
            [reporte.estadisticasGenerales.porcentajeOcupacion < 70 ? 'Ocupación baja - Considerar estrategias de marketing' : 'Ocupación saludable'],
            [reporte.movimientos.llegadasEsperadas.cantidad > reporte.movimientos.checkins.cantidad ? 'Hay llegadas pendientes - Seguimiento requerido' : 'Check-ins al día'],
            [reporte.movimientos.salidasEsperadas.cantidad > reporte.movimientos.checkouts.cantidad ? 'Hay salidas pendientes - Verificar check-outs' : 'Check-outs al día']
        ];

        const rendimientoSheet = XLSX.utils.aoa_to_sheet(rendimientoData);
        XLSX.utils.book_append_sheet(workbook, rendimientoSheet, 'Análisis Rendimiento');
    }

    /**
     * Añade hojas para reporte mensual
     */
    addMonthlyReportSheets(workbook, reporteData) {
        const reporte = reporteData.reporteMensual;

        // Hoja 1: Resumen Ejecutivo Mensual
        const resumenData = [
            ['REPORTE MENSUAL DE HOTELERÍA - ANÁLISIS COMPLETO'],
            ['Período: ' + reporte.fechaFormateada],
            ['Generado el: ' + this.formatDateTime(new Date(), 'dd/MM/yyyy HH:mm')],
            [''],
            ['=== RESUMEN EJECUTIVO ==='],
            [''],
            ['ACTIVIDAD GENERAL DEL MES'],
            ['Total de Reservas Creadas', reporte.resumen.totalReservas],
            ['Check-ins Realizados', reporte.resumen.checkinsRealizados],
            ['Check-outs Realizados', reporte.resumen.checkoutsRealizados],
            ['Tasa de Conversión (Check-ins/Reservas)', reporte.resumen.totalReservas > 0 ? 
                Math.round((reporte.resumen.checkinsRealizados / reporte.resumen.totalReservas) * 100) + '%' : 'N/A'],
            [''],
            ['ANÁLISIS DE OCUPACIÓN'],
            ['Promedio de Ocupación Mensual', reporte.resumen.promedioOcupacion + '%'],
            ['Días con Ocupación >80%', 'Calculando...'],
            ['Días con Ocupación <50%', 'Calculando...'],
            ['Mejor Día del Mes', 'Análisis en hoja separada'],
            [''],
            ['RENDIMIENTO FINANCIERO'],
            ['Total de Ingresos del Mes', this.formatCurrency(reporte.resumen.totalIngresos)],
            ['Ingreso Promedio Diario', this.formatCurrency(reporte.resumen.totalIngresos / 30)],
            ['Revenue per Available Room (RevPAR)', this.formatCurrency((reporte.resumen.totalIngresos / (30 * 20)) || 0)], // Asumiendo 20 habitaciones
            ['Average Daily Rate (ADR)', reporte.resumen.checkinsRealizados > 0 ? 
                this.formatCurrency(reporte.resumen.totalIngresos / reporte.resumen.checkinsRealizados) : '$0'],
            [''],
            ['DISTRIBUCIÓN DE RESERVAS POR ESTADO'],
            ...Object.entries(reporte.reservasPorEstado || {}).map(([estado, cantidad]) => [
                estado.replace('_', ' '), cantidad, reporte.resumen.totalReservas > 0 ? 
                    Math.round((cantidad / reporte.resumen.totalReservas) * 100) + '%' : '0%'
            ]),
            [''],
            ['ANÁLISIS DE FORMAS DE PAGO'],
            ['Forma de Pago', 'Monto Total', 'Porcentaje', 'Transacciones'],
            ...Object.entries(reporte.ingresosPorFormaPago || {}).map(([forma, monto]) => [
                forma, 
                parseFloat(monto),
                reporte.resumen.totalIngresos > 0 ? ((monto / reporte.resumen.totalIngresos) * 100).toFixed(1) + '%' : '0%',
                'Por calcular'
            ]),
            [''],
            ['INDICADORES CLAVE DE RENDIMIENTO (KPIs)'],
            ['Ocupación Promedio', reporte.resumen.promedioOcupacion + '%'],
            ['Ingresos Totales', this.formatCurrency(reporte.resumen.totalIngresos)],
            ['Reservas Totales', reporte.resumen.totalReservas],
            ['Tasa de No-Show', 'Por implementar'],
            ['Tiempo Promedio de Estadía', 'Por implementar'],
            ['Satisfacción del Cliente', 'Por implementar']
        ];

        const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
        XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen Ejecutivo');

        // Hoja 2: Análisis Detallado de Ocupación Diaria
        const ocupacionData = [
            ['ANÁLISIS DETALLADO DE OCUPACIÓN DIARIA'],
            ['Período: ' + reporte.fechaFormateada],
            [''],
            ['Fecha', 'Día Semana', 'Habitaciones Ocupadas', 'Porcentaje', 'Ingresos Estimados', 'Clasificación', 'Observaciones']
        ];

        reporte.ocupacionDiaria.forEach((dia, index) => {
            const fecha = new Date();
            fecha.setDate(index + 1);
            const diaSemana = fecha.toLocaleDateString('es-AR', { weekday: 'long' });
            const porcentaje = parseFloat(dia.porcentaje);
            
            let clasificacion = 'Baja';
            if (porcentaje >= 80) clasificacion = 'Excelente';
            else if (porcentaje >= 60) clasificacion = 'Buena';
            else if (porcentaje >= 40) clasificacion = 'Regular';
            
            let observacion = '';
            if (porcentaje >= 90) observacion = 'Ocupación casi completa';
            else if (porcentaje <= 30) observacion = 'Ocupación crítica';
            else if (diaSemana === 'sábado' || diaSemana === 'domingo') observacion = 'Fin de semana';
            
            ocupacionData.push([
                dia.fecha,
                diaSemana,
                dia.ocupadas,
                porcentaje + '%',
                'Por calcular',
                clasificacion,
                observacion
            ]);
        });

        // Añadir estadísticas de resumen
        ocupacionData.push(['']);
        ocupacionData.push(['=== ESTADÍSTICAS DEL MES ===']);
        const porcentajes = reporte.ocupacionDiaria.map(d => parseFloat(d.porcentaje));
        ocupacionData.push(['Ocupación Máxima', Math.max(...porcentajes) + '%']);
        ocupacionData.push(['Ocupación Mínima', Math.min(...porcentajes) + '%']);
        ocupacionData.push(['Ocupación Promedio', reporte.resumen.promedioOcupacion + '%']);
        ocupacionData.push(['Días con >80% Ocupación', porcentajes.filter(p => p >= 80).length]);
        ocupacionData.push(['Días con <50% Ocupación', porcentajes.filter(p => p < 50).length]);

        const ocupacionSheet = XLSX.utils.aoa_to_sheet(ocupacionData);
        XLSX.utils.book_append_sheet(workbook, ocupacionSheet, 'Ocupación Detallada');

        // Hoja 3: Análisis Completo de Habitaciones
        const habitacionesData = [
            ['ANÁLISIS COMPLETO DE RENDIMIENTO POR HABITACIÓN'],
            ['Período: ' + reporte.fechaFormateada],
            [''],
            ['Ranking', 'Habitación', 'Tipo', 'Reservas', 'Tasa Ocupación', 'Ingresos Generados', 'Promedio por Reserva', 'Clasificación']
        ];

        if (reporte.habitacionesMasUtilizadas.length > 0) {
            reporte.habitacionesMasUtilizadas.forEach((hab, index) => {
                const tasaOcupacion = ((hab.reservas / 30) * 100).toFixed(1); // Asumiendo 30 días
                const ingresosEstimados = hab.reservas * 50000; // Estimación
                const promedioReserva = hab.reservas > 0 ? ingresosEstimados / hab.reservas : 0;
                
                let clasificacion = 'Baja Demanda';
                if (hab.reservas >= 20) clasificacion = 'Alta Demanda';
                else if (hab.reservas >= 15) clasificacion = 'Demanda Media';
                else if (hab.reservas >= 10) clasificacion = 'Demanda Regular';
                
                habitacionesData.push([
                    index + 1,
                    hab.numero,
                    hab.TipoHabitacion?.nombre || 'N/A',
                    hab.reservas,
                    tasaOcupacion + '%',
                    this.formatCurrency(ingresosEstimados),
                    this.formatCurrency(promedioReserva),
                    clasificacion
                ]);
            });
            
            // Añadir análisis estadístico
            habitacionesData.push(['']);
            habitacionesData.push(['=== ANÁLISIS ESTADÍSTICO ===']);
            const totalReservas = reporte.habitacionesMasUtilizadas.reduce((sum, hab) => sum + hab.reservas, 0);
            const promedioReservas = totalReservas / reporte.habitacionesMasUtilizadas.length;
            
            habitacionesData.push(['Total de Reservas Analizadas', totalReservas]);
            habitacionesData.push(['Promedio de Reservas por Habitación', Math.round(promedioReservas)]);
            habitacionesData.push(['Habitación Más Popular', reporte.habitacionesMasUtilizadas[0]?.numero || 'N/A']);
            habitacionesData.push(['Habitación Menos Popular', reporte.habitacionesMasUtilizadas[reporte.habitacionesMasUtilizadas.length - 1]?.numero || 'N/A']);
            
        } else {
            habitacionesData.push(['No hay datos de habitaciones para este período']);
        }

        const habitacionesSheet = XLSX.utils.aoa_to_sheet(habitacionesData);
        XLSX.utils.book_append_sheet(workbook, habitacionesSheet, 'Análisis Habitaciones');

        // Hoja 4: Análisis Financiero Detallado
        const financieroData = [
            ['ANÁLISIS FINANCIERO DETALLADO DEL MES'],
            ['Período: ' + reporte.fechaFormateada],
            [''],
            ['=== RESUMEN FINANCIERO ==='],
            ['Total de Ingresos', this.formatCurrency(reporte.resumen.totalIngresos)],
            ['Ingreso Promedio Diario', this.formatCurrency(reporte.resumen.totalIngresos / 30)],
            ['Ingreso por Check-in', reporte.resumen.checkinsRealizados > 0 ? 
                this.formatCurrency(reporte.resumen.totalIngresos / reporte.resumen.checkinsRealizados) : '$0'],
            [''],
            ['=== DISTRIBUCIÓN POR FORMA DE PAGO ==='],
            ['Forma de Pago', 'Monto', 'Porcentaje del Total', 'Número de Transacciones (Est.)']
        ];

        Object.entries(reporte.ingresosPorFormaPago || {}).forEach(([forma, monto]) => {
            const porcentaje = reporte.resumen.totalIngresos > 0 ? 
                ((monto / reporte.resumen.totalIngresos) * 100).toFixed(1) : '0';
            const transaccionesEst = Math.round(monto / 25000); // Estimación basada en ticket promedio
            
            financieroData.push([
                forma,
                parseFloat(monto),
                porcentaje + '%',
                transaccionesEst
            ]);
        });

        financieroData.push(['']);
        financieroData.push(['=== MÉTRICAS HOTELERAS CLAVE ===']);
        financieroData.push(['Revenue per Available Room (RevPAR)', this.formatCurrency((reporte.resumen.totalIngresos / (30 * 20)) || 0)]);
        financieroData.push(['Average Daily Rate (ADR)', reporte.resumen.checkinsRealizados > 0 ? 
            this.formatCurrency(reporte.resumen.totalIngresos / reporte.resumen.checkinsRealizados) : '$0']);
        financieroData.push(['Gross Operating Profit per Available Room (GOPPAR)', 'Por implementar']);
        financieroData.push(['']);
        financieroData.push(['=== PROYECCIONES Y TENDENCIAS ===']);
        financieroData.push(['Proyección Próximo Mes (Tendencia)', this.formatCurrency(reporte.resumen.totalIngresos * 1.05)]);
        financieroData.push(['Crecimiento Estimado', '5% (basado en tendencia)']);
        financieroData.push(['Meta Sugerida Próximo Mes', this.formatCurrency(reporte.resumen.totalIngresos * 1.1)]);

        const financieroSheet = XLSX.utils.aoa_to_sheet(financieroData);
        XLSX.utils.book_append_sheet(workbook, financieroSheet, 'Análisis Financiero');

        // Hoja 5: Recomendaciones Estratégicas
        const recomendacionesData = [
            ['RECOMENDACIONES ESTRATÉGICAS Y PLAN DE ACCIÓN'],
            ['Basado en el análisis del período: ' + reporte.fechaFormateada],
            [''],
            ['=== ANÁLISIS DE FORTALEZAS ==='],
            [reporte.resumen.promedioOcupacion >= 70 ? '✓ Ocupación saludable (' + reporte.resumen.promedioOcupacion + '%)' : '⚠ Ocupación por debajo del objetivo'],
            [reporte.resumen.totalIngresos >= 1000000 ? '✓ Ingresos sólidos' : '⚠ Ingresos por debajo de expectativas'],
            [reporte.resumen.checkinsRealizados >= reporte.resumen.totalReservas * 0.8 ? '✓ Buena conversión de reservas' : '⚠ Baja conversión de reservas'],
            [''],
            ['=== ÁREAS DE MEJORA IDENTIFICADAS ==='],
            [reporte.resumen.promedioOcupacion < 60 ? '• Implementar estrategias de marketing para aumentar ocupación' : '• Mantener estrategias actuales de ocupación'],
            ['• Analizar patrones de demanda por día de la semana'],
            ['• Optimizar precios según temporada alta/baja'],
            ['• Mejorar experiencia del huésped para aumentar repetición'],
            [''],
            ['=== RECOMENDACIONES ESPECÍFICAS ==='],
            ['1. OCUPACIÓN'],
            [reporte.resumen.promedioOcupacion < 70 ? 
                '   - Crear paquetes promocionales para días de baja ocupación' : 
                '   - Mantener estrategia actual, considerar aumento de tarifas'],
            ['   - Implementar sistema de overbooking controlado'],
            ['   - Desarrollar alianzas con agencias de viaje'],
            [''],
            ['2. INGRESOS'],
            ['   - Implementar revenue management dinámico'],
            ['   - Crear servicios adicionales (spa, restaurante, tours)'],
            ['   - Optimizar mix de formas de pago para reducir comisiones'],
            [''],
            ['3. OPERACIONES'],
            ['   - Automatizar procesos de check-in/check-out'],
            ['   - Implementar sistema de feedback de huéspedes'],
            ['   - Capacitar personal en upselling'],
            [''],
            ['=== METAS SUGERIDAS PRÓXIMO MES ==='],
            ['Ocupación Objetivo', (reporte.resumen.promedioOcupacion + 5) + '%'],
            ['Ingresos Objetivo', this.formatCurrency(reporte.resumen.totalIngresos * 1.1)],
            ['Satisfacción Cliente', '95%'],
            ['Eficiencia Check-in', '98%'],
            [''],
            ['=== INDICADORES A MONITOREAR ==='],
            ['• Tasa de ocupación diaria'],
            ['• RevPAR (Revenue per Available Room)'],
            ['• ADR (Average Daily Rate)'],
            ['• Tiempo promedio de estadía'],
            ['• Tasa de repetición de huéspedes'],
            ['• Calificación promedio en plataformas'],
            ['• Costo de adquisición de cliente'],
            ['• Margen de contribución por habitación']
        ];

        const recomendacionesSheet = XLSX.utils.aoa_to_sheet(recomendacionesData);
        XLSX.utils.book_append_sheet(workbook, recomendacionesSheet, 'Recomendaciones');
    }

    /**
     * Añade hojas para reporte comparativo
     */
    addComparativeReportSheets(workbook, reporteData) {
        const comp = reporteData.comparativas;

        // Hoja 1: Análisis Comparativo Detallado
        const comparativoData = [
            ['ANÁLISIS COMPARATIVO DETALLADO'],
            ['Comparación: ' + comp.mesActual + ' vs ' + comp.mesAnterior],
            ['Generado el: ' + this.formatDateTime(new Date(), 'dd/MM/yyyy HH:mm')],
            [''],
            ['=== RESUMEN EJECUTIVO DE COMPARACIÓN ==='],
            [''],
            ['MÉTRICA', 'MES ACTUAL', 'MES ANTERIOR', 'DIFERENCIA', 'CAMBIO (%)', 'TENDENCIA', 'EVALUACIÓN'],
            [''],
            ['Reservas Totales', 
                comp.comparacion.reservas.actual, 
                comp.comparacion.reservas.anterior, 
                comp.comparacion.reservas.actual - comp.comparacion.reservas.anterior,
                comp.comparacion.reservas.cambio + '%',
                parseFloat(comp.comparacion.reservas.cambio) > 0 ? '↗ Crecimiento' : parseFloat(comp.comparacion.reservas.cambio) < 0 ? '↘ Declive' : '→ Estable',
                parseFloat(comp.comparacion.reservas.cambio) > 10 ? 'Excelente' : parseFloat(comp.comparacion.reservas.cambio) > 0 ? 'Positivo' : parseFloat(comp.comparacion.reservas.cambio) > -10 ? 'Aceptable' : 'Preocupante'
            ],
            ['Ingresos Totales', 
                this.formatCurrency(comp.comparacion.ingresos.actual), 
                this.formatCurrency(comp.comparacion.ingresos.anterior), 
                this.formatCurrency(comp.comparacion.ingresos.actual - comp.comparacion.ingresos.anterior),
                comp.comparacion.ingresos.cambio + '%',
                parseFloat(comp.comparacion.ingresos.cambio) > 0 ? '↗ Crecimiento' : parseFloat(comp.comparacion.ingresos.cambio) < 0 ? '↘ Declive' : '→ Estable',
                parseFloat(comp.comparacion.ingresos.cambio) > 15 ? 'Excelente' : parseFloat(comp.comparacion.ingresos.cambio) > 0 ? 'Positivo' : parseFloat(comp.comparacion.ingresos.cambio) > -10 ? 'Aceptable' : 'Crítico'
            ],
            ['Ocupación Promedio', 
                comp.comparacion.ocupacion.actual + '%', 
                comp.comparacion.ocupacion.anterior + '%', 
                (comp.comparacion.ocupacion.actual - comp.comparacion.ocupacion.anterior).toFixed(1) + ' puntos',
                comp.comparacion.ocupacion.cambio + '%',
                parseFloat(comp.comparacion.ocupacion.cambio) > 0 ? '↗ Mejora' : parseFloat(comp.comparacion.ocupacion.cambio) < 0 ? '↘ Declive' : '→ Estable',
                comp.comparacion.ocupacion.actual > 75 ? 'Excelente' : comp.comparacion.ocupacion.actual > 60 ? 'Bueno' : comp.comparacion.ocupacion.actual > 40 ? 'Regular' : 'Bajo'
            ],
            [''],
            ['=== ANÁLISIS DE RENDIMIENTO ==='],
            [''],
            ['Revenue per Available Room (RevPAR)'],
            ['Mes Actual', this.formatCurrency((comp.comparacion.ingresos.actual / (30 * 20)) || 0)],
            ['Mes Anterior', this.formatCurrency((comp.comparacion.ingresos.anterior / (30 * 20)) || 0)],
            ['Cambio', parseFloat(comp.comparacion.ingresos.cambio) > 0 ? 'Mejora' : parseFloat(comp.comparacion.ingresos.cambio) < 0 ? 'Declive' : 'Sin cambio'],
            [''],
            ['Average Daily Rate (ADR)'],
            ['Mes Actual', comp.comparacion.reservas.actual > 0 ? this.formatCurrency(comp.comparacion.ingresos.actual / comp.comparacion.reservas.actual) : '$0'],
            ['Mes Anterior', comp.comparacion.reservas.anterior > 0 ? this.formatCurrency(comp.comparacion.ingresos.anterior / comp.comparacion.reservas.anterior) : '$0'],
            [''],
            ['=== FACTORES DE IMPACTO ==='],
            ['Estacionalidad', 'Analizar patrones estacionales'],
            ['Competencia', 'Monitorear precios de competidores'],
            ['Marketing', 'Evaluar efectividad de campañas'],
            ['Eventos Locales', 'Considerar eventos que afecten demanda'],
            [''],
            ['=== RECOMENDACIONES BASADAS EN TENDENCIAS ==='],
            [parseFloat(comp.comparacion.reservas.cambio) < 0 ? '• URGENTE: Implementar estrategia de recuperación de reservas' : '• Mantener momentum positivo en reservas'],
            [parseFloat(comp.comparacion.ingresos.cambio) < 0 ? '• CRÍTICO: Revisar estrategia de precios y costos' : '• Optimizar estrategia de ingresos actual'],
            [parseFloat(comp.comparacion.ocupacion.cambio) < 0 ? '• IMPORTANTE: Mejorar estrategias de ocupación' : '• Continuar con estrategias de ocupación exitosas'],
            ['• Analizar causas específicas de los cambios observados'],
            ['• Implementar acciones correctivas en áreas de declive'],
            ['• Potenciar factores que generaron mejoras'],
            [''],
            ['=== METAS PARA EL PRÓXIMO PERÍODO ==='],
            ['Reservas Objetivo', Math.max(comp.comparacion.reservas.actual * 1.05, comp.comparacion.reservas.anterior * 1.1)],
            ['Ingresos Objetivo', this.formatCurrency(Math.max(comp.comparacion.ingresos.actual * 1.05, comp.comparacion.ingresos.anterior * 1.1))],
            ['Ocupación Objetivo', Math.min(95, Math.max(comp.comparacion.ocupacion.actual + 2, comp.comparacion.ocupacion.anterior + 5)) + '%'],
            [''],
            ['=== ALERTAS Y SEGUIMIENTO ==='],
            [parseFloat(comp.comparacion.reservas.cambio) < -20 ? '🚨 ALERTA ROJA: Caída crítica en reservas' : parseFloat(comp.comparacion.reservas.cambio) < -10 ? '⚠️ ALERTA AMARILLA: Declive en reservas' : '✅ Reservas en rango aceptable'],
            [parseFloat(comp.comparacion.ingresos.cambio) < -15 ? '🚨 ALERTA ROJA: Caída crítica en ingresos' : parseFloat(comp.comparacion.ingresos.cambio) < -5 ? '⚠️ ALERTA AMARILLA: Declive en ingresos' : '✅ Ingresos en rango aceptable'],
            [comp.comparacion.ocupacion.actual < 40 ? '🚨 ALERTA ROJA: Ocupación crítica' : comp.comparacion.ocupacion.actual < 60 ? '⚠️ ALERTA AMARILLA: Ocupación baja' : '✅ Ocupación saludable']
        ];

        const comparativoSheet = XLSX.utils.aoa_to_sheet(comparativoData);
        XLSX.utils.book_append_sheet(workbook, comparativoSheet, 'Análisis Comparativo');

        // Hoja 2: Plan de Acción Estratégico
        const planAccionData = [
            ['PLAN DE ACCIÓN ESTRATÉGICO'],
            ['Basado en comparación: ' + comp.mesActual + ' vs ' + comp.mesAnterior],
            [''],
            ['=== ACCIONES INMEDIATAS (0-30 días) ==='],
            [''],
            ['PRIORIDAD ALTA'],
            [parseFloat(comp.comparacion.ingresos.cambio) < -10 ? '1. Revisar y ajustar estrategia de precios' : '1. Mantener estrategia de precios actual'],
            [parseFloat(comp.comparacion.reservas.cambio) < -15 ? '2. Lanzar campaña de marketing urgente' : '2. Optimizar canales de marketing actuales'],
            [comp.comparacion.ocupacion.actual < 50 ? '3. Implementar promociones especiales' : '3. Evaluar oportunidades de upselling'],
            [''],
            ['PRIORIDAD MEDIA'],
            ['4. Analizar feedback de huéspedes del período'],
            ['5. Revisar competencia y posicionamiento'],
            ['6. Optimizar distribución en OTAs'],
            [''],
            ['=== ACCIONES A MEDIANO PLAZO (1-3 meses) ==='],
            [''],
            ['DESARROLLO'],
            ['• Implementar sistema de revenue management'],
            ['• Desarrollar paquetes estacionales'],
            ['• Mejorar experiencia del huésped'],
            ['• Capacitar equipo en técnicas de venta'],
            [''],
            ['MARKETING'],
            ['• Crear contenido para redes sociales'],
            ['• Desarrollar programa de fidelización'],
            ['• Establecer alianzas estratégicas'],
            ['• Optimizar presencia online'],
            [''],
            ['=== MÉTRICAS DE SEGUIMIENTO ==='],
            [''],
            ['DIARIAS'],
            ['• Tasa de ocupación'],
            ['• Ingresos por habitación disponible'],
            ['• Reservas nuevas vs cancelaciones'],
            [''],
            ['SEMANALES'],
            ['• Análisis de competencia'],
            ['• Performance de canales de distribución'],
            ['• Satisfacción del cliente'],
            [''],
            ['MENSUALES'],
            ['• RevPAR vs competencia'],
            ['• Análisis de rentabilidad'],
            ['• Evaluación de estrategias implementadas'],
            [''],
            ['=== PRESUPUESTO ESTIMADO ==='],
            ['Marketing Digital', '$50,000 - $100,000'],
            ['Mejoras Operativas', '$30,000 - $75,000'],
            ['Capacitación Personal', '$15,000 - $30,000'],
            ['Tecnología/Software', '$25,000 - $50,000'],
            ['Total Estimado', '$120,000 - $255,000'],
            [''],
            ['=== CRONOGRAMA DE IMPLEMENTACIÓN ==='],
            ['Semana 1-2: Análisis detallado y planificación'],
            ['Semana 3-4: Implementación de acciones inmediatas'],
            ['Mes 2: Desarrollo de estrategias a mediano plazo'],
            ['Mes 3: Evaluación y ajustes'],
            ['Mes 4+: Implementación continua y optimización']
        ];

        const planAccionSheet = XLSX.utils.aoa_to_sheet(planAccionData);
        XLSX.utils.book_append_sheet(workbook, planAccionSheet, 'Plan de Acción');
    }

    /**
     * Genera HTML optimizado para PDF
     */
    generatePDFHTML(reporteData, tipoReporte, originalHtml) {
        const fecha = this.formatDateTime(reporteData.fecha || new Date(), 'dd/MM/yyyy');
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reporte ${tipoReporte} - ${fecha}</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    font-size: 12px; 
                    line-height: 1.4; 
                    color: #333;
                }
                .pdf-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #0ea5e9;
                }
                .pdf-header h1 {
                    color: #0ea5e9;
                    font-size: 24px;
                    margin-bottom: 8px;
                }
                .pdf-header p {
                    color: #64748b;
                    font-size: 14px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .stat-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 16px;
                    background: #f8fafc;
                }
                .stat-card h3 {
                    color: #475569;
                    font-size: 12px;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }
                .stat-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #0ea5e9;
                    margin-bottom: 4px;
                }
                .stat-description {
                    color: #64748b;
                    font-size: 11px;
                }
                .chart-container {
                    margin: 30px 0;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    background: #fff;
                    page-break-inside: avoid;
                }
                .chart-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 15px;
                    text-align: center;
                }
                .chart-canvas {
                    width: 100% !important;
                    height: 300px !important;
                    max-height: 300px !important;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 11px;
                }
                th, td {
                    border: 1px solid #e2e8f0;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background: #f1f5f9;
                    font-weight: 600;
                    color: #475569;
                }
                .section-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #374151;
                    margin: 20px 0 10px 0;
                    padding-bottom: 5px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                    color: #64748b;
                    font-size: 10px;
                }
                .page-break {
                    page-break-before: always;
                }
                @media print {
                    .stats-grid { grid-template-columns: repeat(4, 1fr); }
                    body { font-size: 11px; }
                    .chart-container { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="pdf-header">
                <h1>📊 Reporte de Hotelería - ${tipoReporte.charAt(0).toUpperCase() + tipoReporte.slice(1)}</h1>
                <p>Generado el ${this.formatDateTime(new Date(), 'dd/MM/yyyy HH:mm')} | Fecha del reporte: ${fecha}</p>
            </div>

            ${this.generatePDFContent(reporteData, tipoReporte)}

            <div class="footer">
                <p>Sistema de Gestión Integral Hotelera (SGIH) - Reporte generado automáticamente</p>
            </div>

            ${this.generateChartsScript(reporteData, tipoReporte)}
        </body>
        </html>
        `;
    }

    /**
     * Genera el contenido específico del PDF según el tipo de reporte
     */
    generatePDFContent(reporteData, tipoReporte) {
        switch (tipoReporte) {
            case 'diario':
                return this.generateDailyPDFContent(reporteData.reporteDiario);
            case 'mensual':
                return this.generateMonthlyPDFContent(reporteData.reporteMensual);
            case 'comparativo':
                return this.generateComparativePDFContent(reporteData.comparativas);
            default:
                return '<p>Tipo de reporte no válido</p>';
        }
    }

    generateDailyPDFContent(reporte) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Ocupación</h3>
                    <div class="stat-number">${reporte.estadisticasGenerales.porcentajeOcupacion}%</div>
                    <div class="stat-description">${reporte.estadisticasGenerales.habitacionesOcupadas}/${reporte.estadisticasGenerales.totalHabitaciones} habitaciones</div>
                </div>
                <div class="stat-card">
                    <h3>Check-ins</h3>
                    <div class="stat-number">${reporte.movimientos.checkins.cantidad}</div>
                    <div class="stat-description">Ingresos realizados</div>
                </div>
                <div class="stat-card">
                    <h3>Check-outs</h3>
                    <div class="stat-number">${reporte.movimientos.checkouts.cantidad}</div>
                    <div class="stat-description">Salidas realizadas</div>
                </div>
                <div class="stat-card">
                    <h3>Ingresos</h3>
                    <div class="stat-number">${this.formatCurrency(reporte.ingresos.total)}</div>
                    <div class="stat-description">${reporte.ingresos.cantidad} pagos</div>
                </div>
            </div>

            ${reporte.ingresos.pagos.length > 0 ? `
                <h2 class="section-title">Detalle de Pagos</h2>
                <table>
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
                                <td>${this.formatDateTime(pago.fechaPago, 'HH:mm')}</td>
                                <td>${pago.Reserva?.codigoReserva || 'N/A'}</td>
                                <td>${pago.Reserva?.Huesped?.apellido}, ${pago.Reserva?.Huesped?.nombre}</td>
                                <td>${pago.FormaPago?.nombre || 'N/A'}</td>
                                <td>${this.formatCurrency(pago.monto)}</td>
                            </tr>
                        `).join('')}
                        <tr style="font-weight: bold; background: #f1f5f9;">
                            <td colspan="4">TOTAL</td>
                            <td>${this.formatCurrency(reporte.ingresos.total)}</td>
                        </tr>
                    </tbody>
                </table>
            ` : ''}
        `;
    }

    generateMonthlyPDFContent(reporte) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Reservas</h3>
                    <div class="stat-number">${reporte.resumen.totalReservas}</div>
                    <div class="stat-description">Total del mes</div>
                </div>
                <div class="stat-card">
                    <h3>Ocupación Promedio</h3>
                    <div class="stat-number">${reporte.resumen.promedioOcupacion}%</div>
                    <div class="stat-description">Promedio mensual</div>
                </div>
                <div class="stat-card">
                    <h3>Ingresos</h3>
                    <div class="stat-number">${this.formatCurrency(reporte.resumen.totalIngresos)}</div>
                    <div class="stat-description">Total del mes</div>
                </div>
                <div class="stat-card">
                    <h3>Movimientos</h3>
                    <div class="stat-number">${reporte.resumen.checkinsRealizados + reporte.resumen.checkoutsRealizados}</div>
                    <div class="stat-description">${reporte.resumen.checkinsRealizados} in / ${reporte.resumen.checkoutsRealizados} out</div>
                </div>
            </div>

            <!-- Gráfico de Ocupación Diaria -->
            <div class="chart-container">
                <div class="chart-title">📈 Ocupación Diaria del Mes</div>
                <canvas id="ocupacionChart" class="chart-canvas"></canvas>
            </div>

            ${Object.keys(reporte.ingresosPorFormaPago).length > 0 ? `
                <!-- Gráfico de Ingresos por Forma de Pago -->
                <div class="chart-container">
                    <div class="chart-title">💳 Distribución de Ingresos por Forma de Pago</div>
                    <canvas id="formasPagoChart" class="chart-canvas"></canvas>
                </div>

                <div class="page-break"></div>

                <h2 class="section-title">Detalle de Ingresos por Forma de Pago</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Forma de Pago</th>
                            <th>Monto</th>
                            <th>Porcentaje</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(reporte.ingresosPorFormaPago).map(([forma, monto]) => `
                            <tr>
                                <td>${forma}</td>
                                <td>${this.formatCurrency(monto)}</td>
                                <td>${((monto / reporte.resumen.totalIngresos) * 100).toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : ''}

            ${reporte.habitacionesMasUtilizadas.length > 0 ? `
                <!-- Gráfico de Habitaciones Más Utilizadas -->
                <div class="chart-container">
                    <div class="chart-title">🏆 Top 5 Habitaciones Más Utilizadas</div>
                    <canvas id="habitacionesChart" class="chart-canvas"></canvas>
                </div>
            ` : ''}
        `;
    }

    generateComparativePDFContent(comparativas) {
        return `
            <h2 class="section-title">Comparación: ${comparativas.mesActual} vs ${comparativas.mesAnterior}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Métrica</th>
                        <th>Mes Actual</th>
                        <th>Mes Anterior</th>
                        <th>Cambio (%)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Reservas</td>
                        <td>${comparativas.comparacion.reservas.actual}</td>
                        <td>${comparativas.comparacion.reservas.anterior}</td>
                        <td>${comparativas.comparacion.reservas.cambio}%</td>
                    </tr>
                    <tr>
                        <td>Ingresos</td>
                        <td>${this.formatCurrency(comparativas.comparacion.ingresos.actual)}</td>
                        <td>${this.formatCurrency(comparativas.comparacion.ingresos.anterior)}</td>
                        <td>${comparativas.comparacion.ingresos.cambio}%</td>
                    </tr>
                    <tr>
                        <td>Ocupación Promedio</td>
                        <td>${comparativas.comparacion.ocupacion.actual}%</td>
                        <td>${comparativas.comparacion.ocupacion.anterior}%</td>
                        <td>${comparativas.comparacion.ocupacion.cambio}%</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    /**
     * Genera nombre de archivo
     */
    generateFileName(tipoReporte, fecha, extension) {
        const fechaStr = this.formatDateTime(fecha, 'yyyy-MM-dd');
        const timestamp = this.formatDateTime(new Date(), 'HHmm');
        return `reporte-${tipoReporte}-${fechaStr}-${timestamp}.${extension}`;
    }

    /**
     * Asegura que el directorio temp existe
     */
    async ensureTempDir() {
        const tempDir = path.join(__dirname, '../temp');
        try {
            await fs.access(tempDir);
        } catch {
            await fs.mkdir(tempDir, { recursive: true });
        }
    }

    /**
     * Formatea moneda
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('es-AR', { 
            style: 'currency', 
            currency: 'ARS' 
        }).format(value || 0);
    }

    /**
     * Formatea fecha/hora
     */
    formatDateTime(dateStr, formatStr = 'dd/MM/yyyy HH:mm') {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Fecha Inválida';
            return format(date, formatStr, { locale: es });
        } catch {
            return 'Fecha Inválida';
        }
    }

    /**
     * Genera los scripts de JavaScript para los gráficos
     */
    generateChartsScript(reporteData, tipoReporte) {
        if (tipoReporte === 'mensual' && reporteData.reporteMensual) {
            return this.generateMonthlyChartsScript(reporteData.reporteMensual);
        } else if (tipoReporte === 'diario' && reporteData.reporteDiario) {
            return this.generateDailyChartsScript(reporteData.reporteDiario);
        } else if (tipoReporte === 'comparativo' && reporteData.comparativas) {
            return this.generateComparativeChartsScript(reporteData.comparativas);
        }
        return '';
    }

    /**
     * Genera gráficos para reporte mensual
     */
    generateMonthlyChartsScript(reporte) {
        return `
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                // Configuración global de Chart.js para PDF
                Chart.defaults.font.family = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                Chart.defaults.font.size = 12;
                Chart.defaults.plugins.legend.display = true;
                Chart.defaults.plugins.legend.position = 'bottom';

                // Gráfico de Ocupación Diaria
                const ocupacionCtx = document.getElementById('ocupacionChart');
                if (ocupacionCtx) {
                    const ocupacionData = ${JSON.stringify(reporte.ocupacionDiaria || [])};
                    
                    new Chart(ocupacionCtx, {
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
                                pointRadius: 4
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                title: {
                                    display: false
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
                                    }
                                }
                            }
                        }
                    });
                }

                // Gráfico de Formas de Pago
                const formasPagoCtx = document.getElementById('formasPagoChart');
                if (formasPagoCtx) {
                    const formasPagoData = ${JSON.stringify(reporte.ingresosPorFormaPago || {})};
                    const labels = Object.keys(formasPagoData);
                    const data = Object.values(formasPagoData);
                    const colors = [
                        '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
                    ];

                    new Chart(formasPagoCtx, {
                        type: 'doughnut',
                        data: {
                            labels: labels,
                            datasets: [{
                                data: data,
                                backgroundColor: colors.slice(0, labels.length),
                                borderWidth: 2,
                                borderColor: '#fff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'right',
                                    labels: {
                                        usePointStyle: true,
                                        padding: 15
                                    }
                                }
                            }
                        }
                    });
                }

                // Gráfico de Habitaciones Más Utilizadas
                const habitacionesCtx = document.getElementById('habitacionesChart');
                if (habitacionesCtx) {
                    const habitacionesData = ${JSON.stringify(reporte.habitacionesMasUtilizadas || [])};
                    const top5 = habitacionesData.slice(0, 5);

                    new Chart(habitacionesCtx, {
                        type: 'bar',
                        data: {
                            labels: top5.map(h => 'Hab. ' + h.numero),
                            datasets: [{
                                label: 'Reservas',
                                data: top5.map(h => h.reservas),
                                backgroundColor: '#10b981',
                                borderColor: '#059669',
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1
                                    }
                                }
                            }
                        }
                    });
                }
            });
        </script>
        `;
    }

    /**
     * Genera gráficos para reporte diario
     */
    generateDailyChartsScript(reporte) {
        return `
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                // Gráfico de distribución de pagos por forma de pago (si hay pagos)
                const pagosData = ${JSON.stringify(reporte.ingresos.pagos || [])};
                
                if (pagosData.length > 0) {
                    // Crear contenedor para gráfico de pagos
                    const chartContainer = document.createElement('div');
                    chartContainer.className = 'chart-container';
                    chartContainer.innerHTML = \`
                        <div class="chart-title">💰 Distribución de Pagos del Día</div>
                        <canvas id="pagosDiarioChart" class="chart-canvas"></canvas>
                    \`;
                    
                    // Insertar después de las estadísticas
                    const statsGrid = document.querySelector('.stats-grid');
                    if (statsGrid) {
                        statsGrid.parentNode.insertBefore(chartContainer, statsGrid.nextSibling);
                    }

                    // Procesar datos de pagos por forma de pago
                    const pagosPorForma = {};
                    pagosData.forEach(pago => {
                        const forma = pago.FormaPago?.nombre || 'Sin especificar';
                        pagosPorForma[forma] = (pagosPorForma[forma] || 0) + parseFloat(pago.monto || 0);
                    });

                    const ctx = document.getElementById('pagosDiarioChart');
                    if (ctx) {
                        const labels = Object.keys(pagosPorForma);
                        const data = Object.values(pagosPorForma);
                        const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

                        new Chart(ctx, {
                            type: 'pie',
                            data: {
                                labels: labels,
                                datasets: [{
                                    data: data,
                                    backgroundColor: colors.slice(0, labels.length),
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
                                            usePointStyle: true,
                                            padding: 15
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
            });
        </script>
        `;
    }

    /**
     * Genera gráficos para reporte comparativo
     */
    generateComparativeChartsScript(comparativas) {
        return `
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                // Crear contenedor para gráfico comparativo
                const chartContainer = document.createElement('div');
                chartContainer.className = 'chart-container';
                chartContainer.innerHTML = \`
                    <div class="chart-title">📊 Comparación Visual de Métricas Clave</div>
                    <canvas id="comparativoChart" class="chart-canvas"></canvas>
                \`;
                
                // Insertar después del título
                const sectionTitle = document.querySelector('.section-title');
                if (sectionTitle) {
                    sectionTitle.parentNode.insertBefore(chartContainer, sectionTitle.nextSibling);
                }

                const ctx = document.getElementById('comparativoChart');
                if (ctx) {
                    const comp = ${JSON.stringify(comparativas.comparacion)};
                    
                    new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['Reservas', 'Ocupación (%)', 'Ingresos (Miles)'],
                            datasets: [{
                                label: '${comparativas.mesAnterior}',
                                data: [
                                    comp.reservas.anterior,
                                    comp.ocupacion.anterior,
                                    Math.round(comp.ingresos.anterior / 1000)
                                ],
                                backgroundColor: '#94a3b8',
                                borderColor: '#64748b',
                                borderWidth: 1
                            }, {
                                label: '${comparativas.mesActual}',
                                data: [
                                    comp.reservas.actual,
                                    comp.ocupacion.actual,
                                    Math.round(comp.ingresos.actual / 1000)
                                ],
                                backgroundColor: '#0ea5e9',
                                borderColor: '#0284c7',
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top'
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    });
                }
            });
        </script>
        `;
    }

    /**
     * Limpia archivos temporales antiguos (más de 1 hora)
     */
    async cleanupTempFiles() {
        try {
            const tempDir = path.join(__dirname, '../temp');
            const files = await fs.readdir(tempDir);
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;

            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtime.getTime() > oneHour) {
                    await fs.unlink(filePath);
                    console.log('🗑️ Archivo temporal eliminado:', file);
                }
            }
        } catch (error) {
            console.error('Error limpiando archivos temporales:', error);
        }
    }
}

module.exports = new ExportService();
