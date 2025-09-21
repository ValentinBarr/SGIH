/*
  Warnings:

  - You are about to drop the column `id_tipoMov` on the `TipoComprobante` table. All the data in the column will be lost.
  - Added the required column `letra_comp` to the `Comprobante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero_comp` to the `Comprobante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saldo_comp` to the `Comprobante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sucursal_comp` to the `Comprobante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_comp` to the `Comprobante` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."TipoComprobante" DROP CONSTRAINT "TipoComprobante_id_tipoMov_fkey";

-- DropIndex
DROP INDEX "public"."TipoComprobante_id_tipoMov_idx";

-- AlterTable
ALTER TABLE "public"."Comprobante" ADD COLUMN     "letra_comp" CHAR(1) NOT NULL,
ADD COLUMN     "numero_comp" CHAR(8) NOT NULL,
ADD COLUMN     "saldo_comp" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "sucursal_comp" CHAR(4) NOT NULL,
ADD COLUMN     "total_comp" DECIMAL(18,2) NOT NULL;

-- AlterTable
ALTER TABLE "public"."TipoComprobante" DROP COLUMN "id_tipoMov";

-- CreateTable
CREATE TABLE "public"."Movimiento" (
    "id_mov" SERIAL NOT NULL,
    "id_tipoMov" INTEGER NOT NULL,
    "id_tipoComp" INTEGER,
    "fecha_mov" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_dep" INTEGER NOT NULL,
    "observacion" VARCHAR(250),

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("id_mov")
);

-- CreateTable
CREATE TABLE "public"."DetalleMovimiento" (
    "id_detMov" SERIAL NOT NULL,
    "id_mov" INTEGER NOT NULL,
    "id_prodDep" INTEGER NOT NULL,
    "cantidad" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "DetalleMovimiento_pkey" PRIMARY KEY ("id_detMov")
);

-- CreateIndex
CREATE INDEX "Movimiento_id_tipoMov_idx" ON "public"."Movimiento"("id_tipoMov");

-- CreateIndex
CREATE INDEX "Movimiento_id_tipoComp_idx" ON "public"."Movimiento"("id_tipoComp");

-- CreateIndex
CREATE INDEX "Movimiento_id_dep_idx" ON "public"."Movimiento"("id_dep");

-- CreateIndex
CREATE INDEX "DetalleMovimiento_id_mov_idx" ON "public"."DetalleMovimiento"("id_mov");

-- CreateIndex
CREATE INDEX "DetalleMovimiento_id_prodDep_idx" ON "public"."DetalleMovimiento"("id_prodDep");

-- AddForeignKey
ALTER TABLE "public"."Movimiento" ADD CONSTRAINT "Movimiento_id_tipoMov_fkey" FOREIGN KEY ("id_tipoMov") REFERENCES "public"."TipoMovimiento"("id_tipoMov") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Movimiento" ADD CONSTRAINT "Movimiento_id_tipoComp_fkey" FOREIGN KEY ("id_tipoComp") REFERENCES "public"."TipoComprobante"("id_tipoComp") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Movimiento" ADD CONSTRAINT "Movimiento_id_dep_fkey" FOREIGN KEY ("id_dep") REFERENCES "public"."Deposito"("id_dep") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetalleMovimiento" ADD CONSTRAINT "DetalleMovimiento_id_mov_fkey" FOREIGN KEY ("id_mov") REFERENCES "public"."Movimiento"("id_mov") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetalleMovimiento" ADD CONSTRAINT "DetalleMovimiento_id_prodDep_fkey" FOREIGN KEY ("id_prodDep") REFERENCES "public"."ProductoDeposito"("id_prodDep") ON DELETE RESTRICT ON UPDATE CASCADE;
