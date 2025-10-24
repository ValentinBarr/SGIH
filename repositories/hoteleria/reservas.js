const { PrismaClient, EstadoReserva } = require('../../generated/prisma');
const prisma = new PrismaClient();
const { differenceInDays } = require('date-fns');

const PAGE_SIZE = 10;

class ReservasRepository {

    /**
     * Helper para calcular noches (duplicado para seguridad de backend)
     */
    _calculateNights(checkIn, checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const noches = differenceInDays(end, start);
        return noches > 0 ? noches : 0;
    }

    /**
     * Obtiene todas las reservas con filtros y paginación
     */
    async getAll({ q, page = 1, estado, id_tipoHab, fechaDesde, fechaHasta } = {}) {
        const currentPage = Number(page) || 1;
        const where = {};

        // 1. Filtro de Búsqueda (Texto)
        if (q) {
            where.OR = [
                { codigoReserva: { contains: q, mode: 'insensitive' } },
                { Huesped: { nombre: { contains: q, mode: 'insensitive' } } },
                { Huesped: { apellido: { contains: q, mode: 'insensitive' } } },
                { Huesped: { documento: { contains: q, mode: 'insensitive' } } },
            ];
        }

        // 2. Filtro de Estado (Enum)
        if (estado && Object.values(EstadoReserva).includes(estado)) {
            where.estado = estado;
        }

        // 3. Filtro de Tipo de Habitación
        if (id_tipoHab) {
            where.DetallesReserva = {
                some: { id_tipoHab: Number(id_tipoHab) },
            };
        }

        // 4. Filtro de Rango de Fechas (Check-in)
        if (fechaDesde) {
            where.fechaCheckIn = { ...where.fechaCheckIn, gte: new Date(fechaDesde) };
        }
        if (fechaHasta) {
            where.fechaCheckIn = { ...where.fechaCheckIn, lte: new Date(fechaHasta) };
        }

        // --- Conteo y Paginación ---
        const totalReservas = await prisma.reserva.count({ where });
        const totalPages = Math.ceil(totalReservas / PAGE_SIZE);

        // --- Obtener Datos ---
        const reservas = await prisma.reserva.findMany({
            where,
            include: {
                Huesped: true,
                DetallesReserva: {
                    take: 1, // Solo necesitamos el primer detalle para el nombre
                    include: {
                        TipoHabitacion: true,
                    },
                },
            },
            orderBy: { fechaCheckIn: 'desc' },
            take: PAGE_SIZE,
            skip: (currentPage - 1) * PAGE_SIZE,
        });

        return { reservas, totalPages, currentPage, totalReservas };
    }

