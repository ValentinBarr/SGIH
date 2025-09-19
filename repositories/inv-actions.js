// repositories/inv_actions.js
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/** Reglas simples de compatibilidad por nombre de TipoDeposito */
function allowedTypesFor(tipoNombre = '') {
  const t = (tipoNombre || '').toLowerCase();
  if (t.includes('minibar') || t.includes('bar') || t.includes('kiosco') || t.includes('punto')) {
    return ['VENDIBLE'];
  }
  if (t.includes('housekeeping')) {
    return ['LINEN', 'AMENITY', 'INSUMO'];
  }
  if (t.includes('cocina')) {
    return ['INSUMO'];
  }
  // Central / genérico: todo stockeable
  return ['VENDIBLE', 'INSUMO', 'AMENITY', 'LINEN', 'SERVICE'];
}

/** Todos los depósitos con su tipo */
async function getDepositos() {
  return prisma.deposito.findMany({
    include: { TipoDeposito: { select: { nombre_tipoDep: true } } },
    orderBy: { nombre_dep: 'asc' },
  });
}

/** Productos permitidos para un depósito (por tipo) */
async function getProductosPermitidos(depId) {
  const dep = await prisma.deposito.findUnique({
    where: { id_dep: Number(depId) },
    include: { TipoDeposito: true },
  });
  if (!dep) return [];
  const permitidos = allowedTypesFor(dep.TipoDeposito?.nombre_tipoDep);

  // sólo activos y stockeables; se puede sumar vendible/… si querés
  return prisma.producto.findMany({
    where: {
      activo_prod: true,
      stockeable_prod: true,
      tipo_prod: { in: permitidos },
    },
    select: {
      id_prod: true,
      nombre_prod: true,
      unidad_prod: true,
      tipo_prod: true,
      precio_prod: true,
    },
    orderBy: { nombre_prod: 'asc' },
  });
}

module.exports = { getDepositos, getProductosPermitidos, allowedTypesFor };
