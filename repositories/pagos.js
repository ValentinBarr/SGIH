const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class PagosRepository {
  /**
   * Listar todas las órdenes de pago.
   */
  async list({ q, id_prov } = {}) {
    const where = {};
    if (id_prov) where.id_prov = Number(id_prov);
    if (q) where.observacion = { contains: q, mode: 'insensitive' };
    
    return prisma.pago.findMany({
      where,
      include: { Proveedor: true, FormaPago: true },
      orderBy: { fecha_pago: 'desc' },
    });
  }

  /**
   * Obtener una orden de pago por su ID con todos los detalles.
   */
  async getById(id_pago) {
    return prisma.pago.findUnique({
      where: { id_pago: Number(id_pago) },
      include: {
        Proveedor: true,
        FormaPago: true,
        DetallesPagos: {
          include: { Comprobante: true },
        },
      },
    });
  }

  /**
   * Obtener las facturas de un proveedor con saldo pendiente y estado EMITIDA.
   */
  async getFacturasPendientes(id_prov) {
    const tipoFactura = await prisma.tipoComprobante.findFirst({ where: { codigo: 'FAC' } });
    if (!tipoFactura) throw new Error('Tipo de comprobante "FAC" no encontrado.');
    
    return prisma.comprobante.findMany({
      where: {
        id_prov: Number(id_prov),
        id_tipoComp: tipoFactura.id_tipoComp,
        saldo_comp: { gt: 0 },
        estado: 'EMITIDA', // 🔹 Solo facturas emitidas
      },
      orderBy: { fecha: 'asc' },
    });
  }

  /**
   * Crear una nueva Orden de Pago.
   */
  async create(data) {
    const { id_prov, id_fp, fecha_pago, observacion, detalles } = data;

    if (!detalles || detalles.length === 0) {
      throw new Error('Debe seleccionar al menos una factura para pagar.');
    }

    const total_pago = detalles.reduce((sum, item) => sum + Number(item.monto_pagar), 0);

    return prisma.$transaction(async (tx) => {
      // 1. Crear el encabezado del Pago
      const nuevoPago = await tx.pago.create({
        data: {
          id_prov: Number(id_prov),
          id_fp: Number(id_fp),
          fecha_pago: new Date(fecha_pago),
          observacion,
          total_pago,
        },
      });

      // 2. Iterar sobre los detalles
      for (const detalle of detalles) {
        const monto = Number(detalle.monto_pagar);
        const id_comp = Number(detalle.id_comp);

        // Crear el registro en DetallePago
        await tx.detallePago.create({
          data: {
            id_pago: nuevoPago.id_pago,
            id_comp,
            monto_pagar: monto,
          },
        });

        // Buscar factura actual
        const factura = await tx.comprobante.findUnique({
          where: { id_comp },
        });

        if (!factura) {
          throw new Error(`Factura con ID ${id_comp} no encontrada`);
        }

        // Actualizar saldo
        const nuevoSaldo = factura.saldo_comp - monto;

        await tx.comprobante.update({
          where: { id_comp },
          data: {
            saldo_comp: nuevoSaldo,
            estado: nuevoSaldo <= 0 ? 'PAGADA' : factura.estado, // 🔹 si llega a 0 => PAGADA
          },
        });
      }

      return nuevoPago;
    });
  }

  // --- Métodos auxiliares ---
  async getActiveProveedores() {
    return prisma.proveedor.findMany({
      where: { activo_prov: true },
      orderBy: { nombre_prov: 'asc' },
    });
  }

  async getActiveFormasDePago() {
    return prisma.formaPago.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }
}

module.exports = {
  PagosRepo: new PagosRepository(),
};
