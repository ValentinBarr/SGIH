-- ========================================
-- TIPOS DEPOSITO
-- ========================================
INSERT INTO "TipoDeposito" ("nombre_tipoDep","esPuntoDeVenta_tipoDep","esConsumoInterno_tipoDep","frecuenciaConteoDias_tipoDep","activo_tipoDep")
VALUES
('Central', false, false, 30, true),
('Bar', true, false, 7, true),
('Housekeeping', false, true, 15, true),
('Minibar', true, false, 7, true),
('Cocina', false, true, 7, true);

-- ========================================
-- DEPOSITOS
-- ========================================
INSERT INTO "Deposito" ("id_tipoDep","nombre_dep","ubicacion_dep","activo_dep")
VALUES
((SELECT "id_tipoDep" FROM "TipoDeposito" WHERE "nombre_tipoDep"='Central'), 'Depósito Central', 'Planta Baja', true),
((SELECT "id_tipoDep" FROM "TipoDeposito" WHERE "nombre_tipoDep"='Bar'), 'Bar Planta Baja', 'Planta Baja', true),
((SELECT "id_tipoDep" FROM "TipoDeposito" WHERE "nombre_tipoDep"='Housekeeping'), 'Housekeeping Piso 1', 'Piso 1', true),
((SELECT "id_tipoDep" FROM "TipoDeposito" WHERE "nombre_tipoDep"='Minibar'), 'Minibar Piso 2', 'Piso 2', true),
((SELECT "id_tipoDep" FROM "TipoDeposito" WHERE "nombre_tipoDep"='Cocina'), 'Cocina Principal', 'Planta Baja', true);

-- ========================================
-- PRODUCTOS
-- ========================================
INSERT INTO "Producto" ("nombre_prod","tipo_prod","stockeable_prod","vendible_prod","descuentaStockVenta_prod","stockMinimoGlobal_prod","activo_prod")
VALUES
('Agua Mineral 500ml', 'VENDIBLE', true, true, true, 20, true),
('Jugo Naranja 1L', 'VENDIBLE', true, true, true, 15, true),
('Detergente', 'INSUMO', true, false, false, 10, true),
('Shampoo Sachet', 'AMENITY', true, false, false, 50, true),
('Hamburguesa Congelada', 'INSUMO', true, false, false, 30, true);

-- ========================================
-- PRODUCTO x DEPOSITO
-- ========================================
INSERT INTO "ProductoDeposito" ("id_prod","id_dep","minimo_prodDep","maximo_prodDep","loteReposicion_prodDep","ubicacion_prodDep")
VALUES
((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Agua Mineral 500ml'),
 (SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Depósito Central'), 10, 200, 50, 'Estante A1'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Jugo Naranja 1L'),
 (SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Bar Planta Baja'), 5, 100, 20, 'Heladera B2'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Detergente'),
 (SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Cocina Principal'), 5, 50, 10, 'Almacén C3'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Shampoo Sachet'),
 (SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Housekeeping Piso 1'), 20, 300, 50, 'Carrito HS1'),

((SELECT "id_prod" FROM "Producto" WHERE "nombre_prod"='Hamburguesa Congelada'),
 (SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Cocina Principal'), 10, 150, 30, 'Freezer F1');

-- ========================================
-- PROVEEDORES
-- ========================================
INSERT INTO "Proveedor" ("nombre_prov","cuit_prov","direccion_prov","telefono_prov","email_prov","activo_prov")
VALUES
('Distribuidora Norte', '30-12345678-9', 'Av. Siempre Viva 742', '387-4444444', 'ventas@distnorte.com', true),
('Bebidas SRL', '30-87654321-0', 'San Martín 1200', '387-5555555', 'contacto@bebidassrl.com', true);

-- ========================================
-- FORMAS DE PAGO
-- ========================================
INSERT INTO "FormaPago" ("nombre","activo")
VALUES
('Efectivo', true),
('Transferencia', true),
('Tarjeta de Crédito', true);

-- ========================================
-- TIPOS MOVIMIENTO
-- ========================================
INSERT INTO "TipoMovimiento" ("nombre","direccion","activo")
VALUES
('Entrada por compra', 'IN', true),
('Salida por consumo', 'OUT', true),
('Ajuste de inventario', 'IN', true),
('Ajuste de inventario', 'OUT', true);

-- ========================================
-- TIPOS COMPROBANTE
-- ========================================
INSERT INTO "TipoComprobante" ("codigo","nombre","descripcion","afectaStock","activo")
VALUES
('OC', 'Orden de Compra', 'Pedido de mercadería a proveedor', false, true),
('FAC', 'Factura', 'Factura de proveedor', true, true),
('REM', 'Remito', 'Remito de proveedor', true, true),
('AJU', 'Ajuste', 'Ajuste interno de stock', true, true),
('CON', 'Conteo', 'Conteo físico de stock', true, true);

-- ========================================
-- EJEMPLO: MOVIMIENTO (Entrada con Remito)
-- ========================================
INSERT INTO "Movimiento" ("id_tipoMov","id_tipoComp","id_dep","observacion")
VALUES
((SELECT "id_tipoMov" FROM "TipoMovimiento" WHERE "nombre"='Entrada por compra'),
 (SELECT "id_tipoComp" FROM "TipoComprobante" WHERE "codigo"='REM'),
 (SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Depósito Central'),
 'Ingreso de mercadería según remito 0001');

-- Detalle Movimiento
INSERT INTO "DetalleMovimiento" ("id_mov","id_prodDep","cantidad")
VALUES
((SELECT MAX("id_mov") FROM "Movimiento"),
 (SELECT "id_prodDep" FROM "ProductoDeposito" pd JOIN "Producto" p ON p."id_prod"=pd."id_prod" WHERE p."nombre_prod"='Agua Mineral 500ml' LIMIT 1), 100);

-- ========================================
-- EJEMPLO: COMPROBANTE (Factura de compra)
-- ========================================
INSERT INTO "Comprobante" ("id_tipoComp","fecha","estado","id_prov","id_dep","id_fp","observacion","letra_comp","sucursal_comp","numero_comp","total_comp","saldo_comp")
VALUES
((SELECT "id_tipoComp" FROM "TipoComprobante" WHERE "codigo"='FAC'),
 now(), 'POSTED',
 (SELECT "id_prov" FROM "Proveedor" WHERE "nombre_prov"='Distribuidora Norte'),
 (SELECT "id_dep" FROM "Deposito" WHERE "nombre_dep"='Depósito Central'),
 (SELECT "id_fp" FROM "FormaPago" WHERE "nombre"='Transferencia'),
 'Factura compra bebidas',
 'A','0001','00000001', 15000, 15000);

-- Detalle Comprobante
INSERT INTO "DetalleComprobante" ("id_comp","id_prodDep","cantidad","precio")
VALUES
((SELECT MAX("id_comp") FROM "Comprobante"),
 (SELECT "id_prodDep" FROM "ProductoDeposito" pd JOIN "Producto" p ON p."id_prod"=pd."id_prod" WHERE p."nombre_prod"='Agua Mineral 500ml' LIMIT 1), 100, 150);
