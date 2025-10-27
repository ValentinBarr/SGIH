const express = require('express');
const router = express.Router();
// 💡 Usa los nombres de tus archivos reales
const HabitacionRepo = require('../../../repositories/hoteleria/check'); // Repositorio de Habitaciones/Check
const RepoReservas = require('../../../repositories/hoteleria/reservas'); // Repositorio de Reservas
const boardView = require('../../../views/admin/products/hoteleria/check/board'); // Vista del tablero
// 💡 IMPORTAR LA VISTA DE DETALLES (Descomentado)
const checkinDetailView = require('../../../views/admin/products/hoteleria/check/checkin-detail'); 
const { EstadoHabitacion, EstadoReserva } = require('../../../generated/prisma');
const { format } = require('date-fns'); 
const { es } = require('date-fns/locale'); 

// --- Helper formatDate ---
const formatDate = (dateStr, formatStr = 'dd/MM/yyyy') => {
    // ... (código del helper)
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return format(date, formatStr, { locale: es });
};

// ==========================================
// RUTA 1: VISTA DEL TABLERO (GET)
// ==========================================
router.get('/hoteleria/board', async (req, res) => {
    // ... (código sin cambios)
    try {
        const habitaciones = await HabitacionRepo.getStatusBoard();
        res.send(boardView({ habitaciones }));
    } catch (error) {
        console.error('Error al cargar el tablero de estatus:', error);
        res.status(500).send('Error al cargar el tablero de estatus');
    }
});

// ==========================================
// RUTA 2: ACCIONES RÁPIDAS (POST/API)
// ==========================================
router.post('/hoteleria/board/action', async (req, res) => {
    // ... (código sin cambios)
    const { habId, action } = req.body;
    const id_hab = parseInt(habId);

    try {
        let result;
        switch (action) {
            case 'checkout':
                result = await HabitacionRepo.performCheckInOut(id_hab, EstadoReserva.CHECKED_OUT);
                break;
            case 'limpieza':
                result = await HabitacionRepo.updateHabitacionState(id_hab, EstadoHabitacion.LIMPIEZA);
                break;
            case 'disponible':
                result = await HabitacionRepo.updateHabitacionState(id_hab, EstadoHabitacion.DISPONIBLE);
                break;
            default:
                return res.status(400).json({ success: false, message: 'Acción no válida.' });
        }
        const habitacionesActualizadas = await HabitacionRepo.getStatusBoard();
        const habActualizada = habitacionesActualizadas.find(h => h.id_hab === id_hab);
        res.json({
            success: true,
            message: `Acción '${action}' completada para Habitación ${habActualizada?.numero}`,
            habitacion: habActualizada,
        });
    } catch (error) {
        console.error(`Error al ejecutar acción ${action}:`, error);
        res.status(400).json({ success: false, message: error.message || `Error al ejecutar ${action}.` });
    }
});

// ==============================================
// RUTA GET: PÁGINA DE DETALLES PARA CHECK-IN
// ==============================================
router.get('/hoteleria/reservas/:id/checkin-detail', async (req, res) => {
    try {
        const reservaId = parseInt(req.params.id);
        const reserva = await RepoReservas.getById(reservaId); // Usa RepoReservas

        if (!reserva || reserva.estado !== 'CONFIRMADA') {
            return res.status(404).send('Reserva no encontrada o no está en estado CONFIRMADA.');
        }

        // ✅ LLAMAR A LA VISTA REAL (Descomentado)
        res.send(checkinDetailView({ reserva })); 

        // ❌ Placeholder HTML eliminado
        // res.send(`<h1>...</h1>...`);

    } catch (error) {
        console.error("Error al cargar detalles de check-in:", error);
        res.status(500).send("Error al cargar detalles.");
    }
});

// ==============================================
// RUTA POST: CONFIRMAR CHECK-IN
// ==============================================
router.post('/hoteleria/reservas/:id/checkin', async (req, res) => {
    // ... (código sin cambios)
    try {
        await RepoReservas.updateState(req.params.id, EstadoReserva.CHECKED_IN);
        res.redirect(`/hoteleria/board?success=Check-in realizado`); 
    } catch (error) {
        console.error('Error al hacer check-in:', error);
        res.redirect(`/hoteleria/reservas/${req.params.id}/checkin-detail?error=${encodeURIComponent(error.message)}`);
    }
});

module.exports = router;