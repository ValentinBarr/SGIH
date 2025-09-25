const express = require('express');
const authRouter = require('./routes/admin/auth');

const dashboardRouter = require('./routes/admin/inventario/dashboard.js');
const articulosdRouter = require('./routes/admin/inventario/articulos.js');
const movimientosRouter = require('./routes/admin/inventario/movimientos.js');
const accionesRouter = require('./routes/admin/inventario/acciones.js');
const depositoRouter = require('./routes/admin/inventario/deposito.js');
const stockRouter = require('./routes/admin/inventario/stock.js');
const proveedorRouter = require('./routes/admin/compras/proveedores.js');
const remitosRouter = require('./routes/admin/compras/remitos');
const posRouter = require('./routes/admin/pos.js');

const inicioRouter = require('./routes/inicio.js');
const app = express();

// IMPORTANTE: Configura el middleware ANTES de las rutas
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Middleware para logging de requests (opcional, para debugging)
app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log(`${req.method} ${req.path}`, {
            body: req.body,
            contentType: req.headers['content-type']
        });
    }
    next();
});

// Rutas
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
app.use(remitosRouter);

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error global:', err);
    res.status(500).send('Error interno del servidor');
});

app.listen(3000, () => {
    console.log('Servidor corriendo en puerto 3000');
});