USE carniceria;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE clientes;
TRUNCATE TABLE usuarios;
TRUNCATE TABLE cortes;
TRUNCATE TABLE proveedores;
TRUNCATE TABLE sucursales;
TRUNCATE TABLE regiones;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO regiones (id, nombre) VALUES
(1, 'Noroeste'),
(2, 'Noreste'),
(3, 'Centro'),
(4, 'Occidente'),
(5, 'Sur'),
(6, 'Sureste');

INSERT INTO sucursales (id, nombre, ciudad, estado, region_id, activa) VALUES
(1, 'Sucursal Culiacán Centro', 'Culiacán', 'Sinaloa', 1, TRUE),
(2, 'Sucursal Hermosillo Norte', 'Hermosillo', 'Sonora', 1, TRUE),
(3, 'Sucursal Monterrey San Pedro', 'Monterrey', 'Nuevo León', 2, TRUE),
(4, 'Sucursal Saltillo Poniente', 'Saltillo', 'Coahuila', 2, TRUE),
(5, 'Sucursal CDMX Del Valle', 'Ciudad de México', 'CDMX', 3, TRUE),
(6, 'Sucursal Guadalajara Providencia', 'Guadalajara', 'Jalisco', 4, TRUE),
(7, 'Sucursal Oaxaca Reforma', 'Oaxaca de Juárez', 'Oaxaca', 5, TRUE),
(8, 'Sucursal Mérida Altabrisa', 'Mérida', 'Yucatán', 6, TRUE);

INSERT INTO proveedores (id, nombre, contacto, telefono, activo) VALUES
(1, 'Ganadería del Norte S.A. de C.V.', 'Ing. Roberto Garza', '667-123-4567', TRUE),
(2, 'Carnes Selectas de Sonora', 'Lic. Alejandro Elías', '662-987-6543', TRUE),
(3, 'Porcícola del Bajío', 'Carlos Mendoza', '477-555-1212', TRUE),
(4, 'Avícola San Juan', 'Patricia Morales', '333-888-9900', TRUE),
(5, 'Empacadora y Embutidos Real', 'Fernando Silva', '811-222-3344', TRUE),
(6, 'Ovinos del Altiplano', 'Héctor Salgado', '555-444-3322', TRUE);

INSERT INTO cortes (id, nombre, tipo_carne, precio_kg, activo) VALUES
(1, 'Arrachera Marinada', 'res', 245.00, TRUE),
(2, 'Ribeye Prime', 'res', 380.00, TRUE),
(3, 'Tomahawk Steak', 'res', 450.00, TRUE),
(4, 'New York Strip', 'res', 340.00, TRUE),
(5, 'T-Bone', 'res', 290.00, TRUE),
(6, 'Costilla de Res Cargada', 'res', 175.00, TRUE),
(7, 'Carne Molida Especial 90/10', 'res', 145.00, TRUE),
(8, 'Diezmillo para Asar', 'res', 195.00, TRUE),
(9, 'Suadero de Res', 'res', 155.00, TRUE),
(10, 'Falda de Res para Deshebrar', 'res', 165.00, TRUE),
(11, 'Costilla de Cerdo BBQ', 'cerdo', 135.00, TRUE),
(12, 'Chuleta de Cerdo Ahumada', 'cerdo', 120.00, TRUE),
(13, 'Lomo de Cerdo', 'cerdo', 130.00, TRUE),
(14, 'Pierna de Cerdo con Hueso', 'cerdo', 105.00, TRUE),
(15, 'Panceta de Cerdo (Pork Belly)', 'cerdo', 160.00, TRUE),
(16, 'Espaldilla de Cerdo', 'cerdo', 115.00, TRUE),
(17, 'Pechuga de Pollo Entera', 'pollo', 125.00, TRUE),
(18, 'Milanesa de Pechuga de Pollo', 'pollo', 145.00, TRUE),
(19, 'Muslo y Pierna de Pollo', 'pollo', 75.00, TRUE),
(20, 'Alitas de Pollo Naturales', 'pollo', 95.00, TRUE),
(21, 'Costillar de Cordero Francés', 'cordero', 420.00, TRUE),
(22, 'Pierna de Cordero Deshuesada', 'cordero', 310.00, TRUE),
(23, 'Chorizo Artesanal Español', 'embutido', 150.00, TRUE),
(24, 'Longaniza Casera de Toluca', 'embutido', 130.00, TRUE),
(25, 'Chistorra Navarra Especial', 'embutido', 185.00, TRUE);

