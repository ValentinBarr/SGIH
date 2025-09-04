const express = require('express');
const bodyParser = require('body-parser');
const authRouter = require('./routes/admin/auth');
const inicioRouter = require('./routes/inicio.js');
const depositoRouter = require('./routes/inventario/deposito');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(authRouter);
app.use(inicioRouter);
app.use(depositoRouter);

app.listen(3000, () => {
  console.log('Listening');
});
