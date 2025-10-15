const express = require('express');
const inicioTemplate = require('../views/inicio.js');

const router = express.Router();

router.get('/', async (req,res)=>{
    res.send(inicioTemplate({req}));
});

module.exports = router;