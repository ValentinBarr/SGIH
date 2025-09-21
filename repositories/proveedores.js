const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class ProveedoresRepository {
  async add(data) {
    const payload = this.#sanitize(data, { creating: true });
    if (!payload.nombre_prov) throw new Error('El nombre es obligatorio');
    if (!payload.cuit_prov) throw new Error('El CUIT es obligatorio');
    return prisma.proveedor.create({ data: payload });
  }

  async update(id_prov, data) {
    const payload = this.#sanitize(data);
    return prisma.proveedor.update({
      where: { id_prov: Number(id_prov) },
      data: payload,
    });
  }

  async getById(id_prov) {
    return prisma.proveedor.findUnique({ where: { id_prov: Number(id_prov) } });
  }

  async remove(id_prov) {
    return prisma.proveedor.delete({ where: { id_prov: Number(id_prov) } });
  }

  async toggleActive(id_prov) {
    const prov = await this.getById(id_prov);
    if (!prov) throw new Error('Proveedor no encontrado');
    return prisma.proveedor.update({
      where: { id_prov: Number(id_prov) },
      data: { activo_prov: !prov.activo_prov },
    });
  }

  async list({ q, activo } = {}) {
    const where = {};
    if (q && q.trim()) {
      const n = Number(q);
      where.OR = [
        { nombre_prov: { contains: q, mode: 'insensitive' } },
        { cuit_prov:   { contains: q, mode: 'insensitive' } },
        ...(Number.isFinite(n) ? [{ id_prov: n }] : []),
      ];
    }
    if (activo === '1' || activo === '0' || typeof activo === 'boolean') {
      where.activo_prov = (activo === '1') ? true : (activo === '0') ? false : !!activo;
    }

    return prisma.proveedor.findMany({
      where,
      orderBy: [{ nombre_prov: 'asc' }, { id_prov: 'asc' }],
    });
  }

  #sanitize(b = {}, { creating = false } = {}) {
    return {
      nombre_prov:    (b.nombre_prov || '').trim(),
      cuit_prov:      (b.cuit_prov || '').trim(),
      direccion_prov: (b.direccion_prov || '').trim() || null,
      telefono_prov:  (b.telefono_prov || '').trim() || null,
      email_prov:     (b.email_prov || '').trim() || null,
      ...(creating
        ? { activo_prov: b.activo_prov === undefined ? true : !!b.activo_prov }
        : { activo_prov: !!b.activo_prov }),
    };
  }
}

module.exports = new ProveedoresRepository();
