/*
  Warnings:

  - The primary key for the `ComprobanteInventario` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `docId_compInv` on the `ComprobanteInventario` table. All the data in the column will be lost.
  - You are about to drop the column `docType_compInv` on the `ComprobanteInventario` table. All the data in the column will be lost.
  - You are about to drop the column `fromDepId_compInv` on the `ComprobanteInventario` table. All the data in the column will be lost.
  - You are about to drop the column `observacion_compInv` on the `ComprobanteInventario` table. All the data in the column will be lost.
  - You are about to drop the column `toDepId_compInv` on the `ComprobanteInventario` table. All the data in the column will be lost.
  - The primary key for the `MovimientoInventario` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cantidad_movInv` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `costoUnitario_movInv` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `docId_compInv` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `id_dep` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `id_prod` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `lineaId_movInv` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `nota_movInv` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `tipoMovId_movInv` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `uom_movInv` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `precio_prod` on the `Producto` table. All the data in the column will be lost.
  - The primary key for the `ProductoDeposito` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `parLevel_prodDep` on the `ProductoDeposito` table. All the data in the column will be lost.
  - You are about to drop the column `ultimoConteo_prodDep` on the `ProductoDeposito` table. All the data in the column will be lost.
  - The primary key for the `TipoMovimiento` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Activo` on the `TipoMovimiento` table. All the data in the column will be lost.
  - You are about to drop the column `Direccion` on the `TipoMovimiento` table. All the data in the column will be lost.
  - You are about to drop the column `Dominio` on the `TipoMovimiento` table. All the data in the column will be lost.
  - You are about to drop the column `Nombre` on the `TipoMovimiento` table. All the data in the column will be lost.
  - You are about to drop the column `TipoMovimientoId` on the `TipoMovimiento` table. All the data in the column will be lost.
  - Added the required column `id_dep` to the `ComprobanteInventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_tipoComp` to the `ComprobanteInventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_tipoMov` to the `ComprobanteInventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cantidad` to the `MovimientoInventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_compInv` to the `MovimientoInventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_prodDep` to the `MovimientoInventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `direccion` to the `TipoMovimiento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `TipoMovimiento` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ComprobanteInventario" DROP CONSTRAINT "ComprobanteInventario_fromDepId_compInv_fkey";

-- DropForeignKey
ALTER TABLE "public"."ComprobanteInventario" DROP CONSTRAINT "ComprobanteInventario_toDepId_compInv_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_docId_compInv_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_id_dep_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_id_prod_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_tipoMovId_movInv_fkey";

-- DropIndex
DROP INDEX "public"."ComprobanteInventario_fromDepId_compInv_idx";

-- DropIndex
DROP INDEX "public"."ComprobanteInventario_toDepId_compInv_idx";

-- DropIndex
DROP INDEX "public"."MovimientoInventario_docId_compInv_idx";

-- DropIndex
DROP INDEX "public"."MovimientoInventario_id_dep_idx";

-- DropIndex
DROP INDEX "public"."MovimientoInventario_id_prod_idx";

-- DropIndex
DROP INDEX "public"."MovimientoInventario_tipoMovId_movInv_idx";

-- AlterTable
ALTER TABLE "public"."ComprobanteInventario" DROP CONSTRAINT "ComprobanteInventario_pkey",
DROP COLUMN "docId_compInv",
DROP COLUMN "docType_compInv",
DROP COLUMN "fromDepId_compInv",
DROP COLUMN "observacion_compInv",
DROP COLUMN "toDepId_compInv",
ADD COLUMN     "id_compInv" BIGSERIAL NOT NULL,
ADD COLUMN     "id_dep" INTEGER NOT NULL,
ADD COLUMN     "id_tipoComp" INTEGER NOT NULL,
ADD COLUMN     "id_tipoMov" INTEGER NOT NULL,
ADD COLUMN     "observacion" VARCHAR(250),
ADD CONSTRAINT "ComprobanteInventario_pkey" PRIMARY KEY ("id_compInv");

-- AlterTable
ALTER TABLE "public"."Deposito" ADD COLUMN     "ubicacion_dep" VARCHAR(120);

-- AlterTable
ALTER TABLE "public"."MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_pkey",
DROP COLUMN "cantidad_movInv",
DROP COLUMN "costoUnitario_movInv",
DROP COLUMN "docId_compInv",
DROP COLUMN "id_dep",
DROP COLUMN "id_prod",
DROP COLUMN "lineaId_movInv",
DROP COLUMN "nota_movInv",
DROP COLUMN "tipoMovId_movInv",
DROP COLUMN "uom_movInv",
ADD COLUMN     "cantidad" DECIMAL(18,3) NOT NULL,
ADD COLUMN     "id_compInv" BIGINT NOT NULL,
ADD COLUMN     "id_movInv" BIGSERIAL NOT NULL,
ADD COLUMN     "id_prodDep" INTEGER NOT NULL,
ADD COLUMN     "nota" VARCHAR(200),
ADD CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id_movInv");

-- AlterTable
ALTER TABLE "public"."Producto" DROP COLUMN "precio_prod";

-- AlterTable
ALTER TABLE "public"."ProductoDeposito" DROP CONSTRAINT "ProductoDeposito_pkey",
DROP COLUMN "parLevel_prodDep",
DROP COLUMN "ultimoConteo_prodDep",
ADD COLUMN     "id_prodDep" SERIAL NOT NULL,
ADD CONSTRAINT "ProductoDeposito_pkey" PRIMARY KEY ("id_prodDep");

-- AlterTable
ALTER TABLE "public"."TipoMovimiento" DROP CONSTRAINT "TipoMovimiento_pkey",
DROP COLUMN "Activo",
DROP COLUMN "Direccion",
DROP COLUMN "Dominio",
DROP COLUMN "Nombre",
DROP COLUMN "TipoMovimientoId",
ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "direccion" CHAR(3) NOT NULL,
ADD COLUMN     "id_tipoMov" SERIAL NOT NULL,
ADD COLUMN     "nombre" VARCHAR(60) NOT NULL,
ADD CONSTRAINT "TipoMovimiento_pkey" PRIMARY KEY ("id_tipoMov");

-- CreateTable
CREATE TABLE "public"."TipoComprobante" (
    "id_tipoComp" SERIAL NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(200),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TipoComprobante_pkey" PRIMARY KEY ("id_tipoComp")
);

-- CreateIndex
CREATE INDEX "ComprobanteInventario_id_dep_idx" ON "public"."ComprobanteInventario"("id_dep");

-- CreateIndex
CREATE INDEX "ComprobanteInventario_id_tipoMov_idx" ON "public"."ComprobanteInventario"("id_tipoMov");

-- CreateIndex
CREATE INDEX "ComprobanteInventario_id_tipoComp_idx" ON "public"."ComprobanteInventario"("id_tipoComp");

-- CreateIndex
CREATE INDEX "MovimientoInventario_id_compInv_idx" ON "public"."MovimientoInventario"("id_compInv");

-- CreateIndex
CREATE INDEX "MovimientoInventario_id_prodDep_idx" ON "public"."MovimientoInventario"("id_prodDep");

-- AddForeignKey
ALTER TABLE "public"."ComprobanteInventario" ADD CONSTRAINT "ComprobanteInventario_id_dep_fkey" FOREIGN KEY ("id_dep") REFERENCES "public"."Deposito"("id_dep") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComprobanteInventario" ADD CONSTRAINT "ComprobanteInventario_id_tipoMov_fkey" FOREIGN KEY ("id_tipoMov") REFERENCES "public"."TipoMovimiento"("id_tipoMov") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComprobanteInventario" ADD CONSTRAINT "ComprobanteInventario_id_tipoComp_fkey" FOREIGN KEY ("id_tipoComp") REFERENCES "public"."TipoComprobante"("id_tipoComp") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_id_compInv_fkey" FOREIGN KEY ("id_compInv") REFERENCES "public"."ComprobanteInventario"("id_compInv") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_id_prodDep_fkey" FOREIGN KEY ("id_prodDep") REFERENCES "public"."ProductoDeposito"("id_prodDep") ON DELETE RESTRICT ON UPDATE CASCADE;
