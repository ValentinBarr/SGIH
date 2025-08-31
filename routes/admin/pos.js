const express = require('express');
const posTemplate = require('../../views/admin/products/pos');

const router = express.Router();

router.get('/pos', async (req,res)=>{
    res.send(posTemplate({req}));
});

module.exports = router;
