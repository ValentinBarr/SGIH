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

  // Traemos los productos parametrizados en el depósito
  const prods = await prisma.productoDeposito.findMany({
    where: { id_dep: depId },
    include: {
      Producto: { 
        select: { id_prod: true, nombre_prod: true, stockeable_prod: true }
      }
    },
    orderBy: [{ Producto: { nombre_prod: 'asc' } }]
  });

  // Movimientos confirmados desde comprobantes (POSTED y que afectan stock)
  const movs = await prisma.detalleComprobante.findMany({
    where: {
      ProductoDeposito: { id_dep: depId },   // 👈 antes estaba fijo en 1
      Comprobante: {
        estado: "POSTED",
        TipoComprobante: { afectaStock: true }
      }
    },
    include: {
      Comprobante: {
        include: {
          TipoComprobante: {
            include: { TipoMovimiento: true }
          }
        }
      }
    }
  });

  // Construimos stock por productoDepósito
  const stockMap = new Map();
  for (const m of movs) {
    const dir = m.Comprobante?.TipoComprobante?.TipoMovimiento?.direccion;
    if (!dir) continue;
    const sign = dir === 'OUT' ? -1 : 1;
    stockMap.set(
      m.id_prodDep,
      (stockMap.get(m.id_prodDep) || 0) + sign * Number(m.cantidad)
    );
  }

  // Resultado para la vista
  return prods.map(pd => {
    const p = pd.Producto;
    const stock = stockMap.get(pd.id_prodDep) || 0;
    const minimo = pd.minimo_prodDep ?? null;
    const estado =
      p.stockeable_prod && minimo != null && stock < Number(minimo)
        ? 'Bajo'
        : 'OK';

    return {
      id_prodDep: pd.id_prodDep,
      id_prod: p.id_prod,
      nombre: p.nombre_prod,
      stock: Number(stock),
      estado
    };
  });

}

// Movimientos de consumo interno por depósito
async function getConsumosInternos(depId, limit = 10) {
  return prisma.comprobante.findMany({
    where: {
      id_dep: Number(depId),
      estado: "POSTED",
      TipoComprobante: { codigo: "CON" } // 👈 solo consumos internos
    },
    include: {
      TipoComprobante: true,
      Detalles: {
        include: {
          ProductoDeposito: {
            include: { Producto: { select: { nombre_prod: true } } }
          }
        }
      }
    },
    orderBy: { fecha: 'desc' },
    take: limit
  });
}

async function getDepositosActivos() {
  return prisma.deposito.findMany({
    where: { activo_dep: true },
    orderBy: { nombre_dep: 'asc' }
  });
}


module.exports = { getDepositos, getDeposito, getStockGrid, getConsumosInternos, getDepositosActivos };
