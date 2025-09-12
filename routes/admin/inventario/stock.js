// routes/admin/inventario/stock.js
const express = require('express');
const router = express.Router();

const StockRepo = require('../../../repositories/stock');
const ProductosRepo = require('../../../repositories/products');
const view = require('../../../views/admin/products/inventario/stock');

// Visor de stock
router.get('/inventarios/stock', async (req, res) => {
  try {
    const { prodId = '', depId = '', onlyLow = '' } = req.query;
    const rows = await StockRepo.getTablero({
      prodId: prodId || undefined,
      depId: depId || undefined,
      onlyLow: onlyLow === '1'
    });
    const productos = await ProductosRepo.getAll(); // combo simple
    res.send(view({
      basePath: '/inventarios/stock',
      filters: { prodId, depId, onlyLow },
      rows,
      productos
    }));
  } catch (e) {
    console.error(e);
    res.status(500).send('No se pudo cargar el stock');
  }
});

// Acción: Registrar Entrada (POSTED)
// routes/admin/inventario/stock.js  (o donde tengas los endpoints)
router.post('/inventarios/stock/entrada', async (req, res) => {
  try {
    const { depId, items, nota } = req.body;
    const doc = await StockRepo.registrarEntrada({ depId, items, nota }); 
    // doc.docId_compInv es BigInt

    res.json({ ok: true, docId: Number(doc.docId_compInv) }); // <- convertir a number o string
  } catch (e) {
    console.error(e);
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.post('/inventarios/stock/transfer', async (req, res) => {
  try {
    const { fromDepId, toDepId, items, nota } = req.body;
    const doc = await StockRepo.registrarTransferencia({ fromDepId, toDepId, items, nota });

    res.json({ ok: true, docId: Number(doc.docId_compInv) });
  } catch (e) {
    console.error(e);
    // si traes faltantes, asegurate que sea serializable:
    // { faltantes: [{ id_prod, nombre, stock: Number(stock), qty }] }
    res.status(400).json({ ok: false, error: e.message, faltantes: req.faltantes||undefined });
  }
});

// Acción: Registrar Salida (POSTED)
router.post('/inventarios/stock/salida', async (req, res) => {
  try {
    const { depId, items, nota } = req.body;
    const result = await StockRepo.registrarSalida({ depId, items, nota });

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: 'Stock insuficiente', faltantes: result.faltantes });
    }

    res.json({ ok: true, docId: Number(result.doc.docId_compInv) });
  } catch (e) {
    console.error(e);
    res.status(400).json({ ok: false, error: e.message });
  }
});


module.exports = router;