    /**
     * Obtiene los datos necesarios para los filtros Y el modal de nueva reserva
     */
    async getFormData() {
        const tiposHabitacion = await prisma.tipoHabitacion.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' },
        });

        const estadosReserva = Object.values(EstadoReserva);

        const huespedes = await prisma.huesped.findMany({
            orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
        });

        return { tiposHabitacion, estadosReserva, huespedes };
    }

    /**
     * Obtiene una reserva por ID (para el modal de edición)
     */
    async getById(id_reserva) {
        return prisma.reserva.findUnique({
            where: { id_reserva: Number(id_reserva) },
            include: { Huesped: true },
        });
    }

    /**
     * Crea una nueva reserva (carga manual) con VALIDACIÓN ATÓMICA.
     */
    async create(data) {
        return prisma.$transaction(async (tx) => {
            const {
                id_huesped,
                fechaCheckIn,
                fechaCheckOut,
                cantAdultos,
                cantNinos,
                total,
                id_tipoHab,
                estado,
                observaciones,
            } = data;

            const checkInDate = new Date(fechaCheckIn);
            const checkOutDate = new Date(fechaCheckOut);
            const noches = this._calculateNights(fechaCheckIn, fechaCheckOut);
            
            // 💡 1. VALIDACIÓN ATÓMICA DE DISPONIBILIDAD
            if (noches > 0) {
                // A. Buscar si existe alguna reserva PENDIENTE/CONFIRMADA/CHECKED_IN que se solape en CUALQUIER noche
                const overlappingReservationsCount = await tx.detalleReserva.count({
                    where: {
                        id_tipoHab: Number(id_tipoHab),
                        fechaNoche: {
                            // Buscar cualquier fecha de noche que caiga en el rango [CheckIn, CheckOut)
                            gte: checkInDate, 
                            lt: checkOutDate, 
                        },
                        // Asegurarse de que la reserva asociada no esté CANCELADA/CHECKED_OUT
                        Reserva: {
                            estado: {
                                in: [EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA, EstadoReserva.CHECKED_IN]
                            }
                        }
                    },
                });
                
                // B. Obtener el inventario físico total de habitaciones de este tipo.
                const totalHabitacionesTipo = await tx.habitacion.count({ 
                    where: { 
                        id_tipoHab: Number(id_tipoHab),
                        activo: true,
                        estado: { not: EstadoReserva.MANTENIMIENTO }
                    } 
                });

                // C. Si la cantidad de reservas superpuestas es igual o mayor al total de habitaciones físicas, hay OVERBOOKING.
                // Asumimos que esta reserva es de 1 habitación.
                if (overlappingReservationsCount >= totalHabitacionesTipo) {
                    throw new Error(`Overbooking: No hay disponibilidad para el tipo de habitación en el rango seleccionado. (Reservas solapadas: ${overlappingReservationsCount} / Total Hab: ${totalHabitacionesTipo})`);
                }
            }


            // 💡 2. CREACIÓN DE LA RESERVA
            const codigoReserva = `RES-${Date.now().toString().slice(-6)}`;

            const reserva = await tx.reserva.create({
                data: {
                    codigoReserva,
                    id_huesped: Number(id_huesped),
                    fechaCheckIn: checkInDate,
                    fechaCheckOut: checkOutDate,
                    cantAdultos: Number(cantAdultos) || 1,
                    cantNinos: Number(cantNinos) || 0,
                    estado: estado || EstadoReserva.PENDIENTE,
                    total: Number(total) || 0,
                    observaciones: observaciones || null,
                },
            });

            // 💡 3. CREAR DETALLE POR CADA NOCHE
            if (id_tipoHab && noches > 0) {
                const detalles = [];
                const precioNocheBase = (Number(total) / noches) || 0; // Distribución simple del precio total

                for (let i = 0; i < noches; i++) {
                    const fechaNoche = new Date(checkInDate);
                    fechaNoche.setDate(fechaNoche.getDate() + i);

                    detalles.push({
                        id_reserva: reserva.id_reserva,
                        id_tipoHab: Number(id_tipoHab),
                        fechaNoche: fechaNoche,
                        precioNoche: precioNocheBase,
                    });
                }
                await tx.detalleReserva.createMany({ data: detalles });
            }

            return reserva;
        }); // Fin de la transacción
    }

    /**
     * Actualiza una reserva (usado por el modal de edición simple)
     */
    async update(id_reserva, data) {
        const { id_reserva: idDelBody, fechaCheckIn, fechaCheckOut, total } = data;
        const dataToUpdate = { updatedAt: new Date() };

        // Solo actualiza los campos permitidos
        if (fechaCheckIn) dataToUpdate.fechaCheckIn = new Date(fechaCheckIn);
        if (fechaCheckOut) dataToUpdate.fechaCheckOut = new Date(fechaCheckOut);
        if (total !== undefined) dataToUpdate.total = Number(total);

        return prisma.reserva.update({
            where: { id_reserva: Number(id_reserva) },
            data: dataToUpdate,
        });
    }

    /**
     * Cambia el estado de una reserva (usado por los botones de acción)
     */
    async updateState(id_reserva, nuevoEstado) {
        return prisma.reserva.update({
            where: { id_reserva: Number(id_reserva) },
            data: {
                estado: nuevoEstado,
                updatedAt: new Date(),
            },
        });
    }
}

module.exports = new ReservasRepository();