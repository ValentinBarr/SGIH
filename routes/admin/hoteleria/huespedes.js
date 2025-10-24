const express = require('express');
const router = express.Router();
const Repo = require('../../../repositories/hoteleria/huespedes'); 
const listView = require('../../../views/admin/products/hoteleria/huespedes');

// 📄 LISTAR (con paginación y búsqueda)
router.get('/hoteleria/huespedes', async (req, res) => {
  try {
    const { 
      huespedes, 
      totalPages, 
      currentPage, 
      totalHuespedes 
    } = await Repo.getAll(req.query);
    
    res.send(listView({ 
      huespedes, 
      query: req.query,
      totalPages, 
      currentPage,
      totalHuespedes
    }));
  } catch (error) {
    console.error('Error al cargar huéspedes:', error);
    res.status(500).send('Error al cargar huéspedes');
  }
});

// ➕ CREAR NUEVO
router.post('/hoteleria/huespedes/new', async (req, res) => {
  try {
    await Repo.create(req.body);
    res.redirect('/hoteleria/huespedes');
  } catch (error) {
    console.error('Error al crear huésped:', error);
    res.status(500).send('Error al crear huésped');
  }
});

// ✏️ EDITAR
router.post('/hoteleria/huespedes/:id/edit', async (req, res) => {
  try {
    await Repo.update(req.params.id, req.body);
    // Redirige preservando la página y búsqueda
    res.redirect(`/hoteleria/huespedes?${new URLSearchParams(req.query)}`); 
  } catch (error) {
    console.error('Error al editar huésped:', error);
    res.status(500).send('Error al editar huésped');
  }
});

// No hay ruta /toggle ya que el modelo Huesped no tiene campo 'activo'

module.exports = router;