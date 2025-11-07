const { PrismaClient, EstadoReserva, EstadoHabitacion } = require('../../generated/prisma');
const prisma = new PrismaClient();
const { startOfDay, endOfDay, subDays, format, differenceInDays } = require('date-fns');

class DashboardRepository {

    // ====================================================================
    // KPIS PRINCIPALES
    // ====================================================================

    /**
     * KPI 1: Ocupación Actual
     */
    async getOcupacionActual() {
        const totalHabitaciones = await prisma.habitacion.count({
            where: { activo: true }
        });

        const habitacionesOcupadas = await prisma.habitacion.count({
            where: { 
                activo: true,
                estado: EstadoHabitacion.OCUPADA 
            }
        });

        const porcentaje = totalHabitaciones > 0 
            ? ((habitacionesOcupadas / totalHabitaciones) * 100).toFixed(1)
            : 0;

        // Tendencia (vs ayer)
        const ayer = subDays(new Date(), 1);
        const ocupadasAyer = await prisma.reserva.count({
            where: {
                estado: EstadoReserva.CHECKED_IN,
                fechaCheckIn: { lte: ayer },
                fechaCheckOut: { gt: ayer }
            }
        });

        const porcentajeAyer = totalHabitaciones > 0
            ? ((ocupadasAyer / totalHabitaciones) * 100).toFixed(1)
            : 0;

        const tendencia = (parseFloat(porcentaje) - parseFloat(porcentajeAyer)).toFixed(1);

        return {
            porcentaje: parseFloat(porcentaje),
            habitacionesOcupadas,
            totalHabitaciones,
            tendencia: parseFloat(tendencia)
        };
    }

    /**
     * KPI 2: ADR (Average Daily Rate)
     */
    async getADR() {
        const desde = subDays(new Date(), 7);
        
        const reservas = await prisma.reserva.findMany({
            where: {
                estado: { in: [EstadoReserva.CHECKED_IN, EstadoReserva.CHECKED_OUT] },
                fechaCheckIn: { gte: desde }
            },
            select: {
                total: true,
                fechaCheckIn: true,
                fechaCheckOut: true
            }
        });

        let totalRevenue = 0;
        let totalNoches = 0;

        reservas.forEach(r => {
            const noches = differenceInDays(new Date(r.fechaCheckOut), new Date(r.fechaCheckIn));
            totalRevenue += parseFloat(r.total);
            totalNoches += noches > 0 ? noches : 1;
        });

        const adr = totalNoches > 0 ? (totalRevenue / totalNoches) : 0;

        return {
            valor: parseFloat(adr.toFixed(2)),
            periodo: '7 días'
        };
    }

    /**
     * KPI 3: RevPAR (Revenue Per Available Room)
     */
    async getRevPAR() {
        const ocupacion = await this.getOcupacionActual();
        const adr = await this.getADR();
        
        const revpar = (adr.valor * (ocupacion.porcentaje / 100));

        return {
            valor: parseFloat(revpar.toFixed(2)),
            meta: 4200,
            progreso: Math.min(((revpar / 4200) * 100), 100).toFixed(1)
        };
    }

    /**
     * KPI 4: Revenue del Día
     */
    async getRevenueHoy() {
        const hoy = new Date();
        const inicioHoy = startOfDay(hoy);
        const finHoy = endOfDay(hoy);

        const reservasHoy = await prisma.reserva.findMany({
            where: {
                OR: [
                    { fechaCheckInReal: { gte: inicioHoy, lte: finHoy } },
                    { 
                        estado: EstadoReserva.CHECKED_IN,
                        fechaCheckIn: { lte: hoy },
                        fechaCheckOut: { gt: hoy }
                    }
                ]
            },
            select: { total: true }
        });

        const revenueHoy = reservasHoy.reduce((sum, r) => sum + parseFloat(r.total), 0);

        return {
            valor: parseFloat(revenueHoy.toFixed(2)),
            proyeccionMensual: parseFloat((revenueHoy * 30).toFixed(2))
        };
    }

