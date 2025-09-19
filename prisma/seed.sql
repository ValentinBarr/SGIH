BEGIN;

----------------------------------------------------------------
-- A) AJUSTE (+) en Housekeeping (2 líneas)
----------------------------------------------------------------
-- Cabecera (si no existe)
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
