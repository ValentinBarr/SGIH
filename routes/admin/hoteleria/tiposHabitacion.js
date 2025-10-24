const express = require('express');
const router = express.Router();
const Repo = require('../../../repositories/hoteleria/tiposHabitacion');
const listView = require('../../../views/admin/products/hoteleria/tiposHabitacion');

// 📄 LISTAR
router.get('/hoteleria/tipos-habitacion', async (req, res) => {
  try {
    const tipos = await Repo.getAll(req.query);
    const comodidades = await Repo.getComodidadesActivas();
    res.send(listView({ tipos, comodidades, query: req.query }));
  } catch (error) {
    console.error('Error al cargar tipos de habitación:', error);
    res.status(500).send('Error al cargar tipos de habitación');
  }
});

// ➕ CREAR NUEVO
router.post('/hoteleria/tipos-habitacion/new', async (req, res) => {
  try {
    const data = req.body;

    // Asegurarse de que las comodidades sean siempre un array
    const comodidades = Array.isArray(data.comodidades)
      ? data.comodidades
      : data.comodidades
      ? [data.comodidades]
      : [];

    await Repo.create({ ...data, comodidades });
    res.redirect('/hoteleria/tipos-habitacion');
  } catch (error) {
    console.error('Error al crear tipo de habitación:', error);
    res.status(500).send('Error al crear tipo de habitación');
  }
});

// ✏️ EDITAR
router.post('/hoteleria/tipos-habitacion/:id/edit', async (req, res) => {
  try {
    const data = req.body;

    const comodidades = Array.isArray(data.comodidades)
      ? data.comodidades
      : data.comodidades
      ? [data.comodidades]
      : [];

    await Repo.update(req.params.id, { ...data, comodidades });
    res.redirect('/hoteleria/tipos-habitacion');
  } catch (error) {
    console.error('Error al editar tipo de habitación:', error);
    res.status(500).send('Error al editar tipo de habitación');
  }
});

// ================== RUTA ACTUALIZADA ==================
// 🔄 ACTIVAR/DESACTIVAR (sin Repo.toggle)
router.post('/hoteleria/tipos-habitacion/:id/toggle', async (req, res) => {
  try {
    // 1. Obtenemos el registro actual.
    // (¡Asegúrate de haber añadido 'getOneById' a tu repositorio!)
// ... en la ruta POST /:id/toggle
    const tipoActual = await Repo.getById(req.params.id);
    if (!tipoActual) {
      return res.status(404).send('Tipo de habitación no encontrado');
    }

    // 2. Calculamos el nuevo estado (invertimos el actual)
    const nuevoEstado = !tipoActual.activo;

    // 3. Actualizamos SÓLO el campo 'activo'.
    // Hacemos esto asumiendo que tu Repo.update maneja las 'comodidades'
    // sólo si el array 'comodidades' es pasado explícitamente (como en la ruta '/edit'),
    // y si no se pasa, las ignora (no las borra).
    await Repo.update(req.params.id, { activo: nuevoEstado });
    
    // Redirige de vuelta a la lista
    res.redirect('/hoteleria/tipos-habitacion');
  } catch (error) {
    console.error('Error al cambiar estado del tipo de habitación:', error);
    res.status(500).send('Error al cambiar estado');
  }
});
// ================== FIN RUTA ACTUALIZADA ==================

// ❌ ELIMINAR (soft delete)
router.post('/hoteleria/tipos-habitacion/:id/delete', async (req, res) => {
  try {
    await Repo.delete(req.params.id);
    res.redirect('/hoteleria/tipos-habitacion');
  } catch (error) {
    console.error('Error al eliminar tipo de habitación:', error);
    res.status(500).send('Error al eliminar tipo de habitación');
  }
});

module.exports = router;