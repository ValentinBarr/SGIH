// routes/admin/compras/remitos.js
const express = require('express');
const router = express.Router();

const { RemitosRepo, ESTADOS_REMITO } = require('../../../repositories/remitos.js');
const remitosTemplate = require('../../../views/admin/products/compras/remitos/index.js');
const renderForm = require('../../../views/admin/products/compras/remitos/form.js');
const detalleTemplate = require('../../../views/admin/products/compras/remitos/detalle.js');

// --- FUNCIONES AUXILIARES ---
const parseRemitoDetails = (body) => {
  const detalles = [];
  if (!body.id_prod) return detalles;

  const ids = Array.isArray(body.id_prod) ? body.id_prod : [body.id_prod];
  const cantidades = Array.isArray(body.cantidad) ? body.cantidad : [body.cantidad];
  const precios = Array.isArray(body.precio) ? body.precio : [body.precio];

  for (let i = 0; i < ids.length; i++) {
    const id_prod = parseInt(ids[i], 10);
    const cantidad = parseFloat(cantidades[i]) || 0;
    const precio = parseFloat(precios[i]) || 0;
    if (id_prod && cantidad > 0) detalles.push({ id_prod, cantidad, precio });
  }
  return detalles;
};

// --- RUTAS GET ---

// 📌 LISTAR REMITOS CON FILTROS
router.get('/compras/remitos', async (req, res) => {
  try {
    const { q, id_prov, estado } = req.query;

    const remitos = await RemitosRepo.list({ q, id_prov, estado });
    const proveedores = await RemitosRepo.getActiveProveedores();
    const estados = RemitosRepo.getEstadosDisponibles();

    res.send(remitosTemplate({
      remitos,
      proveedores,
      estados,
      filters: {
        q: q || '',
        id_prov: id_prov || '',
        estado: estado || ''
      },
      basePath: '/compras/remitos'
    }));
  } catch (error) {
    console.error('❌ Error al listar remitos:', error);
    res.status(500).send('Error al cargar la lista de remitos');
  }
});

// 📌 FORMULARIO NUEVO
router.get('/compras/remitos/new', async (req, res) => {
  try {
    const proveedores = await RemitosRepo.getActiveProveedores();
    const productos = await RemitosRepo.getActiveProductos();
    const formasPago = await RemitosRepo.getActiveFormasPago();
    const estados = RemitosRepo.getEstadosDisponibles();

    res.send(renderForm({
      mode: 'new',
      proveedores,
      productos,
      formasPago,
      estados,
      remito: {
        fecha: new Date().toISOString().split('T')[0],
        detalles: [],
        estado: ESTADOS_REMITO.BORRADOR
      }
    }));
  } catch (error) {
    console.error('❌ Error al cargar formulario nuevo:', error);
    res.status(500).send('Error al cargar el formulario');
  }
});

// 📌 DETALLE
router.get('/compras/remitos/:id', async (req, res) => {
  try {
    const remito = await RemitosRepo.getById(req.params.id);
    if (!remito) return res.status(404).send('Remito no encontrado');

    const transicionesValidas = RemitosRepo.getTransicionesValidas(remito.estado);
    const puedeEditar = remito.estado === ESTADOS_REMITO.BORRADOR;

    res.send(detalleTemplate({ remito, transicionesValidas, puedeEditar }));
  } catch (error) {
    console.error('❌ Error al mostrar el detalle del remito:', error);
    res.status(500).send("Error al cargar el detalle del remito.");
  }
});

// 📌 FORMULARIO EDITAR
router.get('/compras/remitos/:id/edit', async (req, res) => {
  try {
    const remito = await RemitosRepo.getById(req.params.id);
    if (!remito) return res.status(404).send('Remito no encontrado');
    if (remito.estado !== ESTADOS_REMITO.BORRADOR) {
      return res.status(403).send(`No se puede editar un remito en estado ${remito.estado}.`);
    }

    remito.fecha = new Date(remito.fecha).toISOString().split('T')[0];
    const proveedores = await RemitosRepo.getActiveProveedores();
    const productos = await RemitosRepo.getActiveProductos();
    const formasPago = await RemitosRepo.getActiveFormasPago();
    const estados = RemitosRepo.getEstadosDisponibles();

    res.send(renderForm({
      mode: 'edit',
      remito,
      proveedores,
      productos,
      formasPago,
      estados
    }));
  } catch (error) {
    console.error('❌ Error al cargar remito para edición:', error);
    res.status(500).send('Error al cargar el remito');
  }
});

// --- RUTAS POST ---

// 📌 CREAR REMITO
router.post('/compras/remitos/new', async (req, res) => {
  try {
    const body = req.body;
    const detalles = parseRemitoDetails(body);

    const remitoData = {
      fecha: body.fecha ? new Date(body.fecha) : new Date(),
      id_prov: body.id_prov ? Number(body.id_prov) : null,
      id_fp: body.id_fp ? Number(body.id_fp) : null,
      letra_comp: (body.letra_comp || 'R').toUpperCase(),
      sucursal_comp: (body.sucursal_comp || '0001').padStart(4, '0'),
      // ✅ si viene vacío, lo dejamos vacío para que el repo lo autogenere
      numero_comp: body.numero_comp ? body.numero_comp.padStart(8, '0') : '',
      observacion: body.observacion || null,
      estado: body.estado,
      detalles
    };

    const errors = {};
    if (!remitoData.id_prov) errors.id_prov = 'El proveedor es obligatorio';
    if (detalles.length === 0) errors.detalles = 'Debe agregar al menos un artículo';

    if (Object.keys(errors).length > 0) {
      const proveedores = await RemitosRepo.getActiveProveedores();
      const productos = await RemitosRepo.getActiveProductos();
      const formasPago = await RemitosRepo.getActiveFormasPago();
      const estados = RemitosRepo.getEstadosDisponibles();

      return res.status(400).send(renderForm({
        mode: 'new',
        proveedores,
        productos,
        formasPago,
        estados,
        remito: { ...body, detalles },
        errors
      }));
    }

    await RemitosRepo.create(remitoData);
    res.redirect('/compras/remitos?success=created');
  } catch (error) {
    console.error('💥 ERROR CRÍTICO al crear remito:', error);
    res.status(500).send('Error al guardar el remito.');
  }
});

// 📌 ACTUALIZAR REMITO
router.post('/compras/remitos/:id/edit', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const detalles = parseRemitoDetails(body);

    const updateData = {
      fecha: new Date(body.fecha),
      id_prov: Number(body.id_prov),
      id_fp: body.id_fp ? Number(body.id_fp) : null,
      letra_comp: (body.letra_comp || 'R').toUpperCase(),
      sucursal_comp: (body.sucursal_comp || '0001').padStart(4, '0'),
      // ✅ lo mismo aquí
      numero_comp: body.numero_comp ? body.numero_comp.padStart(8, '0') : '',
      observacion: body.observacion || null,
      estado: body.estado,
      detalles
    };

    await RemitosRepo.update(id, updateData);
    res.redirect('/compras/remitos?success=updated');
  } catch (error) {
    console.error('❌ Error al actualizar remito:', error);
    res.status(500).send('Error al actualizar el remito.');
  }
});

// 📌 CAMBIAR ESTADO
router.post('/compras/remitos/:id/estado', async (req, res) => {
  const id = Number(req.params.id);
  const { nuevo_estado } = req.body;

  try {
    await RemitosRepo.changeEstado(id, nuevo_estado);
    res.redirect('/compras/remitos?success=estado_cambiado');
  } catch (error) {
    console.error('❌ Error al cambiar estado:', error);
    res.redirect(`/compras/remitos?error=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;
