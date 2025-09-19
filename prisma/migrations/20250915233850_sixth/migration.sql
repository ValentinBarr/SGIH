/*
  Warnings:

  - You are about to drop the column `id_compInv` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the `ComprobanteInventario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TipoMovimiento` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `id_comp` to the `MovimientoInventario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ComprobanteInventario" DROP CONSTRAINT "ComprobanteInventario_id_dep_fkey";

-- DropForeignKey
ALTER TABLE "public"."ComprobanteInventario" DROP CONSTRAINT "ComprobanteInventario_id_tipoComp_fkey";

-- DropForeignKey
ALTER TABLE "public"."ComprobanteInventario" DROP CONSTRAINT "ComprobanteInventario_id_tipoMov_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_id_compInv_fkey";

-- DropIndex
DROP INDEX "public"."MovimientoInventario_id_compInv_idx";

-- AlterTable
ALTER TABLE "public"."MovimientoInventario" DROP COLUMN "id_compInv",
ADD COLUMN     "id_comp" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."ComprobanteInventario";

-- DropTable
DROP TABLE "public"."TipoMovimiento";

-- CreateTable
CREATE TABLE "public"."Proveedor" (
    "id_prov" SERIAL NOT NULL,
    "nombre_prov" VARCHAR(120) NOT NULL,
    "cuit_prov" VARCHAR(20) NOT NULL,
    "direccion_prov" VARCHAR(200),
    "telefono_prov" VARCHAR(50),
    "email_prov" VARCHAR(120),
    "activo_prov" BOOLEAN NOT NULL DEFAULT true,
    "fechaAlta_prov" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id_prov")
);

-- CreateTable
CREATE TABLE "public"."FormaPago" (
    "id_fp" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FormaPago_pkey" PRIMARY KEY ("id_fp")
);

-- CreateTable
CREATE TABLE "public"."Comprobante" (
    "id_comp" SERIAL NOT NULL,
    "id_tipoComp" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" VARCHAR(20) NOT NULL,
    "id_prov" INTEGER,
    "id_dep" INTEGER,
    "id_fp" INTEGER,
    "observacion" VARCHAR(250),

    CONSTRAINT "Comprobante_pkey" PRIMARY KEY ("id_comp")
);

-- CreateTable
CREATE TABLE "public"."DetalleComprobante" (
    "id_det" SERIAL NOT NULL,
    "id_comp" INTEGER NOT NULL,
    "id_prod" INTEGER NOT NULL,
    "cantidad" DECIMAL(18,3) NOT NULL,
    "precio" DECIMAL(18,2),

    CONSTRAINT "DetalleComprobante_pkey" PRIMARY KEY ("id_det")
);

-- CreateIndex
CREATE INDEX "Comprobante_id_tipoComp_idx" ON "public"."Comprobante"("id_tipoComp");

-- CreateIndex
CREATE INDEX "Comprobante_id_prov_idx" ON "public"."Comprobante"("id_prov");

-- CreateIndex
CREATE INDEX "Comprobante_id_dep_idx" ON "public"."Comprobante"("id_dep");

-- CreateIndex
CREATE INDEX "Comprobante_id_fp_idx" ON "public"."Comprobante"("id_fp");

-- CreateIndex
CREATE INDEX "DetalleComprobante_id_comp_idx" ON "public"."DetalleComprobante"("id_comp");

-- CreateIndex
CREATE INDEX "DetalleComprobante_id_prod_idx" ON "public"."DetalleComprobante"("id_prod");

-- CreateIndex
CREATE INDEX "MovimientoInventario_id_comp_idx" ON "public"."MovimientoInventario"("id_comp");

-- AddForeignKey
ALTER TABLE "public"."MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_id_comp_fkey" FOREIGN KEY ("id_comp") REFERENCES "public"."Comprobante"("id_comp") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comprobante" ADD CONSTRAINT "Comprobante_id_tipoComp_fkey" FOREIGN KEY ("id_tipoComp") REFERENCES "public"."TipoComprobante"("id_tipoComp") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comprobante" ADD CONSTRAINT "Comprobante_id_prov_fkey" FOREIGN KEY ("id_prov") REFERENCES "public"."Proveedor"("id_prov") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comprobante" ADD CONSTRAINT "Comprobante_id_dep_fkey" FOREIGN KEY ("id_dep") REFERENCES "public"."Deposito"("id_dep") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comprobante" ADD CONSTRAINT "Comprobante_id_fp_fkey" FOREIGN KEY ("id_fp") REFERENCES "public"."FormaPago"("id_fp") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetalleComprobante" ADD CONSTRAINT "DetalleComprobante_id_comp_fkey" FOREIGN KEY ("id_comp") REFERENCES "public"."Comprobante"("id_comp") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetalleComprobante" ADD CONSTRAINT "DetalleComprobante_id_prod_fkey" FOREIGN KEY ("id_prod") REFERENCES "public"."Producto"("id_prod") ON DELETE RESTRICT ON UPDATE CASCADE;
