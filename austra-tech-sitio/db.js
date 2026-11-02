// Conexión a MySQL (XAMPP) - createConnection, sin pool
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',          // XAMPP por defecto no tiene clave
  database: 'austratech'
});

db.connect((err) => {
  if (err) {
    console.error('Error de conexión a MySQL:', err.message);
    return;
  }
  console.log('Conectado a MySQL (austratech)');
});

module.exports = db;
