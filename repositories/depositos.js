const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// =============================
// Obtener todos los depósitos con su tipo
// =============================
async function getDepositos() {
  return prisma.deposito.findMany({
    include: {
      TipoDeposito: {
        select: { nombre_tipoDep: true },
      },
    },
    orderBy: { nombre_dep: 'asc' },
  });
}

// =============================
// Info básica de un depósito
// =============================
async function getDeposito(depId) {
  return prisma.deposito.findUnique({
    where: { id_dep: Number(depId) },
    include: {
      TipoDeposito: {
        select: {
          nombre_tipoDep: true,
          esPuntoDeVenta_tipoDep: true,
          esConsumoInterno_tipoDep: true,
        },
      },
    },
  });
}

// =============================
// Stock actual por producto en un depósito (con paginación)
// =============================
async function getStockGrid(depId, page = 1, limit = 10) {
  depId = Number(depId);
  const offset = (page - 1) * limit;

  const total = await prisma.productoDeposito.count({
    where: { id_dep: depId },
  });

  // Productos del depósito
  const prods = await prisma.productoDeposito.findMany({
    where: { id_dep: depId },
    include: {
      Producto: {
        select: { id_prod: true, nombre_prod: true, stockeable_prod: true },
      },
    },
    orderBy: [{ Producto: { nombre_prod: 'asc' } }],
    skip: offset,
    take: limit,
  });

  // Todos los movimientos relacionados
  const movs = await prisma.detalleMovimiento.findMany({
    where: { ProductoDeposito: { id_dep: depId } },
    include: { Movimiento: { include: { TipoMovimiento: true } } },
  });

  // Cálculo de stock
  const stockMap = new Map();
  for (const m of movs) {
    const dir = m.Movimiento?.TipoMovimiento?.direccion;
    if (!dir) continue;
    const signo = dir === 'OUT' ? -1 : 1;
    stockMap.set(
      m.id_prodDep,
      (stockMap.get(m.id_prodDep) || 0) + signo * Number(m.cantidad)
    );
  }

  const grid = prods.map((pd) => {
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
      estado,
    };
  });

  return {
    grid,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

// =============================
// Obtener stock actual de un producto en un depósito
// =============================
async function getStockActual(id_prodDep) {
  const movs = await prisma.detalleMovimiento.findMany({
    where: { id_prodDep: Number(id_prodDep) },
    include: { Movimiento: { include: { TipoMovimiento: true } } },
  });

  const stock = movs.reduce((acc, m) => {
    const dir = m.Movimiento?.TipoMovimiento?.direccion;

    // --- ¡CORRECCIÓN AQUÍ! ---
    // Ignoramos movimientos sin dirección (null/undefined),
    // igual que lo hace getStockGrid
    if (!dir) {
      return acc;
    }

    // Usamos la misma lógica que getStockGrid
    // (Todo lo que no es 'OUT', es 'IN')
    const signo = (dir === 'OUT') ? -1 : 1;
    return acc + (signo * Number(m.cantidad));
    // --- Fin de la corrección ---

  }, 0);

  return stock;
}

// =============================
// Movimientos por depósito (todos: entradas y salidas)
// =============================
async function getMovimientos(depId, limit = 10) {
  return prisma.movimiento.findMany({
    where: { id_dep: Number(depId) },
    include: {
      TipoMovimiento: true,
      TipoComprobante: true,
      Detalles: {
        include: {
          ProductoDeposito: {
            include: { Producto: { select: { nombre_prod: true } } },
          },
        },
      },
    },
    orderBy: { fecha_mov: 'desc' },
    take: limit,
  });
}

// =============================
// Obtener depósitos activos
// =============================
async function getDepositosActivos() {
  return prisma.deposito.findMany({
    where: { activo_dep: true },
    orderBy: { nombre_dep: 'asc' },
  });
}

// =============================
// Tipos de Comprobantes activos
// =============================
async function getTiposComprobantes() {
  return prisma.tipoComprobante.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  });
}

// =============================
// Exportar funciones
// =============================
module.exports = {
  getDepositos,
  getDeposito,
  getStockGrid,
  getStockActual,
  getMovimientos,
  getDepositosActivos,
  getTiposComprobantes,
};