    /**
     * KPI 5: Check-ins Pendientes HOY
     */
    async getCheckinsHoy() {
        const hoy = new Date();
        const inicioHoy = startOfDay(hoy);
        const finHoy = endOfDay(hoy);

        const checkinsHoy = await prisma.reserva.findMany({
            where: {
                fechaCheckIn: { gte: inicioHoy, lte: finHoy },
                estado: { in: [EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA, EstadoReserva.CHECKED_IN] }
            }
        });

        const completados = checkinsHoy.filter(r => r.estado === EstadoReserva.CHECKED_IN).length;
        const pendientes = checkinsHoy.filter(r => r.estado !== EstadoReserva.CHECKED_IN).length;

        return {
            total: checkinsHoy.length,
            completados,
            pendientes
        };
    }

    /**
     * KPI 6: Check-outs HOY
     */
    async getCheckoutsHoy() {
        const hoy = new Date();
        const inicioHoy = startOfDay(hoy);
        const finHoy = endOfDay(hoy);

        const checkoutsHoy = await prisma.reserva.findMany({
            where: {
                fechaCheckOut: { gte: inicioHoy, lte: finHoy },
                estado: { in: [EstadoReserva.CHECKED_IN, EstadoReserva.CHECKED_OUT] }
            },
            orderBy: { fechaCheckOut: 'asc' }
        });

        const completados = checkoutsHoy.filter(r => r.estado === EstadoReserva.CHECKED_OUT).length;
        const pendientes = checkoutsHoy.filter(r => r.estado === EstadoReserva.CHECKED_IN).length;

        return {
            total: checkoutsHoy.length,
            completados,
            pendientes,
            proximo: checkoutsHoy.length > 0 ? format(new Date(checkoutsHoy[0].fechaCheckOut), 'HH:mm') : null
        };
    }

    /**
     * Obtiene todos los KPIs en una sola llamada
     * @param {string} fechaDesde - Fecha inicio del rango (opcional)
     * @param {string} fechaHasta - Fecha fin del rango (opcional)
     */
    async getAllKPIs(fechaDesde = null, fechaHasta = null) {
        // Si hay filtros de fecha, calcular KPIs del período
        if (fechaDesde && fechaHasta) {
            const inicioRango = startOfDay(new Date(fechaDesde));
            const finRango = endOfDay(new Date(fechaHasta));
            
            // Ocupación promedio del período
            const totalHabitaciones = await prisma.habitacion.count({ where: { activo: true } });
            const diasEnRango = Math.ceil((finRango - inicioRango) / (1000 * 60 * 60 * 24)) + 1;
            
            const reservasActivas = await prisma.reserva.count({
                where: {
                    estado: { in: [EstadoReserva.CHECKED_IN, EstadoReserva.CHECKED_OUT] },
                    fechaCheckIn: { lte: finRango },
                    fechaCheckOut: { gt: inicioRango }
                }
            });
            
            const ocupacionPromedio = totalHabitaciones > 0 
                ? ((reservasActivas / (totalHabitaciones * diasEnRango)) * 100).toFixed(1)
                : 0;
            
            // ADR del período
            const reservasPeriodo = await prisma.reserva.findMany({
                where: {
                    fechaCheckIn: { gte: inicioRango, lte: finRango },
                    estado: { in: [EstadoReserva.CHECKED_IN, EstadoReserva.CHECKED_OUT] }
                },
                select: { total: true, fechaCheckIn: true, fechaCheckOut: true }
            });
            
            let adrPeriodo = 0;
            if (reservasPeriodo.length > 0) {
                const totalRevenue = reservasPeriodo.reduce((sum, r) => sum + parseFloat(r.total), 0);
                const totalNoches = reservasPeriodo.reduce((sum, r) => {
                    const noches = differenceInDays(new Date(r.fechaCheckOut), new Date(r.fechaCheckIn));
                    return sum + (noches > 0 ? noches : 1);
                }, 0);
                adrPeriodo = totalNoches > 0 ? (totalRevenue / totalNoches) : 0;
            }
            
            // RevPAR del período
            const revparPeriodo = (parseFloat(ocupacionPromedio) / 100) * adrPeriodo;
            
            // Ingresos totales del período
            const pagosPeriodo = await prisma.pagoReserva.findMany({
                where: {
                    fechaPago: { gte: inicioRango, lte: finRango },
                    estado: 'COMPLETADO'
                }
            });
            const ingresosTotales = pagosPeriodo.reduce((sum, p) => sum + parseFloat(p.monto), 0);
            
            return {
                ocupacionActual: {
                    porcentaje: parseFloat(ocupacionPromedio),
                    habitacionesOcupadas: Math.round(reservasActivas / diasEnRango),
                    totalHabitaciones,
                    tendencia: null // No hay tendencia en período personalizado
                },
                adr: {
                    valor: parseFloat(adrPeriodo.toFixed(2)),
                    periodo: `${diasEnRango} días`
                },
                revpar: {
                    valor: parseFloat(revparPeriodo.toFixed(2)),
                    progreso: Math.min(parseFloat(ocupacionPromedio), 100)
                },
                revenueHoy: {
                    valor: parseFloat(ingresosTotales.toFixed(2)),
                    proyeccionMensual: 0 // No aplica en período personalizado
                },
                checkinsHoy: reservasActivas,
                checkoutsHoy: await prisma.reserva.count({
                    where: {
                        fechaCheckOut: { gte: inicioRango, lte: finRango },
                        estado: EstadoReserva.CHECKED_OUT
                    }
                })
            };
        }
        
        // Sin filtros, usar KPIs actuales
        const [ocupacion, adr, revpar, revenue, checkins, checkouts] = await Promise.all([
            this.getOcupacionActual(),
            this.getADR(),
            this.getRevPAR(),
            this.getRevenueHoy(),
            this.getCheckinsHoy(),
            this.getCheckoutsHoy()
        ]);

        return {
            ocupacionActual: ocupacion,
            adr,
            revpar,
            revenueHoy: revenue,
            checkinsHoy: checkins,
            checkoutsHoy: checkouts
        };
    }

