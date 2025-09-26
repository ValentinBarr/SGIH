const express = require('express');
const router = express.Router();

const { FacturasRepo, ESTADOS_FACTURA } = require('../../../repositories/facturas');
const listView = require('../../../views/admin/products/compras/facturas/index');
const formView = require('../../../views/admin/products/compras/facturas/form');
const detailView = require('../../../views/admin/products/compras/facturas/detail');

// --- Helpers ---
const parseFacturaDetails = (body) => {
  const detalles = [];
  if (!body.id_prod) return detalles;

  const ids = Array.isArray(body.id_prod) ? body.id_prod : [body.id_prod];
  const cantidades = Array.isArray(body.cantidad) ? body.cantidad : [body.cantidad];
  const precios = Array.isArray(body.precio) ? body.precio : [body.precio];

  for (let i = 0; i < ids.length; i++) {
    const id_prod = parseInt(ids[i], 10);
    const cantidad = parseFloat(cantidades[i]) || 0;
    const precio = parseFloat(precios[i]) || 0;
    if (id_prod && cantidad > 0) {
      detalles.push({ id_prod, cantidad, precio });
    }
  }
  return detalles;
};

// =============================
// LISTADO
// =============================
router.get('/compras/facturas', async (req, res) => {
  try {
    const { q, id_prov, estado } = req.query;
    const facturas = await FacturasRepo.list({ q, id_prov, estado });
    const proveedores = await FacturasRepo.getActiveProveedores();
    const estados = FacturasRepo.getEstadosDisponibles();

    res.send(listView({
      facturas,
      proveedores,
      estados,
      filters: { q: q || '', id_prov: id_prov || '', estado: estado || '' },
      basePath: '/compras/facturas'
    }));
  } catch (err) {
    console.error('❌ ERROR al listar facturas:', err);
    res.status(500).send('Error al cargar facturas');
  }
});

// =============================
// NUEVA FACTURA
// =============================
router.get('/compras/facturas/new', async (req, res) => {
  const proveedores = await FacturasRepo.getActiveProveedores();
  const productos = await FacturasRepo.getActiveProductos();
  const estados = FacturasRepo.getEstadosDisponibles();
  const formasPago = await FacturasRepo.getActiveFormasPago();

  res.send(formView({
    mode: 'new',
    factura: { fecha: new Date().toISOString().split('T')[0], detalles: [], estado: ESTADOS_FACTURA.BORRADOR },
    proveedores,
    productos,
    estados,
    formasPago,
    errors: {}
  }));
});

// =============================
// CREAR FACTURA
// =============================
router.post('/compras/facturas/new', async (req, res) => {
  try {
    const detalles = parseFacturaDetails(req.body);

    const data = {
      fecha: req.body.fecha ? new Date(req.body.fecha) : new Date(),
      id_prov: req.body.id_prov ? Number(req.body.id_prov) : null,
      letra_comp: (req.body.letra_comp || 'A').toUpperCase(),
      sucursal_comp: (req.body.sucursal_comp || '0001').padStart(4, '0'),
      numero_comp: req.body.numero_comp || '',
      id_fp: req.body.id_fp ? Number(req.body.id_fp) : null,
      observacion: req.body.observacion || null,
      estado: req.body.estado || ESTADOS_FACTURA.BORRADOR,
      detalles
    };

    await FacturasRepo.create(data);
    res.redirect('/compras/facturas?success=created');
  } catch (err) {
    console.error('❌ ERROR creando factura:', err);
    res.status(500).send('Error al crear la factura');
  }
});

// =============================
// EDITAR FACTURA
// =============================
router.get('/compras/facturas/:id/edit', async (req, res) => {
  try {
    const factura = await FacturasRepo.getById(req.params.id);
    if (!factura) return res.status(404).send('Factura no encontrada');
    if (factura.estado !== ESTADOS_FACTURA.BORRADOR) {
      return res.status(403).send(`No se puede editar una factura en estado ${factura.estado}.`);
    }

    factura.fecha = new Date(factura.fecha).toISOString().split('T')[0];

    const proveedores = await FacturasRepo.getActiveProveedores();
    const productos = await FacturasRepo.getActiveProductos();
    const estados = FacturasRepo.getEstadosDisponibles();
    const formasPago = await FacturasRepo.getActiveFormasPago();

    res.send(formView({
      mode: 'edit',
      factura,
      proveedores,
      productos,
      estados,
      formasPago,
      errors: {}
    }));
  } catch (err) {
    console.error('❌ ERROR cargando factura para editar:', err);
    res.status(500).send('Error al cargar edición de factura');
  }
});

router.post('/compras/facturas/:id/edit', async (req, res) => {
  try {
    const detalles = parseFacturaDetails(req.body);

    const data = {
      fecha: new Date(req.body.fecha),
      id_prov: Number(req.body.id_prov),
      letra_comp: (req.body.letra_comp || 'A').toUpperCase(),
      sucursal_comp: (req.body.sucursal_comp || '0001').padStart(4, '0'),
      numero_comp: req.body.numero_comp || '',
      id_fp: req.body.id_fp ? Number(req.body.id_fp) : null,
      observacion: req.body.observacion || null,
      estado: req.body.estado,
      detalles
    };

    await FacturasRepo.update(Number(req.params.id), data); // 👈 conversión aquí
    res.redirect('/compras/facturas?success=updated');
  } catch (err) {
    console.error('❌ ERROR actualizando factura:', err);
    res.status(500).send('Error al actualizar la factura');
  }
});


// =============================
// DETALLE FACTURA
// =============================
router.get('/compras/facturas/:id', async (req, res) => {
  try {
    const factura = await FacturasRepo.getById(req.params.id);
    if (!factura) return res.status(404).send('Factura no encontrada');

    const transicionesValidas = FacturasRepo.getTransicionesValidas(factura.estado);
    const puedeEditar = factura.estado === ESTADOS_FACTURA.BORRADOR;

    res.send(detailView({ factura, transicionesValidas, puedeEditar }));
  } catch (err) {
    console.error('❌ ERROR en detalle factura:', err);
    res.status(500).send('Error al cargar detalle de la factura');
  }
});

// =============================
// CAMBIAR ESTADO
// =============================
router.post('/compras/facturas/:id/estado', async (req, res) => {
  try {
    await FacturasRepo.changeEstado(req.params.id, req.body.nuevo_estado);
    res.redirect('/compras/facturas?success=estado_cambiado');
  } catch (err) {
    console.error('❌ ERROR cambiando estado:', err);
    res.redirect(`/compras/facturas?error=${encodeURIComponent(err.message)}`);
  }
});

module.exports = router;
