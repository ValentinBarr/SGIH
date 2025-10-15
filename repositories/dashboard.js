// repositories/dashboard.js
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class DashboardRepository {
  /**
   * Obtiene las métricas principales para el dashboard.
   */
  async getStats() {
    // 1. Contar productos con stock por debajo del mínimo
    const lowStockCount = await prisma.productoDeposito.count({
      where: {
        stock_prodDep: {
          lt: prisma.productoDeposito.fields.minimo_prodDep,
        },
      },
    });

    // 2. Contar facturas de proveedores con estado 'EMITIDA' (pendientes de pago)
    const pendingInvoicesCount = await prisma.comprobante.count({
      where: {
        estado: 'EMITIDA',
        TipoComprobante: { codigo: 'FAC' },
      },
    });

    // 3. Sumar el total de las órdenes de pago de los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPayments = await prisma.pago.aggregate({
      _sum: {
        total_pago: true,
      },
      where: {
        fecha_pago: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      lowStockCount,
      pendingInvoicesCount,
      recentPaymentsTotal: recentPayments._sum.total_pago || 0,
    };
  }
}

module.exports = new DashboardRepository();