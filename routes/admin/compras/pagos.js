// routes/admin/compras/pagos.js

const express = require('express');
const router = express.Router();
const { PagosRepo } = require('../../../repositories/pagos.js');

// ✅ Conectar las vistas
const pagosTemplate = require('../../../views/admin/products/compras/pagos/index.js');
const formTemplate = require('../../../views/admin/products/compras/pagos/form.js');

// LISTAR ÓRDENES DE PAGO
router.get('/compras/pagos', async (req, res) => {
  try {
    const pagos = await PagosRepo.list(req.query);
    res.send(pagosTemplate({ pagos }));
  } catch(error) {
    res.send("Error al cargar la lista de pagos.");
  }
});

// MOSTRAR FORMULARIO PARA NUEVA ORDEN DE PAGO
router.get('/compras/pagos/new', async (req, res) => {
  try {
    const proveedores = await PagosRepo.getActiveProveedores();
    const formasDePago = await PagosRepo.getActiveFormasDePago();
    res.send(formTemplate({ proveedores, formasDePago }));
  } catch (error) {
    console.error("Error al cargar formulario de pago:", error);
    res.status(500).send("Error del servidor");
  }
});

// Endpoint API (sin cambios)
router.get('/api/proveedores/:id/facturas-pendientes', async (req, res) => {
    try {
        const facturas = await PagosRepo.getFacturasPendientes(req.params.id);
        res.json(facturas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PROCESAR Y CREAR LA NUEVA ORDEN DE PAGO
router.post('/compras/pagos/new', async (req, res) => {
  try {
    const { id_prov, id_fp, fecha_pago, observacion, facturas } = req.body;
    
    // El body-parser anida los objetos. Hay que transformarlos.
    const detalles = Object.values(facturas || {}).map(f => ({
      id_comp: Number(f.id_comp),
      monto_pagar: Number(f.monto_pagar),
    }));

    const pagoData = { id_prov, id_fp, fecha_pago, observacion, detalles };
    
    await PagosRepo.create(pagoData);
    res.redirect('/compras/pagos?success=created');
  } catch (error) {
    console.error("Error al crear la orden de pago:", error);
    const proveedores = await PagosRepo.getActiveProveedores();
    const formasDePago = await PagosRepo.getActiveFormasDePago();
    res.status(400).send(formTemplate({ 
        proveedores, 
        formasDePago, 
        errors: { general: error.message } 
    }));
  }
});

module.exports = router;