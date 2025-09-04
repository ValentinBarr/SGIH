// repositories/pos.js
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/** Productos vendibles con precio */
async function getVendibles() {
  return prisma.producto.findMany({
    where: { vendible_prod: true, activo_prod: true },
    select: {
      id_prod: true,
      nombre_prod: true,
      unidad_prod: true,
      precio_prod: true,
      descuentaStockVenta_prod: true,
    },
    orderBy: { nombre_prod: 'asc' },
  });
}

/** Depósitos marcados como Punto de Venta */
async function getPosDepositos() {
  return prisma.deposito.findMany({
    where: { TipoDeposito: { esPuntoDeVenta_tipoDep: true, activo_tipoDep: true } },
    select: { id_dep: true, nombre_dep: true },
    orderBy: { nombre_dep: 'asc' },
  });
}

/** Id de TipoMovimiento para VENTA OUT */
async function getVentaOutTipoMovId() {
  const tm = await prisma.tipoMovimiento.findFirst({
    where: { Dominio: 'VENTA', Direccion: 'OUT', Activo: true },
    select: { TipoMovimientoId: true },
  });
  if (!tm) throw new Error('No existe TipoMovimiento VENTA OUT');
  return tm.TipoMovimientoId;
}

/** Stock actual POSTED por producto+depósito */
async function getStock(prodId, depId) {
  const movs = await prisma.movimientoInventario.findMany({
    where: {
      id_prod: Number(prodId),
      id_dep: Number(depId),
      Comprobante: { estado_compInv: 'POSTED' },
    },
    include: { TipoMovimiento: { select: { Direccion: true } } },
  });
  return movs.reduce((acc, m) => {
    const sign = m.TipoMovimiento.Direccion === 'OUT' ? -1 : 1;
    return acc + Number(m.cantidad_movInv) * sign;
  }, 0);
}

/** Valida carrito [{prodId, qty}] contra stock en depId.
 *  Retorna { ok: boolean, faltantes: [{prodId, nombre, stock, qty}] }
 */
async function validateCart(depId, items) {
  const faltantes = [];
  for (const it of items) {
    const stock = await getStock(it.prodId, depId);
    if (stock < it.qty) {
      const p = await prisma.producto.findUnique({ where: { id_prod: it.prodId } });
      faltantes.push({
        prodId: it.prodId,
        nombre: p?.nombre_prod || `#${it.prodId}`,
        stock,
        qty: it.qty,
      });
    }
  }
  return { ok: faltantes.length === 0, faltantes };
}

/** Crea comprobante de VENTA (POSTED) con líneas OUT; asume que ya fue validado */
async function createVenta({ depId, items, nota = 'Ticket POS' }) {
  const tipoMovId = await getVentaOutTipoMovId();

  // Cabecera
  const doc = await prisma.comprobanteInventario.create({
    data: {
      docType_compInv: 'VENTA',
      fecha_compInv: new Date(),
      estado_compInv: 'POSTED',
      fromDepId_compInv: Number(depId),
      toDepId_compInv: null,
      observacion_compInv: nota,
    },
  });

  // Líneas
  for (const it of items) {
    await prisma.movimientoInventario.create({
      data: {
        docId_compInv: doc.docId_compInv,
        id_prod: it.prodId,
        id_dep: Number(depId),
        tipoMovId_movInv: tipoMovId,
        cantidad_movInv: it.qty,
        costoUnitario_movInv: null,
        uom_movInv: 'UN',
        nota_movInv: 'Venta mostrador',
      },
    });
  }

  return doc;
}

module.exports = {
  getVendibles,
  getPosDepositos,
  validateCart,
  createVenta,
};
