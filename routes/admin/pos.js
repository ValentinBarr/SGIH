// routes/pos.js
const express = require('express');
const router = express.Router();

const POSRepo = require('../../repositories/pos');
const ProductsRepo = require('../../repositories/products'); // por si querés reutilizar
const view = require('../../views/admin/products/pos');

router.get('/pos', async (req, res) => {
  try {
    const [productos, depositos] = await Promise.all([
      POSRepo.getVendibles(),
      POSRepo.getPosDepositos(),
    ]);
    res.send(view({ productos, depositos }));
  } catch (e) {
    console.error(e);
    res.status(500).send('No se pudo cargar el POS');
  }
});

// Validación rápida de stock (AJAX)
router.post('/pos/check', express.json(), async (req, res) => {
  try {
    const { depId, items } = req.body || {};
    const parsed = (items || []).map((i) => ({
      prodId: Number(i.prodId),
      qty: Number(i.qty),
    }));
    const result = await POSRepo.validateCart(Number(depId), parsed);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error validando stock' });
  }
});

// Checkout (crea VENTA POSTED)
router.post('/pos/checkout', express.json(), async (req, res) => {
  try {
    const { depId, items, nota } = req.body || {};
    const parsed = (items || []).map((i) => ({
      prodId: Number(i.prodId),
      qty: Number(i.qty),
    }));

    const validation = await POSRepo.validateCart(Number(depId), parsed);
    if (!validation.ok) {
      return res.status(400).json(validation);
    }

    const doc = await POSRepo.createVenta({
      depId: Number(depId),
      items: parsed,
      nota: nota || 'Ticket POS',
    });

    res.json({ ok: true, docId: doc.docId_compInv });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'No se pudo procesar la venta' });
  }
});

module.exports = router;
