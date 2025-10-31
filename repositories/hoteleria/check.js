const { PrismaClient, EstadoHabitacion, EstadoReserva } = require('../../generated/prisma');
const prisma = new PrismaClient();

class HabitacionRepository {

    /**
     * Obtiene el estado actual de todas las habitaciones para el tablero.
     * Incluye información de la reserva activa si la hay.
     */
async getStatusBoard() {
    // 1. Definir fecha de hoy (solo fecha, sin hora) - Simplificado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('🔍 DEBUG - Fecha de hoy (inicio):', today.toISOString());
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    console.log('🔍 DEBUG - Fecha de mañana (fin):', tomorrow.toISOString());
    
    // Verificar si hay reservas CONFIRMADAS para hoy
    const reservasHoy = await prisma.reserva.findMany({
        where: {
            estado: EstadoReserva.CONFIRMADA,
            fechaCheckIn: {
                gte: today,
                lt: tomorrow,
            },
        },
        include: { Huesped: true, Habitacion: true },
    });
    
    console.log(`🔍 Total de reservas CONFIRMADAS para hoy: ${reservasHoy.length}`);
    reservasHoy.forEach(r => {
        console.log(`  - Reserva ${r.codigoReserva}: Habitación ${r.Habitacion?.numero}, Huésped: ${r.Huesped?.nombre} ${r.Huesped?.apellido}`);
    });

    // 2. Obtener todas las habitaciones
    const habitaciones = await prisma.habitacion.findMany({
        where: { activo: true },
        include: { 
            TipoHabitacion: true,
        },
        orderBy: { numero: 'asc' },
    });

    // 3. Para cada habitación, buscar su reserva activa o próxima
    const results = await Promise.all(habitaciones.map(async (hab) => {
        
        // CASO 1: Habitación OCUPADA → Buscar reserva CHECKED_IN
        if (hab.estado === EstadoHabitacion.OCUPADA) {
            const reservaActiva = await prisma.reserva.findFirst({
                where: {
                    id_hab: hab.id_hab,
                    estado: EstadoReserva.CHECKED_IN,
                },
                include: { Huesped: true },
            });
            
            return {
                ...hab,
                reservaActiva,
            };
        }
        
        // CASO 2: Habitación DISPONIBLE → Buscar si hay llegada HOY
        if (hab.estado === EstadoHabitacion.DISPONIBLE) {
            console.log(`🔍 Buscando reservas para habitación ${hab.numero} (ID: ${hab.id_hab})`);
            
            const reservaHoy = await prisma.reserva.findFirst({
                where: {
                    id_hab: hab.id_hab,
                    estado: EstadoReserva.CONFIRMADA,
                    // 🔥 CRÍTICO: Filtrar por fecha de hoy
                    fechaCheckIn: {
                        gte: today,
                        lt: tomorrow,
                    },
                },
                include: { Huesped: true },
                orderBy: { fechaCheckIn: 'asc' },
            });
            
            if (reservaHoy) {
                console.log(`✅ Encontrada reserva para hoy en habitación ${hab.numero}:`, {
                    codigoReserva: reservaHoy.codigoReserva,
                    fechaCheckIn: reservaHoy.fechaCheckIn,
                    huesped: `${reservaHoy.Huesped?.nombre} ${reservaHoy.Huesped?.apellido}`
                });
            } else {
                console.log(`❌ No hay reservas para hoy en habitación ${hab.numero}`);
            }
            
            return {
                ...hab,
                reservaActiva: reservaHoy, // Solo si llega HOY
            };
        }
        
        // CASO 3: Otras habitaciones (LIMPIEZA, MANTENIMIENTO)
        return {
            ...hab,
            reservaActiva: null,
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