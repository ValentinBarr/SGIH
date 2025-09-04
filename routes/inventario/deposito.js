const express = require('express');
const listTemplate = require('../../views/inventario/depositos/list');
const formTemplate = require('../../views/inventario/depositos/form');
const detailTemplate = require('../../views/inventario/depositos/detail');

const router = express.Router();

// In-memory data store
const depositos = [];

// List deposits
router.get('/inventario/depositos', (req, res) => {
  res.send(listTemplate({ depositos }));
});

// New deposit form
router.get('/inventario/depositos/new', (req, res) => {
  const codigo = `DEP-${depositos.length + 1}`;
  res.send(
    formTemplate({
      deposito: { codigo, nombre: '', tipo: '', activo: true },
      action: '/inventario/depositos/new'
    })
  );
});

// Create deposit
router.post('/inventario/depositos/new', (req, res) => {
  const { tipo, codigo, nombre, activo } = req.body;
  const nuevo = {
    id: depositos.length + 1,
    tipo,
    codigo,
    nombre,
    activo: activo === 'on',
    ultimaFechaConteo: new Date().toISOString().slice(0, 10),
    stock: [],
    parametros: [],
    movimientos: []
  };
  depositos.push(nuevo);
  res.redirect('/inventario/depositos');
});

// Edit form
router.get('/inventario/depositos/:id/edit', (req, res) => {
  const deposito = depositos.find((d) => d.id === parseInt(req.params.id));
  if (!deposito) {
    return res.redirect('/inventario/depositos');
  }
  res.send(
    formTemplate({
      deposito,
      action: `/inventario/depositos/${deposito.id}/edit`
    })
  );
});

// Save edit
router.post('/inventario/depositos/:id/edit', (req, res) => {
  const deposito = depositos.find((d) => d.id === parseInt(req.params.id));
  if (!deposito) {
    return res.redirect('/inventario/depositos');
  }
  const { tipo, codigo, nombre, activo } = req.body;
  deposito.tipo = tipo;
  deposito.codigo = codigo;
  deposito.nombre = nombre;
  deposito.activo = activo === 'on';
  res.redirect('/inventario/depositos');
});

// Detail view
router.get('/inventario/depositos/:id', (req, res) => {
  const deposito = depositos.find((d) => d.id === parseInt(req.params.id));
  if (!deposito) {
    return res.redirect('/inventario/depositos');
  }
  const filter = req.query.q || '';
  const stock = deposito.stock.filter((s) =>
    s.articulo.toLowerCase().includes(filter.toLowerCase())
  );
  res.send(detailTemplate({ deposito: { ...deposito, stock }, filter }));
});

// Add parameter
router.post('/inventario/depositos/:id/parametros', (req, res) => {
  const deposito = depositos.find((d) => d.id === parseInt(req.params.id));
  if (!deposito) {
    return res.redirect('/inventario/depositos');
  }
  const { articulo, valor } = req.body;
  deposito.parametros.push({ articulo, valor });
  res.redirect(`/inventario/depositos/${deposito.id}`);
});

// Add movement
router.post('/inventario/depositos/:id/movimientos', (req, res) => {
  const deposito = depositos.find((d) => d.id === parseInt(req.params.id));
  if (!deposito) {
    return res.redirect('/inventario/depositos');
  }
  const { descripcion } = req.body;
  deposito.movimientos.push({
    fecha: new Date().toISOString().slice(0, 10),
    descripcion
  });
  res.redirect(`/inventario/depositos/${deposito.id}`);
});

module.exports = router;
