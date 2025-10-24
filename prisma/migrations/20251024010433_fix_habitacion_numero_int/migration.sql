/*
  Warnings:

  - Changed the type of `numero` on the `habitaciones` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."habitaciones" DROP COLUMN "numero",
ADD COLUMN     "numero" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "habitaciones_numero_key" ON "public"."habitaciones"("numero");
