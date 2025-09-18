/*
  Warnings:

  - You are about to drop the column `id_prod` on the `DetalleComprobante` table. All the data in the column will be lost.
  - You are about to drop the `MovimientoInventario` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `id_prodDep` to the `DetalleComprobante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_tipoMov` to the `TipoComprobante` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."DetalleComprobante" DROP CONSTRAINT "DetalleComprobante_id_prod_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_id_comp_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_id_prodDep_fkey";

-- DropIndex
DROP INDEX "public"."DetalleComprobante_id_prod_idx";

-- AlterTable
ALTER TABLE "public"."DetalleComprobante" DROP COLUMN "id_prod",
ADD COLUMN     "id_prodDep" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."TipoComprobante" ADD COLUMN     "afectaStock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "id_tipoMov" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."MovimientoInventario";

-- CreateTable
CREATE TABLE "public"."TipoMovimiento" (
    "id_tipoMov" SERIAL NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "direccion" CHAR(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TipoMovimiento_pkey" PRIMARY KEY ("id_tipoMov")
);

-- CreateIndex
CREATE INDEX "DetalleComprobante_id_prodDep_idx" ON "public"."DetalleComprobante"("id_prodDep");

-- CreateIndex
CREATE INDEX "TipoComprobante_id_tipoMov_idx" ON "public"."TipoComprobante"("id_tipoMov");

-- AddForeignKey
ALTER TABLE "public"."TipoComprobante" ADD CONSTRAINT "TipoComprobante_id_tipoMov_fkey" FOREIGN KEY ("id_tipoMov") REFERENCES "public"."TipoMovimiento"("id_tipoMov") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetalleComprobante" ADD CONSTRAINT "DetalleComprobante_id_prodDep_fkey" FOREIGN KEY ("id_prodDep") REFERENCES "public"."ProductoDeposito"("id_prodDep") ON DELETE RESTRICT ON UPDATE CASCADE;
