let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (err) {
  sqlite3 = null;
}

if (sqlite3) {
  const db = new sqlite3.Database('./data.db');

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tipo_deposito (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS deposito (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_id INTEGER,
      codigo TEXT,
      nombre TEXT,
      activo INTEGER,
      ultima_fecha_conteo TEXT,
      FOREIGN KEY (tipo_id) REFERENCES tipo_deposito(id)
    )`);

    db.get('SELECT COUNT(*) as count FROM tipo_deposito', (err, row) => {
      if (row && row.count === 0) {
        const stmt = db.prepare('INSERT INTO tipo_deposito (nombre) VALUES (?)');
        ['Principal', 'Secundario'].forEach((n) => stmt.run(n));
        stmt.finalize();
      }
    });
  });

  module.exports = {
    getTiposDeposito(cb) {
      db.all('SELECT id, nombre FROM tipo_deposito', cb);
    },
    getDepositos(cb) {
      db.all(
        `SELECT d.id, d.codigo, d.nombre, d.activo, d.ultima_fecha_conteo, t.nombre as tipo
         FROM deposito d LEFT JOIN tipo_deposito t ON d.tipo_id = t.id`,
        cb
      );
    },
    createDeposito({ tipo_id, codigo, nombre, activo }, cb) {
      db.run(
        `INSERT INTO deposito (tipo_id, codigo, nombre, activo, ultima_fecha_conteo)
         VALUES (?, ?, ?, ?, date('now'))`,
        [tipo_id, codigo, nombre, activo ? 1 : 0],
        function (err) {
          cb(err, this ? this.lastID : null);
        }
      );
    },
    getDepositoById(id, cb) {
      db.get(
        `SELECT d.id, d.codigo, d.nombre, d.activo, d.ultima_fecha_conteo, d.tipo_id, t.nombre as tipo
         FROM deposito d LEFT JOIN tipo_deposito t ON d.tipo_id = t.id WHERE d.id = ?`,
        [id],
        cb
      );
    },
    updateDeposito(id, { tipo_id, codigo, nombre, activo }, cb) {
      db.run(
        `UPDATE deposito SET tipo_id=?, codigo=?, nombre=?, activo=? WHERE id=?`,
        [tipo_id, codigo, nombre, activo ? 1 : 0, id],
        cb
      );
    }
  };
} else {
  const tipos = [
    { id: 1, nombre: 'Principal' },
    { id: 2, nombre: 'Secundario' }
  ];
  const depositos = [];

  module.exports = {
    getTiposDeposito(cb) {
      cb(null, tipos);
    },
    getDepositos(cb) {
      cb(null, depositos);
    },
    createDeposito({ tipo_id, codigo, nombre, activo }, cb) {
      const id = depositos.length + 1;
      depositos.push({
        id,
        tipo_id: Number(tipo_id),
        codigo,
        nombre,
        activo: activo ? 1 : 0,
        ultima_fecha_conteo: new Date().toISOString().slice(0, 10),
        tipo: tipos.find((t) => t.id === Number(tipo_id))?.nombre || ''
      });
      cb(null, id);
    },
    getDepositoById(id, cb) {
      const dep = depositos.find((d) => d.id === id);
      cb(null, dep || null);
    },
    updateDeposito(id, { tipo_id, codigo, nombre, activo }, cb) {
      const dep = depositos.find((d) => d.id === id);
      if (dep) {
        dep.tipo_id = Number(tipo_id);
        dep.codigo = codigo;
        dep.nombre = nombre;
        dep.activo = activo ? 1 : 0;
        dep.tipo = tipos.find((t) => t.id === Number(tipo_id))?.nombre || '';
      }
      cb(null);
    }
  };
}
