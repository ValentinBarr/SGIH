const express = require('express');
const router = express.Router();
// Apunta al nuevo repositorio de comodidades
const Repo = require('../../../repositories/hoteleria/comodidades'); 
// Apunta a la nueva vista de comodidades
const listView = require('../../../views/admin/products/hoteleria/comodidades');

// 📄 LISTAR
router.get('/hoteleria/comodidades', async (req, res) => {
  try {
    const comodidades = await Repo.getAll(req.query);
    res.send(listView({ comodidades, query: req.query }));
  } catch (error) {
    console.error('Error al cargar comodidades:', error);
    res.status(500).send('Error al cargar comodidades');
  }
});

// ➕ CREAR NUEVA
router.post('/hoteleria/comodidades/new', async (req, res) => {
  try {
    await Repo.create(req.body);
    res.redirect('/hoteleria/comodidades');
  } catch (error) {
    console.error('Error al crear comodidad:', error);
    res.status(500).send('Error al crear comodidad');
  }
});

// ✏️ EDITAR
router.post('/hoteleria/comodidades/:id/edit', async (req, res) => {
  try {
    // Usamos el 'update' seguro que ignora el ID del body
    await Repo.update(req.params.id, req.body);
    res.redirect('/hoteleria/comodidades');
  } catch (error) {
    console.error('Error al editar comodidad:', error);
    res.status(500).send('Error al editar comodidad');
  }
});

// 🔄 ACTIVAR/DESACTIVAR (Toggle)
router.post('/hoteleria/comodidades/:id/toggle', async (req, res) => {
  try {
    // 1. Obtenemos el registro actual.
    const comodidadActual = await Repo.getById(req.params.id); 

    if (!comodidadActual) {
      return res.status(404).send('Comodidad no encontrada');
    }

    // 2. Calculamos el nuevo estado
    const nuevoEstado = !comodidadActual.activo;

    // 3. Actualizamos SÓLO el campo 'activo'
    await Repo.update(req.params.id, { activo: nuevoEstado });
    
    res.redirect('/hoteleria/comodidades');
  } catch (error) {
    console.error('Error al cambiar estado de la comodidad:', error);
    res.status(500).send('Error al cambiar estado');
  }
});

module.exports = router;