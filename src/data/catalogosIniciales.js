const regiones = [
  { id: 1, nombre: 'Noroeste' },
  { id: 2, nombre: 'Noreste' },
  { id: 3, nombre: 'Centro' },
  { id: 4, nombre: 'Occidente' },
  { id: 5, nombre: 'Sur' },
  { id: 6, nombre: 'Sureste' }
];

const sucursales = [
  { id: 1, nombre: 'Sucursal Culiacán Centro', ciudad: 'Culiacán', estado: 'Sinaloa', region_id: 1, activa: true },
  { id: 2, nombre: 'Sucursal Hermosillo Norte', ciudad: 'Hermosillo', estado: 'Sonora', region_id: 1, activa: true },
  { id: 3, nombre: 'Sucursal Monterrey San Pedro', ciudad: 'Monterrey', estado: 'Nuevo León', region_id: 2, activa: true },
  { id: 4, nombre: 'Sucursal Saltillo Poniente', ciudad: 'Saltillo', estado: 'Coahuila', region_id: 2, activa: true },
  { id: 5, nombre: 'Sucursal CDMX Del Valle', ciudad: 'Ciudad de México', estado: 'CDMX', region_id: 3, activa: true },
  { id: 6, nombre: 'Sucursal Guadalajara Providencia', ciudad: 'Guadalajara', estado: 'Jalisco', region_id: 4, activa: true },
  { id: 7, nombre: 'Sucursal Oaxaca Reforma', ciudad: 'Oaxaca de Juárez', estado: 'Oaxaca', region_id: 5, activa: true },
  { id: 8, nombre: 'Sucursal Mérida Altabrisa', ciudad: 'Mérida', estado: 'Yucatán', region_id: 6, activa: true }
];

const clientes = [
  ['Carlos Eduardo Rivera', 'mostrador', '667-111-2233', 'carlos.rivera@gmail.com', 'Culiacán', 1],
  ['María Teresa López', 'mostrador', '662-222-3344', 'teresa.lopez@hotmail.com', 'Hermosillo', 1],
  ['José Luis Morales', 'mostrador', '811-333-4455', 'jluis.morales@yahoo.com', 'Monterrey', 2],
  ['Ana Sofía Garza', 'mostrador', '844-444-5566', 'asofia.garza@gmail.com', 'Saltillo', 2],
  ['Miguel Ángel Sánchez', 'mostrador', '555-555-6677', 'miguel.sanchez@gmail.com', 'Ciudad de México', 3],
  ['Lucía Fernanda Gómez', 'mostrador', '333-666-7788', 'lucia.gomez@outlook.com', 'Guadalajara', 4],
  ['Guillermo Mendoza', 'mostrador', '951-777-8899', 'guillermo.m@gmail.com', 'Oaxaca de Juárez', 5],
  ['Daniela Beatriz Chan', 'mostrador', '999-888-9900', 'daniela.chan@gmail.com', 'Mérida', 6],
  ['Jorge Alberto Cárdenas', 'mostrador', '667-999-0011', 'jorge.cardenas@live.com', 'Culiacán', 1],
  ['Valeria Romero Ortiz', 'mostrador', '662-101-1122', 'v.romero@gmail.com', 'Hermosillo', 1],
  ['Enrique Torres Cantú', 'mostrador', '811-212-2233', 'enrique.torres@gmail.com', 'Monterrey', 2],
  ['Patricia Estrada', 'mostrador', '555-313-3344', 'paty.estrada@gmail.com', 'Ciudad de México', 3],
  ['Fernando Velasco', 'mostrador', '333-414-4455', 'fer.velasco@gmail.com', 'Guadalajara', 4],
  ['Claudia Hernández', 'mostrador', '951-515-5566', 'claudia.hdz@gmail.com', 'Oaxaca de Juárez', 5],
  ['Rodrigo Pech Solís', 'mostrador', '999-616-6677', 'rodrigo.pech@gmail.com', 'Mérida', 6],
  ['Restaurante Sonora Grill Culiacán', 'restaurante', '667-717-7788', 'compras@sonoragrillcul.mx', 'Culiacán', 1],
  ['Asador del Norte Hermosillo', 'restaurante', '662-818-8899', 'contacto@asadorhmo.com', 'Hermosillo', 1],
  ['El Gran Pastor Monterrey', 'restaurante', '811-919-9900', 'abastecimiento@granpastor.com', 'Monterrey', 2],
  ['Mesón Saltillo Tradicional', 'restaurante', '844-121-2323', 'admin@mesonsaltillo.com', 'Saltillo', 2],
  ['Bistró Condesa CDMX', 'restaurante', '555-232-3434', 'chef@bistrocondesa.mx', 'Ciudad de México', 3],
  ['Parrilla La Calzada Guadalajara', 'restaurante', '333-343-4545', 'compras@parrillagdl.com', 'Guadalajara', 4],
  ['Cenaduría Oaxaqueña Los Sabores', 'restaurante', '951-454-5656', 'sabores@oaxacagourmet.com', 'Oaxaca de Juárez', 5],
  ['La Tradición Mérida', 'restaurante', '999-565-6767', 'gerencia@latradicionmerida.mx', 'Mérida', 6],
  ['Steakhouse Los Arcos', 'restaurante', '667-676-7878', 'chef@losarcosculiacan.com', 'Culiacán', 1],
  ['La Buena Barra Polanco', 'restaurante', '555-787-8989', 'insumos@labuenabarra.mx', 'Ciudad de México', 3],
  ['Distribuidora de Alimentos del Pacífico', 'mayorista', '667-898-9090', 'pedidos@distribuidorapacifico.com', 'Culiacán', 1],
  ['Comercializadora Regiomontana de Carnes', 'mayorista', '811-909-0101', 'compras@comercializadoraregio.mx', 'Monterrey', 2],
  ['Abastecedora de Carnes del Centro', 'mayorista', '555-010-1212', 'ventas@abastecedoracentro.mx', 'Ciudad de México', 3],
  ['Carnes y Embutidos de Occidente', 'mayorista', '333-121-2323', 'contacto@carnesoccidente.com', 'Guadalajara', 4],
  ['Suministros Cárnicos del Sureste', 'mayorista', '999-232-3434', 'ventas@suministrossureste.com', 'Mérida', 6]
].map((cliente, index) => ({
  id: index + 1,
  nombre: cliente[0],
  tipo: cliente[1],
  telefono: cliente[2],
  correo: cliente[3],
  ciudad: cliente[4],
  region_id: cliente[5]
}));

