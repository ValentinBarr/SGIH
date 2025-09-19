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

  // Movimientos confirmados desde comprobantes (POSTED)
const movs = await prisma.detalleComprobante.findMany({
  where: {
    ProductoDeposito: { id_dep: 1 },
    Comprobante: {
      estado: "POSTED",
      TipoComprobante: { afectaStock: true }
    }
  },
  select: {
    id_prodDep: true,
    cantidad: true,
    Comprobante: {
      select: {
        TipoComprobante: {
          select: {
            TipoMovimiento: {
              select: { direccion: true }
            }
          }
        }
      }
    }
  }
});


  // Construimos stock por productoDepósito
  const stockMap = new Map();
  for (const m of movs) {
    const dir = m.TipoComprobante.TipoMovimiento.direccion; // IN / OUT
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
      id_prod: p.id_prod,
      nombre: p.nombre_prod,
      stock: Number(stock),
      estado
    };
  });
}

module.exports = { getDepositos, getDeposito, getStockGrid };
