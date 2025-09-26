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
  // =============================
  // LISTADO
  // =============================
  async list({ q, id_prov, estado } = {}) {
    const where = { id_tipoComp: await getTipoOrdenId() };
    if (q) where.numero_comp = { contains: q, mode: 'insensitive' };
    if (id_prov) where.id_prov = Number(id_prov);
    if (estado) where.estado = estado;

    return prisma.comprobante.findMany({
      where,
      include: {
        Proveedor: true,
        FormaPago: true, // 👈 importante para mostrar nombre en la vista
      },
      orderBy: [{ fecha: 'desc' }, { id_comp: 'desc' }],
    });
  }

  // =============================
  // GET BY ID
  // =============================
  async getById(id_comp) {
    const orden = await prisma.comprobante.findUnique({
      where: { id_comp: Number(id_comp) },
      include: {
        Proveedor: true,
        FormaPago: true, // 👈 también acá
        Detalles: { include: { Producto: true } },
      },
    });
    if (orden) orden.detalles = orden.Detalles;
    return orden;
  }

  // =============================
  // CREAR ORDEN
  // =============================
  async create(data) {
    const { detalles, ...header } = data;
    const total = detalles.reduce(
      (sum, d) => sum + (Number(d.cantidad) || 0) * (Number(d.precio) || 0),
      0
    );

    const tipoOC = await getTipoOrdenId();

    return prisma.$transaction(async (tx) => {
      let numeroComp = header.numero_comp;

      // 🔹 Autoincremento del número
      if (!numeroComp || numeroComp.trim() === '') {
        const lastOrden = await tx.comprobante.findFirst({
          where: {
            id_tipoComp: tipoOC,
            letra_comp: header.letra_comp || 'A',
            sucursal_comp: header.sucursal_comp || '0001',
          },
          orderBy: { id_comp: 'desc' }, // usamos id_comp para mayor seguridad
          select: { numero_comp: true },
        });

        let next = '00000001';
        if (lastOrden && lastOrden.numero_comp) {
          const lastNum = parseInt(lastOrden.numero_comp, 10);
          if (!isNaN(lastNum)) {
            next = String(lastNum + 1).padStart(8, '0');
          }
        }
        numeroComp = next;
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

  // =============================
  // EDITAR ORDEN
  // =============================
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
          fecha: new Date(header.fecha),
          total_comp: Number(total.toFixed(2)),
          saldo_comp: Number(total.toFixed(2)),
        },
      });

      await tx.detalleComprobante.deleteMany({ where: { id_comp: Number(id_comp) } });

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

  // =============================
  // CAMBIAR ESTADO
  // =============================
  async changeEstado(id_comp, nuevoEstado) {
    return prisma.comprobante.update({
      where: { id_comp: Number(id_comp) },
      data: { estado: nuevoEstado },
    });
  }

  // =============================
  // TRANSICIONES
  // =============================
  getTransicionesValidas(estado) {
    const transiciones = {
      BORRADOR: ['PENDIENTE', 'ANULADA'],
      PENDIENTE: ['CERRADA', 'ANULADA'],
      CERRADA: [],
      ANULADA: [],
    };
    return transiciones[estado] || [];
  }

  // =============================
  // HELPERS
  // =============================
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
    return Object.values(ESTADOS_ORDEN);
  }
}

module.exports = {
  OrdenesRepo: new OrdenesRepository(),
  ESTADOS_ORDEN,
};
