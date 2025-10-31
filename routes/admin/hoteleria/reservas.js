const express = require('express');
const router = express.Router();
const Repo = require('../../../repositories/hoteleria/reservas');
const { PrismaClient, EstadoReserva } = require('../../../generated/prisma');
const prisma = new PrismaClient();

// ⚠️ Asegúrate de que esta vista esté definida al inicio de tu archivo de rutas
const listView = require('../../../views/admin/products/hoteleria/reservas/index'); 
const newView = require('../../../views/admin/products/hoteleria/reservas/new');

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

// 🗑️ Eliminar (DELETE permanente)
router.delete('/hoteleria/reservas/:id/eliminar', async (req, res) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        await prisma.reserva.delete({
            where: { id_reserva: parseInt(req.params.id) }
        });
        
        await prisma.$disconnect();
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error al eliminar reserva:', error);
        res.status(500).json({ error: 'Error al eliminar reserva' });
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
// ✏️ RUTAS DE EDICIÓN DE RESERVA
// ====================================================================

// 📄 GET: Mostrar formulario para editar una reserva
router.get('/hoteleria/reservas/:id/edit', async (req, res) => {
    try {
        const reserva = await Repo.getById(req.params.id);
        if (!reserva) {
            return res.status(404).send('Reserva no encontrada');
        }

        console.log('=== EDITAR RESERVA ===');
        console.log('Reserva ID:', reserva.id_reserva);
        console.log('Check-in:', reserva.fechaCheckIn);
        console.log('Check-out:', reserva.fechaCheckOut);
        console.log('Adultos:', reserva.cantAdultos);
        console.log('Niños:', reserva.cantNinos);
        console.log('Habitación actual:', reserva.id_hab);

        // Obtenemos datos para los selects del formulario
        const { tiposHabitacion, huespedes } = await Repo.getFormData();

        // Buscamos habitaciones disponibles para las fechas de la reserva
        // para que el usuario pueda cambiar de habitación si lo desea.
        const habitacionesDisponibles = await Repo.findAvailableRooms(
            reserva.fechaCheckIn,
            reserva.fechaCheckOut,
            reserva.cantAdultos,
            reserva.cantNinos,
            reserva.id_hab // Excluimos la habitación actual de la validación de disponibilidad
        );

        console.log('Habitaciones disponibles encontradas:', habitacionesDisponibles.length);
        console.log('Tipos de habitación:', tiposHabitacion.length);

        const editView = require('../../../views/admin/products/hoteleria/reservas/edit');
        
        res.send(editView({
            huespedes,
            tiposHabitacion,
            habitacionesDisponibles,
            data: reserva, // Pasamos los datos de la reserva para rellenar el form
            errors: {},
        }));
    } catch (error) {
        console.error('Error al cargar la página de edición de reserva:', error);
        res.status(500).send('Error interno al cargar el formulario de edición.');
    }
});

// 💾 POST: Guardar los cambios de una edición
router.post('/hoteleria/reservas/:id/edit', async (req, res) => {
    const data = req.body;
    const id = req.params.id;

    try {
        await Repo.update(id, {
            ...data,
            id_huesped: parseInt(data.id_huesped),
            id_hab: parseInt(data.id_hab),
            cantAdultos: parseInt(data.cantAdultos),
            cantNinos: parseInt(data.cantNinos),
            total: parseFloat(data.total)
        });
        
        res.redirect('/hoteleria/reservas?success=Reserva actualizada exitosamente');
    } catch (error) {
        console.error(`Error al actualizar reserva ${id}:`, error);
        res.redirect(`/hoteleria/reservas/${id}/edit?error=No se pudo guardar la reserva`);
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
        let formData = (req.session && req.session.formData) ? req.session.formData : {};
        if(req.session && req.session.formData) delete req.session.formData;

        // 🆕 Prellenar datos desde query params (desde calendario)
        if (req.query.fechaCheckIn) {
            formData.fechaCheckIn = req.query.fechaCheckIn;
        }
        if (req.query.fechaCheckOut) {
            formData.fechaCheckOut = req.query.fechaCheckOut;
        }
        if (req.query.id_tipoHab) {
            formData.id_tipoHab = parseInt(req.query.id_tipoHab);
        }
        if (req.query.cantAdultos) {
            formData.cantAdultos = parseInt(req.query.cantAdultos);
        }
        if (req.query.cantNinos) {
            formData.cantNinos = parseInt(req.query.cantNinos);
        }

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
    
    // ⚠️ VALIDACIÓN: No permitir fechas pasadas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaCheckIn = new Date(data.fechaCheckIn);
    fechaCheckIn.setHours(0, 0, 0, 0);
    
    if (fechaCheckIn < hoy) {
        const errors = { 
            general: 'No se pueden crear reservas con fechas anteriores a hoy.',
            fechaCheckIn: 'La fecha de check-in no puede ser anterior a hoy.'
        };
        if(req.session) req.session.formData = data;
        return res.redirect(`/hoteleria/reservas/new?errors=${encodeURIComponent(JSON.stringify(errors))}`);
    }

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

// API: Obtener todas las reservas para el calendario visual (solo activas)
router.get('/api/calendario/reservas', async (req, res) => {
    try {
        // Obtener todas las reservas sin paginación
        const allReservas = await prisma.reserva.findMany({
            include: {
                Huesped: true,
                Habitacion: { 
                    include: {
                        TipoHabitacion: true, 
                    }
                },
            },
            orderBy: { fechaCheckIn: 'desc' },
        });
        
        // Filtrar solo reservas activas (excluir CANCELADA)
        const reservasActivas = allReservas.filter(r => r.estado !== 'CANCELADA');
        
        res.json({ reservas: reservasActivas });
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({ error: 'Error al obtener reservas' });
    }
});

// API: Obtener tipos de habitación para el calendario funcional
router.get('/api/calendario/tipos-habitacion', async (req, res) => {
    try {
        const tiposHabitacion = await prisma.tipoHabitacion.findMany({
            where: { activo: true },
            include: {
                Habitaciones: true
            }
        });
        
        console.log('=== API TIPOS HABITACIÓN ===');
        console.log('Tipos encontrados:', tiposHabitacion.length);
        tiposHabitacion.forEach(t => {
            console.log(`  - ${t.nombre}: $${t.precioBase} (${t.Habitaciones.length} habitaciones)`);
        });
        
        res.json({ tiposHabitacion });
    } catch (error) {
        console.error('Error al obtener tipos de habitación:', error);
        res.status(500).json({ error: 'Error al obtener tipos de habitación' });
    }
});

// API 1: Búsqueda de Habitaciones Disponibles
router.get('/hoteleria/api/disponibilidad', async (req, res) => {
    try {
        const { checkIn, checkOut, adultos, ninos } = req.query;
        
        console.log('=== API DISPONIBILIDAD ===');
        console.log('Params:', { checkIn, checkOut, adultos, ninos });
        
        // La lógica compleja está en el Repositorio
        const habitacionesDisponibles = await Repo.findAvailableRooms(
            checkIn, 
            checkOut, 
            adultos, 
            ninos
        );

        console.log('Habitaciones encontradas:', habitacionesDisponibles.length);
        
        // Obtener todos los tipos de habitación con sus precios
        const tiposHabitacion = await prisma.tipoHabitacion.findMany({
            where: { activo: true },
            select: {
                id_tipoHab: true,
                nombre: true,
                capacidad: true,
                precioBase: true
            }
        });

        console.log('Tipos de habitación:', tiposHabitacion.length);
        tiposHabitacion.forEach(t => {
            console.log(`  - ${t.nombre}: $${t.precioBase}`);
        });

        res.json({ 
            habitacionesDisponibles: habitacionesDisponibles,
            tiposHabitacion: tiposHabitacion
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