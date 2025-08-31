-- CreateTable
CREATE TABLE "public"."Product" (
    "id_prod" SERIAL NOT NULL,
    "name_prod" VARCHAR(100) NOT NULL,
    "fecha_alta_prod" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id_prod")
);
