const { PrismaClient, EstadoReserva } = require('../../generated/prisma');
const prisma = new PrismaClient();

const PAGE_SIZE = 10;

class ReservasRepository {
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
          take: 1,
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
   * Crea una nueva reserva (carga manual)
   */
  async create(data) {
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

    // 1. Generar un código de reserva único
    const codigoReserva = `RES-${Date.now().toString().slice(-6)}`;

    // 2. Crear la Reserva principal
    const reserva = await prisma.reserva.create({
      data: {
        codigoReserva,
        id_huesped: Number(id_huesped),
        fechaCheckIn: new Date(fechaCheckIn),
        fechaCheckOut: new Date(fechaCheckOut),
        cantAdultos: Number(cantAdultos) || 1,
        cantNinos: Number(cantNinos) || 0,
        estado: estado || EstadoReserva.PENDIENTE, // Usa el estado del form
        total: Number(total) || 0,
        observaciones: observaciones || null, // Guarda las observaciones
      },
    });

    // 3. Crear UN detalle de reserva (simplificado)
    if (id_tipoHab) {
      await prisma.detalleReserva.create({
        data: {
          id_reserva: reserva.id_reserva,
          id_tipoHab: Number(id_tipoHab),
          fechaNoche: new Date(fechaCheckIn),
          precioNoche: Number(total) || 0,
        },
      });
    }

    return reserva;
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