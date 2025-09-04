const express = require('express');
const listTemplate = require('../../views/inventario/depositos/list');
const formTemplate = require('../../views/inventario/depositos/form');
const detailTemplate = require('../../views/inventario/depositos/detail');
const db = require('../../db');

const router = express.Router();

const parametros = {};
const movimientos = {};

// List deposits
router.get('/inventario/depositos', (req, res) => {
  db.getDepositos((err, rows) => {
    const depositos = (rows || []).map((d) => ({
      id: d.id,
      codigo: d.codigo,
      nombre: d.nombre,
      tipo: d.tipo,
      activo: !!d.activo,
      ultimaFechaConteo: d.ultima_fecha_conteo
    }));
    res.send(listTemplate({ depositos }));
  });
});

// New deposit form
router.get('/inventario/depositos/new', (req, res) => {
  db.getTiposDeposito((err, tipos) => {
    const codigo = `DEP-${Date.now()}`;
    res.send(
      formTemplate({
        deposito: { codigo, nombre: '', tipo_id: '', activo: true },
        tipos: tipos || [],
        action: '/inventario/depositos/new'
      })
    );
  });
});

// Create deposit
router.post('/inventario/depositos/new', (req, res) => {
  const { tipo_id, codigo, nombre, activo } = req.body;
  db.createDeposito(
    { tipo_id, codigo, nombre, activo: activo === 'on' },
    () => res.redirect('/inventario/depositos')
  );
});

// Edit form
router.get('/inventario/depositos/:id/edit', (req, res) => {
  const id = parseInt(req.params.id);
  db.getDepositoById(id, (err, deposito) => {
    if (!deposito) {
      return res.redirect('/inventario/depositos');
    }
    db.getTiposDeposito((err2, tipos) => {
      res.send(
        formTemplate({
          deposito: {
            id: deposito.id,
            codigo: deposito.codigo,
            nombre: deposito.nombre,
            tipo_id: deposito.tipo_id,
            activo: !!deposito.activo
          },
          tipos: tipos || [],
          action: `/inventario/depositos/${deposito.id}/edit`
        })
      );
    });
  });
});

// Save edit
router.post('/inventario/depositos/:id/edit', (req, res) => {
  const id = parseInt(req.params.id);
  const { tipo_id, codigo, nombre, activo } = req.body;
  db.updateDeposito(
    id,
    { tipo_id, codigo, nombre, activo: activo === 'on' },
    () => res.redirect('/inventario/depositos')
  );
});

// Detail view
router.get('/inventario/depositos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.getDepositoById(id, (err, deposito) => {
    if (!deposito) {
      return res.redirect('/inventario/depositos');
    }
    const filter = req.query.q || '';
    deposito.stock = [];
    deposito.parametros = parametros[id] || [];
    deposito.movimientos = movimientos[id] || [];
    res.send(detailTemplate({ deposito, filter }));
  });
});

// Add parameter
router.post('/inventario/depositos/:id/parametros', (req, res) => {
  const id = parseInt(req.params.id);
  db.getDepositoById(id, (err, deposito) => {
    if (!deposito) {
      return res.redirect('/inventario/depositos');
    }
    const { articulo, valor } = req.body;
    parametros[id] = parametros[id] || [];
    parametros[id].push({ articulo, valor });
    res.redirect(`/inventario/depositos/${id}`);
  });
});

// Add movement
router.post('/inventario/depositos/:id/movimientos', (req, res) => {
  const id = parseInt(req.params.id);
  db.getDepositoById(id, (err, deposito) => {
    if (!deposito) {
      return res.redirect('/inventario/depositos');
    }
    const { descripcion } = req.body;
    movimientos[id] = movimientos[id] || [];
    movimientos[id].push({
      fecha: new Date().toISOString().slice(0, 10),
      descripcion
    });
    res.redirect(`/inventario/depositos/${id}`);
  });
});

module.exports = router;
