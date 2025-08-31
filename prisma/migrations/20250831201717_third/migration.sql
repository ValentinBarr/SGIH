/*
  Warnings:

  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Product";

-- CreateTable
CREATE TABLE "public"."Producto" (
    "id_prod" SERIAL NOT NULL,
    "nombre_prod" VARCHAR(120) NOT NULL,
    "unidad_prod" VARCHAR(10) NOT NULL,
    "tipo_prod" VARCHAR(20) NOT NULL,
    "stockeable_prod" BOOLEAN NOT NULL,
    "vendible_prod" BOOLEAN NOT NULL,
    "descuentaStockVenta_prod" BOOLEAN NOT NULL,
    "stockMinimoGlobal_prod" DECIMAL(18,3),
    "activo_prod" BOOLEAN NOT NULL,
    "fechaAlta_prod" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id_prod")
);

-- CreateTable
CREATE TABLE "public"."ProductoDeposito" (
    "id_prod" INTEGER NOT NULL,
    "id_dep" INTEGER NOT NULL,
    "minimo_prodDep" DECIMAL(18,3) NOT NULL,
    "parLevel_prodDep" DECIMAL(18,3) NOT NULL,
    "maximo_prodDep" DECIMAL(18,3),
    "loteReposicion_prodDep" DECIMAL(18,3),
    "ubicacion_prodDep" VARCHAR(30),
    "ultimoConteo_prodDep" TIMESTAMP(3),

    CONSTRAINT "ProductoDeposito_pkey" PRIMARY KEY ("id_prod","id_dep")
);

-- CreateTable
CREATE TABLE "public"."TipoMovimiento" (
    "TipoMovimientoId" SERIAL NOT NULL,
    "Nombre" VARCHAR(60) NOT NULL,
    "Direccion" CHAR(3) NOT NULL,
    "Dominio" VARCHAR(20) NOT NULL,
    "Activo" BOOLEAN NOT NULL,

    CONSTRAINT "TipoMovimiento_pkey" PRIMARY KEY ("TipoMovimientoId")
);

-- CreateTable
CREATE TABLE "public"."ComprobanteInventario" (
    "docId_compInv" BIGSERIAL NOT NULL,
    "docType_compInv" VARCHAR(20) NOT NULL,
    "fecha_compInv" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_compInv" VARCHAR(12) NOT NULL,
    "fromDepId_compInv" INTEGER,
    "toDepId_compInv" INTEGER,
    "observacion_compInv" VARCHAR(250),

    CONSTRAINT "ComprobanteInventario_pkey" PRIMARY KEY ("docId_compInv")
);

-- CreateTable
CREATE TABLE "public"."MovimientoInventario" (
    "lineaId_movInv" BIGSERIAL NOT NULL,
    "docId_compInv" BIGINT NOT NULL,
    "id_prod" INTEGER NOT NULL,
    "id_dep" INTEGER NOT NULL,
    "tipoMovId_movInv" INTEGER NOT NULL,
    "cantidad_movInv" DECIMAL(18,3) NOT NULL,
    "costoUnitario_movInv" DECIMAL(18,4),
    "uom_movInv" VARCHAR(10),
    "nota_movInv" VARCHAR(200),

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("lineaId_movInv")
);

-- CreateIndex
CREATE INDEX "ProductoDeposito_id_prod_idx" ON "public"."ProductoDeposito"("id_prod");

-- CreateIndex
CREATE INDEX "ProductoDeposito_id_dep_idx" ON "public"."ProductoDeposito"("id_dep");

-- CreateIndex
CREATE INDEX "ComprobanteInventario_fromDepId_compInv_idx" ON "public"."ComprobanteInventario"("fromDepId_compInv");

-- CreateIndex
CREATE INDEX "ComprobanteInventario_toDepId_compInv_idx" ON "public"."ComprobanteInventario"("toDepId_compInv");

-- CreateIndex
CREATE INDEX "MovimientoInventario_docId_compInv_idx" ON "public"."MovimientoInventario"("docId_compInv");

-- CreateIndex
CREATE INDEX "MovimientoInventario_id_prod_idx" ON "public"."MovimientoInventario"("id_prod");

-- CreateIndex
CREATE INDEX "MovimientoInventario_id_dep_idx" ON "public"."MovimientoInventario"("id_dep");

-- CreateIndex
CREATE INDEX "MovimientoInventario_tipoMovId_movInv_idx" ON "public"."MovimientoInventario"("tipoMovId_movInv");

-- AddForeignKey
ALTER TABLE "public"."ProductoDeposito" ADD CONSTRAINT "ProductoDeposito_id_prod_fkey" FOREIGN KEY ("id_prod") REFERENCES "public"."Producto"("id_prod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductoDeposito" ADD CONSTRAINT "ProductoDeposito_id_dep_fkey" FOREIGN KEY ("id_dep") REFERENCES "public"."Deposito"("id_dep") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComprobanteInventario" ADD CONSTRAINT "ComprobanteInventario_fromDepId_compInv_fkey" FOREIGN KEY ("fromDepId_compInv") REFERENCES "public"."Deposito"("id_dep") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComprobanteInventario" ADD CONSTRAINT "ComprobanteInventario_toDepId_compInv_fkey" FOREIGN KEY ("toDepId_compInv") REFERENCES "public"."Deposito"("id_dep") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_docId_compInv_fkey" FOREIGN KEY ("docId_compInv") REFERENCES "public"."ComprobanteInventario"("docId_compInv") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_id_prod_fkey" FOREIGN KEY ("id_prod") REFERENCES "public"."Producto"("id_prod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_id_dep_fkey" FOREIGN KEY ("id_dep") REFERENCES "public"."Deposito"("id_dep") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_tipoMovId_movInv_fkey" FOREIGN KEY ("tipoMovId_movInv") REFERENCES "public"."TipoMovimiento"("TipoMovimientoId") ON DELETE RESTRICT ON UPDATE CASCADE;
