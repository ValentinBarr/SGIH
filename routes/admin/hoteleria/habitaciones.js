const express = require('express');
const router = express.Router();
const Repo = require('../../../repositories/hoteleria/habitaciones'); 
const listView = require('../../../views/admin/products/hoteleria/habitaciones');

// 👇 ================== RUTA GET ACTUALIZADA ================== 👇
router.get('/hoteleria/habitaciones', async (req, res) => {
  try {
    // 1. Repo.getAll ahora recibe todo el req.query (q, page, activo)
    const { 
      habitaciones, 
      totalPages, 
      currentPage, 
      totalHabitaciones 
    } = await Repo.getAll(req.query);
    
    // 2. Obtenemos los tipos (para el modal)
    const tiposHabitacion = await Repo.getTiposActivos(); 

    // 3. Pasamos los nuevos datos de paginación a la vista
    res.send(listView({ 
      habitaciones, 
      tiposHabitacion, 
      query: req.query, // query completo (para filtros y paginación)
      totalPages, 
      currentPage,
      totalHabitaciones
    }));
  } catch (error) {
    console.error('Error al cargar habitaciones:', error);
    res.status(500).send('Error al cargar habitaciones');
  }
});
// 👆 ================== FIN RUTA GET ================== 👆

// ... (las rutas POST de new, edit, y toggle siguen igual) ...

// ➕ CREAR NUEVA
router.post('/hoteleria/habitaciones/new', async (req, res) => {
  try {
    await Repo.create(req.body);
    // Redirige sin query params
    res.redirect('/hoteleria/habitaciones'); 
  } catch (error) {
    console.error('Error al crear habitación:', error);
    res.status(500).send('Error al crear habitación');
  }
});

// ✏️ EDITAR
router.post('/hoteleria/habitaciones/:id/edit', async (req, res) => {
  try {
    await Repo.update(req.params.id, req.body);
    // Preserva los filtros/página actuales al redirigir
    res.redirect(`/hoteleria/habitaciones?${new URLSearchParams(req.query)}`); 
  } catch (error) {
    console.error('Error al editar habitación:', error);
    res.status(500).send('Error al editar habitación');
  }
});

// 🔄 ACTIVAR/DESACTIVAR (Toggle)
router.post('/hoteleria/habitaciones/:id/toggle', async (req, res) => {
  try {
    const habitacionActual = await Repo.getById(req.params.id); 
    if (!habitacionActual) {
      return res.status(404).send('Habitación no encontrada');
    }
    const nuevoEstado = !habitacionActual.activo;
    await Repo.update(req.params.id, { activo: nuevoEstado });
    
    // Preserva los filtros/página actuales al redirigir
    res.redirect(`/hoteleria/habitaciones?${new URLSearchParams(req.query)}`);
  } catch (error) {
    console.error('Error al cambiar estado de la habitación:', error);
    res.status(500).send('Error al cambiar estado');
  }
});

module.exports = router;