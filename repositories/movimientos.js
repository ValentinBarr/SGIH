// repositories/movimientos.js
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Normaliza rangos de fechas (incluye todo el día para 'hasta')
 */
function buildDateRange(fromStr, toStr) {
  const where = {};
  if (fromStr || toStr) {
    where.gte = fromStr ? new Date(fromStr + 'T00:00:00') : undefined;
    // incluir todo el día 'hasta'
    where.lte = toStr ? new Date(toStr + 'T23:59:59.999') : undefined;
  }
  return Object.keys(where).length ? where : undefined;
}

/**
 * Lista movimientos con filtros.
 * Filtros soportados:
 *  - q: texto en producto o nota
 *  - depId: depósito (id)
 *  - prodId: producto (id)
 *  - dominio: COMPRA|VENTA|TRANSFERENCIA|AJUSTE|CONTEO
 *  - direccion: IN|OUT
 *  - from, to: fechas (YYYY-MM-DD)
 */
async function findAll(filters = {}) {
  const {
    q,
    depId,
    prodId,
    dominio,
    direccion,
    from,
    to,
  } = filters;

  const where = {
    // por fecha en la cabecera
    Comprobante: { fecha_compInv: buildDateRange(from, to) },
    // por depósito / producto
    ...(depId ? { id_dep: Number(depId) } : {}),
    ...(prodId ? { id_prod: Number(prodId) } : {}),
    // texto libre en nombre producto o nota
    ...(q
      ? {
          OR: [
            { nota_movInv: { contains: q, mode: 'insensitive' } },
            { Producto: { nombre_prod: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
    // dominio / dirección
    ...(dominio || direccion
      ? {
          TipoMovimiento: {
            ...(dominio ? { Dominio: dominio } : {}),
            ...(direccion ? { Direccion: direccion } : {}),
          },
        }
      : {}),
  };

  const rows = await prisma.movimientoInventario.findMany({
    where,
    include: {
      Producto: true,
      Deposito: true,
      TipoMovimiento: true,
      Comprobante: {
        select: {
          docId_compInv: true,
          docType_compInv: true,
          fecha_compInv: true,
          estado_compInv: true,
        },
      },
    },
    orderBy: [
      { Comprobante: { fecha_compInv: 'desc' } },
      { lineaId_movInv: 'desc' },
    ],
  });

  // enriquecemos con cantidad con signo y fecha formateada
  return rows.map((r) => {
    const sign = r.TipoMovimiento?.Direccion === 'OUT' ? -1 : 1;
    const signedQty = Number(r.cantidad_movInv) * sign;
    const fecha = r.Comprobante?.fecha_compInv
      ? new Date(r.Comprobante.fecha_compInv)
      : null;
    return {
      ...r,
      signedQty,
      fechaFmt: fecha
        ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(
            fecha.getDate()
          ).padStart(2, '0')} ${String(fecha.getHours()).padStart(2, '0')}:${String(
            fecha.getMinutes()
          ).padStart(2, '0')}`
        : '',
    };
  });
}


module.exports = { findAll };
