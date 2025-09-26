const express = require('express');
const router = express.Router();

const { OrdenesRepo, ESTADOS_ORDEN } = require('../../../repositories/ordenes');
const listView = require('../../../views/admin/products/compras/ordenes/index');
const formView = require('../../../views/admin/products/compras/ordenes/form');
const detailView = require('../../../views/admin/products/compras/ordenes/detail');

// --- Helpers ---
const parseOrdenDetails = (body) => {
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
router.get('/compras/ordenes', async (req, res) => {
  try {
    const { q, id_prov, estado } = req.query;
    const ordenes = await OrdenesRepo.list({ q, id_prov, estado });
    const proveedores = await OrdenesRepo.getActiveProveedores();
    const estados = OrdenesRepo.getEstadosDisponibles();

    res.send(listView({
      ordenes,
      proveedores,
      estados,
      filters: { q: q || '', id_prov: id_prov || '', estado: estado || '' },
      basePath: '/compras/ordenes'
    }));
  } catch (err) {
    console.error('❌ ERROR al listar órdenes:', err);
    res.status(500).send('Error al cargar órdenes de compra');
  }
});

// =============================
// NUEVA ORDEN
// =============================
router.get('/compras/ordenes/new', async (req, res) => {
  const proveedores = await OrdenesRepo.getActiveProveedores();
  const productos = await OrdenesRepo.getActiveProductos();
  const estados = OrdenesRepo.getEstadosDisponibles();
  const formasPago = await OrdenesRepo.getActiveFormasPago(); // 👈 ahora sí

  res.send(formView({
    mode: 'new',
    orden: { fecha: new Date().toISOString().split('T')[0], detalles: [], estado: ESTADOS_ORDEN.BORRADOR },
    proveedores,
    productos,
    estados,
    formasPago, // 👈 pasamos al form
    errors: {}
  }));
});

// =============================
// EDITAR ORDEN
// =============================
router.get('/compras/ordenes/:id/edit', async (req, res) => {
  try {
    const orden = await OrdenesRepo.getById(req.params.id);
    if (!orden) return res.status(404).send('Orden no encontrada');
    if (orden.estado !== ESTADOS_ORDEN.BORRADOR) {
      return res.status(403).send(`No se puede editar una orden en estado ${orden.estado}.`);
    }

    orden.fecha = new Date(orden.fecha).toISOString().split('T')[0];

    const proveedores = await OrdenesRepo.getActiveProveedores();
    const productos = await OrdenesRepo.getActiveProductos();
    const estados = OrdenesRepo.getEstadosDisponibles();
    const formasPago = await OrdenesRepo.getActiveFormasPago(); // 👈 agregado

    res.send(formView({
      mode: 'edit',
      orden,
      proveedores,
      productos,
      estados,
      formasPago, // 👈 pasamos al form
      errors: {}
    }));
  } catch (err) {
    console.error('❌ ERROR cargando orden para editar:', err);
    res.status(500).send('Error al cargar edición de orden');
  }
});


router.post('/compras/ordenes/new', async (req, res) => {
  try {
    const detalles = parseOrdenDetails(req.body);

    const data = {
      fecha: req.body.fecha ? new Date(req.body.fecha) : new Date(),
      id_prov: req.body.id_prov ? Number(req.body.id_prov) : null,
      letra_comp: (req.body.letra_comp || 'O').toUpperCase(),
      sucursal_comp: (req.body.sucursal_comp || '0001').padStart(4, '0'),
      numero_comp: req.body.numero_comp || '',
      id_fp: req.body.id_fp ? Number(req.body.id_fp) : null,
      observacion: req.body.observacion || null,
      estado: req.body.estado || ESTADOS_ORDEN.BORRADOR,
      detalles
    };

    if (!data.id_prov || detalles.length === 0) {
      const proveedores = await OrdenesRepo.getActiveProveedores();
      const productos = await OrdenesRepo.getActiveProductos();
      const estados = OrdenesRepo.getEstadosDisponibles();
      return res.send(formView({
        mode: 'new',
        orden: { ...req.body, detalles },
        proveedores,
        productos,
        estados,
        errors: { general: 'Proveedor y al menos un artículo son obligatorios' }
      }));
    }

    await OrdenesRepo.create(data);
    res.redirect('/compras/ordenes?success=created');
  } catch (err) {
    console.error('❌ ERROR creando orden:', err);
    res.status(500).send('Error al crear la orden');
  }
});

// =============================
// DETALLE
// =============================
router.get('/compras/ordenes/:id', async (req, res) => {
  try {
    const orden = await OrdenesRepo.getById(req.params.id);
    if (!orden) return res.status(404).send('Orden no encontrada');

    const transicionesValidas = OrdenesRepo.getTransicionesValidas(orden.estado);
    const puedeEditar = orden.estado === ESTADOS_ORDEN.BORRADOR;

    res.send(detailView({ orden, transicionesValidas, puedeEditar }));
  } catch (err) {
    console.error('❌ ERROR en detalle orden:', err);
    res.status(500).send('Error al cargar detalle de la orden');
  }
});



router.post('/compras/ordenes/:id/edit', async (req, res) => {
  try {
    const detalles = parseOrdenDetails(req.body);
    const data = {
      fecha: new Date(req.body.fecha),
      id_prov: Number(req.body.id_prov),
      letra_comp: (req.body.letra_comp || 'O').toUpperCase(),
      sucursal_comp: (req.body.sucursal_comp || '0001').padStart(4, '0'),
      numero_comp: req.body.numero_comp || '',
      id_fp: req.body.id_fp ? Number(req.body.id_fp) : null,
      observacion: req.body.observacion || null,
      estado: req.body.estado,
      detalles
    };

    await OrdenesRepo.update(req.params.id, data);
    res.redirect('/compras/ordenes?success=updated');
  } catch (err) {
    console.error('❌ ERROR actualizando orden:', err);
    res.status(500).send('Error al actualizar la orden');
  }
});

// =============================
// CAMBIAR ESTADO
// =============================
router.post('/compras/ordenes/:id/estado', async (req, res) => {
  try {
    await OrdenesRepo.changeEstado(req.params.id, req.body.nuevo_estado);
    res.redirect('/compras/ordenes?success=estado_cambiado');
  } catch (err) {
    console.error('❌ ERROR cambiando estado:', err);
    res.redirect(`/compras/ordenes?error=${encodeURIComponent(err.message)}`);
  }
});

module.exports = router;
