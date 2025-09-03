const express = require('express');
const ProductsRepo = require('../../../repositories/products.js');
const productsTemplate = require('../../../views/admin/products/inventario/articulos/productos.js');
const renderForm  = require('../../../views/admin/products/inventario/articulos/form');
const router = express.Router();

router.get('/inventarios/articulos', async (req,res)=>{
    const { q, tipo, stockeable, activo } = req.query;

    const products = await ProductsRepo.list({q, tipo, stockeable, activo});

    res.send(productsTemplate({products, filters: {
            products,
            filters: { q: q || '', tipo: tipo || '', stockeable: stockeable || '', activo: activo || '' },
            basePath: '/inventarios/articulos', // para el link "Limpiar"
    }}));
});

// NUEVO (form)
router.get('/inventarios/articulos/new', (req, res) => {
  res.send(renderForm({ mode: 'new', producto: { activo_prod: true, stockeable_prod: true } }));
});

// CREAR (post)
router.post('/inventarios/articulos/new', async (req, res) => {
  const b = req.body || {};
  console.log('BODY EN NEW:', b); // ← mirá esto en consola al enviar

  const data = {
    nombre_prod: (b.nombre_prod || '').trim(),
    unidad_prod: b.unidad_prod,
    tipo_prod: b.tipo_prod,
    stockeable_prod: !!b.stockeable_prod,
    vendible_prod: !!b.vendible_prod,
    descuentaStockVenta_prod: !!b.descuentaStockVenta_prod,
    activo_prod: !!b.activo_prod,
    precio_prod: b.precio_prod ? Number(b.precio_prod) : null,
    stockMinimoGlobal_prod: b.stockMinimoGlobal_prod ? Number(b.stockMinimoGlobal_prod) : null,
  };

  const errors = {};
  if (!data.nombre_prod) errors.nombre_prod = 'El nombre es obligatorio';

  if (Object.keys(errors).length) {
    return res.status(400).send(renderForm({
      mode: 'new',
      producto: b,
      errors
    }));
  }

  await ProductsRepo.addProduct(data);
  return res.redirect('/inventarios/articulos?ok=created');
});

// EDITAR (form)
router.get('/inventarios/articulos/:id/edit', async (req, res) => {
  const producto = await ProductsRepo.getById(req.params.id);
  if (!producto) return res.status(404).send('Producto no encontrado');
  res.send(renderForm({ mode: 'edit', producto }));
});

// ACTUALIZAR (post)
router.post('/inventarios/articulos/:id/edit', async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body;
  try {
    const data = {
      nombre_prod: (b.nombre_prod||'').trim(),
      unidad_prod: b.unidad_prod,
      tipo_prod: b.tipo_prod,
      stockeable_prod: !!b.stockeable_prod,
      vendible_prod: !!b.vendible_prod,
      descuentaStockVenta_prod: !!b.descuentaStockVenta_prod,
      activo_prod: !!b.activo_prod,
      precio_prod: b.precio_prod ? Number(b.precio_prod) : null,
      stockMinimoGlobal_prod: b.stockMinimoGlobal_prod ? Number(b.stockMinimoGlobal_prod) : null,
    };
    await ProductsRepo.update(id, data);
    res.redirect('/inventarios/articulos');
  } catch (err) {
    res.status(400).send(renderForm({
      mode: 'edit',
      producto: { id_prod: id, ...req.body },
      errors: { general: err.message }
    }));
  }
});



module.exports = router;