    // ====================================================================
    // GRÁFICOS
    // ====================================================================

    /**
     * GRÁFICO 1: Ocupación y ADR - Histórico
     * @param {number} dias - Número de días hacia atrás (si no se usan fechas)
     * @param {string} fechaDesde - Fecha inicio del rango
     * @param {string} fechaHasta - Fecha fin del rango
     */
    async getOcupacionADRHistorico(dias = 30, fechaDesde = null, fechaHasta = null) {
        const totalHabitaciones = await prisma.habitacion.count({ where: { activo: true } });
        const data = [];

        // Determinar el rango de fechas
        let fechaInicio, fechaFin;
        if (fechaDesde && fechaHasta) {
            fechaInicio = startOfDay(new Date(fechaDesde));
            fechaFin = endOfDay(new Date(fechaHasta));
        } else {
            fechaInicio = subDays(new Date(), dias - 1);
            fechaFin = new Date();
        }

        // Iterar por cada día en el rango
        for (let fecha = new Date(fechaInicio); fecha <= fechaFin; fecha.setDate(fecha.getDate() + 1)) {
            const inicioDia = startOfDay(new Date(fecha));
            const finDia = endOfDay(new Date(fecha));

            // Habitaciones ocupadas ese día
            const ocupadas = await prisma.reserva.count({
                where: {
                    estado: { in: [EstadoReserva.CHECKED_IN, EstadoReserva.CHECKED_OUT] },
                    fechaCheckIn: { lte: finDia },
                    fechaCheckOut: { gt: inicioDia }
                }
            });

            const ocupacionPorcentaje = totalHabitaciones > 0 
                ? ((ocupadas / totalHabitaciones) * 100).toFixed(1) 
                : 0;

            // ADR de ese día
            const reservas = await prisma.reserva.findMany({
                where: {
                    fechaCheckIn: { gte: inicioDia, lte: finDia }
                },
                select: { total: true, fechaCheckIn: true, fechaCheckOut: true }
            });

            let adr = 0;
            if (reservas.length > 0) {
                const totalRevenue = reservas.reduce((sum, r) => sum + parseFloat(r.total), 0);
                const totalNoches = reservas.reduce((sum, r) => {
                    const noches = differenceInDays(new Date(r.fechaCheckOut), new Date(r.fechaCheckIn));
                    return sum + (noches > 0 ? noches : 1);
                }, 0);
                adr = totalNoches > 0 ? (totalRevenue / totalNoches) : 0;
            }

            const revpar = (parseFloat(ocupacionPorcentaje) / 100) * adr;

            data.push({
                fecha: format(fecha, 'yyyy-MM-dd'),
                ocupacionPorcentaje: parseFloat(ocupacionPorcentaje),
                adr: parseFloat(adr.toFixed(2)),
                revpar: parseFloat(revpar.toFixed(2))
            });
        }

        return data;
    }

