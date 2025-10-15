const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../../../generated/prisma');
const prisma = new PrismaClient();

const Repo = require('../../../repositories/depositos');
const listView = require('../../../views/admin/products/inventario/depositos/list');
const detailView = require('../../../views/admin/products/inventario/depositos/detail');
const parametrosView = require('../../../views/admin/products/inventario/depositos/parametros');


// LISTADO
router.get('/inventarios/depositos', async (_req, res) => {
  try {
    const deps = await Repo.getDepositos();
    res.send(listView({ deps }));
  } catch (e) {
    console.error(e);
    res.status(500).send('No se pudo cargar depósitos');
  }
});

// =============================
// DETALLE DE DEPÓSITO
// =============================
router.get('/inventarios/depositos/:id', async (req, res) => {
  try {
    const depId = req.params.id;
    const page = parseInt(req.query.page) || 1;

    const dep = await Repo.getDeposito(depId);
    if (!dep) {
      return res.status(404).send('Depósito no encontrado');
    }

    const { grid, total, pages } = await Repo.getStockGrid(depId, page, 10);
    const movimientos = await Repo.getMovimientos(depId, 20);

    // Tipos de comprobantes (para registrar entradas)
    const tiposComprobantes = await Repo.getTiposComprobantes();
    
    // Productos de este depósito (para entradas y salidas)
    const productos = await prisma.productoDeposito.findMany({
      where: { id_dep: Number(depId) },
      include: { Producto: true },
      orderBy: { Producto: { nombre_prod: 'asc' } }
    });

    res.send(
      detailView({
        dep,
        grid,
        movimientos,
        productos,
        tiposComprobantes,
        pagination: { page, total, pages }
      })
    );
  } catch (e) {
    console.error('❌ ERROR en detalle depósito:', e);
    res.status(500).send('Error al cargar el detalle del depósito');
  }
});

// =============================
// REGISTRAR ENTRADA
// =============================
router.post('/inventarios/depositos/:id/entradas', async (req, res) => {
  try {
    const depId = Number(req.params.id);
    const { id_tipoComp, observacion, ...body } = req.body;

    // Buscar tipo de movimiento ENTRADA
    const tipoMov = await prisma.tipoMovimiento.findFirst({
      where: { direccion: 'IN' }
    });
    if (!tipoMov) throw new Error('No existe tipo de movimiento ENTRADA');

    // Crear movimiento
    const mov = await prisma.movimiento.create({
      data: {
        id_dep: depId,
        id_tipoMov: tipoMov.id_tipoMov,
        id_tipoComp: id_tipoComp ? Number(id_tipoComp) : null,
        observacion: observacion || null,
      }
    });

    // Cargar productos del form (producto_1, cantidad_1, producto_2...)
    const detalles = [];
    Object.keys(body).forEach(k => {
      if (k.startsWith('producto_')) {
        const idx = k.split('_')[1];
        const prodDepId = Number(body[`producto_${idx}`]);
        const cantidad = Number(body[`cantidad_${idx}`] || 0);
        if (prodDepId && cantidad > 0) {
          detalles.push({
            id_mov: mov.id_mov,
            id_prodDep: prodDepId,
            cantidad
          });
        }
      }
    });

    if (detalles.length) {
      await prisma.detalleMovimiento.createMany({ data: detalles });
    }

    res.redirect(`/inventarios/depositos/${depId}`);
  } catch (e) {
    console.error('❌ ERROR registrando entrada:', e);
    res.status(500).send('Error al registrar entrada');
  }
});


// =============================
// REGISTRAR SALIDA
// =============================
router.post('/inventarios/depositos/:id/salidas', async (req, res) => {
  try {
    const depId = Number(req.params.id);
    const { observacion, ...body } = req.body;

    // Tipo de movimiento SALIDA
    const tipoMov = await prisma.tipoMovimiento.findFirst({
      where: { direccion: 'OUT' }
    });
    if (!tipoMov) throw new Error('No existe tipo de movimiento SALIDA');

    // Crear movimiento
    const mov = await prisma.movimiento.create({
      data: {
        id_dep: depId,
        id_tipoMov: tipoMov.id_tipoMov,
        observacion: observacion || null,
      }
    });

    // Procesar productos
    const detalles = [];
    Object.keys(body).forEach(k => {
      if (k.startsWith('producto_')) {
        const idx = k.split('_')[1];
        const prodDepId = Number(body[`producto_${idx}`]);
        const cantidad = Number(body[`cantidad_${idx}`] || 0);
        if (prodDepId && cantidad > 0) {
          detalles.push({
            id_mov: mov.id_mov,
            id_prodDep: prodDepId,
            cantidad
          });
        }
      }
    });

    if (detalles.length) {
      await prisma.detalleMovimiento.createMany({ data: detalles });
    }

    res.redirect(`/inventarios/depositos/${depId}`);
  } catch (e) {
    console.error('❌ ERROR registrando salida:', e);
    res.status(500).send('Error al registrar salida: ' + e.message);
  }
});


// ... (resto de las rutas de parámetros) ...
router.get('/inventarios/depositos/:depId/parametros', async (req, res) => {
  const { depId } = req.params;
  const dep = await Repo.getDeposito(depId);

  const productosDeposito = await prisma.productoDeposito.findMany({
    where: { id_dep: Number(depId) },
    include: { Producto: true }
  });

  const productos = await prisma.producto.findMany({
    where: { activo_prod: true }
  });

  res.send(parametrosView({ dep, productosDeposito, productos }));
});

// Guardar cambios de parámetros
router.post('/inventarios/depositos/:depId/parametros/update', async (req, res) => {
  const { depId } = req.params;
  const data = req.body;

  for (const key of Object.keys(data)) {
    const [campo, id] = key.split('_');
    if (!id) continue;

    await prisma.productoDeposito.update({
      where: { id_prodDep: Number(id) },
      data: {
        minimo_prodDep: campo === 'minimo' ? Number(data[key]) : undefined,
        maximo_prodDep: campo === 'maximo' ? Number(data[key]) : undefined,
        loteReposicion_prodDep: campo === 'lote' ? Number(data[key]) : undefined,
        ubicacion_prodDep: campo === 'ubicacion' ? data[key] : undefined
      }
    });
  }

  res.redirect(`/inventarios/depositos/${depId}/parametros`);
});

// Agregar nuevo producto a depósito
router.post('/inventarios/depositos/:depId/parametros/add', async (req, res) => {
  const { depId } = req.params;
  const { id_prod, minimo, maximo, lote, ubicacion } = req.body;

  await prisma.productoDeposito.create({
    data: {
      id_prod: Number(id_prod),
      id_dep: Number(depId),
      minimo_prodDep: Number(minimo),
      maximo_prodDep: maximo ? Number(maximo) : null,
      loteReposicion_prodDep: lote ? Number(lote) : null,
      ubicacion_prodDep: ubicacion || null
    }
  });

  res.redirect(`/inventarios/depositos/${depId}/parametros`);
});

module.exports = router;