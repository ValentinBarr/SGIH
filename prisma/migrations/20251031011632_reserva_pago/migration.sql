-- CreateEnum
CREATE TYPE "public"."EstadoPago" AS ENUM ('PENDIENTE', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO');

-- CreateTable
CREATE TABLE "public"."pagos" (
    "id_pago" SERIAL NOT NULL,
    "id_reserva" INTEGER NOT NULL,
    "id_fp" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "public"."EstadoPago" NOT NULL DEFAULT 'COMPLETADO',
    "referencia" VARCHAR(255),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id_pago")
);

-- CreateIndex
CREATE INDEX "pagos_id_reserva_idx" ON "public"."pagos"("id_reserva");

-- CreateIndex
CREATE INDEX "pagos_id_fp_idx" ON "public"."pagos"("id_fp");

-- AddForeignKey
ALTER TABLE "public"."pagos" ADD CONSTRAINT "pagos_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "public"."reservas"("id_reserva") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pagos" ADD CONSTRAINT "pagos_id_fp_fkey" FOREIGN KEY ("id_fp") REFERENCES "public"."FormaPago"("id_fp") ON DELETE RESTRICT ON UPDATE CASCADE;
