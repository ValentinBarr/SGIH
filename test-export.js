// Script de prueba para verificar las exportaciones
const ExportService = require('./services/exportService');

async function testExports() {
    console.log('🧪 Iniciando pruebas de exportación...');
    
    // Datos de prueba
    const testData = {
        fecha: new Date(),
        reporteDiario: {
            fechaFormateada: '31/10/2025',
            estadisticasGenerales: {
                totalHabitaciones: 20,
                habitacionesOcupadas: 15,
                porcentajeOcupacion: 75.0
            },
            movimientos: {
                checkins: { cantidad: 5, lista: [] },
                checkouts: { cantidad: 3, lista: [] },
                llegadasEsperadas: { cantidad: 2, lista: [] },
                salidasEsperadas: { cantidad: 4, lista: [] }
            },
            ingresos: {
                total: 150000,
                cantidad: 8,
                pagos: [
                    {
                        fechaPago: new Date(),
                        monto: 50000,
                        FormaPago: { nombre: 'Efectivo' },
                        Reserva: {
                            codigoReserva: 'RES001',
                            Huesped: { nombre: 'Juan', apellido: 'Pérez' }
                        }
                    }
                ]
            }
        }
    };
    
    try {
        // Probar exportación a Excel
        console.log('📊 Probando exportación a Excel...');
        const excelResult = await ExportService.exportToExcel(testData, 'diario');
        console.log('✅ Excel generado:', excelResult.fileName);
        
        // Probar exportación a PDF
        console.log('📄 Probando exportación a PDF...');
        const pdfResult = await ExportService.exportToPDF(testData, 'diario');
        console.log('✅ PDF generado:', pdfResult.fileName);
        
        console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
    }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
    testExports();
}

module.exports = { testExports };
