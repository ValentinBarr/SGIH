const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const ESTADOS_ORDEN = {
  BORRADOR: 'BORRADOR',
  PENDIENTE: 'PENDIENTE',
  CERRADA: 'CERRADA',
  ANULADA: 'ANULADA',
};

const getTipoOrdenId = async () => {
  const tipo = await prisma.tipoComprobante.findFirst({
    where: { codigo: 'OC' },
    select: { id_tipoComp: true },
  });
  if (!tipo) throw new Error('Tipo de comprobante "OC" no encontrado');
  return tipo.id_tipoComp;
};

class OrdenesRepository {
  async list({ q, id_prov, estado } = {}) {
    const where = { id_tipoComp: await getTipoOrdenId() };
    if (q) where.numero_comp = { contains: q, mode: 'insensitive' };
    if (id_prov) where.id_prov = Number(id_prov);
    if (estado) where.estado = estado;

    return prisma.comprobante.findMany({
      where,
      include: { Proveedor: true },
      orderBy: [{ fecha: 'desc' }, { id_comp: 'desc' }],
    });
  }

  async getById(id_comp) {
    const orden = await prisma.comprobante.findUnique({
      where: { id_comp: Number(id_comp) },
      include: {
        Proveedor: true,
        Detalles: { include: { Producto: true } },
        FormaPago: true,
      },
    });
    if (orden) orden.detalles = orden.Detalles;
    return orden;
  }

async create(data) {
  const { detalles, ...header } = data;
  const total = detalles.reduce(
    (sum, d) => sum + (Number(d.cantidad) || 0) * (Number(d.precio) || 0),
    0
  );

  const tipoOC = await getTipoOrdenId();

  return prisma.$transaction(async (tx) => {
    let numeroComp = header.numero_comp;

    // 🔹 Si no viene número, lo generamos automáticamente
    if (!numeroComp || numeroComp.trim() === '') {
      const lastOrden = await tx.comprobante.findFirst({
        where: {
          id_tipoComp: tipoOC,
          letra_comp: header.letra_comp || 'A',
          sucursal_comp: header.sucursal_comp || '0001',
        },
        orderBy: { numero_comp: 'desc' },
      });

      const nextNumber = lastOrden
        ? String(Number(lastOrden.numero_comp) + 1).padStart(8, '0')
        : '00000001';

      numeroComp = nextNumber;
    }

    const orden = await tx.comprobante.create({
      data: {
        ...header,
        id_tipoComp: tipoOC,
        numero_comp: numeroComp,
        total_comp: Number(total.toFixed(2)),
        saldo_comp: Number(total.toFixed(2)),
        estado: header.estado || ESTADOS_ORDEN.BORRADOR,
      },
    });

    if (detalles.length > 0) {
      await tx.detalleComprobante.createMany({
        data: detalles.map((d) => ({
          id_comp: orden.id_comp,
          id_prod: Number(d.id_prod),
          cantidad: Number(d.cantidad),
          precio: Number(d.precio),
        })),
      });
    }

    return orden;
  });
}


  async update(id_comp, data) {
    const ordenExistente = await prisma.comprobante.findUnique({
      where: { id_comp: Number(id_comp) },
    });
    if (!ordenExistente) throw new Error('Orden no encontrada');
    if (ordenExistente.estado !== ESTADOS_ORDEN.BORRADOR) {
      throw new Error(`No se puede editar una orden en estado ${ordenExistente.estado}`);
    }

    const { detalles, ...header } = data;
    const total = detalles.reduce(
      (sum, d) => sum + (Number(d.cantidad) || 0) * (Number(d.precio) || 0),
      0
    );

    return prisma.$transaction(async (tx) => {
      const orden = await tx.comprobante.update({
        where: { id_comp: Number(id_comp) },
        data: {
          ...header,
          fecha: new Date(header.fecha), // 👈 corrección
          total_comp: Number(total.toFixed(2)),
          saldo_comp: Number(total.toFixed(2)),
        },
      });

      await tx.detalleComprobante.deleteMany({ where: { id_comp } });

      if (detalles.length > 0) {
        await tx.detalleComprobante.createMany({
          data: detalles.map((d) => ({
            id_comp: orden.id_comp,
            id_prod: Number(d.id_prod),
            cantidad: Number(d.cantidad),
            precio: Number(d.precio),
          })),
        });
      }

      return orden;
    });
  }

  async changeEstado(id_comp, nuevoEstado) {
    return prisma.comprobante.update({
      where: { id_comp: Number(id_comp) },
      data: { estado: nuevoEstado },
    });
  }

  getTransicionesValidas(estado) {
    const transiciones = {
      BORRADOR: ['PENDIENTE', 'ANULADA'],
      PENDIENTE: ['CERRADA', 'ANULADA'],
      CERRADA: [],
      ANULADA: [],
    };
    return transiciones[estado] || [];
  }

  getActiveProveedores() {
    return prisma.proveedor.findMany({
      where: { activo_prov: true },
      orderBy: { nombre_prov: 'asc' },
    });
  }

  getActiveProductos() {
    return prisma.producto.findMany({
      where: { activo_prod: true },
      orderBy: { nombre_prod: 'asc' },
    });
  }

  getEstadosDisponibles() {
    return Object.values(ESTADOS_ORDEN);
  }


getActiveFormasPago() {
  return prisma.formaPago.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  });
}


}

module.exports = {
  OrdenesRepo: new OrdenesRepository(),
  ESTADOS_ORDEN,
};
