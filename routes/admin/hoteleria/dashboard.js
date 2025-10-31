const express = require('express');
const router = express.Router();
const dashboardView = require('../../../views/admin/products/hoteleria/dashboard');
const dashboardRepo = require('../../../repositories/hoteleria/dashboard');

// ====================================================================
// VISTA PRINCIPAL DEL DASHBOARD
// ====================================================================

router.get('/hoteleria/dashboard', async (req, res) => {
    try {
        res.send(dashboardView());
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        res.status(500).send('Error al cargar el dashboard');
    }
});

// ====================================================================
// ENDPOINTS API - KPIS
// ====================================================================

/**
 * GET /api/hoteleria/dashboard/kpis
 * Retorna todos los KPIs principales en una sola llamada
 */
router.get('/api/hoteleria/dashboard/kpis', async (req, res) => {
    try {
        const kpis = await dashboardRepo.getAllKPIs();
        res.json(kpis);
    } catch (error) {
        console.error('Error al obtener KPIs:', error);
        res.status(500).json({ error: 'Error al obtener KPIs' });
    }
});

// ====================================================================
// ENDPOINTS API - GRÁFICOS
// ====================================================================

/**
 * GET /api/hoteleria/dashboard/ocupacion-adr
 * Gráfico 1: Ocupación y ADR histórico
 * Query params: dias (default: 30)
 */
router.get('/api/hoteleria/dashboard/ocupacion-adr', async (req, res) => {
    try {
        const dias = parseInt(req.query.dias) || 30;
        const data = await dashboardRepo.getOcupacionADRHistorico(dias);
        res.json(data);
    } catch (error) {
        console.error('Error al obtener ocupación/ADR:', error);
        res.status(500).json({ error: 'Error al obtener datos de ocupación/ADR' });
    }
});

/**
 * GET /api/hoteleria/dashboard/revenue-tipo
 * Gráfico 2: Revenue por tipo de habitación
 */
router.get('/api/hoteleria/dashboard/revenue-tipo', async (req, res) => {
    try {
        const data = await dashboardRepo.getRevenuePorTipo();
        res.json(data);
    } catch (error) {
        console.error('Error al obtener revenue por tipo:', error);
        res.status(500).json({ error: 'Error al obtener revenue por tipo' });
    }
});

/**
 * GET /api/hoteleria/dashboard/estados-habitaciones
 * Gráfico 3: Estados de habitaciones (dona)
 */
router.get('/api/hoteleria/dashboard/estados-habitaciones', async (req, res) => {
    try {
        const data = await dashboardRepo.getEstadosHabitaciones();
        res.json(data);
    } catch (error) {
        console.error('Error al obtener estados de habitaciones:', error);
        res.status(500).json({ error: 'Error al obtener estados de habitaciones' });
    }
});

/**
 * GET /api/hoteleria/dashboard/forecast-ocupacion
 * Gráfico 4: Curva de ocupación futura
 * Query params: dias (default: 30)
 */
router.get('/api/hoteleria/dashboard/forecast-ocupacion', async (req, res) => {
    try {
        const dias = parseInt(req.query.dias) || 30;
        const data = await dashboardRepo.getForecastOcupacion(dias);
        res.json(data);
    } catch (error) {
        console.error('Error al obtener forecast de ocupación:', error);
        res.status(500).json({ error: 'Error al obtener forecast de ocupación' });
    }
});

/**
 * GET /api/hoteleria/dashboard/revenue-comparativo
 * Gráfico 5: Revenue comparativo año actual vs anterior
 */
router.get('/api/hoteleria/dashboard/revenue-comparativo', async (req, res) => {
    try {
        const data = await dashboardRepo.getRevenueComparativo();
        res.json(data);
    } catch (error) {
        console.error('Error al obtener revenue comparativo:', error);
        res.status(500).json({ error: 'Error al obtener revenue comparativo' });
    }
});

// ====================================================================
// ENDPOINTS API - TABLAS OPERATIVAS
// ====================================================================

/**
 * GET /api/hoteleria/dashboard/checkins-hoy
 * Tabla 1: Check-ins de hoy con detalle
 */
router.get('/api/hoteleria/dashboard/checkins-hoy', async (req, res) => {
    try {
        const data = await dashboardRepo.getCheckinsDetalle();
        res.json(data);
    } catch (error) {
        console.error('Error al obtener check-ins de hoy:', error);
        res.status(500).json({ error: 'Error al obtener check-ins de hoy' });
    }
});

/**
 * GET /api/hoteleria/dashboard/checkouts-hoy
 * Tabla 2: Check-outs de hoy con detalle
 */
router.get('/api/hoteleria/dashboard/checkouts-hoy', async (req, res) => {
    try {
        const data = await dashboardRepo.getCheckoutsDetalle();
        res.json(data);
    } catch (error) {
        console.error('Error al obtener check-outs de hoy:', error);
        res.status(500).json({ error: 'Error al obtener check-outs de hoy' });
    }
});

/**
 * GET /api/hoteleria/dashboard/habitaciones-criticas
 * Tabla 3: Habitaciones que requieren atención
 */
router.get('/api/hoteleria/dashboard/habitaciones-criticas', async (req, res) => {
    try {
        const data = await dashboardRepo.getHabitacionesCriticas();
        res.json(data);
    } catch (error) {
        console.error('Error al obtener habitaciones críticas:', error);
        res.status(500).json({ error: 'Error al obtener habitaciones críticas' });
    }
});

module.exports = router;
