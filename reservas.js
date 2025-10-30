// routes/hotel/reservas.js
const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');

const habitacionesRepo = require('../../repositories/hotel/habitacionesRepo'); // Repositorio de habitaciones
const reservasRepo = require('../../repositories/hotel/reservasRepo'); // Ruta correcta desde routes/hotel
const reservasIndexTemplate = require('../../views/hotel/reservas/index'); // Ruta correcta desde routes/hotel
const newReservaTemplate = require('../../views/admin/products/hoteleria/reservas/new'); // Vista de nueva reserva
const huespedesRepo = require('../../repositories/hotel/huespedesRepo'); // Repositorio de huéspedes
const { requireReservaData } = require('./validators'); // Validadores (asumiendo que existen)

/**
 * NOTA: La ruta base en tu app.js debe ser '/hoteleria' para que coincida con el formulario.
 * @route GET /hotel/reservas
 * @description Muestra la lista de todas las reservas.
 */
router.get('/hotel/reservas', async (req, res, next) => {
  try {
    const reservas = await reservasRepo.getAll();
    res.send(reservasIndexTemplate({ reservas }));
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /hoteleria/reservas/new
 * @description Muestra el formulario para crear una nueva reserva.
 */
router.get('/hoteleria/reservas/new', async (req, res) => {
    const huespedes = await huespedesRepo.getAll();
    res.send(newReservaTemplate({ huespedes }));
});

/**
 * @route POST /hoteleria/reservas/new
 * @description Procesa el formulario y crea una nueva reserva.
 */
router.post('/hoteleria/reservas/new', requireReservaData, async (req, res) => {
    const errors = validationResult(req);
    const data = req.body;

    if (!errors.isEmpty()) {
        const huespedes = await huespedesRepo.getAll();
        
        // Si hay un error de validación, volvemos a buscar la disponibilidad
        // para que el usuario vea la lista de habitaciones actualizada.
        const { habitacionesDisponibles, tiposHabitacion } = await habitacionesRepo.getDisponibilidad(
            data.fechaCheckIn,
            data.fechaCheckOut
        );

        // Si hay errores, volvemos a renderizar el formulario con los datos y errores.
        return res.status(422).send(newReservaTemplate({ 
            errors: errors.mapped(), 
            huespedes, 
            data,
            habitacionesDisponibles,
            tiposHabitacion
        }));
    }

    try {
        // Llama al repositorio para crear la reserva
        await reservasRepo.create(data);
        // Redirige a la lista de reservas si todo fue exitoso
        res.redirect('/hoteleria/reservas');
    } catch (err) {
        console.error("Error al crear la reserva:", err);
        const huespedes = await huespedesRepo.getAll();
        res.status(500).send(newReservaTemplate({ errors: { general: 'Error interno al guardar la reserva.' }, huespedes, data }));
    }
});

module.exports = router;