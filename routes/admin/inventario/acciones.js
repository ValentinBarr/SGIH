const express = require('express');
const router = express.Router();

const ActionsRepo = require('../../../repositories/inv-actions');

// Páginas
const entradaView = require('../../../views/admin/products/inventario/entrada_form');
const salidaView = require('../../../views/admin/products/inventario/salida_form');


// ----- Acciones (páginas) -----
router.get('/inventarios/acciones/entrada', async (req, res) => {
  const deps = await ActionsRepo.getDepositos();
  res.send(entradaView({ deps, depSel: req.query.depId || '' }));
});

// ----- APIs para combos -----
router.get('/api/depositos', async (_req, res) => {
  const deps = await ActionsRepo.getDepositos();
  res.json(
    deps.map(d => ({
      id: d.id_dep,
      nombre: d.nombre_dep,
      tipo: d.TipoDeposito?.nombre_tipoDep || ''
    }))
  );
});

router.get('/api/depositos/:depId/productos', async (req, res) => {
  const prods = await ActionsRepo.getProductosPermitidos(req.params.depId);
  res.json(
    prods.map(p => ({
      id: p.id_prod,
      nombre: p.nombre_prod,
      uom: p.unidad_prod,
      tipo: p.tipo_prod,
      precio: p.precio_prod ? Number(p.precio_prod) : null
    }))
  );
});

router.get('/inventarios/acciones/salida', async (req, res) => {
  const deps = await ActionsRepo.getDepositos();
  res.send(salidaView({ deps, depSel: req.query.depId || '' }));
});



module.exports = router;
