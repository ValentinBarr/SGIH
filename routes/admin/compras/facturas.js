// routes/admin/products/compras/facturas.js
const express = require('express');
const router = express.Router();

const { FacturasRepo, ESTADOS_FACTURA } = require('../../../repositories/facturas');
const listView = require('../../../views/admin/products/compras/facturas/index');
const formView = require('../../../views/admin/products/compras/facturas/form');
const detailView = require('../../../views/admin/products/compras/facturas/detail');

// helper parseDetails igual al de ordenes
const parseFacturaDetails = (body) => { /* igual que parseOrdenDetails */ };

// LISTADO
router.get('/compras/facturas', async (req, res) => {
  const { q, id_prov, estado } = req.query;
  const facturas = await FacturasRepo.list({ q, id_prov, estado });
  const proveedores = await FacturasRepo.getActiveProveedores();
  const estados = FacturasRepo.getEstadosDisponibles();

  res.send(listView({ facturas, proveedores, estados, filters: { q, id_prov, estado }, basePath: '/compras/facturas' }));
});

// NUEVA
router.get('/compras/facturas/new', async (req, res) => {
  const proveedores = await FacturasRepo.getActiveProveedores();
  const productos = await FacturasRepo.getActiveProductos();
  const estados = FacturasRepo.getEstadosDisponibles();
  const formasPago = await FacturasRepo.getActiveFormasPago();

  res.send(formView({
    mode: 'new',
    factura: { fecha: new Date().toISOString().split('T')[0], detalles: [], estado: ESTADOS_FACTURA.BORRADOR },
    proveedores, productos, estados, formasPago, errors: {}
  }));
});

// DETALLE
router.get('/compras/facturas/:id', async (req, res) => {
  const factura = await FacturasRepo.getById(req.params.id);
  if (!factura) return res.status(404).send('Factura no encontrada');
  const transicionesValidas = FacturasRepo.getTransicionesValidas(factura.estado);
  const puedeEditar = factura.estado === ESTADOS_FACTURA.BORRADOR;
  res.send(detailView({ factura, transicionesValidas, puedeEditar }));
});

// CREATE
router.post('/compras/facturas/new', async (req, res) => {
  const detalles = parseFacturaDetails(req.body);
  const data = { ...req.body, detalles };
  await FacturasRepo.create(data);
  res.redirect('/compras/facturas?success=created');
});

// UPDATE
router.post('/compras/facturas/:id/edit', async (req, res) => {
  const detalles = parseFacturaDetails(req.body);
  const data = { ...req.body, detalles };
  await FacturasRepo.update(req.params.id, data);
  res.redirect('/compras/facturas?success=updated');
});

// CAMBIAR ESTADO
router.post('/compras/facturas/:id/estado', async (req, res) => {
  await FacturasRepo.changeEstado(req.params.id, req.body.nuevo_estado);
  res.redirect('/compras/facturas?success=estado_cambiado');
});

module.exports = router;
 