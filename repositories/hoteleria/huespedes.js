const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

const PAGE_SIZE = 10;

class HuespedesRepository {
  
  // 🔹 Listar todos (paginado y con búsqueda)
  async getAll({ q, page = 1 } = {}) {
    
    const currentPage = Number(page) || 1;
    const where = {};

    // Lógica de búsqueda con 'OR'
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { apellido: { contains: q, mode: 'insensitive' } },
        { documento: { contains: q, mode: 'insensitive' } },
      ];
    }

    // 1. Contar el total de registros
    const totalHuespedes = await prisma.huesped.count({ where });

    // 2. Calcular páginas
    const totalPages = Math.ceil(totalHuespedes / PAGE_SIZE);

    // 3. Obtener los registros paginados
    const huespedes = await prisma.huesped.findMany({
      where,
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' },
      ],
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    });

    // 4. Devolver todo
    return { 
      huespedes, 
      totalPages, 
      currentPage, 
      totalHuespedes 
    };
  }

  // 🔹 Obtener uno por ID
  async getById(id_huesped) {
    return prisma.huesped.findUnique({
      where: { id_huesped: Number(id_huesped) },
    });
  }

  // 🔹 Crear nuevo huésped
  async create(data) {
    const { nombre, apellido, documento, telefono, email } = data;

    return prisma.huesped.create({
      data: {
        nombre,
        apellido,
        // Asigna null si el string está vacío (para campos opcionales)
        documento: documento || null,
        telefono: telefono || null,
        email: email || null,
      },
    });
  }

  // 🔹 Actualizar huésped
  async update(id_huesped, data) {
    const { id_huesped: idDelBody, ...dataToUpdate } = data;

    // Asigna null si el string está vacío
    if (dataToUpdate.documento !== undefined) {
      dataToUpdate.documento = dataToUpdate.documento || null;
    }
    if (dataToUpdate.telefono !== undefined) {
      dataToUpdate.telefono = dataToUpdate.telefono || null;
    }
    if (dataToUpdate.email !== undefined) {
      dataToUpdate.email = dataToUpdate.email || null;
    }

    dataToUpdate.updatedAt = new Date();

    return prisma.huesped.update({
      where: { id_huesped: Number(id_huesped) },
      data: dataToUpdate,
    });
  }
}

module.exports = new HuespedesRepository();