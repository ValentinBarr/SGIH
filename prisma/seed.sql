BEGIN;

----------------------------------------------------------------
-- A) AJUSTE (+) en Housekeeping (2 líneas)
----------------------------------------------------------------
-- Cabecera (si no existe)


INSERT INTO "TipoDeposito"
("nombre_tipoDep","esPuntoDeVenta_tipoDep","esConsumoInterno_tipoDep","frecuenciaConteoDias_tipoDep","activo_tipoDep")
VALUES
('Central',        false, false, 30, true),
('Bar',            true,  false, 7,  true),
('Housekeeping',   false, true,  7,  true),
('Minibar',        true,  false, 1,  true),
('Punto de Venta', true,  false, 7,  true),
('Cocina',         false, true,  7,  true);

INSERT INTO "TipoMovimiento" ("Nombre","Direccion","Dominio","Activo") VALUES
('Entrada por compra',           'IN',  'COMPRA',        true),
('Salida por venta',             'OUT', 'VENTA',         true),
('Salida por transferencia',     'OUT', 'TRANSFERENCIA', true),
('Entrada por transferencia',    'IN',  'TRANSFERENCIA', true),
('Ajuste de entrada',            'IN',  'AJUSTE',        true),
('Ajuste de salida',             'OUT', 'AJUSTE',        true),
('Conteo: sobrante (ajuste +)',  'IN',  'CONTEO',        true),
('Conteo: faltante (ajuste -)',  'OUT', 'CONTEO',        true);


INSERT INTO "Producto"
("nombre_prod","unidad_prod","tipo_prod","stockeable_prod","vendible_prod","descuentaStockVenta_prod","stockMinimoGlobal_prod","activo_prod","precio_prod")
VALUES
('Agua Mineral 500ml',        'UN', 'VENDIBLE', true,  true,  true,  50.000,  true, 1200.00),
('Snack Mix 50g',             'UN', 'VENDIBLE', true,  true,  true,  30.000,  true, 1800.00),
('Gin Tonic',                 'UN', 'VENDIBLE', false, true,  true,  NULL,    true, 5000.00),  
('Desayuno Buffet',           'SRV','SERVICE',  false, true,  false, NULL,    true, 8000.00),  
('Shampoo Hotelero 30ml',     'UN', 'AMENITY',  true,  false, false, 200.000, true, NULL),
('Toalla Blanca',             'UN', 'LINEN',    true,  false, false, 50.000,  true, NULL),
('Detergente Líquido 5L',     'LT', 'INSUMO',   true,  false, false, 10.000,  true, NULL),
('Sábanas King Size',         'UN', 'LINEN',    true,  false, false, 20.000,  true, NULL),
('Café Doble',                'UN', 'VENDIBLE', false, true,  true,  NULL,    true, 2000.00),  
('Panificados p/ desayuno',   'KG', 'INSUMO',   true,  false, false, 15.000,  true, NULL);

INSERT INTO "Deposito" ("id_tipoDep","nombre_dep","activo_dep")
VALUES
((SELECT "id_tipoDep" FROM "TipoDeposito" WHERE "nombre_tipoDep"='Central'),       'Central',             true),
((SELECT "id_tipoDep" FROM "TipoDeposito" WHERE "nombre_tipoDep"='Bar'),           'Bar Planta Baja',     true),
((SELECT "id_tipoDep" FROM "TipoDeposito" WHERE "nombre_tipoDep"='Housekeeping'),  'Housekeeping Piso 1', true),
((SELECT "id_tipoDep" FROM "TipoDeposito" WHERE "nombre_tipoDep"='Housekeeping'),  'Housekeeping Piso 2', true),
((SELECT "id_tipoDep" FROM "TipoDeposito" WHERE "nombre_tipoDep"='Minibar'),       'Minibar Piso 1',      true),
((SELECT "id_tipoDep" FROM "TipoDeposito" WHERE "nombre_tipoDep"='Cocina'),        'Cocina Principal',    true),
((SELECT "id_tipoDep" FROM "TipoDeposito" WHERE "nombre_tipoDep"='Punto de Venta'),'Kiosco Lobby',        true);

