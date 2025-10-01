-- CreateTable
CREATE TABLE "public"."Pago" (
    "id_pago" SERIAL NOT NULL,
    "id_prov" INTEGER NOT NULL,
    "id_fp" INTEGER NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_pago" DECIMAL(18,2) NOT NULL,
    "observacion" VARCHAR(250),

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id_pago")
);

-- CreateTable
CREATE TABLE "public"."DetallePago" (
    "id_detPago" SERIAL NOT NULL,
    "id_pago" INTEGER NOT NULL,
    "id_comp" INTEGER NOT NULL,
    "monto_pagar" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "DetallePago_pkey" PRIMARY KEY ("id_detPago")
);

-- CreateIndex
CREATE INDEX "Pago_id_prov_idx" ON "public"."Pago"("id_prov");

-- CreateIndex
CREATE INDEX "Pago_id_fp_idx" ON "public"."Pago"("id_fp");

-- CreateIndex
CREATE INDEX "DetallePago_id_pago_idx" ON "public"."DetallePago"("id_pago");

-- CreateIndex
CREATE INDEX "DetallePago_id_comp_idx" ON "public"."DetallePago"("id_comp");

-- AddForeignKey
ALTER TABLE "public"."Pago" ADD CONSTRAINT "Pago_id_prov_fkey" FOREIGN KEY ("id_prov") REFERENCES "public"."Proveedor"("id_prov") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pago" ADD CONSTRAINT "Pago_id_fp_fkey" FOREIGN KEY ("id_fp") REFERENCES "public"."FormaPago"("id_fp") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetallePago" ADD CONSTRAINT "DetallePago_id_pago_fkey" FOREIGN KEY ("id_pago") REFERENCES "public"."Pago"("id_pago") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetallePago" ADD CONSTRAINT "DetallePago_id_comp_fkey" FOREIGN KEY ("id_comp") REFERENCES "public"."Comprobante"("id_comp") ON DELETE RESTRICT ON UPDATE CASCADE;
