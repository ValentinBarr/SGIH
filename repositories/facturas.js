const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const ESTADOS_FACTURA = {
  BORRADOR: 'BORRADOR',
  EMITIDA: 'EMITIDA',
  PAGADA: 'PAGADA',
  ANULADA: 'ANULADA',
};

const getTipoFacturaId = async () => {
  const tipo = await prisma.tipoComprobante.findFirst({
    where: { codigo: 'FAC' },
    select: { id_tipoComp: true },
  });
  if (!tipo) throw new Error('Tipo de comprobante "FAC" no encontrado');
  return tipo.id_tipoComp;
};

class FacturasRepository {
  async list({ q, id_prov, estado } = {}) {
    const where = { id_tipoComp: await getTipoFacturaId() };
    if (q) where.numero_comp = { contains: q, mode: 'insensitive' };
    if (id_prov) where.id_prov = Number(id_prov);
    if (estado) where.estado = estado;

    return prisma.comprobante.findMany({
      where,
      include: { Proveedor: true, FormaPago: true },
      orderBy: [{ fecha: 'desc' }, { id_comp: 'desc' }],
    });
  }

  async getById(id_comp) {
    const factura = await prisma.comprobante.findUnique({
      where: { id_comp: Number(id_comp) },
      include: {
        Proveedor: true,
        Detalles: { include: { Producto: true } },
        FormaPago: true,
      },
    });
    if (factura) factura.detalles = factura.Detalles;
    return factura;
  }

  async create(data) {
    const { detalles, ...header } = data;
    const total = detalles.reduce(
      (sum, d) => sum + (Number(d.cantidad) || 0) * (Number(d.precio) || 0),
      0
    );

    const tipoFC = await getTipoFacturaId();

    return prisma.$transaction(async (tx) => {
      let numeroComp = header.numero_comp;

      // 🔹 Autonumeración segura
      if (!numeroComp || numeroComp.trim() === '') {
const last = await tx.comprobante.findFirst({
  where: {
    id_tipoComp: tipoFC,
    letra_comp: header.letra_comp || 'A',
    sucursal_comp: header.sucursal_comp || '0001',
  },
  orderBy: {
    id_comp: 'desc', // siempre el último insertado
  },
  select: { numero_comp: true },
});

let next = '00000001';
if (last && last.numero_comp) {
  const lastNum = parseInt(last.numero_comp, 10);
  if (!isNaN(lastNum)) {
    next = String(lastNum + 1).padStart(8, '0');
  }
}
numeroComp = next;

      }

      const factura = await tx.comprobante.create({
        data: {
          ...header,
          id_tipoComp: tipoFC,
          numero_comp: numeroComp,
          total_comp: Number(total.toFixed(2)),
          saldo_comp: Number(total.toFixed(2)),
          estado: header.estado || ESTADOS_FACTURA.BORRADOR,
        },
      });

      if (detalles.length > 0) {
        await tx.detalleComprobante.createMany({
          data: detalles.map((d) => ({
            id_comp: factura.id_comp,
            id_prod: Number(d.id_prod),
            cantidad: Number(d.cantidad),
            precio: Number(d.precio),
          })),
        });
      }

      return factura;
    });
  }

  async update(id_comp, data) {
    const facturaExistente = await prisma.comprobante.findUnique({
      where: { id_comp: Number(id_comp) },
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
        where: { id_comp: Number(id_comp) },
        data: {
          ...header,
          fecha: new Date(header.fecha),
          total_comp: Number(total.toFixed(2)),
          saldo_comp: Number(total.toFixed(2)),
        },
      });

      await tx.detalleComprobante.deleteMany({ where: { id_comp } });

      if (detalles.length > 0) {
        await tx.detalleComprobante.createMany({
          data: detalles.map((d) => ({
            id_comp: factura.id_comp,
            id_prod: Number(d.id_prod),
            cantidad: Number(d.cantidad),
            precio: Number(d.precio),
          })),
        });
      }

      return factura;
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
      BORRADOR: ['EMITIDA', 'ANULADA'],
      EMITIDA: ['PAGADA', 'ANULADA'],
      PAGADA: [],
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

  getActiveFormasPago() {
    return prisma.formaPago.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  getEstadosDisponibles() {
    return Object.values(ESTADOS_FACTURA);
  }
}

module.exports = {
  FacturasRepo: new FacturasRepository(),
  ESTADOS_FACTURA,
};
