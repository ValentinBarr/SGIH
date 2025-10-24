-- CreateEnum
CREATE TYPE "public"."CategoriaComodidad" AS ENUM ('BASICO', 'ENTRETENIMIENTO', 'BANIO', 'SERVICIO', 'OTROS');

-- CreateEnum
CREATE TYPE "public"."EstadoHabitacion" AS ENUM ('DISPONIBLE', 'OCUPADA', 'LIMPIEZA', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "public"."EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELADA');

-- CreateTable
CREATE TABLE "public"."tipos_habitacion" (
    "id_tipoHab" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "capacidad" INTEGER NOT NULL,
    "precioBase" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_habitacion_pkey" PRIMARY KEY ("id_tipoHab")
);

-- CreateTable
CREATE TABLE "public"."comodidades" (
    "id_comodidad" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "icono" VARCHAR(50),
    "categoria" "public"."CategoriaComodidad" NOT NULL DEFAULT 'OTROS',
    "descripcion" VARCHAR(250),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comodidades_pkey" PRIMARY KEY ("id_comodidad")
);

-- CreateTable
CREATE TABLE "public"."tipo_habitacion_comodidades" (
    "id_tipoHab" INTEGER NOT NULL,
    "id_comodidad" INTEGER NOT NULL,

    CONSTRAINT "tipo_habitacion_comodidades_pkey" PRIMARY KEY ("id_tipoHab","id_comodidad")
);

-- CreateTable
CREATE TABLE "public"."habitaciones" (
    "id_hab" SERIAL NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "id_tipoHab" INTEGER NOT NULL,
    "piso" INTEGER,
    "estado" "public"."EstadoHabitacion" NOT NULL DEFAULT 'DISPONIBLE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habitaciones_pkey" PRIMARY KEY ("id_hab")
);

-- CreateTable
CREATE TABLE "public"."huespedes" (
    "id_huesped" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "documento" VARCHAR(50),
    "telefono" VARCHAR(30),
    "email" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "huespedes_pkey" PRIMARY KEY ("id_huesped")
);

-- CreateTable
CREATE TABLE "public"."reservas" (
    "id_reserva" SERIAL NOT NULL,
    "codigoReserva" VARCHAR(20) NOT NULL,
    "id_huesped" INTEGER NOT NULL,
    "fechaCheckIn" DATE NOT NULL,
    "fechaCheckOut" DATE NOT NULL,
    "cantAdultos" INTEGER NOT NULL DEFAULT 1,
    "cantNinos" INTEGER NOT NULL DEFAULT 0,
    "estado" "public"."EstadoReserva" NOT NULL DEFAULT 'PENDIENTE',
    "total" DECIMAL(10,2) NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id_reserva")
);

-- CreateTable
CREATE TABLE "public"."detalles_reserva" (
    "id_detReserva" SERIAL NOT NULL,
    "id_reserva" INTEGER NOT NULL,
    "id_tipoHab" INTEGER NOT NULL,
    "fechaNoche" DATE NOT NULL,
    "precioNoche" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalles_reserva_pkey" PRIMARY KEY ("id_detReserva")
);

-- CreateTable
CREATE TABLE "public"."estadias" (
    "id_estadia" SERIAL NOT NULL,
    "id_hab" INTEGER NOT NULL,
    "id_huesped" INTEGER NOT NULL,
    "id_reserva" INTEGER,
    "fechaCheckIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCheckOut" TIMESTAMP(3),

    CONSTRAINT "estadias_pkey" PRIMARY KEY ("id_estadia")
);

-- CreateIndex
CREATE UNIQUE INDEX "habitaciones_numero_key" ON "public"."habitaciones"("numero");

-- CreateIndex
CREATE INDEX "habitaciones_id_tipoHab_idx" ON "public"."habitaciones"("id_tipoHab");

-- CreateIndex
CREATE INDEX "habitaciones_estado_idx" ON "public"."habitaciones"("estado");

-- CreateIndex
CREATE INDEX "huespedes_documento_idx" ON "public"."huespedes"("documento");

-- CreateIndex
CREATE INDEX "huespedes_email_idx" ON "public"."huespedes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_codigoReserva_key" ON "public"."reservas"("codigoReserva");

-- CreateIndex
CREATE INDEX "reservas_id_huesped_idx" ON "public"."reservas"("id_huesped");

-- CreateIndex
CREATE INDEX "reservas_fechaCheckIn_idx" ON "public"."reservas"("fechaCheckIn");

-- CreateIndex
CREATE INDEX "reservas_estado_idx" ON "public"."reservas"("estado");

-- CreateIndex
CREATE INDEX "detalles_reserva_id_reserva_idx" ON "public"."detalles_reserva"("id_reserva");

-- CreateIndex
CREATE INDEX "detalles_reserva_fechaNoche_idx" ON "public"."detalles_reserva"("fechaNoche");

-- CreateIndex
CREATE INDEX "estadias_id_hab_idx" ON "public"."estadias"("id_hab");

-- CreateIndex
CREATE INDEX "estadias_id_huesped_idx" ON "public"."estadias"("id_huesped");

-- CreateIndex
CREATE INDEX "estadias_id_reserva_idx" ON "public"."estadias"("id_reserva");

-- AddForeignKey
ALTER TABLE "public"."tipo_habitacion_comodidades" ADD CONSTRAINT "tipo_habitacion_comodidades_id_tipoHab_fkey" FOREIGN KEY ("id_tipoHab") REFERENCES "public"."tipos_habitacion"("id_tipoHab") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tipo_habitacion_comodidades" ADD CONSTRAINT "tipo_habitacion_comodidades_id_comodidad_fkey" FOREIGN KEY ("id_comodidad") REFERENCES "public"."comodidades"("id_comodidad") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."habitaciones" ADD CONSTRAINT "habitaciones_id_tipoHab_fkey" FOREIGN KEY ("id_tipoHab") REFERENCES "public"."tipos_habitacion"("id_tipoHab") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_id_huesped_fkey" FOREIGN KEY ("id_huesped") REFERENCES "public"."huespedes"("id_huesped") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detalles_reserva" ADD CONSTRAINT "detalles_reserva_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "public"."reservas"("id_reserva") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detalles_reserva" ADD CONSTRAINT "detalles_reserva_id_tipoHab_fkey" FOREIGN KEY ("id_tipoHab") REFERENCES "public"."tipos_habitacion"("id_tipoHab") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estadias" ADD CONSTRAINT "estadias_id_hab_fkey" FOREIGN KEY ("id_hab") REFERENCES "public"."habitaciones"("id_hab") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estadias" ADD CONSTRAINT "estadias_id_huesped_fkey" FOREIGN KEY ("id_huesped") REFERENCES "public"."huespedes"("id_huesped") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estadias" ADD CONSTRAINT "estadias_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "public"."reservas"("id_reserva") ON DELETE SET NULL ON UPDATE CASCADE;
