CREATE DATABASE IF NOT EXISTS carniceria;
USE carniceria;

CREATE TABLE IF NOT EXISTS regiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sucursales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  ciudad VARCHAR(80) NOT NULL,
  estado VARCHAR(80) NOT NULL,
  region_id INT NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (region_id) REFERENCES regiones(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_sucursales_region (region_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  tipo ENUM('mostrador', 'restaurante', 'mayorista') NOT NULL DEFAULT 'mostrador',
  telefono VARCHAR(20),
  correo VARCHAR(120) UNIQUE,
  ciudad VARCHAR(80),
  region_id INT,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regiones(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_clientes_region (region_id),
  INDEX idx_clientes_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  contacto VARCHAR(120),
  telefono VARCHAR(20),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_proveedores_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cortes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  tipo_carne ENUM('res', 'cerdo', 'pollo', 'cordero', 'embutido') NOT NULL,
  precio_kg DECIMAL(10,2) NOT NULL CHECK (precio_kg > 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_cortes_tipo (tipo_carne),
  INDEX idx_cortes_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  usuario VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'cajero', 'supervisor') NOT NULL DEFAULT 'admin',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
