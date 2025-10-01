// repositories/pagos.js

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
   * Obtener las facturas de un proveedor con saldo pendiente.
   * Asumimos que las facturas son un tipo de 'Comprobante' con código 'FAC'.
   */
  async getFacturasPendientes(id_prov) {
    const tipoFactura = await prisma.tipoComprobante.findFirst({ where: { codigo: 'FAC' } });
    if (!tipoFactura) throw new Error('Tipo de comprobante "FAC" no encontrado.');
    
    return prisma.comprobante.findMany({
      where: {
        id_prov: Number(id_prov),
        id_tipoComp: tipoFactura.id_tipoComp,
        saldo_comp: { gt: 0 }, // gt = greater than (mayor que)
      },
      orderBy: { fecha: 'asc' },
    });
  }

  /**
   * Crear una nueva Orden de Pago.
   * Esta es la operación más compleja.
   */
  async create(data) {
    const { id_prov, id_fp, fecha_pago, observacion, detalles } = data;

    // 1. Validar que haya detalles y que el total coincida
    if (!detalles || detalles.length === 0) {
      throw new Error('Debe seleccionar al menos una factura para pagar.');
    }
    const total_pago = detalles.reduce((sum, item) => sum + Number(item.monto_pagar), 0);

    return prisma.$transaction(async (tx) => {
      // 2. Crear el encabezado del Pago
      const nuevoPago = await tx.pago.create({
        data: {
          id_prov: Number(id_prov),
          id_fp: Number(id_fp),
          fecha_pago: new Date(fecha_pago),
          observacion,
          total_pago,
        },
      });

      // 3. Iterar sobre los detalles para actualizar saldos y crear los DetallePago
      for (const detalle of detalles) {
        const monto = Number(detalle.monto_pagar);
        const id_comp = Number(detalle.id_comp);

        // Crear el registro en DetallePago
        await tx.detallePago.create({
          data: {
            id_pago: nuevoPago.id_pago,
            id_comp: id_comp,
            monto_pagar: monto,
          },
        });

        // Actualizar el saldo del Comprobante (la factura)
        await tx.comprobante.update({
          where: { id_comp: id_comp },
          data: {
            saldo_comp: {
              decrement: monto,
            },
          },
        });
      }
      return nuevoPago;
    });
  }
  
  // --- Métodos auxiliares para los formularios ---
  
  async getActiveProveedores() {
    return prisma.proveedor.findMany({ where: { activo_prov: true }, orderBy: { nombre_prov: 'asc' } });
  }

  async getActiveFormasDePago() {
    return prisma.formaPago.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
  }
}

module.exports = {
  PagosRepo: new PagosRepository(),
};