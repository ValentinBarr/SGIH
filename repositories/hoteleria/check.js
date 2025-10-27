const { PrismaClient, EstadoHabitacion, EstadoReserva } = require('../../generated/prisma');
const prisma = new PrismaClient();

class HabitacionRepository {

    /**
     * Obtiene el estado actual de todas las habitaciones para el tablero.
     * Incluye información de la reserva activa si la hay.
     */
    async getStatusBoard() {
        // 1. Obtener todas las habitaciones y su tipo
        const habitaciones = await prisma.habitacion.findMany({
            where: { activo: true },
            include: { 
                TipoHabitacion: true,
            },
            orderBy: { numero: 'asc' },
        });

        // 2. Buscar reservas activas para cada habitación
        const results = await Promise.all(habitaciones.map(async (hab) => {
            // Buscamos la reserva que está CHECKED_IN o CONFIRMADA para hoy/mañana
            const reservaActiva = await prisma.reserva.findFirst({
                where: {
                    id_hab: hab.id_hab,
                    estado: { in: [EstadoReserva.CHECKED_IN, EstadoReserva.CONFIRMADA] },
                    // Si está CHECKED_IN, es la reserva actual.
                    // Si está CONFIRMADA, es la próxima reserva (Check-in hoy/mañana)
                },
                include: { Huesped: true },
                // Ordenar por check-in para priorizar la más próxima
                orderBy: { fechaCheckIn: 'asc' }, 
            });

            return {
                ...hab,
                // Si la reserva es CHECKED_IN, la habitación está OCUPADA actualmente.
                // Si la reserva es CONFIRMADA, la habitación está DISPONIBLE, pero tiene cliente por llegar.
                reservaActiva,
            };
        }));

        return results;
    }

    /**
     * Cambia el estado interno de una habitación (ej: a LIMPIEZA o MANTENIMIENTO)
     * No gestiona el Check-in/out, solo estados internos.
     */
    async updateHabitacionState(id_hab, newState) {
        return prisma.habitacion.update({
            where: { id_hab: Number(id_hab) },
            data: { estado: newState },
        });
    }

    /**
     * Busca la próxima reserva CONFIRMADA para una habitación específica.
     */
    async getNextConfirmedReservation(id_hab) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return prisma.reserva.findFirst({
            where: {
                id_hab: Number(id_hab),
                estado: EstadoReserva.CONFIRMADA,
                fechaCheckIn: { gte: today },
            },
            include: { Huesped: true },
            orderBy: { fechaCheckIn: 'asc' },
        });
    }

    /**
     * Realiza el Check-in o Check-out de una RESERVA.
     * Reutiliza la lógica de cambio de estado de reserva que ya tienes.
     * Se asume que esta lógica maneja también la actualización de la tabla Habitacion.
     */
    async performCheckInOut(id_hab, newReservaState) {
        // En un entorno real, buscarías la ID de la reserva activa o próxima.
        // Aquí simplificamos buscando la reserva más relevante.
        
        let reserva;
        
        if (newReservaState === EstadoReserva.CHECKED_IN) {
            // Buscamos la próxima reserva CONFIRMADA para hacer el Check-in
            reserva = await prisma.reserva.findFirst({
                where: {
                    id_hab: Number(id_hab),
                    estado: EstadoReserva.CONFIRMADA,
                    // Idealmente, check-in es hoy o en el pasado reciente
                    fechaCheckIn: { lte: new Date() }, 
                },
                orderBy: { fechaCheckIn: 'desc' },
            });
            if (!reserva) throw new Error("No hay reserva CONFIRMADA para hacer Check-in.");

        } else if (newReservaState === EstadoReserva.CHECKED_OUT) {
             // Buscamos la reserva actualmente en CHECKED_IN para hacer el Check-out
            reserva = await prisma.reserva.findFirst({
                where: {
                    id_hab: Number(id_hab),
                    estado: EstadoReserva.CHECKED_IN,
                },
            });
            if (!reserva) throw new Error("La habitación no tiene una reserva activa (CHECKED_IN).");
        } else {
            throw new Error("Estado de acción no válido.");
        }

        // Llamamos al método de actualización que actualiza Reserva y Habitacion
        // ⚠️ Nota: Necesitas que el método updateState de tu ReservaRepository esté disponible
        // y maneje la lógica de actualización de la tabla Habitacion.
        const ReservaRepo = require('./reservas'); 
        return ReservaRepo.updateState(reserva.id_reserva, newReservaState);
    }
}

// ⚠️ Usamos una instancia Singleton para la exportación
module.exports = new HabitacionRepository();