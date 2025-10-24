// Usamos el cliente Prisma que ya debes tener configurado
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

class ComodidadesRepository {
  
  // 🔹 Listar todas
  async getAll({ q } = {}) {
    const where = q
      ? { nombre: { contains: q, mode: 'insensitive' } }
      : {};

    return prisma.comodidad.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
  }

  // 🔹 Obtener una por ID
  async getById(id_comodidad) {
    return prisma.comodidad.findUnique({
      where: { id_comodidad: Number(id_comodidad) },
    });
  }

  // 🔹 Crear nueva
  async create(data) {
    const { nombre, descripcion, categoria } = data;
    return prisma.comodidad.create({
      data: {
        nombre,
        descripcion,
        categoria,
        activo: true, // Siempre se crea como activa
      },
    });
  }

  // 🔹 Actualizar (Nombre, Descripción o Estado)
  async update(id_comodidad, data) {
    // Extraemos el id_comodidad del 'data' (que viene del req.body)
    // para que no intente actualizar la Primary Key.
    const { id_comodidad: idDelBody, ...dataToUpdate } = data;

    return prisma.comodidad.update({
      where: { id_comodidad: Number(id_comodidad) },
      data: dataToUpdate, // Actualiza solo los campos que llegan
    });
  }

  // (No necesitamos 'delete' si usamos el toggle 'activo')
}

module.exports = new ComodidadesRepository();