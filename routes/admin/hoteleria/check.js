// routes/hoteleria/check.js
const express = require('express');
const router = express.Router();

const HabitacionRepo = require('../../../repositories/hoteleria/check'); 
const ReservaRepo = require('../../../repositories/hoteleria/reservas'); 
const checkinCheckoutView = require('../../../views/admin/products/hoteleria/check/board'); 
const checkinDetailView = require('../../../views/admin/products/hoteleria/check/checkin-detail'); 
//const walkInView = require('../../../views/admin/products/hoteleria/check/walk-in'); 

// 🆕 IMPORTAR LA NUEVA VISTA DE CHECK-OUT
const checkoutDetailView = require('../../../views/admin/products/hoteleria/check/checkout-detail'); 

const { EstadoReserva, EstadoHabitacion, EstadoPago } = require('../../../generated/prisma');
const { PrismaClient } = require('../../../generated/prisma'); // Ruta corregida
const prisma = new PrismaClient();

// RUTA 1: Mostrar el Tablero de Habitaciones
router.get('/hoteleria/checkin-checkout', async (req, res) => {
    try {
        const habitaciones = await HabitacionRepo.getStatusBoard();
        res.send(checkinCheckoutView({ habitaciones }));
    } catch (error) {
        console.error('Error al cargar el tablero de habitaciones:', error);
        res.status(500).send('Error al cargar el tablero.');
    }
});

// --- RUTAS DE CHECK-IN (Reservas existentes) ---
router.get('/hoteleria/checkin/:idReserva', async (req, res) => {
    try {
        const reserva = await ReservaRepo.getCheckinDetails(req.params.idReserva);
        if (!reserva || reserva.estado !== EstadoReserva.CONFIRMADA) {
            return res.status(400).send('Reserva no encontrada o no está confirmada.');
        }

        // 🆕 Traer las formas de pago reales
        const formasPago = await prisma.formaPago.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' },
        });

        // Pasarlas a la vista
        res.send(checkinDetailView({ reserva, formasPago }));

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la página de check-in.');
    }
});


router.post('/hoteleria/checkin/:idReserva/confirm', async (req, res) => {
     // ... (Tu código existente)
     try {
         await ReservaRepo.updateState(req.params.idReserva, EstadoReserva.CHECKED_IN); 
         res.redirect('/hoteleria/checkin-checkout');
     } catch (error) { res.status(500).send(`Error al confirmar check-in: ${error.message}.`); }
});

// --- RUTAS DE WALK-IN ---
router.get('/hoteleria/walk-in', async (req, res) => {
    // ... (Tu código existente)
    try {
        const { tiposHabitacion, huespedes } = await ReservaRepo.getFormData();
        res.send(walkInView({
            huespedes, tiposHabitacion,
            habitacionesDisponibles: [], data: {}, errors: {}
        }));
    } catch (error) { res.status(500).send('Error al cargar la página.'); }
});

router.post('/hoteleria/walk-in/create', async (req, res) => {
    // ... (Tu código existente)
    try {
        await ReservaRepo.create(req.body);
        res.redirect('/hoteleria/checkin-checkout');
    } catch (error) {
        const { tiposHabitacion, huespedes } = await ReservaRepo.getFormData();
        res.status(400).send(walkInView({
            huespedes, tiposHabitacion,
            habitacionesDisponibles: [], data: req.body,
            errors: { general: error.message || "No se pudo crear la reserva." }
        }));
    }
});

// ==========================================================
// 🆕 RUTAS PARA EL FLUJO DE CHECK-OUT
// ==========================================================

// RUTA GET: Mostrar la Página de Detalle de Check-out
router.get('/hoteleria/checkout/:idReserva', async (req, res) => {
    const { idReserva } = req.params;
    try {
        // Reutilizamos el mismo método del check-in
        const reserva = await ReservaRepo.getCheckinDetails(idReserva); 

        if (!reserva) {
            return res.status(404).send('Reserva no encontrada.');
        }

        // Validar que la reserva esté OCUPADA (CHECKED_IN)
        if (reserva.estado !== EstadoReserva.CHECKED_IN) {
             return res.status(400).send(`Error: La reserva ${reserva.codigoReserva} no está en estado CHECKED_IN. No se puede hacer check-out.`);
        }
        
        res.send(checkoutDetailView({ reserva }));

    } catch (error) {
        console.error(`Error al cargar detalles de check-out para reserva ${idReserva}:`, error);
        res.status(500).send('Error al cargar la página de check-out.');
    }
});

// RUTA POST: Confirmar el Check-out
router.post('/hoteleria/checkout/:idReserva/confirm', async (req, res) => {
     const { idReserva } = req.params;
     
     try {
         // (Aquí iría la lógica de validación de pago, cargos extras, etc.)
         
         // 1. Realizar el check-out (Actualiza Reserva a CHECKED_OUT y Habitación a LIMPIEZA)
         await ReservaRepo.updateState(idReserva, EstadoReserva.CHECKED_OUT); 

         // 2. Redirigir de vuelta al tablero principal
         res.redirect('/hoteleria/checkin-checkout');

     } catch (error) {
         console.error(`Error al confirmar check-out para reserva ${idReserva}:`, error);
         res.status(500).send(`Error al confirmar check-out: ${error.message}. <a href="/hoteleria/checkin-checkout">Volver al tablero</a>`);
     }
});

// ==========================================================
// RUTAS DE ACCIONES DEL TABLERO (Internas)
// ==========================================================

router.post('/hoteleria/habitaciones/:id/cambiar-estado', async (req, res) => {
    // ... (Tu código existente)
    const { id } = req.params;
    const { nuevoEstado } = req.body;
    try {
        if (!nuevoEstado) return res.status(400).json({ error: 'Falta especificar el nuevo estado.' });
        await HabitacionRepo.updateHabitacionState(id, nuevoEstado);
        res.json({ message: `Habitación ${id} actualizada a ${nuevoEstado}.` });
    } catch (error) {
        res.status(400).json({ error: error.message || 'No se pudo actualizar el estado.' });
    }
});

// 🚨 ESTA RUTA YA NO ES NECESARIA, la acción de checkout ahora es un LINK <a>
// La lógica se movió a la RUTA 3 (POST /hoteleria/checkout/:idReserva/confirm)
/*
router.post('/hoteleria/habitaciones/:idHab/checkout', async (req, res) => {
    // ... (Tu código anterior) ...
});
*/

// Crear un pago nuevo (desde el modal)
router.post('/hoteleria/pagos/new', async (req, res) => {
  try {
    const { id_reserva, id_fp, monto, referencia } = req.body;

    if (!id_reserva || !id_fp || !monto)
      return res.status(400).send('Faltan datos requeridos.');

    await prisma.pagoReserva.create({
      data: {
        id_reserva: Number(id_reserva),
        id_fp: Number(id_fp),
        monto: parseFloat(monto),
        referencia: referencia || null,
        estado: EstadoPago.COMPLETADO,
      },
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).send(error.message || 'Error interno al registrar pago.');
  }
});



module.exports = router;