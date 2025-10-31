// repositories/hoteleria/reservas.js
const { PrismaClient, EstadoReserva } = require('../../generated/prisma');
const prisma = new PrismaClient();
const { differenceInDays, format } = require('date-fns');

const PAGE_SIZE = 10;

class ReservasRepository {
  // ============================================================
  // 📘 Helpers
  // ============================================================
  _calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const noches = differenceInDays(end, start);
    return end > start ? noches : 0;
  }

  // ============================================================
  // 📗 Lectura y filtros
  // ============================================================
  async getAll({ q, page = 1, estado, id_tipoHab, fechaDesde, fechaHasta } = {}) {
    const currentPage = Number(page) || 1;
    const where = {};

    // 🔍 Filtro de búsqueda general
    if (q) {
      where.OR = [
        { codigoReserva: { contains: q, mode: 'insensitive' } },
        { Huesped: { nombre: { contains: q, mode: 'insensitive' } } },
        { Huesped: { apellido: { contains: q, mode: 'insensitive' } } },
        { Huesped: { documento: { contains: q, mode: 'insensitive' } } },
      ];
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
            orderBy: [
                // Primero ordenar por estado: activas primero, canceladas al final
                {
                    estado: 'asc' // CANCELADA viene después de CHECKED_IN, CONFIRMADA, etc.
                },
                // Luego por fecha de check-in descendente
                {
                    fechaCheckIn: 'desc'
                }
            ],
            take: PAGE_SIZE,
            skip: (currentPage - 1) * PAGE_SIZE,
        });

        // Ordenar manualmente para poner CANCELADA al final
        const reservasOrdenadas = reservas.sort((a, b) => {
            // Si una es CANCELADA y la otra no, CANCELADA va al final
            if (a.estado === 'CANCELADA' && b.estado !== 'CANCELADA') return 1;
            if (a.estado !== 'CANCELADA' && b.estado === 'CANCELADA') return -1;
            
            // Si ambas son CANCELADA o ambas no lo son, ordenar por fecha
            return new Date(b.fechaCheckIn) - new Date(a.fechaCheckIn);
        });

        return { reservas: reservasOrdenadas, totalPages, currentPage, totalReservas };
    }

    // 🏨 Filtro por tipo de habitación
    if (id_tipoHab) {
      where.Habitacion = { id_tipoHab: Number(id_tipoHab) };
    }

    // 📅 Filtro por rango de fechas
    const desdeDate = fechaDesde ? new Date(fechaDesde) : null;
    const hastaDate = fechaHasta ? new Date(fechaHasta) : null;
    if (desdeDate && !isNaN(desdeDate)) {
      const startOfDay = new Date(
        Date.UTC(desdeDate.getFullYear(), desdeDate.getMonth(), desdeDate.getDate())
      );
      where.fechaCheckIn = { ...where.fechaCheckIn, gte: startOfDay };
    }
    if (hastaDate && !isNaN(hastaDate)) {
      const endOfDay = new Date(
        Date.UTC(hastaDate.getFullYear(), hastaDate.getMonth(), hastaDate.getDate(), 23, 59, 59, 999)
      );
      where.fechaCheckIn = { ...where.fechaCheckIn, lte: endOfDay };
    }

    // 📊 Conteo y paginación
    const totalReservas = await prisma.reserva.count({ where });
    const totalPages = Math.ceil(totalReservas / PAGE_SIZE);

    // 🧾 Listado de reservas
    const reservas = await prisma.reserva.findMany({
      where,
      include: {
        Huesped: true,
        Habitacion: { include: { TipoHabitacion: true } },
        PagoReserva: { include: { FormaPago: true } },
      },
      orderBy: { fechaCheckIn: 'desc' },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    });

    return { reservas, totalPages, currentPage, totalReservas };
  }

  // ============================================================
  // 📋 Datos para formularios (incluye Formas de Pago)
  // ============================================================
  async getFormData() {
    const tiposHabitacion = await prisma.tipoHabitacion.findMany({
      where: { activo: true },
      include: { Comodidades: { include: { Comodidad: true } } },
      orderBy: { nombre: 'asc' },
    });

    const estadosReserva = Object.values(EstadoReserva);

    const huespedes = await prisma.huesped.findMany({
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    // 💳 Traer formas de pago activas
    const formasPago = await prisma.formaPago.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });

    return { tiposHabitacion, estadosReserva, huespedes, formasPago };
  }

  // ============================================================
  // 📘 Obtener reserva simple por ID
  // ============================================================
  async getById(id_reserva) {
    return prisma.reserva.findUnique({
      where: { id_reserva: Number(id_reserva) },
      include: { Huesped: true, Habitacion: true },
    });
  }

  // ============================================================
  // 🧾 Detalles completos para Check-in / Check-out
  // ============================================================
  async getCheckinDetails(id_reserva) {
    return prisma.reserva.findUnique({
      where: { id_reserva: Number(id_reserva) },
      include: {
        Huesped: true,
        Habitacion: {
          include: {
            TipoHabitacion: {
              include: {
                Comodidades: { include: { Comodidad: true } },
              },
            },
          },
        },
        PagoReserva: { include: { FormaPago: true } }, // 💳 Pagos asociados
      },
    });
  }

  // ============================================================
  // 🛏️ Habitaciones disponibles
  // ============================================================
  static async findAvailableRooms(checkIn, checkOut, adultos, ninos) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const capacidadTotal = parseInt(adultos || '0') + parseInt(ninos || '0');

    if (
      isNaN(checkInDate.getTime()) ||
      isNaN(checkOutDate.getTime()) ||
      checkOutDate <= checkInDate ||
      capacidadTotal <= 0
    ) {
      console.warn('findAvailableRooms: Fechas inválidas o capacidad cero.');
      return [];
    }

    const checkInUTC = new Date(
      Date.UTC(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate())
    );
    const checkOutUTC = new Date(
      Date.UTC(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate())
    );

    // 🏠 Buscar habitaciones ocupadas en el rango
    const habitacionesOcupadas = await prisma.reserva.findMany({
      where: {
        estado: { notIn: [EstadoReserva.CHECKED_OUT, EstadoReserva.CANCELADA] },
        fechaCheckIn: { lt: checkOutUTC },
        fechaCheckOut: { gt: checkInUTC },
      },
      select: { id_hab: true },
      distinct: ['id_hab'],
    });

    const idsOcupadas = habitacionesOcupadas.map((r) => r.id_hab).filter(Boolean);

    return prisma.habitacion.findMany({
      where: {
        id_hab: { notIn: idsOcupadas },
        estado: { in: ['DISPONIBLE', 'LIMPIEZA'] },
        activo: true,
        TipoHabitacion: { capacidad: { gte: capacidadTotal } },
      },
      include: {
        TipoHabitacion: {
          include: { Comodidades: { include: { Comodidad: true } } },
        },
      },
      orderBy: [{ id_tipoHab: 'asc' }, { numero: 'asc' }],
    });
  }

  // ============================================================
  // ➕ Crear huésped
  // ============================================================
  static async createHuesped(data) {
    const { nombre, apellido, documento, telefono, email } = data;
    if (!nombre || !apellido) throw new Error('Nombre y apellido son requeridos.');
    return prisma.huesped.create({
      data: { nombre, apellido, documento, telefono, email },
    });
  }

  // ============================================================
  // 🧱 Crear reserva
  // ============================================================
  async create(data) {
    const {
      id_huesped,
      id_hab,
      fechaCheckIn,
      fechaCheckOut,
      cantAdultos,
      cantNinos,
      estado,
      total,
      observaciones,
    } = data;

    const huespedId = Number(id_huesped);
    const habId = Number(id_hab);
    const totalNum = Number(total);
    const estadoFinal = estado || EstadoReserva.CONFIRMADA;

    if (!huespedId || !habId || !fechaCheckIn || !fechaCheckOut || totalNum <= 0) {
      throw new Error('Datos incompletos o inválidos para crear reserva.');
    }

    const checkIn = new Date(fechaCheckIn);
    const checkOut = new Date(fechaCheckOut);
    if (checkOut <= checkIn) throw new Error('Check-out debe ser posterior al check-in.');

    return prisma.$transaction(async (tx) => {
      const codigoReserva = 'R' + format(new Date(), 'yyyyMMddHHmmss');

      const nuevaReserva = await tx.reserva.create({
        data: {
          codigoReserva,
          id_huesped: huespedId,
          id_hab: habId,
          fechaCheckIn: checkIn,
          fechaCheckOut: checkOut,
          cantAdultos: Number(cantAdultos) || 1,
          cantNinos: Number(cantNinos) || 0,
          estado: estadoFinal,
          total: totalNum,
          observaciones: observaciones || null,
        },
      });

      if (estadoFinal === EstadoReserva.CHECKED_IN) {
        await tx.habitacion.update({
          where: { id_hab: habId },
          data: { estado: 'OCUPADA' },
        });
      }

      return nuevaReserva;
    });
  }

  // ============================================================
  // ✏️ Actualizar reserva
  // ============================================================
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

  // ============================================================
  // 🔄 Actualizar estado de reserva y habitación
  // ============================================================
  async updateState(id_reserva, nuevoEstado) {
    if (!Object.values(EstadoReserva).includes(nuevoEstado))
      throw new Error(`Estado inválido: ${nuevoEstado}`);

    return prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id_reserva: Number(id_reserva) },
        select: { id_hab: true, estado: true },
      });
      if (!reserva) throw new Error('Reserva no encontrada.');

      const updated = await tx.reserva.update({
        where: { id_reserva: Number(id_reserva) },
        data: {
          estado: nuevoEstado,
          updatedAt: new Date(),
          fechaCheckInReal:
            nuevoEstado === EstadoReserva.CHECKED_IN ? new Date() : undefined,
          fechaCheckOutReal:
            nuevoEstado === EstadoReserva.CHECKED_OUT ? new Date() : undefined,
        },
      });

      let newState;
      if (nuevoEstado === EstadoReserva.CHECKED_IN) newState = 'OCUPADA';
      else if (
        nuevoEstado === EstadoReserva.CHECKED_OUT ||
        nuevoEstado === EstadoReserva.CANCELADA
      )
        newState = 'LIMPIEZA';

      if (newState)
        await tx.habitacion.update({
          where: { id_hab: reserva.id_hab },
          data: { estado: newState },
        });

      return updated;
    });
  }
}

// ============================================================
// 🚀 Exportación Singleton
// ============================================================
const repo = new ReservasRepository();

module.exports = {
  getAll: repo.getAll.bind(repo),
  getFormData: repo.getFormData.bind(repo),
  getById: repo.getById.bind(repo),
  create: repo.create.bind(repo),
  update: repo.update.bind(repo),
  updateState: repo.updateState.bind(repo),
  getCheckinDetails: repo.getCheckinDetails.bind(repo),
  findAvailableRooms: ReservasRepository.findAvailableRooms,
  createHuesped: ReservasRepository.createHuesped,
};
