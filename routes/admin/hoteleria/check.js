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
        console.error('Error en GET /hoteleria/checkin/:idReserva:', error);
        res.status(500).send(`Error al cargar la página de check-in: ${error.message}`);
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

        // Obtener las formas de pago para el modal
        const formasPago = await prisma.formaPago.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' },
        });
        
        res.send(checkoutDetailView({ reserva, formasPago }));

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
    console.log('🔍 POST /hoteleria/pagos/new - Datos recibidos:', req.body);
    
    const { id_reserva, id_fp, monto, referencia } = req.body;

    // Validación de datos
    if (!id_reserva || !id_fp || !monto) {
      console.log('❌ Validación fallida:', { id_reserva, id_fp, monto });
      return res.status(400).json({ 
        error: 'Faltan datos requeridos: id_reserva, id_fp y monto son obligatorios.' 
      });
    }

    // Validar que el monto sea un número válido
    const montoNumerico = parseFloat(monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      console.log('❌ Monto inválido:', monto);
      return res.status(400).json({ 
        error: 'El monto debe ser un número mayor a 0.' 
      });
    }

    // Verificar que la reserva existe
    const reserva = await prisma.reserva.findUnique({
      where: { id_reserva: Number(id_reserva) }
    });

    if (!reserva) {
      console.log('❌ Reserva no encontrada:', id_reserva);
      return res.status(404).json({ 
        error: 'La reserva especificada no existe.' 
      });
    }

    // Crear el pago
    const nuevoPago = await prisma.pagoReserva.create({
      data: {
        id_reserva: Number(id_reserva),
        id_fp: Number(id_fp),
        monto: montoNumerico,
        referencia: referencia || null,
        estado: EstadoPago.COMPLETADO,
        fechaPago: new Date(),
      },
    });

    console.log('✅ Pago creado exitosamente:', nuevoPago.id_pago);

    res.status(200).json({ 
      success: true,
      message: 'Pago registrado correctamente',
      pago: {
        id: nuevoPago.id_pago,
        monto: nuevoPago.monto,
        fecha: nuevoPago.fechaPago
      }
    });

  } catch (error) {
    console.error('❌ Error al registrar pago:', error);
    res.status(500).json({ 
      error: error.message || 'Error interno del servidor al registrar pago.' 
    });
  }
});



// 🔍 RUTA DE DEBUG TEMPORAL - Para verificar reservas de hoy
router.get('/hoteleria/debug/reservas-hoy', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('🔍 DEBUG - Buscando reservas para:', {
      desde: today.toISOString(),
      hasta: tomorrow.toISOString()
    });

    // Todas las reservas
    const todasReservas = await prisma.reserva.findMany({
      include: { 
        Huesped: true, 
        Habitacion: { include: { TipoHabitacion: true } }
      },
      orderBy: { fechaCheckIn: 'asc' }
    });

    // Reservas confirmadas para hoy
    const reservasHoy = await prisma.reserva.findMany({
      where: {
        estado: EstadoReserva.CONFIRMADA,
        fechaCheckIn: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: { 
        Huesped: true, 
        Habitacion: { include: { TipoHabitacion: true } }
      },
    });

    // Habitaciones disponibles
    const habitacionesDisponibles = await prisma.habitacion.findMany({
      where: { 
        activo: true,
        estado: EstadoHabitacion.DISPONIBLE 
      },
      include: { TipoHabitacion: true },
      orderBy: { numero: 'asc' }
    });

    const debugInfo = {
      fechaHoy: today.toISOString(),
      fechaManana: tomorrow.toISOString(),
      totalReservas: todasReservas.length,
      reservasConfirmadasHoy: reservasHoy.length,
      habitacionesDisponibles: habitacionesDisponibles.length,
      reservas: {
        todas: todasReservas.map(r => ({
          codigo: r.codigoReserva,
          estado: r.estado,
          fechaCheckIn: r.fechaCheckIn,
          habitacion: r.Habitacion?.numero,
          huesped: `${r.Huesped?.nombre} ${r.Huesped?.apellido}`
        })),
        confirmadas_hoy: reservasHoy.map(r => ({
          codigo: r.codigoReserva,
          fechaCheckIn: r.fechaCheckIn,
          habitacion: r.Habitacion?.numero,
          huesped: `${r.Huesped?.nombre} ${r.Huesped?.apellido}`
        }))
      },
      habitaciones: habitacionesDisponibles.map(h => ({
        numero: h.numero,
        estado: h.estado,
        tipo: h.TipoHabitacion?.nombre
      }))
    };

    res.json(debugInfo);
  } catch (error) {
    console.error('Error en debug:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;