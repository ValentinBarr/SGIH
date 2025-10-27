const express = require('express');
const router = express.Router();
const Repo = require('../../../repositories/hoteleria/reservas');

// ⚠️ Asegúrate de que esta vista esté definida al inicio de tu archivo de rutas
const listView = require('../../../views/admin/products/hoteleria/reservas/index'); 
const newView = require('../../../views/admin/products/hoteleria/reservas/new'); 
const { EstadoReserva } = require('../../../generated/prisma');

// ====================================================================
// RUTAS DE LISTADO Y ACCIONES
// ====================================================================

// 📄 LISTAR (Ruta principal que muestra la página)
router.get('/hoteleria/reservas', async (req, res) => {
    try {
        const { reservas, totalPages, currentPage, totalReservas } =
            await Repo.getAll(req.query);

        const { tiposHabitacion, estadosReserva, huespedes } =
            await Repo.getFormData();

        res.send(
            listView({
                reservas,
                tiposHabitacion, 
                estadosReserva,
                huespedes,
                query: req.query,
                totalPages,
                currentPage,
                totalReservas,
            })
        );
    } catch (error) {
        console.error('Error al cargar reservas:', error);
        res.status(500).send('Error al cargar reservas');
    }
});

// ✅ Confirmar
router.post('/hoteleria/reservas/:id/confirmar', async (req, res) => {
    try {
        await Repo.updateState(req.params.id, EstadoReserva.CONFIRMADA);
        res.redirect(`/hoteleria/reservas?${new URLSearchParams(req.query)}`);
    } catch (error) {
        res.status(500).send('Error al confirmar reserva');
    }
});

// ❌ Cancelar
router.post('/hoteleria/reservas/:id/cancelar', async (req, res) => {
    try {
        await Repo.updateState(req.params.id, EstadoReserva.CANCELADA);
        res.redirect(`/hoteleria/reservas?${new URLSearchParams(req.query)}`);
    } catch (error) {
        res.status(500).send('Error al cancelar reserva');
    }
});

// ➡️ Check-in
router.post('/hoteleria/reservas/:id/checkin', async (req, res) => {
    try {
        await Repo.updateState(req.params.id, EstadoReserva.CHECKED_IN);
        res.redirect(`/hoteleria/reservas?${new URLSearchParams(req.query)}`);
    } catch (error) {
        res.status(500).send('Error al hacer check-in');
    }
});

// ⬅️ Check-out
router.post('/hoteleria/reservas/:id/checkout', async (req, res) => {
    try {
        await Repo.updateState(req.params.id, EstadoReserva.CHECKED_OUT);
        res.redirect(`/hoteleria/reservas?${new URLSearchParams(req.query)}`);
    } catch (error) {
        res.status(500).send('Error al hacer check-out');
    }
});

// ✏️ GUARDAR Edición
router.post('/hoteleria/reservas/:id/edit', async (req, res) => {
    try {
        await Repo.update(req.params.id, req.body);
        res.redirect(`/hoteleria/reservas?${new URLSearchParams(req.query)}`);
    } catch (error) {
        console.error('Error al editar reserva:', error);
        res.status(500).send('Error al editar reserva');
    }
});

// 💾 OBTENER DATOS (para llenar el modal de edición)
router.get('/hoteleria/reservas/:id/data', async (req, res) => {
    try {
        const reserva = await Repo.getById(req.params.id);
        if (!reserva) {
            return res.status(404).send('Reserva no encontrada');
        }
        res.json(reserva);
    } catch (error) {
        res.status(500).send('Error al obtener datos de la reserva');
    }
});

// ====================================================================
// 🆕 RUTAS DE CREACIÓN DE RESERVA (PÁGINA SEPARADA)
// ====================================================================

// 📄 GET: Mostrar formulario de nueva reserva
router.get('/hoteleria/reservas/new', async (req, res) => {
    try {
        // Obtenemos data estática
        const { tiposHabitacion, huespedes } = await Repo.getFormData(); 

        // Manejo de errores y data
        const errors = req.query.errors ? JSON.parse(decodeURIComponent(req.query.errors)) : {};
        
        // 🚨 PREVENCIÓN DE UNDEFINED: Asegurarse de que req.session.formData exista
        const formData = (req.session && req.session.formData) ? req.session.formData : {};
        if(req.session && req.session.formData) delete req.session.formData;

        res.send(
            newView({ 
                huespedes,
                tiposHabitacion,
                habitacionesDisponibles: [], 
                data: formData,
                errors,
            })
        );
    } catch (error) {
        console.error('Error al cargar la página de nueva reserva:', error);
        res.status(500).send('Error interno al cargar el formulario de reserva.');
    }
});

// ➕ POST: Procesar la creación de la nueva reserva
router.post('/hoteleria/reservas/new', async (req, res) => {
    const data = req.body;
    
    // ⚠️ VALIDACIÓN INICIAL - Puedes expandirla aquí

    try {
        await Repo.create({
            ...data,
            id_huesped: parseInt(data.id_huesped),
            id_hab: parseInt(data.id_hab),
            cantAdultos: parseInt(data.cantAdultos),
            cantNinos: parseInt(data.cantNinos),
            total: parseFloat(data.total)
        });
        
        res.redirect('/hoteleria/reservas?success=Reserva creada exitosamente');
    } catch (error) {
        console.error('Error al crear reserva (Repo):', error);
        
        // Guardar data y error en sesión para el redirect
        if(req.session) req.session.formData = data;
        const errorMessage = error.message || 'Error al guardar la reserva. Verifique la disponibilidad.';
        
        res.redirect(`/hoteleria/reservas/new?errors=${encodeURIComponent(JSON.stringify({ general: errorMessage }))}`);
    }
});

// ====================================================================
// 🚀 RUTAS API (Consumidas por AJAX/JS)
// ====================================================================

// API 1: Búsqueda de Habitaciones Disponibles
router.get('/hoteleria/api/disponibilidad', async (req, res) => {
    try {
        const { checkIn, checkOut, adultos, ninos } = req.query;
        
        // La lógica compleja está en el Repositorio
        const habitacionesDisponibles = await Repo.findAvailableRooms(
            checkIn, 
            checkOut, 
            adultos, 
            ninos
        );

        res.json({ 
            habitaciones: habitacionesDisponibles
            // No necesitamos devolver tiposHabitacion ya que están en la vista
        });

    } catch (error) {
        console.error('Error en la API de disponibilidad:', error);
        res.status(500).json({ error: 'Error interno al verificar disponibilidad.' });
    }
});

// API 2: Creación de Huésped (Desde el Modal)
router.post('/hoteleria/huespedes/api/new', async (req, res) => {
    const { nombre, apellido } = req.body;
    
    if (!nombre || !apellido) {
        return res.status(400).json({ errors: { general: 'Nombre y Apellido son requeridos.' } });
    }

    try {
        const newHuesped = await Repo.createHuesped(req.body);
        res.status(201).json({ success: true, Huesped: newHuesped });
    } catch (error) {
        console.error('Error al crear huésped:', error);
        res.status(500).json({ errors: { general: 'Error al guardar el huésped en la base de datos.' } });
    }
});


module.exports = router;