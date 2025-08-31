const express = require('express');
const ProductsRepo = require('../../../repositories/products.js');
const productsTemplate = require('../../../views/admin/products/inventario/inventario.js');

const router = express.Router();

router.get('/inventarios/dashboard', async (req,res)=>{
    const products = await ProductsRepo.getAll();
    res.send(productsTemplate({products}));
});

module.exports = router;
