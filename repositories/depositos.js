// repositories/depositos.js
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Obtener todos los depósitos con su tipo
async function getDepositos() {
  return prisma.deposito.findMany({
    include: { TipoDeposito: { select: { nombre_tipoDep: true } } },
    orderBy: { nombre_dep: 'asc' }
  });
}

// Info básica de un depósito
async function getDeposito(depId) {
  return prisma.deposito.findUnique({
    where: { id_dep: Number(depId) },
    include: {
      TipoDeposito: {
        select: {
          nombre_tipoDep: true,
          esPuntoDeVenta_tipoDep: true,
          esConsumoInterno_tipoDep: true
        }
      }
    }
  });
}

// Stock actual por producto en un depósito
async function getStockGrid(depId) {
  depId = Number(depId);

  // Productos parametrizados en el depósito
  const prods = await prisma.productoDeposito.findMany({
    where: { id_dep: depId },
    include: { Producto: { select: { id_prod: true, nombre_prod: true, unidad_prod: true, stockeable_prod: true } } },
    orderBy: [{ Producto: { nombre_prod: 'asc' } }]
  });

  // Movimientos POSTED
  const movs = await prisma.movimientoInventario.findMany({
    where: { id_dep: depId, Comprobante: { estado_compInv: 'POSTED' } },
    select: {
      id_prod: true,
      cantidad_movInv: true,
      TipoMovimiento: { select: { Direccion: true } }
    }
  });

  const stockMap = new Map();
  for (const m of movs) {
    const sign = m.TipoMovimiento.Direccion === 'OUT' ? -1 : 1;
    stockMap.set(m.id_prod, (stockMap.get(m.id_prod) || 0) + sign * Number(m.cantidad_movInv));
  }

  return prods.map(pd => {
    const p = pd.Producto;
    const stock = stockMap.get(p.id_prod) || 0;
    const minimo = pd.minimo_prodDep ?? null;
    const estado = (p.stockeable_prod && minimo != null && stock < Number(minimo)) ? 'Bajo' : 'OK';

    return {
      id_prod: p.id_prod,
      nombre: p.nombre_prod,
      uom: p.unidad_prod || 'UN',
      stock: Number(stock),
      estado
    };
  });
}

module.exports = { getDepositos, getDeposito, getStockGrid };