INSERT INTO "ProductoDeposito"
("id_prod","id_dep","minimo_prodDep","parLevel_prodDep","maximo_prodDep","loteReposicion_prodDep","ubicacion_prodDep")
VALUES
((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Agua Mineral 500ml'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Central'),
60.000,120.000,240.000,24.000,'CEN-BEV-01'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Snack Mix 50g'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Central'),
40.000, 80.000,160.000,20.000,'CEN-SNK-01'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Shampoo Hotelero 30ml'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Central'),
200.000,400.000,800.000,100.000,'CEN-HK-01'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Toalla Blanca'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Central'),
50.000,100.000,200.000,25.000,'CEN-LIN-01'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Detergente Líquido 5L'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Central'),
10.000, 20.000, 40.000, 5.000,'CEN-QL-01'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Sábanas King Size'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Central'),
20.000, 40.000, 80.000,10.000,'CEN-LIN-02'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Panificados p/ desayuno'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Central'),
15.000, 30.000, 60.000, 5.000,'CEN-COC-01'),
((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Agua Mineral 500ml'),
(SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Bar Planta Baja'),
12.000, 24.000, 48.000, 6.000,'BAR-BEV-01'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Snack Mix 50g'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Bar Planta Baja'),
10.000, 20.000, 40.000, 5.000,'BAR-SNK-01'),
((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Agua Mineral 500ml'),
(SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Minibar Piso 1'),
24.000, 48.000, 96.000,12.000,'MB-P1-01'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Snack Mix 50g'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Minibar Piso 1'),
24.000, 48.000, 96.000,12.000,'MB-P1-02'),
((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Shampoo Hotelero 30ml'),
(SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Housekeeping Piso 1'),
25.000, 50.000,100.000,25.000,'HK-P1-01'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Toalla Blanca'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Housekeeping Piso 1'),
20.000, 40.000, 80.000,10.000,'HK-P1-02'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Sábanas King Size'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Housekeeping Piso 1'),
10.000, 20.000, 40.000,10.000,'HK-P1-03'),
((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Panificados p/ desayuno'),
(SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Cocina Principal'),
10.000, 20.000, 40.000, 5.000,'COC-01'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Detergente Líquido 5L'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Cocina Principal'),
5.000, 10.000, 20.000, 2.000,'COC-02'),
((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Agua Mineral 500ml'),
(SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Kiosco Lobby'),
8.000, 16.000, 32.000, 4.000,'KIO-BEV-01'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Snack Mix 50g'),
(SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Kiosco Lobby'),
8.000, 16.000, 32.000, 4.000,'KIO-SNK-01')
ON CONFLICT ("id_prod","id_dep") DO NOTHING;


INSERT INTO "ComprobanteInventario"
("docType_compInv","fecha_compInv","estado_compInv","fromDepId_compInv","toDepId_compInv","observacion_compInv")
SELECT 'AJUSTE','2025-09-09 09:00:00','POSTED',NULL,NULL,'Ajuste inventario HK'
WHERE NOT EXISTS (
  SELECT 1 FROM "ComprobanteInventario"
  WHERE "docType_compInv"='AJUSTE'
    AND "fecha_compInv"='2025-09-09 09:00:00'
    AND "observacion_compInv"='Ajuste inventario HK'
);

-- Línea 1 (Toallas +5)
INSERT INTO "MovimientoInventario"
("docId_compInv","id_prod","id_dep","tipoMovId_movInv","cantidad_movInv","costoUnitario_movInv","uom_movInv","nota_movInv")
SELECT
  (SELECT "docId_compInv" FROM "ComprobanteInventario"
   WHERE "docType_compInv"='AJUSTE' AND "fecha_compInv"='2025-09-09 09:00:00'
         AND "observacion_compInv"='Ajuste inventario HK' LIMIT 1),
  (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Toalla Blanca' LIMIT 1),
  (SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Housekeeping Piso 1' LIMIT 1),
  (SELECT "TipoMovimientoId" FROM "TipoMovimiento" WHERE "Dominio"='AJUSTE' AND "Direccion"='IN' LIMIT 1),
  5::numeric, CAST(NULL AS numeric), 'UN', 'Toallas +5'
WHERE NOT EXISTS (
  SELECT 1 FROM "MovimientoInventario" mi
  WHERE mi."docId_compInv" = (SELECT "docId_compInv" FROM "ComprobanteInventario"
                              WHERE "docType_compInv"='AJUSTE' AND "fecha_compInv"='2025-09-09 09:00:00'
                                    AND "observacion_compInv"='Ajuste inventario HK' LIMIT 1)
    AND mi."id_prod" = (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Toalla Blanca' LIMIT 1)
    AND mi."nota_movInv" = 'Toallas +5'
);

-- Línea 2 (Shampoo +2)
INSERT INTO "MovimientoInventario"
("docId_compInv","id_prod","id_dep","tipoMovId_movInv","cantidad_movInv","costoUnitario_movInv","uom_movInv","nota_movInv")
SELECT
  (SELECT "docId_compInv" FROM "ComprobanteInventario"
   WHERE "docType_compInv"='AJUSTE' AND "fecha_compInv"='2025-09-09 09:00:00'
         AND "observacion_compInv"='Ajuste inventario HK' LIMIT 1),
  (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Shampoo Hotelero 30ml' LIMIT 1),
  (SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Housekeeping Piso 1' LIMIT 1),
  (SELECT "TipoMovimientoId" FROM "TipoMovimiento" WHERE "Dominio"='AJUSTE' AND "Direccion"='IN' LIMIT 1),
  2::numeric, CAST(NULL AS numeric), 'UN', 'Shampoo +2'
WHERE NOT EXISTS (
  SELECT 1 FROM "MovimientoInventario" mi
  WHERE mi."docId_compInv" = (SELECT "docId_compInv" FROM "ComprobanteInventario"
                              WHERE "docType_compInv"='AJUSTE' AND "fecha_compInv"='2025-09-09 09:00:00'
                                    AND "observacion_compInv"='Ajuste inventario HK' LIMIT 1)
    AND mi."id_prod" = (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Shampoo Hotelero 30ml' LIMIT 1)
    AND mi."nota_movInv" = 'Shampoo +2'
);

----------------------------------------------------------------
-- B) VENTA (–) desde Kiosco (3 líneas)
----------------------------------------------------------------
-- Cabecera
INSERT INTO "ComprobanteInventario"
("docType_compInv","fecha_compInv","estado_compInv","fromDepId_compInv","toDepId_compInv","observacion_compInv")
SELECT 'VENTA','2025-09-09 10:30:00','POSTED',
       (SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Kiosco Lobby' LIMIT 1),
       NULL,'Ticket POS #KIO-0002'
WHERE NOT EXISTS (
  SELECT 1 FROM "ComprobanteInventario"
  WHERE "docType_compInv"='VENTA'
    AND "fecha_compInv"='2025-09-09 10:30:00'
    AND "observacion_compInv"='Ticket POS #KIO-0002'
);

-- Agua x2
INSERT INTO "MovimientoInventario"
("docId_compInv","id_prod","id_dep","tipoMovId_movInv","cantidad_movInv","costoUnitario_movInv","uom_movInv","nota_movInv")
SELECT
  (SELECT "docId_compInv" FROM "ComprobanteInventario"
   WHERE "docType_compInv"='VENTA' AND "fecha_compInv"='2025-09-09 10:30:00'
         AND "observacion_compInv"='Ticket POS #KIO-0002' LIMIT 1),
  (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Agua Mineral 500ml' LIMIT 1),
  (SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Kiosco Lobby' LIMIT 1),
  (SELECT "TipoMovimientoId" FROM "TipoMovimiento" WHERE "Dominio"='VENTA' AND "Direccion"='OUT' LIMIT 1),
  2::numeric, CAST(NULL AS numeric), 'UN', 'Agua x2'
WHERE NOT EXISTS (
  SELECT 1 FROM "MovimientoInventario" mi
  WHERE mi."docId_compInv" = (SELECT "docId_compInv" FROM "ComprobanteInventario"
                              WHERE "docType_compInv"='VENTA' AND "fecha_compInv"='2025-09-09 10:30:00'
                                    AND "observacion_compInv"='Ticket POS #KIO-0002' LIMIT 1)
    AND mi."id_prod" = (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Agua Mineral 500ml' LIMIT 1)
    AND mi."nota_movInv" = 'Agua x2'
);

-- Snack x1
INSERT INTO "MovimientoInventario"
("docId_compInv","id_prod","id_dep","tipoMovId_movInv","cantidad_movInv","costoUnitario_movInv","uom_movInv","nota_movInv")
SELECT
  (SELECT "docId_compInv" FROM "ComprobanteInventario"
   WHERE "docType_compInv"='VENTA' AND "fecha_compInv"='2025-09-09 10:30:00'
         AND "observacion_compInv"='Ticket POS #KIO-0002' LIMIT 1),
  (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Snack Mix 50g' LIMIT 1),
  (SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Kiosco Lobby' LIMIT 1),
  (SELECT "TipoMovimientoId" FROM "TipoMovimiento" WHERE "Dominio"='VENTA' AND "Direccion"='OUT' LIMIT 1),
  1::numeric, CAST(NULL AS numeric), 'UN', 'Snack x1'
WHERE NOT EXISTS (
  SELECT 1 FROM "MovimientoInventario" mi
  WHERE mi."docId_compInv" = (SELECT "docId_compInv" FROM "ComprobanteInventario"
                              WHERE "docType_compInv"='VENTA' AND "fecha_compInv"='2025-09-09 10:30:00'
                                    AND "observacion_compInv"='Ticket POS #KIO-0002' LIMIT 1)
    AND mi."id_prod" = (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Snack Mix 50g' LIMIT 1)
    AND mi."nota_movInv" = 'Snack x1'
);

-- Shampoo x1
INSERT INTO "MovimientoInventario"
("docId_compInv","id_prod","id_dep","tipoMovId_movInv","cantidad_movInv","costoUnitario_movInv","uom_movInv","nota_movInv")
SELECT
  (SELECT "docId_compInv" FROM "ComprobanteInventario"
   WHERE "docType_compInv"='VENTA' AND "fecha_compInv"='2025-09-09 10:30:00'
         AND "observacion_compInv"='Ticket POS #KIO-0002' LIMIT 1),
  (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Shampoo Hotelero 30ml' LIMIT 1),
  (SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Kiosco Lobby' LIMIT 1),
  (SELECT "TipoMovimientoId" FROM "TipoMovimiento" WHERE "Dominio"='VENTA' AND "Direccion"='OUT' LIMIT 1),
  1::numeric, CAST(NULL AS numeric), 'UN', 'Shampoo x1'
WHERE NOT EXISTS (
  SELECT 1 FROM "MovimientoInventario" mi
  WHERE mi."docId_compInv" = (SELECT "docId_compInv" FROM "ComprobanteInventario"
                              WHERE "docType_compInv"='VENTA' AND "fecha_compInv"='2025-09-09 10:30:00'
                                    AND "observacion_compInv"='Ticket POS #KIO-0002' LIMIT 1)
    AND mi."id_prod" = (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Shampoo Hotelero 30ml' LIMIT 1)
    AND mi."nota_movInv" = 'Shampoo x1'
);

----------------------------------------------------------------
-- C) TRANSFERENCIA Minibar → Kiosco (2 líneas)
----------------------------------------------------------------
-- Cabecera
INSERT INTO "ComprobanteInventario"
("docType_compInv","fecha_compInv","estado_compInv","fromDepId_compInv","toDepId_compInv","observacion_compInv")
SELECT 'TRANSFERENCIA','2025-09-09 11:15:00','POSTED',
       (SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Minibar Piso 1' LIMIT 1),
       (SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Kiosco Lobby'   LIMIT 1),
       'Reposición Kiosco desde Minibar'
WHERE NOT EXISTS (
  SELECT 1 FROM "ComprobanteInventario"
  WHERE "docType_compInv"='TRANSFERENCIA'
    AND "fecha_compInv"='2025-09-09 11:15:00'
    AND "observacion_compInv"='Reposición Kiosco desde Minibar'
);

-- OUT desde Minibar (5)
INSERT INTO "MovimientoInventario"
("docId_compInv","id_prod","id_dep","tipoMovId_movInv","cantidad_movInv","costoUnitario_movInv","uom_movInv","nota_movInv")
SELECT
  (SELECT "docId_compInv" FROM "ComprobanteInventario"
   WHERE "docType_compInv"='TRANSFERENCIA' AND "fecha_compInv"='2025-09-09 11:15:00'
         AND "observacion_compInv"='Reposición Kiosco desde Minibar' LIMIT 1),
  (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Shampoo Hotelero 30ml' LIMIT 1),
  (SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Minibar Piso 1' LIMIT 1),
  (SELECT "TipoMovimientoId" FROM "TipoMovimiento" WHERE "Dominio"='TRANSFERENCIA' AND "Direccion"='OUT' LIMIT 1),
  5::numeric, CAST(NULL AS numeric), 'UN', 'Salida a Kiosco'
WHERE NOT EXISTS (
  SELECT 1 FROM "MovimientoInventario" mi
  WHERE mi."docId_compInv" = (SELECT "docId_compInv" FROM "ComprobanteInventario"
                              WHERE "docType_compInv"='TRANSFERENCIA' AND "fecha_compInv"='2025-09-09 11:15:00'
                                    AND "observacion_compInv"='Reposición Kiosco desde Minibar' LIMIT 1)
    AND mi."id_dep"  = (SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Minibar Piso 1' LIMIT 1)
    AND mi."id_prod" = (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Shampoo Hotelero 30ml' LIMIT 1)
);

-- IN en Kiosco (5)
INSERT INTO "MovimientoInventario"
("docId_compInv","id_prod","id_dep","tipoMovId_movInv","cantidad_movInv","costoUnitario_movInv","uom_movInv","nota_movInv")
SELECT
  (SELECT "docId_compInv" FROM "ComprobanteInventario"
   WHERE "docType_compInv"='TRANSFERENCIA' AND "fecha_compInv"='2025-09-09 11:15:00'
         AND "observacion_compInv"='Reposición Kiosco desde Minibar' LIMIT 1),
  (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Shampoo Hotelero 30ml' LIMIT 1),
  (SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Kiosco Lobby' LIMIT 1),
  (SELECT "TipoMovimientoId" FROM "TipoMovimiento" WHERE "Dominio"='TRANSFERENCIA' AND "Direccion"='IN' LIMIT 1),
  5::numeric, CAST(NULL AS numeric), 'UN', 'Ingreso desde Minibar'
WHERE NOT EXISTS (
  SELECT 1 FROM "MovimientoInventario" mi
  WHERE mi."docId_compInv" = (SELECT "docId_compInv" FROM "ComprobanteInventario"
                              WHERE "docType_compInv"='TRANSFERENCIA' AND "fecha_compInv"='2025-09-09 11:15:00'
                                    AND "observacion_compInv"='Reposición Kiosco desde Minibar' LIMIT 1)
    AND mi."id_dep"  = (SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Kiosco Lobby' LIMIT 1)
    AND mi."id_prod" = (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Shampoo Hotelero 30ml' LIMIT 1)
);

----------------------------------------------------------------
-- D) CONTEO (–) Minibar (1 línea)
----------------------------------------------------------------
-- Cabecera
INSERT INTO "ComprobanteInventario"
("docType_compInv","fecha_compInv","estado_compInv","fromDepId_compInv","toDepId_compInv","observacion_compInv")
SELECT 'CONTEO','2025-09-09 12:00:00','POSTED',NULL,NULL,'Conteo Minibar Piso 1'
WHERE NOT EXISTS (
  SELECT 1 FROM "ComprobanteInventario"
  WHERE "docType_compInv"='CONTEO'
    AND "fecha_compInv"='2025-09-09 12:00:00'
    AND "observacion_compInv"='Conteo Minibar Piso 1'
);

-- Faltante snacks -2
INSERT INTO "MovimientoInventario"
("docId_compInv","id_prod","id_dep","tipoMovId_movInv","cantidad_movInv","costoUnitario_movInv","uom_movInv","nota_movInv")
SELECT
  (SELECT "docId_compInv" FROM "ComprobanteInventario"
   WHERE "docType_compInv"='CONTEO' AND "fecha_compInv"='2025-09-09 12:00:00'
         AND "observacion_compInv"='Conteo Minibar Piso 1' LIMIT 1),
  (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Snack Mix 50g' LIMIT 1),
  (SELECT "id_dep"  FROM "Deposito" WHERE "nombre_dep"='Minibar Piso 1' LIMIT 1),
  (SELECT "TipoMovimientoId" FROM "TipoMovimiento" WHERE "Dominio"='CONTEO' AND "Direccion"='OUT' LIMIT 1),
  2::numeric, CAST(NULL AS numeric), 'UN', 'Faltante snacks -2'
WHERE NOT EXISTS (
  SELECT 1 FROM "MovimientoInventario" mi
  WHERE mi."docId_compInv" = (SELECT "docId_compInv" FROM "ComprobanteInventario"
                              WHERE "docType_compInv"='CONTEO' AND "fecha_compInv"='2025-09-09 12:00:00'
                                    AND "observacion_compInv"='Conteo Minibar Piso 1' LIMIT 1)
    AND mi."id_prod" = (SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Snack Mix 50g' LIMIT 1)
    AND mi."nota_movInv" = 'Faltante snacks -2'
);

COMMIT;