    /**
     * GRÁFICO 2: Revenue por Tipo de Habitación
     * @param {string} fechaDesde - Fecha inicio del rango (opcional)
     * @param {string} fechaHasta - Fecha fin del rango (opcional)
     */
    async getRevenuePorTipo(fechaDesde = null, fechaHasta = null) {
        // Determinar el rango de fechas
        let inicioMes, finMes;
        if (fechaDesde && fechaHasta) {
            inicioMes = startOfDay(new Date(fechaDesde));
            finMes = endOfDay(new Date(fechaHasta));
        } else {
            inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            finMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
        }

        const reservas = await prisma.reserva.findMany({
            where: {
                fechaCheckIn: { gte: inicioMes, lte: finMes },
                estado: { in: [EstadoReserva.CHECKED_IN, EstadoReserva.CHECKED_OUT] }
            },
            include: {
                Habitacion: {
                    include: { TipoHabitacion: true }
                }
            }
        });

        const revenueMap = new Map();

        reservas.forEach(r => {
            const tipo = r.Habitacion.TipoHabitacion.nombre;
            const total = parseFloat(r.total);
            const noches = differenceInDays(new Date(r.fechaCheckOut), new Date(r.fechaCheckIn)) || 1;

            if (!revenueMap.has(tipo)) {
                revenueMap.set(tipo, { revenue: 0, noches: 0, cantidad: 0 });
            }

            const data = revenueMap.get(tipo);
            data.revenue += total;
            data.noches += noches;
            data.cantidad += 1;
            revenueMap.set(tipo, data);
        });

        const totalRevenue = Array.from(revenueMap.values()).reduce((sum, d) => sum + d.revenue, 0);
        const result = [];

        revenueMap.forEach((data, tipo) => {
            result.push({
                tipoHabitacion: tipo,
                revenue: parseFloat(data.revenue.toFixed(2)),
                porcentaje: ((data.revenue / totalRevenue) * 100).toFixed(1),
                noches: data.noches,
                precioPromedio: parseFloat((data.revenue / data.noches).toFixed(2))
            });
        });

        return result.sort((a, b) => b.revenue - a.revenue);
    }

    /**
     * GRÁFICO 3: Estados de Habitaciones - Vista Actual
     */
    async getEstadosHabitaciones() {
        const habitaciones = await prisma.habitacion.findMany({
            where: { activo: true },
            select: { id_hab: true, numero: true, estado: true }
        });

        const estados = {
            disponible: { cantidad: 0, porcentaje: 0, habitaciones: [] },
            ocupada: { cantidad: 0, porcentaje: 0, habitaciones: [] },
            limpieza: { cantidad: 0, porcentaje: 0, habitaciones: [] },
            mantenimiento: { cantidad: 0, porcentaje: 0, habitaciones: [] }
        };

        habitaciones.forEach(h => {
            const estadoKey = h.estado.toLowerCase();
            if (estados[estadoKey]) {
                estados[estadoKey].cantidad++;
                estados[estadoKey].habitaciones.push(h.numero);
            }
        });

        const total = habitaciones.length;
        Object.keys(estados).forEach(key => {
            estados[key].porcentaje = total > 0 
                ? ((estados[key].cantidad / total) * 100).toFixed(1)
                : 0;
        });

        return estados;
    }

    /**
     * GRÁFICO 4: Curva de Ocupación - Próximos 30 días
     */
    async getForecastOcupacion(dias = 30) {
        const totalHabitaciones = await prisma.habitacion.count({ where: { activo: true } });
        const data = [];

        for (let i = 0; i < dias; i++) {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() + i);
            const inicioDia = startOfDay(fecha);
            const finDia = endOfDay(fecha);

            const confirmadas = await prisma.reserva.count({
                where: {
                    estado: { in: [EstadoReserva.CONFIRMADA, EstadoReserva.CHECKED_IN] },
                    fechaCheckIn: { lte: finDia },
                    fechaCheckOut: { gt: inicioDia }
                }
            });

            const ocupacionProyectada = totalHabitaciones > 0
                ? ((confirmadas / totalHabitaciones) * 100).toFixed(1)
                : 0;

            const disponible = totalHabitaciones - confirmadas;

            data.push({
                fecha: format(fecha, 'yyyy-MM-dd'),
                ocupacionProyectada: parseFloat(ocupacionProyectada),
                confirmada: confirmadas,
                disponible
            });
        }

