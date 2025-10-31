const { PrismaClient, EstadoReserva, EstadoHabitacion } = require('../../generated/prisma');
const { startOfDay, endOfDay, startOfMonth, endOfMonth, format, subDays, subMonths } = require('date-fns');
const { es } = require('date-fns/locale');

const prisma = new PrismaClient();

class ReportesRepository {

    /**
     * Obtiene el reporte diario de ocupación
     */
    async getReporteDiario(fecha = new Date()) {
        const inicioDelDia = startOfDay(fecha);
        const finDelDia = endOfDay(fecha);

        console.log('📊 Generando reporte diario para:', format(fecha, 'dd/MM/yyyy', { locale: es }));

        // 1. Estadísticas generales de habitaciones
        const totalHabitaciones = await prisma.habitacion.count({
            where: { activo: true }
        });

        const habitacionesPorEstado = await prisma.habitacion.groupBy({
            by: ['estado'],
            where: { activo: true },
            _count: { estado: true }
        });

        // 2. Check-ins del día
        const checkins = await prisma.reserva.findMany({
            where: {
                fechaCheckInReal: {
                    gte: inicioDelDia,
                    lte: finDelDia
                }
            },
            include: {
                Huesped: true,
                Habitacion: true
            },
            orderBy: { fechaCheckInReal: 'desc' }
        });

        // 3. Check-outs del día
        const checkouts = await prisma.reserva.findMany({
            where: {
                fechaCheckOutReal: {
                    gte: inicioDelDia,
                    lte: finDelDia
                }
            },
            include: {
                Huesped: true,
                Habitacion: true
            },
            orderBy: { fechaCheckOutReal: 'desc' }
        });

        // 4. Reservas confirmadas para hoy (llegadas esperadas)
        const llegadasEsperadas = await prisma.reserva.findMany({
            where: {
                fechaCheckIn: {
                    gte: inicioDelDia,
                    lte: finDelDia
                },
                estado: EstadoReserva.CONFIRMADA
            },
            include: {
                Huesped: true,
                Habitacion: true
            }
        });

        // 5. Salidas esperadas para hoy
        const salidasEsperadas = await prisma.reserva.findMany({
            where: {
                fechaCheckOut: {
                    gte: inicioDelDia,
                    lte: finDelDia
                },
                estado: EstadoReserva.CHECKED_IN
            },
            include: {
                Huesped: true,
                Habitacion: true
            }
        });

        // 6. Ingresos del día (pagos)
        const pagosDelDia = await prisma.pagoReserva.findMany({
            where: {
                fechaPago: {
                    gte: inicioDelDia,
                    lte: finDelDia
                }
            },
            include: {
                FormaPago: true,
                Reserva: {
                    include: {
                        Huesped: true,
                        Habitacion: true
                    }
                }
            }
        });

        const totalIngresos = pagosDelDia.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);

        // 7. Calcular porcentaje de ocupación
        const habitacionesOcupadas = habitacionesPorEstado.find(h => h.estado === EstadoHabitacion.OCUPADA)?._count?.estado || 0;
        const porcentajeOcupacion = totalHabitaciones > 0 ? (habitacionesOcupadas / totalHabitaciones * 100).toFixed(1) : 0;

