/*
  Warnings:

  - You are about to drop the column `id_prodDep` on the `DetalleComprobante` table. All the data in the column will be lost.
  - Added the required column `id_prod` to the `DetalleComprobante` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."DetalleComprobante" DROP CONSTRAINT "DetalleComprobante_id_prodDep_fkey";

-- DropIndex
DROP INDEX "public"."DetalleComprobante_id_prodDep_idx";

-- AlterTable
ALTER TABLE "public"."Comprobante" ADD COLUMN     "id_compRef" INTEGER;

-- AlterTable
ALTER TABLE "public"."DetalleComprobante" DROP COLUMN "id_prodDep",
ADD COLUMN     "id_prod" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Comprobante_id_compRef_idx" ON "public"."Comprobante"("id_compRef");

-- CreateIndex
CREATE INDEX "DetalleComprobante_id_prod_idx" ON "public"."DetalleComprobante"("id_prod");

-- AddForeignKey
ALTER TABLE "public"."Comprobante" ADD CONSTRAINT "Comprobante_id_compRef_fkey" FOREIGN KEY ("id_compRef") REFERENCES "public"."Comprobante"("id_comp") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetalleComprobante" ADD CONSTRAINT "DetalleComprobante_id_prod_fkey" FOREIGN KEY ("id_prod") REFERENCES "public"."Producto"("id_prod") ON DELETE RESTRICT ON UPDATE CASCADE;
