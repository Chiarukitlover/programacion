// Crea el primer administrador con la clave encriptada (bcrypt).
// Uso:  node crear-admin.js MiUsuario MiClaveSegura
const bcrypt = require('bcryptjs');
const db = require('./db');

const usuario = process.argv[2];
const clave = process.argv[3];

if (!usuario || !clave) {
  console.log('Uso: node crear-admin.js <usuario> <clave>');
  process.exit(1);
}
if (usuario.length > 20) {
  console.log('El usuario puede tener hasta 20 caracteres.');
  process.exit(1);
}

db.query('SELECT COUNT(*) AS total FROM admin', (err, filas) => {
  if (err) { console.log('Error: ' + err.message); return db.end(); }
  if (filas[0].total > 0) {
    console.log('Ya existe un admin. No se creó otro.');
    return db.end();
  }
  bcrypt.hash(clave, 10, (err2, hash) => {
    db.query('INSERT INTO admin (usuario, `contraseña`) VALUES (?, ?)', [usuario, hash], (err3) => {
      console.log(err3 ? 'Error: ' + err3.message : 'Admin creado correctamente');
      db.end();
    });
  });
});
