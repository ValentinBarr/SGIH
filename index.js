const express = require ('express');
const bodyParser = require('body-parser');
const authRouter = require('./routes/admin/auth');
const inicioRouter = require('./routes/inicio.js');

const app = express();

app.use(authRouter);
app.use(inicioRouter);

app.listen(3000, ()=> {
    console.log('Listening');
});