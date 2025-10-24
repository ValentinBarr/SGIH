const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

class TiposHabitacionRepository {
  // 🔹 Listar todos los tipos de habitación con comodidades
  async getAll({ q } = {}) {
    const where = q
      ? { nombre: { contains: q, mode: 'insensitive' } }
      : {};

    return prisma.tipoHabitacion.findMany({
      where,
      include: {
        Comodidades: {
          include: { Comodidad: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // 🔹 Obtener tipo por ID
  async getById(id_tipoHab) {
    return prisma.tipoHabitacion.findUnique({
      where: { id_tipoHab: Number(id_tipoHab) },
      include: {
        Comodidades: {
          include: { Comodidad: true },
        },
      },
    });
  }

  // 🔹 Crear tipo con comodidades
  async create(data) {
    const { nombre, descripcion, capacidad, precioBase, comodidades = [] } = data;

    const tipoHab = await prisma.tipoHabitacion.create({
      data: {
        nombre,
        descripcion,
        capacidad: Number(capacidad),
        precioBase: Number(precioBase),
        activo: true,
      },
    });

    // Guardar comodidades seleccionadas (tabla intermedia)
    if (comodidades.length > 0) {
      await prisma.tipoHabitacionComodidad.createMany({
        data: comodidades.map(id => ({
          id_tipoHab: tipoHab.id_tipoHab,
          id_comodidad: Number(id),
        })),
      });
    }

    return tipoHab;
  }

  // 🔹 Actualizar tipo de habitación y sus comodidades
async update(id_tipoHab, data) {
    
    // ================== LÍNEA CORREGIDA ==================
    // Destructuramos 'comodidades' Y TAMBIÉN 'id_tipoHab' (que viene del body)
    // para que no se incluyan en el payload de 'tipoData'.
    const { comodidades, id_tipoHab: idDelBody, ...tipoData } = data;
    // =====================================================

    // 1. Prepara el payload de datos para actualizar
    const dataToUpdate = { ...tipoData };

    // 2. Convierte campos numéricos SI existen en los datos
    if (dataToUpdate.capacidad !== undefined) {
      dataToUpdate.capacidad = Number(dataToUpdate.capacidad);
    }
    if (dataToUpdate.precioBase !== undefined) {
      dataToUpdate.precioBase = Number(dataToUpdate.precioBase);
    }
    
    // 3. Agrega la fecha de actualización
    dataToUpdate.updatedAt = new Date();

    // 4. Actualiza el registro principal (TipoHabitacion)
    await prisma.tipoHabitacion.update({
      where: { id_tipoHab: Number(id_tipoHab) }, // Usa el ID de los params
      data: dataToUpdate, // 'dataToUpdate' AHORA YA NO TIENE 'id_tipoHab'
    });

    // 5. Actualiza las comodidades SÓLO SI el array 'comodidades' fue enviado.
    //    (Esta lógica ya estaba bien y es crucial para que el /toggle funcione)
    if (comodidades !== undefined) {
      // Borrar las comodidades viejas
      await prisma.tipoHabitacionComodidad.deleteMany({
        where: { id_tipoHab: Number(id_tipoHab) },
      });

      // Crear las nuevas si el array no está vacío
      if (comodidades.length > 0) {
        await prisma.tipoHabitacionComodidad.createMany({
          data: comodidades.map(id => ({
            id_tipoHab: Number(id_tipoHab),
            id_comodidad: Number(id),
          })),
        });
      }
    }
  }



  // 🔹 Eliminación lógica (soft delete)
  async delete(id_tipoHab) {
    return prisma.tipoHabitacion.update({
      where: { id_tipoHab: Number(id_tipoHab) },
      data: { activo: false },
    });
  }

  // 🔹 Obtener comodidades activas
  async getComodidadesActivas() {
    return prisma.comodidad.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  // (Junto a tus otras funciones como getAll, create, etc.)

  async getOneById (id) {
  // Busca el tipo de habitación por su Primary Key (ID)
  // Incluimos las comodidades por si acaso, aunque para el toggle no se usan.
  return db.TipoHabitacion.findByPk(id, {
    include: [{ 
      model: db.ComodidadPorTipo, 
      as: 'Comodidades',
      include: [{ model: db.Comodidad, as: 'Comodidad' }]
    }]
    });
  }
}


module.exports = new TiposHabitacionRepository();
