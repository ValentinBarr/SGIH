// repositories/products.js
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class ProductsRepository {
  /**
   * Crea un nuevo producto
   * @param {{ name_prod: string, fecha_alta_prod?: Date }} data
   * @returns {Promise<Object>}
   */
  async addProduct({ name_prod, fecha_alta_prod }) {
    if (!name_prod || typeof name_prod !== 'string') {
      throw new Error('name_prod es requerido y debe ser string');
    }
    const product = await prisma.product.create({
      data: {
        name_prod,
        ...(fecha_alta_prod ? { fecha_alta_prod } : {})
      },
    });
    return product;
  }

  async getAll() {
    return prisma.product.findMany({ orderBy: { id_prod: 'asc' } });
  }

  async getById(id_prod) {
    return prisma.product.findUnique({ where: { id_prod: Number(id_prod) } });
  }

  async update(id_prod, data) {
    return prisma.product.update({
      where: { id_prod: Number(id_prod) },
      data,
    });
  }

  async remove(id_prod) {
    return prisma.product.delete({ where: { id_prod: Number(id_prod) } });
  }
}

module.exports = new ProductsRepository();

