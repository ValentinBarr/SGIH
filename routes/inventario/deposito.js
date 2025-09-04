const express = require('express');
const listTemplate = require('../../views/inventario/depositos/list');
const formTemplate = require('../../views/inventario/depositos/form');
const detailTemplate = require('../../views/inventario/depositos/detail');
const depositoRepo = require('../../repositorio/deposito');

const router = express.Router();

const parametros = {};
const movimientos = {};

// List deposits
router.get('/inventario/depositos', async (req, res) => {
  const depositos = await depositoRepo.list();
  res.send(listTemplate({ depositos }));
});

// New deposit form
router.get('/inventario/depositos/new', async (req, res) => {
  const tipos = await depositoRepo.listTipos();
  const codigo = `DEP-${Date.now()}`;
  res.send(
    formTemplate({
      deposito: { codigo, nombre: '', tipo_id: '', activo: true },
      tipos,
      action: '/inventario/depositos/new'
    })
  );
});

// Create deposit
router.post('/inventario/depositos/new', async (req, res) => {
  const { tipo_id, codigo, nombre, activo } = req.body;
  await depositoRepo.create({
    tipo_id,
    nombre,
    activo: activo === 'on'
  });
  res.redirect('/inventario/depositos');
});

// Edit form
router.get('/inventario/depositos/:id/edit', async (req, res) => {
  const id = parseInt(req.params.id);
  const deposito = await depositoRepo.getById(id);
  if (!deposito) {
    return res.redirect('/inventario/depositos');
  }
  const tipos = await depositoRepo.listTipos();
  res.send(
    formTemplate({
      deposito,
      tipos,
      action: `/inventario/depositos/${id}/edit`
    })
  );
});

// Save edit
router.post('/inventario/depositos/:id/edit', async (req, res) => {
  const id = parseInt(req.params.id);
  const { tipo_id, codigo, nombre, activo } = req.body;
  await depositoRepo.update(id, {
    tipo_id,
    nombre,
    activo: activo === 'on'
  });
  res.redirect('/inventario/depositos');
});

// Detail view
router.get('/inventario/depositos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const deposito = await depositoRepo.getById(id);
  if (!deposito) {
    return res.redirect('/inventario/depositos');
  }
  const filter = req.query.q || '';
  deposito.stock = [];
  deposito.parametros = parametros[id] || [];
  deposito.movimientos = movimientos[id] || [];
  res.send(detailTemplate({ deposito, filter }));
});

// Add parameter
router.post('/inventario/depositos/:id/parametros', (req, res) => {
  const id = parseInt(req.params.id);
  const { articulo, valor } = req.body;
  parametros[id] = parametros[id] || [];
  parametros[id].push({ articulo, valor });
  res.redirect(`/inventario/depositos/${id}`);
});

// Add movement
router.post('/inventario/depositos/:id/movimientos', (req, res) => {
  const id = parseInt(req.params.id);
  const { descripcion } = req.body;
  movimientos[id] = movimientos[id] || [];
  movimientos[id].push({
    fecha: new Date().toISOString().slice(0, 10),
    descripcion
  });
  res.redirect(`/inventario/depositos/${id}`);
});

module.exports = router;
