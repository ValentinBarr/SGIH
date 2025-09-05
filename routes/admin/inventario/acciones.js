const express = require('express');
const router = express.Router();

const ActionsRepo = require('../../../repositories/inv-actions');

// Páginas
const entradaView = require('../../../views/admin/products/inventario/entrada_form');
const transferView = require('../../../views/admin/products/inventario/transfer_form');

const conteoView = require('../../../views/admin/products/inventario/conteo_form');
const ajusteView = require('../../../views/admin/products/inventario/ajuste_form');

// ----- Acciones (páginas) -----
router.get('/inventarios/acciones/entrada', async (req, res) => {
  const deps = await ActionsRepo.getDepositos();
  res.send(entradaView({ deps }));
});

router.get('/inventarios/acciones/transfer', async (req, res) => {
  const deps = await ActionsRepo.getDepositos();
  res.send(transferView({ deps }));
});

// ----- APIs para combos -----
router.get('/api/depositos', async (_req, res) => {
  const deps = await ActionsRepo.getDepositos();
  res.json(deps.map(d => ({ id: d.id_dep, nombre: d.nombre_dep, tipo: d.TipoDeposito?.nombre_tipoDep || '' })));
});

router.get('/api/depositos/:depId/productos', async (req, res) => {
  const prods = await ActionsRepo.getProductosPermitidos(req.params.depId);
  res.json(prods.map(p => ({
    id: p.id_prod, nombre: p.nombre_prod, uom: p.unidad_prod,
    tipo: p.tipo_prod, precio: p.precio_prod ? Number(p.precio_prod) : null
  })));
});

// --- Página de Conteo ---
router.get('/inventarios/acciones/conteo', async (req, res) => {
  const deps = await ActionsRepo.getDepositos();
  res.send(conteoView({ deps, depSel: req.query.depId || '' }));
});

// --- Página de Ajuste ---
router.get('/inventarios/acciones/ajuste', async (req, res) => {
  const deps = await ActionsRepo.getDepositos();
  res.send(ajusteView({ deps, depSel: req.query.depId || '' }));
});


module.exports = router;
