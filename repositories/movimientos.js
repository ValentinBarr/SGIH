const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Normaliza rangos de fechas (incluye todo el día para 'hasta')
 */
function buildDateRange(fromStr, toStr) {
  const where = {};
  if (fromStr || toStr) {
    where.gte = fromStr ? new Date(fromStr + 'T00:00:00') : undefined;
    where.lte = toStr ? new Date(toStr + 'T23:59:59.999') : undefined;
  }
  return Object.keys(where).length ? where : undefined;
}

/**
 * Lista movimientos con filtros.
 */
async function findAll(filters = {}) {
  const { q, depId, prodId, dominio, direccion, from, to } = filters;

  const where = {
    fecha_mov: buildDateRange(from, to),
    ...(depId ? { id_dep: Number(depId) } : {}),
    ...(q
      ? {
          observacion: { contains: q, mode: 'insensitive' },
        }
      : {}),
    ...(dominio || direccion
      ? {
          TipoMovimiento: {
            ...(direccion ? { direccion } : {}),
            ...(dominio ? { Dominio: dominio } : {}),
          },
        }
      : {}),
  };

  const rows = await prisma.movimiento.findMany({
    where,
    include: {
      Deposito: true,
      TipoMovimiento: true,
      TipoComprobante: true,
    },
    orderBy: { fecha_mov: 'desc' },
  });

  return rows.map((r) => ({
    ...r,
    fechaFmt: new Date(r.fecha_mov).toLocaleString(),
  }));
}

/**
 * Busca un movimiento por id con todo su detalle
 */
async function findById(id) {
  const mov = await prisma.movimiento.findUnique({
    where: { id_mov: Number(id) },
    include: {
      Deposito: true,
      TipoMovimiento: true,
      TipoComprobante: true,
      Detalles: {
        include: {
          ProductoDeposito: {
            include: { Producto: true },
          },
        },
      },
    },
  });

  if (!mov) return null;

  return {
    ...mov,
    fechaFmt: new Date(mov.fecha_mov).toLocaleString(),
    productos: mov.Detalles.map((d) => ({
      nombre: d.ProductoDeposito.Producto.nombre_prod,
      cantidad: Number(d.cantidad),
    })),
  };
}

module.exports = { findAll, findById };
