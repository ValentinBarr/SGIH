// repositories/pos.js
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/** Productos vendibles, activos (con precio si lo usás en pantalla) */
async function getVendibles() {
  return prisma.producto.findMany({
    where: { vendible_prod: true, activo_prod: true },
    select: {
      id_prod: true, nombre_prod: true, unidad_prod: true, tipo_prod: true,
      precio_prod: true
    },
    orderBy: { nombre_prod: 'asc' }
  });
}

/** Depósitos marcados como Punto de Venta */
async function getDepositosPOS() {
  return prisma.deposito.findMany({
    where: { TipoDeposito: { esPuntoDeVenta_tipoDep: true } },
    include: { TipoDeposito: { select: { nombre_tipoDep: true } } },
    orderBy: { nombre_dep: 'asc' }
  });
}

/** stock actual (solo POSTED) */
async function stockProdDep(id_prod, id_dep) {
  const rows = await prisma.movimientoInventario.findMany({
    where: { id_prod, id_dep, Comprobante: { estado_compInv: 'POSTED' } },
    select: { cantidad_movInv: true, TipoMovimiento: { select: { Direccion: true } } }
  });
  return rows.reduce((acc, r) => acc + Number(r.cantidad_movInv) * (r.TipoMovimiento.Direccion === 'OUT' ? -1 : 1), 0);
}

/** valida que haya stock suficiente para todas las líneas */
async function validarStock(fromDepId, items) {
  const faltantes = [];
  for (const it of items) {
    const st = await stockProdDep(it.prodId, fromDepId);
    if (st < it.qty) {
      const p = await prisma.producto.findUnique({ where: { id_prod: it.prodId }, select: { nombre_prod: true } });
      faltantes.push({ id_prod: it.prodId, nombre: p?.nombre_prod || `#${it.prodId}`, stock: st, qty: it.qty });
    }
  }
  return faltantes;
}

/** registra venta: crea doc + líneas OUT, estado POSTED */
async function procesarVenta({ fromDepId, items, nota = 'POS' }) {
  // tipo movimiento: VENTA OUT
  const tm = await prisma.tipoMovimiento.findFirst({
    where: { Dominio: 'VENTA', Direccion: 'OUT', Activo: true },
    select: { TipoMovimientoId: true }
  });
  if (!tm) throw new Error('No existe TipoMovimiento VENTA OUT activo');

  // validación stock
  const faltantes = await validarStock(fromDepId, items);
  if (faltantes.length) {
    const err = new Error('Stock insuficiente');
    err.faltantes = faltantes;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const doc = await tx.comprobanteInventario.create({
      data: {
        docType_compInv: 'VENTA',
        estado_compInv: 'POSTED',
        fromDepId_compInv: Number(fromDepId),
        observacion_compInv: nota
      }
    });

    for (const it of items) {
      await tx.movimientoInventario.create({
        data: {
          docId_compInv: doc.docId_compInv,
          id_prod: Number(it.prodId),
          id_dep: Number(fromDepId),
          tipoMovId_movInv: tm.TipoMovimientoId,
          cantidad_movInv: Number(it.qty),
          uom_movInv: it.uom || 'UN',
          nota_movInv: 'POS'
        }
      });
    }

    return { docId_compInv: doc.docId_compInv };
  });
}

module.exports = {
  getVendibles,
  getDepositosPOS,
  procesarVenta
};
