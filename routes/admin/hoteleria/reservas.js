const express = require('express');
const router = express.Router();
const Repo = require('../../../repositories/hoteleria/reservas');
const listView = require('../../../views/admin/products/hoteleria/reservas');
const { EstadoReserva } = require('../../../generated/prisma');

// 📄 LISTAR (Ruta principal que muestra la página)
router.get('/hoteleria/reservas', async (req, res) => {
  try {
    // 1. Obtener datos de reservas
    const { reservas, totalPages, currentPage, totalReservas } =
      await Repo.getAll(req.query);

    // 2. Obtener datos para filtros y modal de "Nuevo"
    const { tiposHabitacion, estadosReserva, huespedes } =
      await Repo.getFormData();

    // 3. Enviar todo a la vista
    res.send(
      listView({
        reservas,
        tiposHabitacion, // Para filtros y modal
        estadosReserva,  // Para filtros
        huespedes,       // Para modal
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

// ➕ CREAR NUEVA RESERVA (desde el modal) - CÓDIGO CORREGIDO PARA TRANSACCIÓN
router.post('/hoteleria/reservas/new', async (req, res) => {
  try {
    await Repo.create(req.body);
    // Redirige de vuelta a la lista (htmx se encargará)
    res.redirect('/hoteleria/reservas');
  } catch (error) {
    console.error('Error al crear reserva (Transacción):', error.message);
    
    // Devolvemos el error de la transacción para ser mostrado al usuario
    // Usamos el código 400 (Bad Request) para errores de validación de negocio.
    res.status(400).send(`Error al crear reserva: ${error.message}`);
  }
});

// --- RUTAS DE ACCIONES (POST) ---

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

// --- RUTAS PARA EL MODAL DE EDICIÓN ---

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

// 💾 OBTENER DATOS (para llenar el modal)
router.get('/hoteleria/reservas/:id/data', async (req, res) => {
  try {
    const reserva = await Repo.getById(req.params.id);
    if (!reserva) {
      return res.status(404).send('Reserva no encontrada');
    }
    res.json(reserva); // Enviamos JSON al script del cliente
  } catch (error) {
    res.status(500).send('Error al obtener datos de la reserva');
  }
});

module.exports = router;