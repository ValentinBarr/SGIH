// repositories/dashboard.js
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/** signo +1/-1 según dirección */
const sign = (dir) => (dir === 'OUT' ? -1 : 1);

/** stock actual POSTED para prod+dep */
async function stockProdDep(prodId, depId) {
  const movs = await prisma.movimientoInventario.findMany({
    where: { id_prod: prodId, id_dep: depId, Comprobante: { estado_compInv: 'POSTED' } },
    include: { TipoMovimiento: { select: { Direccion: true } } }
  });
  return movs.reduce((a, m) => a + Number(m.cantidad_movInv) * sign(m.TipoMovimiento.Direccion), 0);
}

/** Métrica: filas Producto×Depósito bajo mínimo (y breakdown por depósito) */
async function lowStockSummary() {
  const combos = await prisma.productoDeposito.findMany({
    include: { Deposito: true, Producto: { select: { nombre_prod: true } } }
  });

  let total = 0;
  const porDeposito = new Map(); // depId -> { nombre, count }
  const ejemplos = [];

  for (const c of combos) {
    const st = await stockProdDep(c.id_prod, c.id_dep);
    const min = Number(c.minimo_prodDep);
    if (st < min) {
      total++;
      const dep = porDeposito.get(c.id_dep) || { nombre: c.Deposito.nombre_dep, count: 0 };
      dep.count++;
      porDeposito.set(c.id_dep, dep);
      if (ejemplos.length < 6) ejemplos.push({ prod: c.Producto.nombre_prod, dep: c.Deposito.nombre_dep, stock: st, min });
    }
  }
  const breakdown = Array.from(porDeposito.entries()).map(([id, v]) => ({ id_dep: id, nombre_dep: v.nombre, count: v.count }))
    .sort((a,b)=>b.count-a.count);

  return { total, breakdown, ejemplos };
}

/** Rotación últimos N días: top salidas (absoluto) */
async function topSalidas(days = 30, top = 5) {
  const since = new Date(); since.setDate(since.getDate() - days);
  const rows = await prisma.movimientoInventario.findMany({
    where: {
      Comprobante: { estado_compInv: 'POSTED', fecha_compInv: { gte: since } },
      TipoMovimiento: { Direccion: 'OUT' }
    },
    include: { Producto: { select: { nombre_prod: true, unidad_prod: true } } }
  });

  const agg = new Map(); // prodId -> qty
  for (const m of rows) {
    const prev = agg.get(m.id_prod) || 0;
    agg.set(m.id_prod, prev + Number(m.cantidad_movInv));
  }
  const ordered = Array.from(agg.entries())
    .sort((a,b)=>b[1]-a[1])
    .slice(0, top);

  const byId = new Map(rows.map(r => [r.id_prod, r.Producto]));
  return ordered.map(([id, qty]) => ({
    id_prod: id,
    nombre_prod: byId.get(id)?.nombre_prod || `#${id}`,
    uom: byId.get(id)?.unidad_prod || '',
    qty
  }));
}

/** Depósitos con conteo vencido vs frecuencia */
async function depositosConConteoVencido() {
  const deps = await prisma.deposito.findMany({
    include: {
      TipoDeposito: { select: { nombre_tipoDep: true, frecuenciaConteoDias_tipoDep: true } },
      ProductoDepositos: { select: { ultimoConteo_prodDep: true } }
    }
  });

  const hoy = new Date();
  const vencidos = [];

  for (const d of deps) {
    const freq = d.TipoDeposito?.frecuenciaConteoDias_tipoDep || 0;
    if (!freq) continue;

    // Usamos el máximo “días desde último conteo” entre sus productos.
    const dias = (d.ProductoDepositos.length
      ? Math.max(...d.ProductoDepositos.map(p => {
          if (!p.ultimoConteo_prodDep) return Infinity;
          const delta = Math.ceil((hoy - new Date(p.ultimoConteo_prodDep)) / (1000*60*60*24));
          return delta;
        }))
      : Infinity);

    if (dias > freq) {
      vencidos.push({
        id_dep: d.id_dep,
        nombre_dep: d.nombre_dep,
        tipo: d.TipoDeposito?.nombre_tipoDep || '',
        diasSinConteo: (dias === Infinity ? 'sin registro' : dias)
      });
    }
  }
  return vencidos.sort((a,b)=> (b.diasSinConteo=== 'sin registro'? 9999:b.diasSinConteo) - (a.diasSinConteo=== 'sin registro'? 9999:a.diasSinConteo));
}

/** Últimos movimientos (feed corto) */
async function ultimosMovimientos(limit = 10) {
  const movs = await prisma.movimientoInventario.findMany({
    include: {
      Producto: { select: { nombre_prod: true } },
      Comprobante: { select: { fecha_compInv: true, docType_compInv: true, fromDepId_compInv: true, toDepId_compInv: true } },
      TipoMovimiento: { select: { Direccion: true } },
      Deposito: { select: { nombre_dep: true } }
    },
    orderBy: { lineaId_movInv: 'desc' },
    take: limit
  });

  return movs.map(m => ({
    fecha: m.Comprobante?.fecha_compInv,
    docType: m.Comprobante?.docType_compInv,
    producto: m.Producto?.nombre_prod,
    dep: m.Deposito?.nombre_dep,
    dir: m.TipoMovimiento?.Direccion,
    qty: Number(m.cantidad_movInv) * (m.TipoMovimiento?.Direccion === 'OUT' ? -1 : 1)
  }));
}

module.exports = {
  lowStockSummary,
  topSalidas,
  depositosConConteoVencido,
  ultimosMovimientos
};