INSERT INTO clientes (id, nombre, tipo, telefono, correo, ciudad, region_id) VALUES
(1, 'Carlos Eduardo Rivera', 'mostrador', '667-111-2233', 'carlos.rivera@gmail.com', 'Culiacán', 1),
(2, 'María Teresa López', 'mostrador', '662-222-3344', 'teresa.lopez@hotmail.com', 'Hermosillo', 1),
(3, 'José Luis Morales', 'mostrador', '811-333-4455', 'jluis.morales@yahoo.com', 'Monterrey', 2),
(4, 'Ana Sofía Garza', 'mostrador', '844-444-5566', 'asofia.garza@gmail.com', 'Saltillo', 2),
(5, 'Miguel Ángel Sánchez', 'mostrador', '555-555-6677', 'miguel.sanchez@gmail.com', 'Ciudad de México', 3),
(6, 'Lucía Fernanda Gómez', 'mostrador', '333-666-7788', 'lucia.gomez@outlook.com', 'Guadalajara', 4),
(7, 'Guillermo Mendoza', 'mostrador', '951-777-8899', 'guillermo.m@gmail.com', 'Oaxaca de Juárez', 5),
(8, 'Daniela Beatriz Chan', 'mostrador', '999-888-9900', 'daniela.chan@gmail.com', 'Mérida', 6),
(9, 'Jorge Alberto Cárdenas', 'mostrador', '667-999-0011', 'jorge.cardenas@live.com', 'Culiacán', 1),
(10, 'Valeria Romero Ortiz', 'mostrador', '662-101-1122', 'v.romero@gmail.com', 'Hermosillo', 1),
(11, 'Enrique Torres Cantú', 'mostrador', '811-212-2233', 'enrique.torres@gmail.com', 'Monterrey', 2),
(12, 'Patricia Estrada', 'mostrador', '555-313-3344', 'paty.estrada@gmail.com', 'Ciudad de México', 3),
(13, 'Fernando Velasco', 'mostrador', '333-414-4455', 'fer.velasco@gmail.com', 'Guadalajara', 4),
(14, 'Claudia Hernández', 'mostrador', '951-515-5566', 'claudia.hdz@gmail.com', 'Oaxaca de Juárez', 5),
(15, 'Rodrigo Pech Solís', 'mostrador', '999-616-6677', 'rodrigo.pech@gmail.com', 'Mérida', 6),
(16, 'Restaurante Sonora Grill Culiacán', 'restaurante', '667-717-7788', 'compras@sonoragrillcul.mx', 'Culiacán', 1),
(17, 'Asador del Norte Hermosillo', 'restaurante', '662-818-8899', 'contacto@asadorhmo.com', 'Hermosillo', 1),
(18, 'El Gran Pastor Monterrey', 'restaurante', '811-919-9900', 'abastecimiento@granpastor.com', 'Monterrey', 2),
(19, 'Mesón Saltillo Tradicional', 'restaurante', '844-121-2323', 'admin@mesonsaltillo.com', 'Saltillo', 2),
(20, 'Bistró Condesa CDMX', 'restaurante', '555-232-3434', 'chef@bistrocondesa.mx', 'Ciudad de México', 3),
(21, 'Parrilla La Calzada Guadalajara', 'restaurante', '333-343-4545', 'compras@parrillagdl.com', 'Guadalajara', 4),
(22, 'Cenaduría Oaxaqueña Los Sabores', 'restaurante', '951-454-5656', 'sabores@oaxacagourmet.com', 'Oaxaca de Juárez', 5),
(23, 'La Tradición Mérida', 'restaurante', '999-565-6767', 'gerencia@latradicionmerida.mx', 'Mérida', 6),
(24, 'Steakhouse Los Arcos', 'restaurante', '667-676-7878', 'chef@losarcosculiacan.com', 'Culiacán', 1),
(25, 'La Buena Barra Polanco', 'restaurante', '555-787-8989', 'insumos@labuenabarra.mx', 'Ciudad de México', 3),
(26, 'Distribuidora de Alimentos del Pacífico', 'mayorista', '667-898-9090', 'pedidos@distribuidorapacifico.com', 'Culiacán', 1),
(27, 'Comercializadora Regiomontana de Carnes', 'mayorista', '811-909-0101', 'compras@comercializadoraregio.mx', 'Monterrey', 2),
(28, 'Abastecedora de Carnes del Centro', 'mayorista', '555-010-1212', 'ventas@abastecedoracentro.mx', 'Ciudad de México', 3),
(29, 'Carnes y Embutidos de Occidente', 'mayorista', '333-121-2323', 'contacto@carnesoccidente.com', 'Guadalajara', 4),
(30, 'Suministros Cárnicos del Sureste', 'mayorista', '999-232-3434', 'ventas@suministrossureste.com', 'Mérida', 6);

INSERT INTO usuarios (id, nombre, usuario, password_hash, rol, activo) VALUES
(1, 'Uzielito Remix', 'uzielitoremix', '$2b$10$HWIPODptIhzghEC1xI9szOAZ0FD/DRCWDuVDJTmmAs2loIwADxPmm', 'admin', TRUE);
