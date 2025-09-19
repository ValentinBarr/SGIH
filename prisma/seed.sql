-- ========================
-- CARGA INICIAL DE DATOS
-- ========================

-- ------------------------
-- TipoDeposito
-- ------------------------
INSERT INTO "TipoDeposito" 
("nombre_tipoDep", "esPuntoDeVenta_tipoDep", "esConsumoInterno_tipoDep", "frecuenciaConteoDias_tipoDep", "activo_tipoDep")
VALUES
('Central', false, false, 30, true),
('Bar', true, false, 15, true),
('Housekeeping', false, true, 7, true);

-- ------------------------
-- Deposito
-- ------------------------
INSERT INTO "Deposito" 
("id_tipoDep", "nombre_dep", "ubicacion_dep", "activo_dep")
VALUES
(1, 'Depósito Central', 'Planta Baja', true),
(2, 'Bar Principal', 'Planta Baja', true),
(3, 'Housekeeping Piso 1', 'Piso 1', true);

-- ------------------------
-- Producto
-- ------------------------
INSERT INTO "Producto" 
("nombre_prod", "unidad_prod", "tipo_prod", "stockeable_prod", "vendible_prod", "descuentaStockVenta_prod", "stockMinimoGlobal_prod", "activo_prod")
VALUES
('Coca Cola 500ml', 'UN', 'VENDIBLE', true, true, true, 20, true),
('Detergente 1L', 'LT', 'INSUMO', true, false, false, 10, true),
('Shampoo Sachet', 'UN', 'AMENITY', true, false, false, 50, true);

-- ------------------------
-- ProductoDeposito
-- ------------------------
INSERT INTO "ProductoDeposito" 
("id_prod", "id_dep", "minimo_prodDep", "maximo_prodDep", "loteReposicion_prodDep", "ubicacion_prodDep")
VALUES
(1, 1, 10, 200, 50, 'Estante A1'),
(2, 1, 5, 100, 20, 'Estante B2'),
(3, 3, 20, 300, 100, 'Carro Amenities');

-- ------------------------
-- Proveedor
-- ------------------------
INSERT INTO "Proveedor" 
("nombre_prov", "cuit_prov", "direccion_prov", "telefono_prov", "email_prov", "activo_prov")
VALUES
('Distribuidora Norte', '30-12345678-9', 'Av. Belgrano 123', '387-4000000', 'ventas@norte.com', true),
('Limpieza S.A.', '30-87654321-0', 'San Martín 456', '387-4555555', 'contacto@limpieza.com', true);

-- ------------------------
-- FormaPago
-- ------------------------
INSERT INTO "FormaPago" ("nombre", "activo")
VALUES
('Efectivo', true),
('Transferencia', true),
('Cheque', true);

-- ------------------------
-- TipoMovimiento
-- ------------------------
INSERT INTO "TipoMovimiento" 
("nombre", "direccion", "activo")
VALUES
('Entrada', 'IN', true),
('Salida', 'OUT', true);

-- ------------------------
-- TipoComprobante
-- ------------------------
INSERT INTO "TipoComprobante" 
("codigo", "nombre", "descripcion", "afectaStock", "activo", "id_tipoMov")
VALUES
('OC',  'Orden de Compra', 'Orden de compra a proveedor', false, true, 1),
('FAC', 'Factura Proveedor', 'Factura recibida del proveedor', true, true, 1),
('REM', 'Remito', 'Remito de ingreso de mercadería', true, true, 1),
('AJU', 'Ajuste Inventario', 'Ajuste por diferencias de stock', true, true, 2),
('CON', 'Consumo Interno', 'Salida por consumo interno', true, true, 2);

-- ------------------------
-- Comprobante
-- ------------------------
INSERT INTO "Comprobante" 
("id_tipoComp", "fecha", "estado", "id_prov", "id_dep", "id_fp", "observacion")
VALUES
(1, NOW(), 'BORRADOR', 1, NULL, 2, 'Orden inicial de prueba'),
(2, NOW(), 'POSTED', 1, 1, 2, 'Factura de compra registrada'),
(5, NOW(), 'POSTED', NULL, 2, NULL, 'Consumo en el bar');

-- ------------------------
-- DetalleComprobante
-- ------------------------
INSERT INTO "DetalleComprobante" 
("id_comp", "id_prodDep", "cantidad", "precio")
VALUES
(1, 1, 50, 120.00),  
(2, 1, 50, 125.00),   
(2, 2, 20, 300.00),  
(3, 1, 5, 0.00);     
