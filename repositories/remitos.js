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

class RemitosRepository {
  // 📌 Listar con filtros funcionando
  async list({ q, id_prov, estado } = {}) {
    try {
      const where = { id_tipoComp: await getTipoRemitoId() };

      if (q) {
        where.OR = [
          { numero_comp: { contains: q, mode: 'insensitive' } },
          { observacion: { contains: q, mode: 'insensitive' } }
        ];
      }
      if (id_prov) where.id_prov = Number(id_prov);
      if (estado) where.estado = estado;

      return prisma.comprobante.findMany({
        where,
        include: {
          Proveedor: true,
          FormaPago: true
        },
        orderBy: [{ fecha: 'desc' }, { id_comp: 'desc' }]
      });
    } catch (error) {
      console.error('❌ Error al listar remitos:', error);
      throw error;
    }
  }

  // 📌 Obtener por ID
  async getById(id_comp) {
    try {
      const remito = await prisma.comprobante.findUnique({
        where: { id_comp: Number(id_comp) },
        include: {
          Proveedor: true,
          FormaPago: true,
          Detalles: { include: { Producto: true } }
        }
      });
      if (remito) {
        remito.detalles = remito.Detalles;
      }
      return remito;
    } catch (error) {
      console.error(`❌ Error al obtener remito ${id_comp}:`, error);
      throw error;
    }
  }

  // 📌 Crear
  async create(data) {
    try {
      const { detalles, ...headerData } = data;
      const total_comp = detalles.reduce((sum, item) =>
        sum + ((Number(item.cantidad) || 0) * (Number(item.precio) || 0)), 0);

      return prisma.$transaction(async (tx) => {
        const remito = await tx.comprobante.create({
          data: {
            ...headerData,
            id_tipoComp: await getTipoRemitoId(),
            total_comp: Number(total_comp.toFixed(2)),
            saldo_comp: Number(total_comp.toFixed(2)),
            estado: headerData.estado || ESTADOS_REMITO.BORRADOR
          }
        });

        if (detalles && detalles.length > 0) {
          await tx.detalleComprobante.createMany({
            data: detalles.map(det => ({
              id_comp: remito.id_comp,
              id_prod: Number(det.id_prod),
              cantidad: Number(det.cantidad),
              precio: Number(det.precio)
            }))
          });
        }
        return remito;
      });
    } catch (error) {
      console.error('❌ Error al crear remito:', error);
      throw error;
    }
  }

  // 📌 Actualizar
async update(id_comp, data) {
  const facturaExistente = await prisma.comprobante.findUnique({
    where: { id_comp: Number(id_comp) }, // 👈 convertir acá
  });
  if (!facturaExistente) throw new Error('Factura no encontrada');
  if (facturaExistente.estado !== ESTADOS_FACTURA.BORRADOR) {
    throw new Error(`No se puede editar una factura en estado ${facturaExistente.estado}`);
  }

  const { detalles, ...header } = data;
  const total = detalles.reduce(
    (sum, d) => sum + (Number(d.cantidad) || 0) * (Number(d.precio) || 0),
    0
  );

  return prisma.$transaction(async (tx) => {
    const factura = await tx.comprobante.update({
      where: { id_comp: Number(id_comp) }, // 👈 también acá
      data: {
        ...header,
        fecha: new Date(header.fecha),
        total_comp: Number(total.toFixed(2)),
        saldo_comp: Number(total.toFixed(2)),
      },
    });

    await tx.detalleComprobante.deleteMany({
      where: { id_comp: Number(id_comp) }, // 👈 y acá
    });

    if (detalles.length > 0) {
      await tx.detalleComprobante.createMany({
        data: detalles.map((d) => ({
          id_comp: factura.id_comp, // este ya es int
          id_prod: Number(d.id_prod),
          cantidad: Number(d.cantidad),
          precio: Number(d.precio),
        })),
      });
    }

    return factura;
  });
}


  // 📌 Cambiar estado
  async changeEstado(id_comp, nuevoEstado) {
    try {
      return prisma.comprobante.update({
        where: { id_comp: Number(id_comp) },
        data: { estado: nuevoEstado }
      });
    } catch (error) {
      console.error(`❌ Error al cambiar estado del remito ${id_comp}:`, error);
      throw error;
    }
  }

  // 📌 Transiciones válidas
  getTransicionesValidas(estadoActual) {
    const transiciones = {
      BORRADOR: ['PENDIENTE', 'ANULADO'],
      PENDIENTE: ['RECIBIDO', 'ANULADO'],
      RECIBIDO: ['ANULADO'],
      ANULADO: []
    };
    return transiciones[estadoActual] || [];
  }

  // 📌 Helpers
  getActiveProveedores() {
    return prisma.proveedor.findMany({
      where: { activo_prov: true },
      orderBy: { nombre_prov: 'asc' }
    });
  }

  getActiveProductos() {
    return prisma.producto.findMany({
      where: { activo_prod: true },
      orderBy: { nombre_prod: 'asc' }
    });
  }

  getActiveFormasPago() {
    return prisma.formaPago.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
  }

  getEstadosDisponibles() {
    return Object.values(ESTADOS_REMITO);
  }
}

module.exports = {
  RemitosRepo: new RemitosRepository(),
  ESTADOS_REMITO
};