const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class ProductosRepository {
  /**
   * Crea un nuevo producto
   * @param {{ nombre_prod: string, fechaAlta_prod?: Date }} data
   * @returns {Promise<Object>}
   */
  async addProduct({ nombre_prod, fechaAlta_prod }) {
    if (!nombre_prod || typeof nombre_prod !== 'string') {
      throw new Error('nombre_prod es requerido y debe ser string');
    }
    return prisma.producto.create({
      data: {
        nombre_prod,
        ...(fechaAlta_prod ? { fechaAlta_prod: new Date(fechaAlta_prod) } : {})
      },
    });
  }

  async getAll() {
    return prisma.producto.findMany({ orderBy: { id_prod: 'asc' } });
  }

  async getById(id_prod) {
    return prisma.producto.findUnique({ where: { id_prod: Number(id_prod) } });
  }

  async update(id_prod, data) {
    // Solo permitimos campos que existen en el modelo
    const allowed = [
      'nombre_prod',
      'unidad_prod',
      'tipo_prod',
      'stockeable_prod',
      'vendible_prod',
      'descuentaStockVenta_prod',
      'stockMinimoGlobal_prod',
      'activo_prod',
      'fechaAlta_prod',
    ];
    const payload = Object.fromEntries(
      Object.entries(data || {}).filter(([k]) => allowed.includes(k))
    );

    return prisma.producto.update({
      where: { id_prod: Number(id_prod) },
      data: payload,
    });
  }

  async remove(id_prod) {
    return prisma.producto.delete({ where: { id_prod: Number(id_prod) } });
  }
}

module.exports = new ProductosRepository();