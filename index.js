const express = require('express');
const authRouter = require('./routes/admin/auth');
const inicioRouter = require('./routes/inicio.js');
const posRouter = require('./routes/admin/pos.js');

// Rutas de Inventario
const dashboardRouter = require('./routes/admin/inventario/dashboard.js');
const articulosdRouter = require('./routes/admin/inventario/articulos.js');
const movimientosRouter = require('./routes/admin/inventario/movimientos.js');
const accionesRouter = require('./routes/admin/inventario/acciones.js');
const depositoRouter = require('./routes/admin/inventario/deposito.js');
const stockRouter = require('./routes/admin/inventario/stock.js');

// Rutas de Compras
const proveedorRouter = require('./routes/admin/compras/proveedores.js');
const remitosRouter = require('./routes/admin/compras/remitos');
const ordenesRouter = require('./routes/admin/compras/ordenes');
const facturasRouter = require('./routes/admin/compras/facturas');
const pagosRouter = require('./routes/admin/compras/pagos'); // <-- ✅ LÍNEA AÑADIDA

// Rutas de Hoteleria
const tiposHabitacionRouter = require('./routes/admin/hoteleria/tiposHabitacion.js');
const comodidadesRouter = require('./routes/admin/hoteleria/comodidades.js');
const habitacionesRouter = require('./routes/admin/hoteleria/habitaciones.js');
const huespedesRouter = require('./routes/admin/hoteleria/huespedes.js');
const reservasRouter = require('./routes/admin/hoteleria/reservas.js');




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

// Rutas Generales
app.use(authRouter);
app.use(inicioRouter); // <-- Usamos el router de inicio para la ruta principal
app.use(posRouter);

// Rutas de Módulo Inventario
app.use(dashboardRouter);
app.use(movimientosRouter);
app.use(stockRouter);
app.use(articulosdRouter);
app.use(depositoRouter);
app.use(accionesRouter);

// Rutas de Módulo Compras
app.use(proveedorRouter);
app.use(remitosRouter);
app.use(ordenesRouter);
app.use(facturasRouter);
app.use(pagosRouter);

app.use(tiposHabitacionRouter);
app.use(comodidadesRouter);
app.use(habitacionesRouter);
app.use(huespedesRouter);
app.use(reservasRouter);


// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error global:', err);
    res.status(500).send('Error interno del servidor');
});

app.listen(3000, () => {
    console.log('Servidor corriendo en puerto 3000');
});