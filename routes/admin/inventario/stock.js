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
router.post('/inventarios/stock/entrada', express.json(), async (req, res) => {
  try {
    const { depId, items, nota } = req.body || {};
    if (!depId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: 'Datos inválidos' });
    }
    const doc = await StockRepo.registrarEntrada({
      depId: Number(depId),
      items: items.map(i => ({ prodId: Number(i.prodId), qty: Number(i.qty), costo: i.costo ? Number(i.costo) : null })),
      nota: nota || 'Entrada manual'
    });
    res.json({ ok: true, docId: doc.docId_compInv });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error registrando entrada' });
  }
});

// Acción: Transferencia sugerida (POSTED)
router.post('/inventarios/stock/transfer', express.json(), async (req, res) => {
  try {
    const { fromDepId, toDepId, items, nota } = req.body || {};
    if (!fromDepId || !toDepId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: 'Datos inválidos' });
    }
    const result = await StockRepo.registrarTransferencia({
      fromDepId: Number(fromDepId),
      toDepId: Number(toDepId),
      items: items.map(i => ({ prodId: Number(i.prodId), qty: Number(i.qty) })),
      nota: nota || 'Transferencia sugerida'
    });
    if (!result.ok) return res.status(400).json(result);
    res.json({ ok: true, docId: result.doc.docId_compInv });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error registrando transferencia' });
  }
});

module.exports = router;
