const express = require ('express');
const bodyParser = require('body-parser');
const authRouter = require('./routes/admin/auth');

const dashboardRouter = require('./routes/admin/inventario/dashboard.js');
const articulosdRouter = require('./routes/admin/inventario/articulos.js');
const movimientosRouter = require('./routes/admin/inventario/movimientos.js');
const accionesRouter = require('./routes/admin/inventario/acciones.js');
const depositoRouter = require('./routes/admin/inventario/deposito.js');
const stockRouter = require('./routes/admin/inventario/stock.js');
const proveedorRouter = require('./routes/admin/compras/proveedores.js');

const posRouter = require('./routes/admin/pos.js');

const inicioRouter = require('./routes/inicio.js');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.static('public'));
app.use(authRouter);
app.use(inicioRouter);
app.use(dashboardRouter);
app.use(movimientosRouter);
app.use(stockRouter);
app.use(articulosdRouter);
app.use(posRouter);
app.use(depositoRouter);
app.use(accionesRouter);
app.use(proveedorRouter);



app.listen(3000, ()=> {
    console.log('Listening');
});