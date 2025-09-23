const express = require('express');
const MovRepo = require('../../../repositories/movimientos.js');
const movimientosTemplate = require('../../../views/admin/products/inventario/movimientos/movimientos.js');

const router = express.Router();

// =============================
// LISTADO DE MOVIMIENTOS (solo cabecera)
// =============================
router.get('/inventarios/movimientos', async (req, res) => {
  try {
    const {
      q = '',
      depId = '',
      direccion = '',
      from = '',
      to = '',
    } = req.query;

    // Solo cabecera (sin detalles)
    const movs = await MovRepo.findAll({ q, depId, direccion, from, to });

    res.send(
      movimientosTemplate({
        basePath: '/inventarios/movimientos',
        filters: { q, depId, direccion, from, to },
        movimientos: movs,
      })
    );
  } catch (err) {
    console.error('❌ GET /inventarios/movimientos', err);
    res.status(500).send('Error al cargar movimientos');
  }
});

// =============================
// DETALLE DE UN MOVIMIENTO (para modal vía AJAX)
// =============================
router.get('/inventarios/movimientos/:id', async (req, res) => {
  try {
    const mov = await MovRepo.findById(req.params.id);
    if (!mov) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    res.json(mov); // 🔹 devuelve cabecera + detalle productos
  } catch (err) {
    console.error('❌ GET /inventarios/movimientos/:id', err);
    res.status(500).json({ error: 'Error al obtener el movimiento' });
  }
});

module.exports = router;
