const { PrismaClient, EstadoReserva } = require('../../generated/prisma');
const prisma = new PrismaClient();
const { differenceInDays, format } = require('date-fns'); // Se agrega format para código de reserva

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

    // ====================================================================
    // MÉTODOS DE LECTURA Y FILTROS
    // ====================================================================

    /**
     * Obtiene todas las reservas con filtros y paginación (Ajustado al nuevo modelo Habitacion)
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

        // 3. Filtro de Tipo de Habitación (Ajustado a la relación Reserva -> Habitacion -> TipoHabitacion)
        if (id_tipoHab) {
            where.Habitacion = {
                id_tipoHab: Number(id_tipoHab),
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
                Habitacion: { 
                    include: {
                        TipoHabitacion: true, 
                    }
                },
            },
            orderBy: { fechaCheckIn: 'desc' },
            take: PAGE_SIZE,
            skip: (currentPage - 1) * PAGE_SIZE,
        });

        return { reservas, totalPages, currentPage, totalReservas };
    }

    /**
     * Obtiene los datos necesarios para los filtros y la nueva reserva
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
            include: { Huesped: true, Habitacion: true },
        });
    }
    
    // ====================================================================
    // MÉTODOS ESTÁTICOS DE DISPONIBILIDAD Y HUÉSPED (Usados por API)
    // ====================================================================

    /**
     * Busca habitaciones disponibles para el rango de fechas y capacidad dados.
     */
    static async findAvailableRooms(checkIn, checkOut, adultos, ninos) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const capacidadTotal = parseInt(adultos) + parseInt(ninos);
        
        if (checkOutDate <= checkInDate || capacidadTotal <= 0 || isNaN(capacidadTotal)) {
            return [];
        }

        // --- 1. IDs de Habitaciones Ocupadas (Lógica de Solapamiento) ---
        const habitacionesOcupadas = await prisma.reserva.findMany({
            where: {
                estado: { notIn : [EstadoReserva.CHECKED_OUT, EstadoReserva.CANCELADA] }, 
                fechaCheckIn: { lt: checkOutDate }, 
                fechaCheckOut: { gt: checkInDate }, 
            },
            select: { id_hab: true },
        });

        const idsOcupadas = habitacionesOcupadas.map(r => r.id_hab);

        // --- 2. Habitaciones Disponibles con Capacidad ---
        return prisma.habitacion.findMany({
            where: {
                id_hab: { notIn: idsOcupadas }, 
                estado: { in: ['DISPONIBLE', 'LIMPIEZA'] }, 
                activo: true,
                TipoHabitacion: {
                    capacidad: { gte: capacidadTotal }
                }
            },
            include: { 
                TipoHabitacion: true 
            },
            orderBy: [{ id_tipoHab: 'asc' }, { numero: 'asc' }]
        });
    }

    /**
     * Crea un nuevo Huésped (para el modal).
     */
    static async createHuesped(data) {
        const { nombre, apellido, documento, telefono, email } = data;
        
        return prisma.huesped.create({
            data: {
                nombre,
                apellido,
                documento: documento || null,
                telefono: telefono || null,
                email: email || null,
            }
        });
    }


    // ====================================================================
    // MÉTODOS DE ESCRITURA (Transaccionales)
    // ====================================================================

    /**
     * Crea una nueva reserva (simplificada con id_hab).
     */
    async create(data) {
        const {
            id_huesped, id_hab, fechaCheckIn, fechaCheckOut, 
            cantAdultos, cantNinos, estado, total, observaciones 
        } = data;

        const checkInDate = new Date(fechaCheckIn);
        const checkOutDate = new Date(fechaCheckOut);
        
        // 💡 1. RE-VERIFICACIÓN CRÍTICA DE DISPONIBILIDAD (CRÍTICO)
        // Se llama al método estático dentro de la instancia:
        const habitacionesDisponibles = await ReservasRepository.findAvailableRooms(
            fechaCheckIn, 
            fechaCheckOut, 
            cantAdultos, 
            cantNinos
        );

        if (!habitacionesDisponibles.some(h => h.id_hab === id_hab)) {
             throw new Error("La habitación seleccionada ya no está disponible para el rango de fechas. Vuelva a verificar.");
        }

        // 💡 2. Transacción de Creación y Actualización de Habitación
        return prisma.$transaction(async (tx) => {
            
            const codigoReserva = 'R' + format(new Date(), 'yyyyMMddHHmmss');

            const newReserva = await tx.reserva.create({
                data: {
                    codigoReserva,
                    id_huesped: id_huesped,
                    id_hab: id_hab, 
                    fechaCheckIn: checkInDate,
                    fechaCheckOut: checkOutDate,
                    cantAdultos: cantAdultos,
                    cantNinos: cantNinos,
                    estado: estado,
                    total: total,
                    observaciones: observaciones || null,
                }
            });

            // Si el estado inicial es CHECKED_IN, actualiza el estado de la habitación
            if (estado === EstadoReserva.CHECKED_IN) {
                await tx.habitacion.update({
                    where: { id_hab: id_hab },
                    data: { estado: 'OCUPADA' } 
                });
            }

            return newReserva;
        }); 
    }

    /**
     * Actualiza una reserva (usado por el modal de edición simple)
     */
    async update(id_reserva, data) {
        const { fechaCheckIn, fechaCheckOut, total, observaciones } = data;
        const dataToUpdate = { updatedAt: new Date() };

        if (fechaCheckIn) dataToUpdate.fechaCheckIn = new Date(fechaCheckIn);
        if (fechaCheckOut) dataToUpdate.fechaCheckOut = new Date(fechaCheckOut);
        if (total !== undefined) dataToUpdate.total = Number(total);
        if (observaciones !== undefined) dataToUpdate.observaciones = observaciones;

        return prisma.reserva.update({
            where: { id_reserva: Number(id_reserva) },
            data: dataToUpdate,
        });
    }

    /**
     * Cambia el estado de una reserva (usado por los botones de acción)
     */
    async updateState(id_reserva, nuevoEstado) {
        return prisma.$transaction(async (tx) => {
            const reserva = await tx.reserva.findUnique({
                where: { id_reserva: Number(id_reserva) },
                select: { id_hab: true, estado: true, fechaCheckInReal: true, fechaCheckOutReal: true },
            });

            if (!reserva) {
                throw new Error("Reserva no encontrada.");
            }

            // Actualizar la reserva
            const updatedReserva = await tx.reserva.update({
                where: { id_reserva: Number(id_reserva) },
                data: {
                    estado: nuevoEstado,
                    updatedAt: new Date(),
                    fechaCheckInReal: (nuevoEstado === EstadoReserva.CHECKED_IN && !reserva.fechaCheckInReal) ? new Date() : undefined,
                    fechaCheckOutReal: (nuevoEstado === EstadoReserva.CHECKED_OUT && !reserva.fechaCheckOutReal) ? new Date() : undefined,
                },
            });

            // Lógica de actualización de estado de la habitación (Transaccional)
            let newHabitacionState;
            if (nuevoEstado === EstadoReserva.CHECKED_IN) {
                newHabitacionState = 'OCUPADA';
            } else if (nuevoEstado === EstadoReserva.CHECKED_OUT || nuevoEstado === EstadoReserva.CANCELADA) {
                newHabitacionState = 'LIMPIEZA'; 
            }
            
            if (newHabitacionState) {
                await tx.habitacion.update({
                    where: { id_hab: reserva.id_hab },
                    data: { estado: newHabitacionState },
                });
            }

            return updatedReserva;
        });
    }
}

// ====================================================================
// EXPORTACIÓN (SINGLETON) - Soluciona el TypeError
// ====================================================================
const repoInstance = new ReservasRepository();

module.exports = {
    // Métodos de instancia (que usan 'this' y por eso necesitan bind)
    getAll: repoInstance.getAll.bind(repoInstance),
    getFormData: repoInstance.getFormData.bind(repoInstance),
    getById: repoInstance.getById.bind(repoInstance),
    create: repoInstance.create.bind(repoInstance),
    update: repoInstance.update.bind(repoInstance),
    updateState: repoInstance.updateState.bind(repoInstance),

    // Métodos estáticos (que no usan 'this' y se exportan directamente)
    findAvailableRooms: ReservasRepository.findAvailableRooms,
    createHuesped: ReservasRepository.createHuesped,
};