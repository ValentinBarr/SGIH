const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

async function list() {
  const depositos = await prisma.deposito.findMany({
    include: { TipoDeposito: true }
  });
  return depositos.map((d) => ({
    id: d.id_dep,
    codigo: d.id_dep,
    nombre: d.nombre_dep,
    tipo_id: d.id_tipoDep,
    tipo: d.TipoDeposito ? d.TipoDeposito.nombre_tipoDep : '',
    activo: d.activo_dep,
    ultimaFechaConteo: null
  }));
}

async function getById(id) {
  const d = await prisma.deposito.findUnique({
    where: { id_dep: id },
    include: { TipoDeposito: true }
  });
  if (!d) return null;
  return {
    id: d.id_dep,
    codigo: d.id_dep,
    nombre: d.nombre_dep,
    tipo_id: d.id_tipoDep,
    tipo: d.TipoDeposito ? d.TipoDeposito.nombre_tipoDep : '',
    activo: d.activo_dep,
    ultimaFechaConteo: null
  };
}

async function listTipos() {
  const tipos = await prisma.tipoDeposito.findMany();
  return tipos.map((t) => ({ id: t.id_tipoDep, nombre: t.nombre_tipoDep }));
}

async function create({ tipo_id, nombre, activo }) {
  await prisma.deposito.create({
    data: {
      id_tipoDep: parseInt(tipo_id),
      nombre_dep: nombre,
      activo_dep: activo
    }
  });
}

async function update(id, { tipo_id, nombre, activo }) {
  await prisma.deposito.update({
    where: { id_dep: id },
    data: {
      id_tipoDep: parseInt(tipo_id),
      nombre_dep: nombre,
      activo_dep: activo
    }
  });
}

module.exports = {
  list,
  getById,
  listTipos,
  create,
  update
};
