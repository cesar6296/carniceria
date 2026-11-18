-- Migración para bases de datos ya creadas con la versión anterior.
-- Agrega la columna creado_en a cortes y proveedores sin fallar si ya existe.
-- Ejecutar una sola vez: mysql -u root -p carniceria < sql/03_migracion_creado_en.sql

USE carniceria;

SET @existe_cortes := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'cortes'
    AND COLUMN_NAME = 'creado_en'
);
SET @sql_cortes := IF(
  @existe_cortes = 0,
  'ALTER TABLE cortes ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'SELECT "cortes.creado_en ya existe" AS resultado'
);
PREPARE stmt_cortes FROM @sql_cortes;
EXECUTE stmt_cortes;
DEALLOCATE PREPARE stmt_cortes;

SET @existe_proveedores := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'proveedores'
    AND COLUMN_NAME = 'creado_en'
);
SET @sql_proveedores := IF(
  @existe_proveedores = 0,
  'ALTER TABLE proveedores ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'SELECT "proveedores.creado_en ya existe" AS resultado'
);
PREPARE stmt_proveedores FROM @sql_proveedores;
EXECUTE stmt_proveedores;
DEALLOCATE PREPARE stmt_proveedores;