        return {
            fecha: fecha,
            fechaFormateada: format(fecha, 'dd/MM/yyyy', { locale: es }),
            estadisticasGenerales: {
                totalHabitaciones,
                habitacionesOcupadas,
                porcentajeOcupacion,
                habitacionesPorEstado: habitacionesPorEstado.reduce((acc, item) => {
                    acc[item.estado] = item._count.estado;
                    return acc;
                }, {})
            },
            movimientos: {
                checkins: {
                    cantidad: checkins.length,
                    lista: checkins
                },
                checkouts: {
                    cantidad: checkouts.length,
                    lista: checkouts
                },
                llegadasEsperadas: {
                    cantidad: llegadasEsperadas.length,
                    lista: llegadasEsperadas
                },
                salidasEsperadas: {
                    cantidad: salidasEsperadas.length,
                    lista: salidasEsperadas
                }
            },
            ingresos: {
                total: totalIngresos,
                pagos: pagosDelDia,
                cantidad: pagosDelDia.length
            }
        };
    }

    /**
     * Obtiene el reporte mensual
     */
    async getReporteMensual(fecha = new Date()) {
        const inicioDelMes = startOfMonth(fecha);
        const finDelMes = endOfMonth(fecha);

        console.log('📊 Generando reporte mensual para:', format(fecha, 'MMMM yyyy', { locale: es }));

        // 1. Total de reservas del mes
        const reservasDelMes = await prisma.reserva.findMany({
            where: {
                createdAt: {
                    gte: inicioDelMes,
                    lte: finDelMes
                }
            },
            include: {
                Huesped: true,
                Habitacion: { include: { TipoHabitacion: true } }
            }
        });

        // 2. Reservas por estado
        const reservasPorEstado = await prisma.reserva.groupBy({
            by: ['estado'],
            where: {
                createdAt: {
                    gte: inicioDelMes,
                    lte: finDelMes
                }
            },
            _count: { estado: true }
        });

        // 3. Check-ins del mes
        const checkinsDelMes = await prisma.reserva.count({
            where: {
                fechaCheckInReal: {
                    gte: inicioDelMes,
                    lte: finDelMes
                }
            }
        });

        // 4. Check-outs del mes
        const checkoutsDelMes = await prisma.reserva.count({
            where: {
                fechaCheckOutReal: {
                    gte: inicioDelMes,
                    lte: finDelMes
                }
            }
        });

        // 5. Ingresos del mes
        const pagosDelMes = await prisma.pagoReserva.findMany({
            where: {
                fechaPago: {
                    gte: inicioDelMes,
                    lte: finDelMes
                }
            },
            include: {
                FormaPago: true
            }
        });

        const totalIngresosMes = pagosDelMes.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);

        // 6. Ingresos por forma de pago
        const ingresosPorFormaPago = {};
        pagosDelMes.forEach(pago => {
            const formaPago = pago.FormaPago?.nombre || 'Sin especificar';
            ingresosPorFormaPago[formaPago] = (ingresosPorFormaPago[formaPago] || 0) + parseFloat(pago.monto);
        });

        // 7. Habitaciones más utilizadas
        const habitacionesMasUtilizadas = await prisma.reserva.groupBy({
            by: ['id_hab'],
            where: {
                fechaCheckInReal: {
                    gte: inicioDelMes,
                    lte: finDelMes
                }
            },
            _count: { id_hab: true },
            orderBy: { _count: { id_hab: 'desc' } },
            take: 5
        });

        // Obtener detalles de las habitaciones más utilizadas
        const habitacionesDetalles = await Promise.all(
            habitacionesMasUtilizadas.map(async (item) => {
                const habitacion = await prisma.habitacion.findUnique({
                    where: { id_hab: item.id_hab },
                    include: { TipoHabitacion: true }
                });
                return {
                    ...habitacion,
                    reservas: item._count.id_hab
                };
            })
        );

        // 8. Promedio de ocupación diaria del mes
        const diasDelMes = [];
        const totalHabitaciones = await prisma.habitacion.count({ where: { activo: true } });
        
        for (let dia = new Date(inicioDelMes); dia <= finDelMes; dia.setDate(dia.getDate() + 1)) {
            const inicioDelDia = startOfDay(new Date(dia));
            const finDelDia = endOfDay(new Date(dia));
            
            const ocupadasDelDia = await prisma.reserva.count({
                where: {
                    estado: EstadoReserva.CHECKED_IN,
                    fechaCheckInReal: { lte: finDelDia },
                    OR: [
                        { fechaCheckOutReal: null },
                        { fechaCheckOutReal: { gte: inicioDelDia } }
                    ]
                }
            });

            diasDelMes.push({
                fecha: format(new Date(dia), 'dd/MM', { locale: es }),
                ocupadas: ocupadasDelDia,
                porcentaje: totalHabitaciones > 0 ? (ocupadasDelDia / totalHabitaciones * 100).toFixed(1) : 0
            });
        }

        const promedioOcupacion = diasDelMes.length > 0 
            ? (diasDelMes.reduce((sum, dia) => sum + parseFloat(dia.porcentaje), 0) / diasDelMes.length).toFixed(1)
            : 0;

        return {
            fecha: fecha,
            fechaFormateada: format(fecha, 'MMMM yyyy', { locale: es }),
            resumen: {
                totalReservas: reservasDelMes.length,
                checkinsRealizados: checkinsDelMes,
                checkoutsRealizados: checkoutsDelMes,
                totalIngresos: totalIngresosMes,
                promedioOcupacion: parseFloat(promedioOcupacion)
            },
            reservasPorEstado: reservasPorEstado.reduce((acc, item) => {
                acc[item.estado] = item._count.estado;
                return acc;
            }, {}),
            ingresosPorFormaPago,
            habitacionesMasUtilizadas: habitacionesDetalles,
            ocupacionDiaria: diasDelMes,
            detalles: {
                reservas: reservasDelMes,
                pagos: pagosDelMes
            }
        };
    }

    /**
     * Obtiene estadísticas comparativas (mes actual vs mes anterior)
     */
    async getEstadisticasComparativas(fecha = new Date()) {
        const mesActual = await this.getReporteMensual(fecha);
        const mesAnterior = await this.getReporteMensual(subMonths(fecha, 1));

        const calcularCambio = (actual, anterior) => {
            if (anterior === 0) return actual > 0 ? 100 : 0;
            return ((actual - anterior) / anterior * 100).toFixed(1);
        };

        return {
            mesActual: mesActual.fechaFormateada,
            mesAnterior: mesAnterior.fechaFormateada,
            comparacion: {
                reservas: {
                    actual: mesActual.resumen.totalReservas,
                    anterior: mesAnterior.resumen.totalReservas,
                    cambio: calcularCambio(mesActual.resumen.totalReservas, mesAnterior.resumen.totalReservas)
                },
                ingresos: {
                    actual: mesActual.resumen.totalIngresos,
                    anterior: mesAnterior.resumen.totalIngresos,
                    cambio: calcularCambio(mesActual.resumen.totalIngresos, mesAnterior.resumen.totalIngresos)
                },
                ocupacion: {
                    actual: mesActual.resumen.promedioOcupacion,
                    anterior: mesAnterior.resumen.promedioOcupacion,
                    cambio: calcularCambio(mesActual.resumen.promedioOcupacion, mesAnterior.resumen.promedioOcupacion)
                }
            }
        };
    }

    /**
     * Obtiene el top de huéspedes más frecuentes
     */
    async getHuespedesFrecuentes(limite = 10) {
        const huespedesFrecuentes = await prisma.reserva.groupBy({
            by: ['id_huesped'],
            _count: { id_huesped: true },
            orderBy: { _count: { id_huesped: 'desc' } },
            take: limite
        });

        const huespedes = await Promise.all(
            huespedesFrecuentes.map(async (item) => {
                const huesped = await prisma.huesped.findUnique({
                    where: { id_huesped: item.id_huesped }
                });
                return {
                    ...huesped,
                    totalReservas: item._count.id_huesped
                };
            })
        );

        return huespedes;
    }
}

module.exports = new ReportesRepository();
