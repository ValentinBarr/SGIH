// routes/admin/inventario/depositos.js
const express = require('express');
const router = express.Router();

const Repo = require('../../../repositories/depositos');
const listView = require('../../../views/admin/products/inventario/depositos/list');
const detailView = require('../../../views/admin/products/inventario/depositos/detail');

// LISTADO EN TARJETAS
router.get('/inventarios/depositos', async (_req, res) => {
  try {
    const deps = await Repo.getDepositos();
    res.send(listView({ deps }));
  } catch (e) {
    console.error(e);
    res.status(500).send('No se pudo cargar depósitos');
  }
});

// DETALLE (solo lectura: producto, stock, estado)
router.get('/inventarios/depositos/:depId', async (req, res) => {
  try {
    const { depId } = req.params;
    const dep = await Repo.getDeposito(depId);
    const grid = await Repo.getStockGrid(depId);

    res.send(detailView({ dep, grid }));
  } catch (e) {
    console.error(e);
    res.status(500).send('No se pudo cargar el depósito');
  }
});

module.exports = router;
