// routes/admin/pos.js
const express = require('express');
const router = express.Router();

const POSRepo = require('../../repositories/pos');
const view = require('../../views/admin/products/pos');

// Página POS
router.get('/pos', async (_req, res) => {
  const [productos, depositos] = await Promise.all([
    POSRepo.getVendibles(),
    POSRepo.getDepositosPOS()
  ]);
  res.send(view({ productos, depositos }));
});

// Checkout POS
router.post('/pos/checkout', express.json(), async (req, res) => {
  try {
    const { depId, items } = req.body; // items: [{prodId, qty, uom?}]
    if (!depId || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ ok: false, error: 'Datos incompletos' });
    }
    const result = await POSRepo.procesarVenta({
      fromDepId: Number(depId),
      items: items.map(i => ({ prodId: Number(i.prodId), qty: Number(i.qty), uom: i.uom }))
    });

    // BigInt -> number para JSON
    res.json({ ok: true, docId: Number(result.docId_compInv) });
  } catch (e) {
    console.error(e);
    if (e.faltantes) {
      return res.status(400).json({ ok: false, error: e.message, faltantes: e.faltantes.map(f => ({ ...f, stock: Number(f.stock) })) });
    }
    res.status(500).json({ ok: false, error: 'No se pudo procesar la venta' });
  }
});

module.exports = router;
