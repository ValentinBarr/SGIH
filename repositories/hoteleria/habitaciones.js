// EN: repositories/hoteleria/habitaciones.js

const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

const PAGE_SIZE = 10;

class HabitacionesRepository {
  
  // 👇 ================== MÉTODO GETALL ACTUALIZADO ================== 👇
  async getAll({ q, page = 1, activo } = {}) {
    
    const currentPage = Number(page) || 1;

    // 1. Construir la cláusula WHERE
    const where = {};

    // ¡AQUÍ ESTÁ LA CORRECCIÓN!
    if (q) {
      // Intentamos convertir la búsqueda 'q' a un número
      const numBusqueda = parseInt(q, 10);

      if (!isNaN(numBusqueda)) {
        // Si ES un número válido, buscamos una coincidencia exacta
        where.numero = numBusqueda;
      } else {
        // Si NO es un número (ej: "abc"), forzamos 0 resultados
        // ya que un número de habitación no puede ser "abc".
        where.id_hab = -1; // Asumimos que los IDs nunca son negativos
      }
    }
    
    // Filtros rápidos de estado (esto sigue igual)
    if (activo === 'true') {
      where.activo = true;
    } else if (activo === 'false') {
      where.activo = false;
    }

    // 2. Contar el total de registros
    const totalHabitaciones = await prisma.habitacion.count({ where });

    // 3. Calcular el total de páginas
    const totalPages = Math.ceil(totalHabitaciones / PAGE_SIZE);

    // 4. Obtener los registros paginados
    const habitaciones = await prisma.habitacion.findMany({
      where,
      include: {
        TipoHabitacion: true,
      },
      orderBy: { numero: 'asc' },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    });

    // 5. Devolver todo
    return { 
      habitaciones, 
      totalPages, 
      currentPage, 
      totalHabitaciones 
    };
  }
  // 👆 ================== FIN MÉTODO GETALL ================== 👆

  // ... (el resto de tus funciones: getById, create, update, etc.)
  
  async getById(id_hab) {
    return prisma.habitacion.findUnique({
      where: { id_hab: Number(id_hab) },
    });
  }

  async create(data) {
    const { numero, piso, id_tipoHab, estado } = data;
    return prisma.habitacion.create({
      data: {
        numero: Number(numero),
        piso: piso ? Number(piso) : null,
        id_tipoHab: Number(id_tipoHab),
        estado,
        activo: true,
      },
    });
  }

  async update(id_hab, data) {
    const { id_hab: idDelBody, ...dataToUpdate } = data;
    if (dataToUpdate.numero !== undefined) {
      dataToUpdate.numero = Number(dataToUpdate.numero);
    }
    if (dataToUpdate.piso !== undefined) {
      dataToUpdate.piso = dataToUpdate.piso ? Number(dataToUpdate.piso) : null;
    }
    if (dataToUpdate.id_tipoHab !== undefined) {
      dataToUpdate.id_tipoHab = Number(dataToUpdate.id_tipoHab);
    }
    dataToUpdate.updatedAt = new Date();
    return prisma.habitacion.update({
      where: { id_hab: Number(id_hab) },
      data: dataToUpdate,
    });
  }
  
  async getTiposActivos() {
    return prisma.tipoHabitacion.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }
}

module.exports = new HabitacionesRepository();