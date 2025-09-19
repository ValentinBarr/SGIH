// routes/admin/inventario/depositos.js
const express = require('express');
const router = express.Router();

const Repo = require('../../../repositories/depositos');
const listView = require('../../../views/admin/products/inventario/depositos/list');
const detailView = require('../../../views/admin/products/inventario/depositos/detail');

// =============================
// LISTADO EN TARJETAS
// =============================
router.get('/inventarios/depositos', async (_req, res) => {
  try {
    const deps = await Repo.getDepositos();
    res.send(listView({ deps }));
  } catch (e) {
    console.error(e);
    res.status(500).send('No se pudo cargar depósitos');
  }
});

// DETALLE DEL DEPÓSITO
router.get('/inventarios/depositos/:depId', async (req, res) => {
  try {
    const { depId } = req.params;

    const dep = await Repo.getDeposito(depId);
    const grid = await Repo.getStockGrid(depId);

    // 👇 SOLO consumos internos
    const movimientos = await Repo.getConsumosInternos(depId, 20);

    const depositos = await Repo.getDepositosActivos();

    const productos = grid.map(r => ({
      id_prodDep: r.id_prodDep,
      nombre: r.nombre
    }));

    res.send(detailView({ dep, grid, movimientos, depositos, productos }));
  } catch (e) {
    console.error('💥 ERROR en detalle depósito:', e);
    res.status(500).send('No se pudo cargar el depósito');
  }
});


// =============================
// REGISTRAR TRANSFERENCIA (solo Central)
// =============================
router.post('/inventarios/depositos/:depId/movimientos', async (req, res) => {
  try {
    const { depId } = req.params;
    const { id_dep_destino, ...productosData } = req.body;

    // ✅ Buscar tipo de comprobante TRF
    const tipoTrf = await prisma.tipoComprobante.findFirst({
      where: { codigo: 'TRF' }
    });
    if (!tipoTrf) throw new Error("No existe el tipo de comprobante TRF");

    // ✅ Crear encabezado del comprobante
    const comp = await prisma.comprobante.create({
      data: {
        id_tipoComp: tipoTrf.id_tipoComp,
        fecha: new Date(),
        estado: "POSTED",
        id_dep: Number(depId), // depósito origen (Central)
        observacion: `Transferencia a depósito ${id_dep_destino}`
      }
    });

    // ✅ Procesar los productos enviados en el formulario
    for (const [key, value] of Object.entries(productosData)) {
      if (key.startsWith("producto_")) {
        const index = key.split("_")[1];
        const id_prodDep = Number(value);
        const cantidad = Number(productosData[`cantidad_${index}`]);

        // Verificar stock disponible en el depósito origen
        const stock = await prisma.detalleComprobante.aggregate({
          _sum: { cantidad: true },
          where: {
            id_prodDep,
            Comprobante: {
              estado: "POSTED",
              TipoComprobante: { afectaStock: true }
            }
          }
        });

        const stockActual = stock._sum.cantidad || 0;
        if (stockActual < cantidad) {
          throw new Error(`Stock insuficiente para producto ${id_prodDep}`);
        }

        // Crear detalle de salida
        await prisma.detalleComprobante.create({
          data: {
            id_comp: comp.id_comp,
            id_prodDep,
            cantidad
          }
        });

        // ⚠️ OJO: todavía falta registrar la ENTRADA en el depósito destino.
        // Por ahora solo hacemos el comprobante de salida (Central).
      }
    }

    res.redirect(`/inventarios/depositos/${depId}`);
  } catch (e) {
    console.error("💥 ERROR EN TRANSFERENCIA:", e);
    res.status(400).send("No se pudo registrar la transferencia: " + e.message);
  }
});



module.exports = router;
