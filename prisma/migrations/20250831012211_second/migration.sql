-- CreateTable
CREATE TABLE "public"."TipoDeposito" (
    "id_tipoDep" SERIAL NOT NULL,
    "nombre_tipoDep" VARCHAR(80) NOT NULL,
    "esPuntoDeVenta_tipoDep" BOOLEAN NOT NULL,
    "esConsumoInterno_tipoDep" BOOLEAN NOT NULL,
    "frecuenciaConteoDias_tipoDep" INTEGER NOT NULL,
    "activo_tipoDep" BOOLEAN NOT NULL,

    CONSTRAINT "TipoDeposito_pkey" PRIMARY KEY ("id_tipoDep")
);

-- CreateTable
CREATE TABLE "public"."Deposito" (
    "id_dep" SERIAL NOT NULL,
    "id_tipoDep" INTEGER NOT NULL,
    "nombre_dep" VARCHAR(80) NOT NULL,
    "activo_dep" BOOLEAN NOT NULL,
    "fechaAlta_dep" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deposito_pkey" PRIMARY KEY ("id_dep")
);

-- AddForeignKey
ALTER TABLE "public"."Deposito" ADD CONSTRAINT "Deposito_id_tipoDep_fkey" FOREIGN KEY ("id_tipoDep") REFERENCES "public"."TipoDeposito"("id_tipoDep") ON DELETE RESTRICT ON UPDATE CASCADE;
