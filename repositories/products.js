const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class ProductosRepository {
  /**
   * Crear un nuevo producto
   */
  async addProduct({
    nombre_prod,
    unidad_prod,
    tipo_prod,
    stockeable_prod,
    vendible_prod,
    descuentaStockVenta_prod,
    activo_prod,
    fechaAlta_prod,
  }) {
    if (!nombre_prod || typeof nombre_prod !== 'string') {
      throw new Error('nombre_prod es requerido y debe ser string');
    }

    return prisma.producto.create({
      data: {
        nombre_prod,
        unidad_prod,
        tipo_prod,
        stockeable_prod,
        vendible_prod,
        descuentaStockVenta_prod,
        activo_prod,
        ...(fechaAlta_prod ? { fechaAlta_prod: new Date(fechaAlta_prod) } : {}),
      },
    });
  }

  /**
   * Traer todos los productos
   */
  async getAll() {
    return prisma.producto.findMany({
      orderBy: [{ nombre_prod: 'asc' }, { id_prod: 'asc' }],
    });
  }

  /**
   * Traer solo activos
   */
  async getAllActivos() {
    return prisma.producto.findMany({
      where: { activo_prod: true },
      orderBy: [{ nombre_prod: 'asc' }, { id_prod: 'asc' }],
    });
  }

  /**
   * Buscar por ID
   */
  async getById(id_prod) {
    return prisma.producto.findUnique({
      where: { id_prod: Number(id_prod) },
    });
  }

  /**
   * Actualizar producto
   */
  async update(id_prod, data) {
    const allowed = [
      'nombre_prod',
      'unidad_prod',
      'tipo_prod',
      'stockeable_prod',
      'vendible_prod',
      'descuentaStockVenta_prod',
      'activo_prod',
      'fechaAlta_prod',
    ];

    const payload = Object.fromEntries(
      Object.entries(data || {}).filter(([k]) => allowed.includes(k))
    );

    if (payload.fechaAlta_prod) {
      payload.fechaAlta_prod = new Date(payload.fechaAlta_prod);
    }

    return prisma.producto.update({
      where: { id_prod: Number(id_prod) },
      data: payload,
    });
  }

  /**
   * Eliminar producto
   */
  async remove(id_prod) {
    return prisma.producto.delete({
      where: { id_prod: Number(id_prod) },
    });
  }

  /**
   * Listar con filtros
   */
  async list({ q, tipo, stockeable, activo } = {}) {
    const where = {};

    if (q && q.trim()) {
      const n = Number(q);
      where.OR = [
        { nombre_prod: { contains: q, mode: 'insensitive' } },
        ...(Number.isFinite(n) ? [{ id_prod: n }] : []),
      ];
    }

    if (tipo) where.tipo_prod = tipo;

    if (stockeable === '1' || stockeable === '0' || typeof stockeable === 'boolean') {
      where.stockeable_prod =
        stockeable === '1' ? true : stockeable === '0' ? false : !!stockeable;
    }

    if (activo === '1' || activo === '0' || typeof activo === 'boolean') {
      where.activo_prod =
        activo === '1' ? true : activo === '0' ? false : !!activo;
    }

    return prisma.producto.findMany({
      where,
      orderBy: [{ nombre_prod: 'asc' }, { id_prod: 'asc' }],
    });
  }
async toggleActive(id_prod) {
  const prod = await prisma.producto.findUnique({ where: { id_prod: Number(id_prod) } });
  if (!prod) throw new Error('Producto no encontrado');
  
  return prisma.producto.update({
    where: { id_prod: Number(id_prod) },
    data: { activo_prod: !prod.activo_prod }
  });
}

}




module.exports = new ProductosRepository();
