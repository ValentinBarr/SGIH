// repositories/remitos.js

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const ESTADOS_REMITO = {
  BORRADOR: 'BORRADOR',
  PENDIENTE: 'PENDIENTE', 
  RECIBIDO: 'RECIBIDO',
  ANULADO: 'ANULADO'
};

const getTipoRemitoId = async () => {
  const tipoRemito = await prisma.tipoComprobante.findFirst({
    where: { codigo: 'REM' },
    select: { id_tipoComp: true }
  });
  if (!tipoRemito) {
    throw new Error('Tipo de comprobante "REM" no encontrado. Asegúrate de que exista en la base de datos.');
  }
  return tipoRemito.id_tipoComp;
};

const getDepositoCentralId = async () => {
  const depCentral = await prisma.deposito.findFirst({
    where: { nombre_dep: 'Depósito Central', activo_dep: true },
    select: { id_dep: true }
  });
  if (!depCentral) {
    throw new Error('El "Depósito Central" activo no fue encontrado. Por favor, créalo en la sección de Depósitos.');
  }
  return depCentral.id_dep;
};


class RemitosRepository {
  async list({ q, id_prov, estado } = {}) {
    try {
      const where = { id_tipoComp: await getTipoRemitoId() };
      if (q) where.numero_comp = { contains: q, mode: 'insensitive' };
      if (id_prov) where.id_prov = Number(id_prov);
      if (estado) where.estado = estado;
      
      return prisma.comprobante.findMany({
        where,
        include: { Proveedor: true, Deposito: true },
        orderBy: [{ fecha: 'desc' }, { id_comp: 'desc' }],
      });
    } catch (error) {
      console.error('❌ Error al listar remitos:', error);
      throw error;
    }
  }

  async getById(id_comp) {
    try {
      const remito = await prisma.comprobante.findUnique({
        where: { id_comp: Number(id_comp) },
        include: {
          Proveedor: true, Deposito: true,
          Detalles: { include: { Producto: true } },
        },
      });
      if (remito) {
        remito.detalles = remito.Detalles; // Simplificar acceso
      }
      return remito;
    } catch (error) {
      console.error(`❌ Error al obtener remito ${id_comp}:`, error);
      throw error;
    }
  }

  async create(data) {
    try {
      const { detalles, ...headerData } = data;
      const total_comp = detalles.reduce((sum, item) => sum + ((Number(item.cantidad) || 0) * (Number(item.precio) || 0)), 0);

      return prisma.$transaction(async (tx) => {
        const remito = await tx.comprobante.create({
          data: {
            ...headerData,
            id_dep: await getDepositoCentralId(),
            id_tipoComp: await getTipoRemitoId(),
            total_comp: Number(total_comp.toFixed(2)),
            saldo_comp: Number(total_comp.toFixed(2)),
            estado: headerData.estado || ESTADOS_REMITO.BORRADOR,
          },
        });

        if (detalles && detalles.length > 0) {
          await tx.detalleComprobante.createMany({
            data: detalles.map(det => ({
              id_comp: remito.id_comp,
              id_prod: Number(det.id_prod),
              cantidad: Number(det.cantidad),
              precio: Number(det.precio),
            })),
          });
        }
        return remito;
      });
    } catch (error) {
      console.error('❌ Error al crear remito:', error);
      throw error;
    }
  }

  async update(id_comp, data) {
    try {
      const remitoExistente = await prisma.comprobante.findUnique({ where: { id_comp: Number(id_comp) }});
      if (!remitoExistente) throw new Error('El remito no existe');
      if (remitoExistente.estado !== ESTADOS_REMITO.BORRADOR) {
        throw new Error(`No se puede editar un remito en estado ${remitoExistente.estado}.`);
      }

      const { detalles, ...headerData } = data;
      const total_comp = detalles.reduce((sum, item) => sum + ((Number(item.cantidad) || 0) * (Number(item.precio) || 0)), 0);

      return prisma.$transaction(async (tx) => {
        const remito = await tx.comprobante.update({
          where: { id_comp: Number(id_comp) },
          data: {
            ...headerData,
            total_comp: Number(total_comp.toFixed(2)),
            saldo_comp: Number(total_comp.toFixed(2)),
          },
        });

        await tx.detalleComprobante.deleteMany({ where: { id_comp: Number(id_comp) } });

        if (detalles && detalles.length > 0) {
          await tx.detalleComprobante.createMany({
            data: detalles.map(det => ({
              id_comp: remito.id_comp,
              id_prod: Number(det.id_prod),
              cantidad: Number(det.cantidad),
              precio: Number(det.precio),
            })),
          });
        }
        return remito;
      });
    } catch (error) {
      console.error(`❌ Error al actualizar remito ${id_comp}:`, error);
      throw error;
    }
  }

  async changeEstado(id_comp, nuevoEstado) { /* ... (código sin cambios) ... */ }
  getTransicionesValidas(estadoActual) { /* ... (código sin cambios) ... */ }

  getActiveProveedores() { return prisma.proveedor.findMany({ where: { activo_prov: true }, orderBy: { nombre_prov: 'asc' } }); }
  getActiveDepositos() { return prisma.deposito.findMany({ where: { activo_dep: true }, orderBy: { nombre_dep: 'asc' } }); }
  getActiveProductos() { return prisma.producto.findMany({ where: { activo_prod: true }, orderBy: { nombre_prod: 'asc' } }); }
  getEstadosDisponibles() { return Object.values(ESTADOS_REMITO); }
}

module.exports = {
  RemitosRepo: new RemitosRepository(),
  ESTADOS_REMITO: ESTADOS_REMITO,
};