        return data;
    }

    /**
     * GRÁFICO 5: Revenue Mensual Comparativo - Último Año
     */
    async getRevenueComparativo() {
        const data = [];
        const añoActual = new Date().getFullYear();
        const añoAnterior = añoActual - 1;

        for (let mes = 0; mes < 12; mes++) {
            // Año actual
            const inicioMesActual = new Date(añoActual, mes, 1);
            const finMesActual = new Date(añoActual, mes + 1, 0);

            const reservasActual = await prisma.reserva.findMany({
                where: {
                    fechaCheckIn: { gte: inicioMesActual, lte: finMesActual },
                    estado: { in: [EstadoReserva.CHECKED_IN, EstadoReserva.CHECKED_OUT] }
                },
                select: { total: true }
            });

            const revenueActual = reservasActual.reduce((sum, r) => sum + parseFloat(r.total), 0);

            // Año anterior
            const inicioMesAnterior = new Date(añoAnterior, mes, 1);
            const finMesAnterior = new Date(añoAnterior, mes + 1, 0);

            const reservasAnterior = await prisma.reserva.findMany({
                where: {
                    fechaCheckIn: { gte: inicioMesAnterior, lte: finMesAnterior },
                    estado: { in: [EstadoReserva.CHECKED_IN, EstadoReserva.CHECKED_OUT] }
                },
                select: { total: true }
            });

            const revenueAnterior = reservasAnterior.reduce((sum, r) => sum + parseFloat(r.total), 0);

            const crecimiento = revenueAnterior > 0
                ? (((revenueActual - revenueAnterior) / revenueAnterior) * 100).toFixed(1)
                : 0;

            data.push({
                mes: format(new Date(añoActual, mes), 'MMM'),
                revenueActual: parseFloat(revenueActual.toFixed(2)),
                revenueAnterior: parseFloat(revenueAnterior.toFixed(2)),
                crecimiento: parseFloat(crecimiento)
            });
        }

        return data;
    }

    // ====================================================================
    // TABLAS OPERATIVAS
    // ====================================================================

    /**
     * TABLA 1: Llegadas de Hoy (Check-ins Pendientes)
     */
    async getCheckinsDetalle() {
        const hoy = new Date();
        const inicioHoy = startOfDay(hoy);
        const finHoy = endOfDay(hoy);

        const checkins = await prisma.reserva.findMany({
            where: {
                fechaCheckIn: { gte: inicioHoy, lte: finHoy },
                estado: { in: [EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA, EstadoReserva.CHECKED_IN] }
            },
            include: {
                Huesped: true,
                Habitacion: {
                    include: { TipoHabitacion: true }
                }
            },
            orderBy: { fechaCheckIn: 'asc' }
        });

        return checkins.map(r => ({
            id_reserva: r.id_reserva,
            codigoReserva: r.codigoReserva,
            hora: format(new Date(r.fechaCheckIn), 'HH:mm'),
            huesped: `${r.Huesped.nombre} ${r.Huesped.apellido}`,
            habitacion: r.Habitacion.numero,
            tipoHabitacion: r.Habitacion.TipoHabitacion.nombre,
            noches: differenceInDays(new Date(r.fechaCheckOut), new Date(r.fechaCheckIn)),
            estado: r.estado
        }));
    }

    /**
     * TABLA 2: Salidas de Hoy (Check-outs Pendientes)
     */
    async getCheckoutsDetalle() {
        const hoy = new Date();
        const inicioHoy = startOfDay(hoy);
        const finHoy = endOfDay(hoy);

        const checkouts = await prisma.reserva.findMany({
            where: {
                fechaCheckOut: { gte: inicioHoy, lte: finHoy },
                estado: { in: [EstadoReserva.CHECKED_IN, EstadoReserva.CHECKED_OUT] }
            },
            include: {
                Huesped: true,
                Habitacion: true
            },
            orderBy: { fechaCheckOut: 'asc' }
        });

        return checkouts.map(r => ({
            id_reserva: r.id_reserva,
            habitacion: r.Habitacion.numero,
            huesped: `${r.Huesped.nombre} ${r.Huesped.apellido}`,
            horaCheckout: format(new Date(r.fechaCheckOut), 'HH:mm'),
            diasEstadia: differenceInDays(new Date(r.fechaCheckOut), new Date(r.fechaCheckIn)),
            total: parseFloat(r.total),
            estado: r.estado
        }));
    }

    /**
     * TABLA 3: Habitaciones Críticas (Alertas)
     */
    async getHabitacionesCriticas() {
        const habitaciones = await prisma.habitacion.findMany({
            where: {
                activo: true,
                OR: [
                    { estado: EstadoHabitacion.MANTENIMIENTO },
                    { estado: EstadoHabitacion.LIMPIEZA }
                ]
            },
            include: {
                TipoHabitacion: true
            }
        });

        return habitaciones.map(h => ({
            habitacion: h.numero,
            alerta: h.estado === 'MANTENIMIENTO' ? 'Mantenimiento urgente' : 'Limpieza pendiente',
            prioridad: h.estado === 'MANTENIMIENTO' ? 'Alta' : 'Media',
            tipo: h.TipoHabitacion.nombre,
            estado: h.estado
        }));
    }

    /**
     * GRÁFICO 6: Rentabilidad - Ingresos vs Egresos
     * Compara ingresos de reservas con egresos de órdenes de pago
     */
    async getRentabilidad(dias = 30, fechaDesde = null, fechaHasta = null) {
        const data = [];
        
        // Determinar rango de fechas
        let fechaInicio, fechaFin;
        if (fechaDesde && fechaHasta) {
            fechaInicio = new Date(fechaDesde);
            fechaFin = new Date(fechaHasta);
        } else {
            fechaFin = new Date();
            fechaInicio = subDays(fechaFin, dias - 1);
        }

        // Iterar por cada día en el rango
        for (let fecha = new Date(fechaInicio); fecha <= fechaFin; fecha.setDate(fecha.getDate() + 1)) {
            const inicioDia = startOfDay(new Date(fecha));
            const finDia = endOfDay(new Date(fecha));

            // INGRESOS: Pagos de reservas del día
            const pagosDelDia = await prisma.pagoReserva.findMany({
                where: {
                    fechaPago: {
                        gte: inicioDia,
                        lte: finDia
                    },
                    estado: 'COMPLETADO'
                }
            });
            const ingresos = pagosDelDia.reduce((sum, p) => sum + parseFloat(p.monto), 0);

            // EGRESOS: Órdenes de pago (Pagos a proveedores)
            const egresosDelDia = await prisma.pago.findMany({
                where: {
                    fecha_pago: {
                        gte: inicioDia,
                        lte: finDia
                    }
                }
            });
            const egresos = egresosDelDia.reduce((sum, p) => sum + parseFloat(p.total_pago), 0);

            // Calcular utilidad
            const utilidad = ingresos - egresos;

            data.push({
                fecha: format(new Date(fecha), 'yyyy-MM-dd'),
                ingresos: parseFloat(ingresos.toFixed(2)),
                egresos: parseFloat(egresos.toFixed(2)),
                utilidad: parseFloat(utilidad.toFixed(2))
            });
        }

        return data;
    }
}

const dashboardRepo = new DashboardRepository();

module.exports = {
    getAllKPIs: dashboardRepo.getAllKPIs.bind(dashboardRepo),
    getOcupacionADRHistorico: dashboardRepo.getOcupacionADRHistorico.bind(dashboardRepo),
    getRevenuePorTipo: dashboardRepo.getRevenuePorTipo.bind(dashboardRepo),
    getEstadosHabitaciones: dashboardRepo.getEstadosHabitaciones.bind(dashboardRepo),
    getForecastOcupacion: dashboardRepo.getForecastOcupacion.bind(dashboardRepo),
    getRevenueComparativo: dashboardRepo.getRevenueComparativo.bind(dashboardRepo),
    getCheckinsDetalle: dashboardRepo.getCheckinsDetalle.bind(dashboardRepo),
    getCheckoutsDetalle: dashboardRepo.getCheckoutsDetalle.bind(dashboardRepo),
    getHabitacionesCriticas: dashboardRepo.getHabitacionesCriticas.bind(dashboardRepo),
    getRentabilidad: dashboardRepo.getRentabilidad.bind(dashboardRepo)
};
