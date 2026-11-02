-- Base de datos AUSTRA TECH (XAMPP / MySQL)
CREATE DATABASE IF NOT EXISTS austratech CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE austratech;

CREATE TABLE IF NOT EXISTS consultas (
  id_consultas INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  contacto VARCHAR(50) NOT NULL,
  tipoconsulta ENUM('hardware','software','redes','asistencia') NOT NULL,
  consulta VARCHAR(500) NOT NULL
);

CREATE TABLE IF NOT EXISTS admin (
  id_admin INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(20) NOT NULL UNIQUE,
  `contraseña` VARCHAR(255) NOT NULL   -- hash bcrypt (~60 caracteres)
);

CREATE TABLE IF NOT EXISTS atencion (
  id_atencion INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_consultas INT(11) NOT NULL UNIQUE,   -- una atención por consulta
  id_admin INT(11) NOT NULL,
  respuesta VARCHAR(500) NOT NULL,
  fecha_atencion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_consultas) REFERENCES consultas(id_consultas) ON DELETE CASCADE,
  FOREIGN KEY (id_admin) REFERENCES admin(id_admin)
);

/* ----- Si ya tenés las tablas creadas en phpMyAdmin, corré solo esto: -----
ALTER TABLE admin MODIFY `contraseña` VARCHAR(255) NOT NULL;
ALTER TABLE atencion ADD UNIQUE (id_consultas);
-- (y en Diseñador / Estructura > Vista de relaciones, poné ON DELETE CASCADE
--  en la relación atencion.id_consultas -> consultas.id_consultas)
*/
