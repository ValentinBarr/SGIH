const express = require('express');
const signupTemplate = require('../../views/admin/auth/signin');
const signinTemplate = require('../../views/admin/auth/signup');

//const {getError} = require('../../helpers');

//Subroot
const router = express.Router();

router.get('/signin', (req,res)=>{
    res.send(signupTemplate({req}));
})

router.post('/signin', async (req,res) => {
    res.send('Entraste pa');
});

router.get('/signup', (req,res)=>{
    res.send(signinTemplate({req}));
})



module.exports = router;