const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const SECRETO = process.env.JWT_SECRETO || 'cambia-esto-por-una-frase-larga-y-propia';
const app = express();

app.use(cors());
app.use(express.json());

// No publicar archivos internos del servidor (static publica toda la carpeta)
app.use((req, res, next) => {
  if (/^\/(server|db|crear-admin)\.js$|^\/package(-lock)?\.json$|\.sql$|^\/node_modules/i.test(req.path)) {
    return res.status(404).end();
  }
  next();
});
app.use(express.static(__dirname));

// ---------- FORMULARIO PÚBLICO ----------
app.post('/api/consultas', (req, res) => {
  const tipo = String(req.body.tipoconsulta ?? '').trim();
  const contacto = String(req.body.contacto ?? '').trim();
  const consulta = String(req.body.consulta ?? '').trim();

  const tiposValidos = ['hardware', 'software', 'redes', 'asistencia'];
  if (!tipo || !contacto || !consulta) {
    return res.status(400).json({ mensaje: 'Faltan datos: tipo, contacto y consulta' });
  }
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ mensaje: 'Tipo de consulta inválido' });
  }
  const esEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto);
  const esTelefono = /^[\d\s()+\-]{6,25}$/.test(contacto);
  if (contacto.length > 50 || (!esEmail && !esTelefono)) {
    return res.status(400).json({ mensaje: 'Ingresá un email o un teléfono válido (máx. 50 caracteres)' });
  }
  if (consulta.length < 10 || consulta.length > 500) {
    return res.status(400).json({ mensaje: 'La consulta debe tener entre 10 y 500 caracteres' });
  }

  db.query(
    'INSERT INTO consultas (contacto, tipoconsulta, consulta) VALUES (?, ?, ?)',
    [contacto, tipo, consulta],
    (err, result) => {
      if (err) {
        console.error('Error SQL:', err.code, err.sqlMessage);
        return res.status(500).json({ mensaje: 'Error al guardar la consulta' });
      }
      res.status(201).json({ mensaje: 'Consulta registrada correctamente', id: result.insertId });
    }
  );
});

// ---------- LOGIN DEL ADMIN ----------
app.post('/api/login', (req, res) => {
  const usuario = String(req.body.usuario ?? '').trim();
  const clave = String(req.body.clave ?? '');
  if (!usuario || !clave) {
    return res.status(400).json({ mensaje: 'Completá usuario y contraseña' });
  }

  db.query(
    'SELECT id_admin, usuario, `contraseña` AS clave FROM admin WHERE usuario = ?',
    [usuario],
    async (err, filas) => {
      if (err) {
        console.error('Error SQL:', err.sqlMessage);
        return res.status(500).json({ mensaje: 'Error en el servidor' });
      }
      const invalido = () => res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
      if (filas.length === 0) return invalido();

      const coincide = await bcrypt.compare(clave, filas[0].clave);
      if (!coincide) return invalido();

      const token = jwt.sign(
        { id: filas[0].id_admin, usuario: filas[0].usuario },
        SECRETO,
        { expiresIn: '2h' }
      );
      res.json({ mensaje: 'Bienvenido', token });
    }
  );
});

// ---------- PROTECCIÓN DE RUTAS DE ADMIN ----------
function soloAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.admin = jwt.verify(token, SECRETO);
    next();
  } catch {
    res.status(401).json({ mensaje: 'No autorizado' });
  }
}

// Lista las consultas con su atención (JOIN entre las tablas)
app.get('/api/consultas', soloAdmin, (req, res) => {
  const sql = `
    SELECT c.id_consultas, c.contacto, c.tipoconsulta, c.consulta,
           a.respuesta, a.fecha_atencion
    FROM consultas c
    LEFT JOIN atencion a ON a.id_consultas = c.id_consultas
    ORDER BY c.id_consultas DESC
  `;
  db.query(sql, (err, filas) => {
    if (err) {
      console.error('Error SQL:', err.sqlMessage);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }
    res.json(filas);
  });
});

// Guarda (o actualiza) la respuesta a una consulta
app.post('/api/atencion', soloAdmin, (req, res) => {
  const idConsulta = parseInt(req.body.id_consultas, 10);
  const respuesta = String(req.body.respuesta ?? '').trim();
  if (!idConsulta || !respuesta || respuesta.length > 500) {
    return res.status(400).json({ mensaje: 'Datos inválidos (respuesta de 1 a 500 caracteres)' });
  }

  // Requiere UNIQUE en atencion.id_consultas (ver austratech.sql)
  const sql = `
    INSERT INTO atencion (id_consultas, id_admin, respuesta)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      respuesta = VALUES(respuesta),
      id_admin = VALUES(id_admin),
      fecha_atencion = CURRENT_TIMESTAMP
  `;
  db.query(sql, [idConsulta, req.admin.id, respuesta], (err) => {
    if (err) {
      console.error('Error SQL:', err.sqlMessage);
      return res.status(500).json({ mensaje: 'Error al guardar la respuesta' });
    }
    res.json({ mensaje: 'Respuesta guardada' });
  });
});

// Elimina una consulta (su atención se borra sola por el ON DELETE CASCADE)
app.delete('/api/consultas/:id', soloAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ mensaje: 'Consulta inválida' });

  db.query('DELETE FROM consultas WHERE id_consultas = ?', [id], (err) => {
    if (err) {
      console.error('Error SQL:', err.sqlMessage);
      return res.status(500).json({ mensaje: 'Error al eliminar' });
    }
    res.json({ mensaje: 'Consulta eliminada' });
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
