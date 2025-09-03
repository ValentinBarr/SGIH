const express = require('express');
const ProductsRepo = require('../../../repositories/products.js');
const dashboardTemplate = require('../../../views/admin/products/inventario/deposito.js');

const router = express.Router();

router.get('/inventarios/dashboard', async (req,res)=>{
    const products = await ProductsRepo.getAll();
    res.send(dashboardTemplate({req}));
});

module.exports = router;