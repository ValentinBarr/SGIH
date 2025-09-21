const express = require('express');
const ProveedoresRepo = require('../../../repositories/proveedores.js');
const listTemplate = require('../../../views/admin/products/compras/proveedores/index.js');
const renderForm   = require('../../../views/admin/products/compras/proveedores/form.js');

const router = express.Router();

// Listado + filtros
router.get('/compras/proveedores', async (req, res) => {
  const { q, activo } = req.query;
  const proveedores = await ProveedoresRepo.list({ q, activo });
  res.send(listTemplate({
    proveedores,
    filters: { q: q || '', activo: activo || '' },
    basePath: '/compras/proveedores'
  }));
});

// Nuevo (form)
router.get('/compras/proveedores/new', (req, res) => {
  res.send(renderForm({ mode: 'new', proveedor: { activo_prov: true } }));
});

// Crear
router.post('/compras/proveedores/new', async (req, res) => {
  const b = req.body || {};
  const data = {
    nombre_prov: b.nombre_prov,
    cuit_prov: b.cuit_prov,
    direccion_prov: b.direccion_prov,
    telefono_prov: b.telefono_prov,
    email_prov: b.email_prov,
    activo_prov: !!b.activo_prov
  };

  const errors = {};
  if (!data.nombre_prov || !data.nombre_prov.trim()) errors.nombre_prov = 'El nombre es obligatorio';
  if (!data.cuit_prov || !data.cuit_prov.trim()) errors.cuit_prov = 'El CUIT es obligatorio';

  if (Object.keys(errors).length) {
    return res.status(400).send(renderForm({ mode: 'new', proveedor: b, errors }));
  }

  try {
    await ProveedoresRepo.add(data);
    res.redirect('/compras/proveedores?ok=created');
  } catch (err) {
    res.status(400).send(renderForm({ mode: 'new', proveedor: b, errors: { general: err.message } }));
  }
});

// Editar (form)
router.get('/compras/proveedores/:id/edit', async (req, res) => {
  const prov = await ProveedoresRepo.getById(req.params.id);
  if (!prov) return res.status(404).send('Proveedor no encontrado');
  res.send(renderForm({ mode: 'edit', proveedor: prov }));
});

// Actualizar
router.post('/compras/proveedores/:id/edit', async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const data = {
    nombre_prov: b.nombre_prov,
    cuit_prov: b.cuit_prov,
    direccion_prov: b.direccion_prov,
    telefono_prov: b.telefono_prov,
    email_prov: b.email_prov,
    activo_prov: !!b.activo_prov
  };

  try {
    await ProveedoresRepo.update(id, data);
    res.redirect('/compras/proveedores?ok=updated');
  } catch (err) {
    res.status(400).send(renderForm({
      mode: 'edit',
      proveedor: { id_prov: id, ...b },
      errors: { general: err.message }
    }));
  }
});

// Activar/Desactivar
router.post('/compras/proveedores/:id/toggle', async (req, res) => {
  try {
    await ProveedoresRepo.toggleActive(Number(req.params.id));
    res.redirect('/compras/proveedores?ok=toggled');
  } catch (err) {
    res.status(400).send(`No se pudo actualizar el proveedor. Error: ${err.message}`);
  }
});

module.exports = router;
