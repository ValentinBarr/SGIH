const express = require ('express');
const bodyParser = require('body-parser');
const authRouter = require('./routes/admin/auth');
const dashboardRouter = require('./routes/admin/inventario/dashboard.js');
const articulosdRouter = require('./routes/admin/inventario/articulos.js');
const movimientosRouter = require('./routes/admin/inventario/movimientos.js');
const inicioRouter = require('./routes/inicio.js');
const posRouter = require('./routes/admin/pos.js');

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.static('public'));
app.use(authRouter);
app.use(inicioRouter);
app.use(dashboardRouter);
app.use(movimientosRouter);
app.use(articulosdRouter);
app.use(posRouter);


app.listen(3000, ()=> {
    console.log('Listening');
});