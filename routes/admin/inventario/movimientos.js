const express = require('express');
const ProductsRepo = require('../../../repositories/products.js');
const MovRepo = require('../../../repositories/movimientos.js');

const movimientosTemplate = require('../../../views/admin/products/inventario/movimientos/movimientos.js');

const router = express.Router();

router.get('/inventarios/movimientos', async (req, res) => {
  try {
    const {
      q = '',
      depId = '',
      prodId = '',
      dominio = '',
      direccion = '',
      from = '',
      to = '',
    } = req.query;

    const [movs, productos] = await Promise.all([
      MovRepo.findAll({ q, depId, prodId, dominio, direccion, from, to }),
      ProductsRepo.getAll(), // para combo de producto
    ]);

    res.send(
      movimientosTemplate({
        basePath: '/inventarios/movimientos',
        filters: { q, depId, prodId, dominio, direccion, from, to },
        movimientos: movs,
        productos,
      })
    );
  } catch (err) {
    console.error('GET /inventarios/movimientos', err);
    res.status(500).send('Error al cargar movimientos');
  }
});



module.exports = router;