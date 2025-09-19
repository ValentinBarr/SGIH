// repositories/products.js
const { PrismaClient } = require('../generated/prisma'); // usás tu client generado
const prisma = new PrismaClient();

class ProductosRepository {
  /**
   * Crea un nuevo producto
   * Solo nombre es obligatorio aquí (el resto según tu validación de negocio)
   */
  async addProduct({
    nombre_prod,
    unidad_prod,
    tipo_prod,
    stockeable_prod,
    vendible_prod,
    descuentaStockVenta_prod,
    stockMinimoGlobal_prod,
    activo_prod,
    fechaAlta_prod,
    precio_prod,
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
        stockMinimoGlobal_prod,
        activo_prod,
        ...(fechaAlta_prod ? { fechaAlta_prod: new Date(fechaAlta_prod) } : {}),
        ...(typeof precio_prod !== 'undefined' ? { precio_prod } : {}),
      },
    });
  }
  /** Trae TODOS los productos (todos los campos del modelo) */
  async getAll() {
    return prisma.producto.findMany({
      orderBy: [{ nombre_prod: 'asc' }, { id_prod: 'asc' }],
    });
  }

  /** Útil si querés solo activos (opcional) */
  async getAllActivos() {
    return prisma.producto.findMany({
      where: { activo_prod: true },
      orderBy: [{ nombre_prod: 'asc' }, { id_prod: 'asc' }],
    });
  }

  async getById(id_prod) {
    return prisma.producto.findUnique({
      where: { id_prod: Number(id_prod) },
    });
  }

  async update(id_prod, data) {
    // Campos permitidos
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
      'precio_prod',
    ];
    const payload = Object.fromEntries(
      Object.entries(data || {}).filter(([k]) => allowed.includes(k))
    );

    // Normalizo fecha si viene
    if (payload.fechaAlta_prod) {
      payload.fechaAlta_prod = new Date(payload.fechaAlta_prod);
    }

    return prisma.producto.update({
      where: { id_prod: Number(id_prod) },
      data: payload,
    });
  }

  async remove(id_prod) {
    return prisma.producto.delete({
      where: { id_prod: Number(id_prod) },
    });
  }

  async list({ q, tipo, stockeable, activo } = {}) {
    const where = {};

    // búsqueda por ID o nombre
    if (q && q.trim()) {
      const n = Number(q);
      where.OR = [
        { nombre_prod: { contains: q, mode: 'insensitive' } },
        ...(Number.isFinite(n) ? [{ id_prod: n }] : []),
      ];
    }

    // filtros
    if (tipo) where.tipo_prod = tipo; // ej: VENDIBLE | INSUMO | AMENITY | LINEN | SERVICE

    if (stockeable === '1' || stockeable === '0' || typeof stockeable === 'boolean') {
      where.stockeable_prod = stockeable === '1' ? true
                          : stockeable === '0' ? false
                          : !!stockeable;
    }

    if (activo === '1' || activo === '0' || typeof activo === 'boolean') {
      where.activo_prod = activo === '1' ? true
                       : activo === '0' ? false
                       : !!activo;
    }

    return prisma.producto.findMany({
      where,
      orderBy: [{ nombre_prod: 'asc' }, { id_prod: 'asc' }],
    });
  }
}


module.exports = new ProductosRepository();