const proveedores = [
  ['Ganadería del Norte S.A. de C.V.', 'Ing. Roberto Garza', '667-123-4567'],
  ['Carnes Selectas de Sonora', 'Lic. Alejandro Elías', '662-987-6543'],
  ['Porcícola del Bajío', 'Carlos Mendoza', '477-555-1212'],
  ['Avícola San Juan', 'Patricia Morales', '333-888-9900'],
  ['Empacadora y Embutidos Real', 'Fernando Silva', '811-222-3344'],
  ['Ovinos del Altiplano', 'Héctor Salgado', '555-444-3322']
].map((proveedor, index) => ({
  id: index + 1,
  nombre: proveedor[0],
  contacto: proveedor[1],
  telefono: proveedor[2],
  activo: true
}));

const cortes = [
  ['Arrachera Marinada', 'res', 245],
  ['Ribeye Prime', 'res', 380],
  ['Tomahawk Steak', 'res', 450],
  ['New York Strip', 'res', 340],
  ['T-Bone', 'res', 290],
  ['Costilla de Res Cargada', 'res', 175],
  ['Carne Molida Especial 90/10', 'res', 145],
  ['Diezmillo para Asar', 'res', 195],
  ['Suadero de Res', 'res', 155],
  ['Falda de Res para Deshebrar', 'res', 165],
  ['Costilla de Cerdo BBQ', 'cerdo', 135],
  ['Chuleta de Cerdo Ahumada', 'cerdo', 120],
  ['Lomo de Cerdo', 'cerdo', 130],
  ['Pierna de Cerdo con Hueso', 'cerdo', 105],
  ['Panceta de Cerdo (Pork Belly)', 'cerdo', 160],
  ['Espaldilla de Cerdo', 'cerdo', 115],
  ['Pechuga de Pollo Entera', 'pollo', 125],
  ['Milanesa de Pechuga de Pollo', 'pollo', 145],
  ['Muslo y Pierna de Pollo', 'pollo', 75],
  ['Alitas de Pollo Naturales', 'pollo', 95],
  ['Costillar de Cordero Francés', 'cordero', 420],
  ['Pierna de Cordero Deshuesada', 'cordero', 310],
  ['Chorizo Artesanal Español', 'embutido', 150],
  ['Longaniza Casera de Toluca', 'embutido', 130],
  ['Chistorra Navarra Especial', 'embutido', 185]
].map((corte, index) => ({
  id: index + 1,
  nombre: corte[0],
  tipo_carne: corte[1],
  precio_kg: corte[2],
  activo: true
}));

module.exports = { regiones, sucursales, clientes, proveedores, cortes };
