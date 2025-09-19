// repositories/stock.js
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/** Helpers */
async function getTipoMovId({ dominio, direccion }) {
  const tm = await prisma.tipoMovimiento.findFirst({
    where: { Dominio: dominio, Direccion: direccion, Activo: true },
    select: { TipoMovimientoId: true }
  });
  if (!tm) throw new Error(`No existe TipoMovimiento ${dominio} ${direccion}`);
  return tm.TipoMovimientoId;
}

/** Stock actual POSTED para un prod+dep */
async function getStockActual(prodId, depId) {
  const movs = await prisma.movimientoInventario.findMany({
    where: {
      id_prod: Number(prodId),
      id_dep: Number(depId),
      Comprobante: { estado_compInv: 'POSTED' }
    },
    include: { TipoMovimiento: { select: { Direccion: true } } }
  });
  return movs.reduce((acc, m) => {
    const sign = m.TipoMovimiento.Direccion === 'OUT' ? -1 : 1;
    return acc + Number(m.cantidad_movInv) * sign;
  }, 0);
}

/** Trae tablero de stock Producto×Depósito con mínimos/par/máx
 *  filters: { prodId, depId, onlyLow }
 */
async function getTablero(filters = {}) {
  const { prodId, depId, onlyLow } = filters;

  // base: combinaciones definidas en ProductoDeposito
  const combos = await prisma.productoDeposito.findMany({
    where: {
      ...(prodId ? { id_prod: Number(prodId) } : {}),
      ...(depId ? { id_dep: Number(depId) } : {}),
    },
    include: {
      Producto: true,
      Deposito: true
    },
    orderBy: [
      { id_dep: 'asc' },
      { id_prod: 'asc' }
    ]
  });

  const rows = [];
  for (const c of combos) {
    const stockActual = await getStockActual(c.id_prod, c.id_dep);
    const low = stockActual < Number(c.minimo_prodDep);
    if (onlyLow && !low) continue;

    rows.push({
      id_prod: c.id_prod,
      id_dep: c.id_dep,
      producto: c.Producto.nombre_prod,
      deposito: c.Deposito.nombre_dep,
      uom: c.Producto.unidad_prod,
      stock: stockActual,
      minimo: Number(c.minimo_prodDep),
      par: Number(c.parLevel_prodDep),
      max: c.maximo_prodDep == null ? null : Number(c.maximo_prodDep),
      estado: low ? 'BAJO' : 'OK'
    });
  }
  return rows;
}

/** Validar que haya stock suficiente en ORIGEN para items [{prodId, qty}] */
async function validarStockOrigen(depId, items) {
  const faltantes = [];
  for (const it of items) {
    const stock = await getStockActual(it.prodId, depId);
    if (stock < it.qty) {
      const p = await prisma.producto.findUnique({ where: { id_prod: it.prodId } });
      faltantes.push({ prodId: it.prodId, nombre: p?.nombre_prod || `#${it.prodId}`, stock, qty: it.qty });
    }
  }
  return { ok: faltantes.length === 0, faltantes };
}

/** Registrar ENTRADA (AJUSTE/COMPRA) POSTED
 * payload: { depId, items:[{prodId, qty, costo?}], dominio='AJUSTE', nota? }
 */
async function registrarEntrada({ depId, items, dominio = 'AJUSTE', nota = 'Entrada manual' }) {
  const tipoMovId = await getTipoMovId({ dominio, direccion: 'IN' });

  const doc = await prisma.comprobanteInventario.create({
    data: {
      docType_compInv: dominio === 'COMPRA' ? 'COMPRA' : 'AJUSTE',
      fecha_compInv: new Date(),
      estado_compInv: 'POSTED',
      fromDepId_compInv: null,
      toDepId_compInv: Number(depId),
      observacion_compInv: nota
    }
  });

  for (const it of items) {
    await prisma.movimientoInventario.create({
      data: {
        docId_compInv: doc.docId_compInv,
        id_prod: Number(it.prodId),
        id_dep: Number(depId),
        tipoMovId_movInv: tipoMovId,
        cantidad_movInv: Number(it.qty),
        costoUnitario_movInv: it.costo ?? null,
        uom_movInv: 'UN',
        nota_movInv: nota
      }
    });
  }
  return doc;
}

/** Registrar TRANSFERENCIA (OUT en origen + IN en destino) POSTED
 * payload: { fromDepId, toDepId, items:[{prodId, qty}], nota? }
 */
async function registrarTransferencia({ fromDepId, toDepId, items, nota = 'Transferencia sugerida' }) {
  if (Number(fromDepId) === Number(toDepId)) {
    throw new Error('Origen y destino deben ser distintos');
  }

  const check = await validarStockOrigen(Number(fromDepId), items);
  if (!check.ok) {
    return { ok: false, faltantes: check.faltantes };
  }

  const tmOut = await getTipoMovId({ dominio: 'TRANSFERENCIA', direccion: 'OUT' });
  const tmIn  = await getTipoMovId({ dominio: 'TRANSFERENCIA', direccion: 'IN' });

  const doc = await prisma.comprobanteInventario.create({
    data: {
      docType_compInv: 'TRANSFERENCIA',
      fecha_compInv: new Date(),
      estado_compInv: 'POSTED',
      fromDepId_compInv: Number(fromDepId),
      toDepId_compInv: Number(toDepId),
      observacion_compInv: nota
    }
  });

  // por cada ítem, OUT en origen + IN en destino
  for (const it of items) {
    await prisma.movimientoInventario.create({
      data: {
        docId_compInv: doc.docId_compInv,
        id_prod: Number(it.prodId),
        id_dep: Number(fromDepId),
        tipoMovId_movInv: tmOut,
        cantidad_movInv: Number(it.qty),
        uom_movInv: 'UN',
        nota_movInv: nota
      }
    });
    await prisma.movimientoInventario.create({
      data: {
        docId_compInv: doc.docId_compInv,
        id_prod: Number(it.prodId),
        id_dep: Number(toDepId),
        tipoMovId_movInv: tmIn,
        cantidad_movInv: Number(it.qty),
        uom_movInv: 'UN',
        nota_movInv: nota
      }
    });
  }

  return { ok: true, doc };
}

module.exports = {
  getTablero,
  registrarEntrada,
  registrarTransferencia,
  validarStockOrigen
};
