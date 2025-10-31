const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../../../generated/prisma');
const prisma = new PrismaClient();

const Repo = require('../../../repositories/depositos');
const listView = require('../../../views/admin/products/inventario/depositos/list');
const detailView = require('../../../views/admin/products/inventario/depositos/detail');
const parametrosView = require('../../../views/admin/products/inventario/depositos/parametros');

// =============================
// LISTADO DE DEPÓSITOS
// =============================
router.get('/inventarios/depositos', async (_req, res) => {
  try {
    const deps = await Repo.getDepositos();
    res.send(listView({ deps }));
  } catch (e) {
    console.error('❌ Error al listar depósitos:', e);
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
    if (!dep) return res.status(404).send('Depósito no encontrado');

    const { grid, total, pages } = await Repo.getStockGrid(depId, page, 10);
    const movimientos = await Repo.getMovimientos(depId, 20);
    const tiposComprobantes = await Repo.getTiposComprobantes();

    const productos = await prisma.productoDeposito.findMany({
      where: { id_dep: Number(depId) },
      include: { Producto: true },
      orderBy: { Producto: { nombre_prod: 'asc' } },
    });

    const tiposMovimientos = await prisma.tipoMovimiento.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });

    res.send(
      detailView({
        dep,
        grid,
        movimientos,
        productos,
        tiposComprobantes,
        tiposMovimientos,
        pagination: { page, total, pages },
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

    const tipoMov = await prisma.tipoMovimiento.findFirst({
      where: { direccion: 'IN' },
    });
    if (!tipoMov) throw new Error('No existe tipo de movimiento ENTRADA');

    const mov = await prisma.movimiento.create({
      data: {
        id_dep: depId,
        id_tipoMov: tipoMov.id_tipoMov,
        id_tipoComp: id_tipoComp ? Number(id_tipoComp) : null,
        observacion: observacion || null,
      },
    });

    const detalles = [];
    Object.keys(body).forEach((k) => {
      if (k.startsWith('producto_')) {
        const idx = k.split('_')[1];
        const prodDepId = Number(body[`producto_${idx}`]);
        const cantidad = Number(body[`cantidad_${idx}`] || 0);
        if (prodDepId && cantidad > 0) {
          detalles.push({
            id_mov: mov.id_mov,
            id_prodDep: prodDepId,
            cantidad,
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
// REGISTRAR MOVIMIENTO UNIFICADO
// =============================
router.post('/inventarios/depositos/:id/movimientos', async (req, res) => {
  const depId = Number(req.params.id); // Sacamos esto fuera del try para usarlo en el catch

  try {
    const { id_tipoMov, id_tipoComp, observacion, ...body } = req.body;

    if (!id_tipoMov) throw new Error('Debe seleccionar un tipo de movimiento');

    const tipoMov = await prisma.tipoMovimiento.findUnique({
      where: { id_tipoMov: Number(id_tipoMov) },
    });
    if (!tipoMov) throw new Error('Tipo de movimiento no válido');

    console.log(`🔄 Procesando movimiento "${tipoMov.nombre}" (${tipoMov.direccion}) en depósito ${depId}`);

    const productosForm = [];
    Object.keys(body).forEach((k) => {
      if (k.startsWith('producto_')) {
        const idx = k.split('_')[1];
        const prodDepId = Number(body[`producto_${idx}`]);
        const cantidad = Number(body[`cantidad_${idx}`] || 0);
        if (prodDepId && cantidad > 0) {
          productosForm.push({ prodDepId, cantidad });
        }
      }
    });

    if (productosForm.length === 0) {
      throw new Error('Debe seleccionar al menos un producto y cantidad');
    }

    // =============================
    // 📤 Validar stock usando Repo
    // =============================
    if (tipoMov.direccion === 'OUT') {
      console.log('📤 Validando stock disponible para salida...');

      for (const item of productosForm) {
        const prodDep = await prisma.productoDeposito.findUnique({
          where: { id_prodDep: item.prodDepId },
          include: { Producto: true },
        });
        if (!prodDep) throw new Error('Producto no encontrado en el depósito');

        // Aplicamos la corrección de la BBDD
        const stockActual = await Repo.getStockActual(item.prodDepId); 
        console.log(`   - ${prodDep.Producto.nombre_prod}: stock actual ${stockActual}, salida solicitada ${item.cantidad}`);

        if (stockActual < item.cantidad) {
          throw new Error(
            `Stock insuficiente para ${prodDep.Producto.nombre_prod}. Stock actual: ${stockActual}, solicitado: ${item.cantidad}`
          );
        }
      }

      console.log('✅ Validación de stock completada con éxito.');
    }
    
    // (El resto de la lógica 'try' sigue igual)
    // ...
    const mov = await prisma.movimiento.create({
      data: {
        id_dep: depId,
        id_tipoMov: tipoMov.id_tipoMov,
        id_tipoComp: id_tipoComp ? Number(id_tipoComp) : null,
        observacion: observacion || null,
      },
    });
    console.log(`✅ Movimiento creado (ID ${mov.id_mov})`);

    const detalles = productosForm.map((p) => ({
      id_mov: mov.id_mov,
      id_prodDep: p.prodDepId,
      cantidad: p.cantidad,
    }));

    if (detalles.length > 0) {
      await prisma.detalleMovimiento.createMany({ data: detalles });
      console.log(`✅ ${detalles.length} detalles agregados al movimiento`);
    }

    // Si todo sale bien, redirigimos como antes
    res.redirect(`/inventarios/depositos/${depId}`);

  } catch (e) {
    console.error('❌ ERROR registrando movimiento:', e.message);

    // --- ¡AQUÍ ESTÁ LA NUEVA LÓGICA! ---
    // Verificamos si es nuestro error de stock
    if (e.message.startsWith('Stock insuficiente')) {
      // Si es error de stock, volvemos a renderizar la vista con el mensaje
      try {
        const page = 1; // Volvemos a la página 1 por defecto
        const dep = await Repo.getDeposito(depId);
        if (!dep) return res.status(404).send('Depósito no encontrado');

        const { grid, total, pages } = await Repo.getStockGrid(depId, page, 10);
        const movimientos = await Repo.getMovimientos(depId, 20);
        const tiposComprobantes = await Repo.getTiposComprobantes();

        const productos = await prisma.productoDeposito.findMany({
          where: { id_dep: Number(depId) },
          include: { Producto: true },
          orderBy: { Producto: { nombre_prod: 'asc' } },
        });

        const tiposMovimientos = await prisma.tipoMovimiento.findMany({
          where: { activo: true },
          orderBy: { nombre: 'asc' },
        });

        // Renderizamos la vista de detalle, pero esta vez
        // le pasamos el mensaje de error.
        return res.send(
          detailView({
            dep,
            grid,
            movimientos,
            productos,
            tiposComprobantes,
            tiposMovimientos,
            pagination: { page, total, pages },
            error: e.message // <-- ¡LE PASAMOS EL ERROR A LA VISTA!
          })
        );
      } catch (fetchError) {
        // Si falla al buscar los datos para re-renderizar...
        console.error('❌ ERROR anidado al re-renderizar:', fetchError.message);
        return res.status(500).send('Error crítico: ' + fetchError.message);
      }
    }
    
    // Si es cualquier OTRO error, mostramos la pantalla 500
    return res.status(500).send('Error al registrar movimiento: ' + e.message);
  }
});



// =============================
// PARÁMETROS DEL DEPÓSITO
// =============================
router.get('/inventarios/depositos/:depId/parametros', async (req, res) => {
  const { depId } = req.params;
  const dep = await Repo.getDeposito(depId);

  const productosDeposito = await prisma.productoDeposito.findMany({
    where: { id_dep: Number(depId) },
    include: { Producto: true },
  });

  const productos = await prisma.producto.findMany({
    where: { activo_prod: true },
  });

  res.send(parametrosView({ dep, productosDeposito, productos }));
});

// =============================
// ACTUALIZAR PARÁMETROS
// =============================
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
        ubicacion_prodDep: campo === 'ubicacion' ? data[key] : undefined,
      },
    });
  }

  res.redirect(`/inventarios/depositos/${depId}/parametros`);
});

// =============================
// AGREGAR PRODUCTO A DEPÓSITO
// =============================
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
      ubicacion_prodDep: ubicacion || null,
    },
  });

  res.redirect(`/inventarios/depositos/${depId}/parametros`);
});

module.exports = router;
