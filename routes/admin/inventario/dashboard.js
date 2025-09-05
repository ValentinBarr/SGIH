const express = require('express');
const router = express.Router();

const DashRepo = require('../../../repositories/dashboard'); // el que ya tenías
const view = require('../../../views/admin/products/inventario/dashboard_lite');

router.get('/inventarios/dashboard', async (_req, res) => {
  try {
    const [low, vencidos, feed] = await Promise.all([
      DashRepo.lowStockSummary(),
      DashRepo.depositosConConteoVencido(),
      DashRepo.ultimosMovimientos(10),
    ]);
    res.send(view({ low, vencidos, feed }));
  } catch (e) {
    console.error(e);
    res.status(500).send('No se pudo cargar el dashboard');
  }
});

module.exports = router;
