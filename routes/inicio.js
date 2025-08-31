const express = require('express');
const inicioTemplate = require('../views/inicio.js');
const ProductsRepo = require('../repositories/products');

const router = express.Router();


router.get('/', async (req,res)=>{
    const products = await ProductsRepo.getAll();
    // res.send(productsTemplate({products}));
    res.send(inicioTemplate({req}));
})

router.post('/', async (req, res) => {
  try {
    const { name_prod, fecha_alta_prod } = req.body;
    const created = await ProductsRepo.addProduct({ name_prod, fecha_alta_prod });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});




module.exports = router;