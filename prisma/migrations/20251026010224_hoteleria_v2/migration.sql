/*
  Warnings:

  - You are about to drop the `detalles_reserva` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `estadias` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `id_hab` to the `reservas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."detalles_reserva" DROP CONSTRAINT "detalles_reserva_id_reserva_fkey";

-- DropForeignKey
ALTER TABLE "public"."detalles_reserva" DROP CONSTRAINT "detalles_reserva_id_tipoHab_fkey";

-- DropForeignKey
ALTER TABLE "public"."estadias" DROP CONSTRAINT "estadias_id_hab_fkey";

-- DropForeignKey
ALTER TABLE "public"."estadias" DROP CONSTRAINT "estadias_id_huesped_fkey";

-- DropForeignKey
ALTER TABLE "public"."estadias" DROP CONSTRAINT "estadias_id_reserva_fkey";

-- AlterTable
ALTER TABLE "public"."reservas" ADD COLUMN     "fechaCheckInReal" TIMESTAMP(3),
ADD COLUMN     "fechaCheckOutReal" TIMESTAMP(3),
ADD COLUMN     "id_hab" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."detalles_reserva";

-- DropTable
DROP TABLE "public"."estadias";

-- CreateIndex
CREATE INDEX "reservas_id_hab_idx" ON "public"."reservas"("id_hab");

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_id_hab_fkey" FOREIGN KEY ("id_hab") REFERENCES "public"."habitaciones"("id_hab") ON DELETE RESTRICT ON UPDATE CASCADE;
