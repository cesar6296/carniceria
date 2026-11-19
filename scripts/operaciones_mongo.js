require('dotenv').config();

const mongoose = require('mongoose');
const { conectarMongoDB, desconectarMongoDB, probarConexionMongo } = require('../src/config/mongo');
const CatalogoRepository = require('../src/repositories/catalogoRepository');
const UsuarioRepository = require('../src/repositories/usuarioRepository');

const Region = require('../src/models/Region');
const Sucursal = require('../src/models/Sucursal');
const Cliente = require('../src/models/Cliente');
const Proveedor = require('../src/models/Proveedor');
const Corte = require('../src/models/Corte');
const Venta = require('../src/models/Venta');
const InventarioLote = require('../src/models/InventarioLote');
const Merma = require('../src/models/Merma');
const HistorialRegional = require('../src/models/HistorialRegional');
const LecturaRefrigeracion = require('../src/models/LecturaRefrigeracion');
const Usuario = require('../src/models/Usuario');

const modelos = {
  regiones: Region,
  sucursales: Sucursal,
  clientes: Cliente,
  proveedores: Proveedor,
  cortes: Corte,
  ventas: Venta,
  inventario_lotes: InventarioLote,
  mermas: Merma,
  historial_regional: HistorialRegional,
  lecturas_refrigeracion: LecturaRefrigeracion,
  usuarios: Usuario
};

async function insertarClienteDemo() {
  const ultimo = await Cliente.findOne().sort({ id: -1 }).select({ id: 1 }).lean();
  const ahora = Date.now();
  const cliente = await Cliente.create({
    id: (ultimo?.id || 0) + 1,
    nombre: `Cliente Mongo ${ahora}`,
    tipo: 'mostrador',
    correo: `mongo.${ahora}@demo.local`,
    ciudad: 'Culiacán',
    region_id: 1,
    region_nombre: 'Noroeste'
  });
  console.log(`Insertado cliente ${cliente.id} en la colección clientes.`);
  return cliente;
}

async function consultarDatos() {
  const resumen = {};
  for (const [nombre, Model] of Object.entries(modelos)) {
    resumen[nombre] = await Model.countDocuments();
  }

  const cortesRes = await Corte.find({ tipo_carne: 'res', activo: true })
    .sort({ precio_kg: -1 })
    .limit(5)
    .select({ _id: 0, id: 1, nombre: 1, precio_kg: 1 })
    .lean();

  const ventasRecientes = await Venta.find({ estatus: 'completada' })
    .sort({ fecha_venta: -1 })
    .limit(5)
    .select({ _id: 0, folio: 1, fecha_venta: 1, 'pago.total': 1 })
    .lean();

  console.log('Conteo de colecciones:', JSON.stringify(resumen, null, 2));
  console.log('Consulta de cortes de res:', JSON.stringify(cortesRes, null, 2));
  console.log('Consulta de ventas recientes:', JSON.stringify(ventasRecientes, null, 2));
}

async function eliminarDocumentoAleatorio() {
  const muestra = await Cliente.aggregate([{ $sample: { size: 1 } }, { $project: { _id: 1, id: 1, nombre: 1 } }]);
  if (!muestra.length) {
    console.log('No hay clientes para eliminar aleatoriamente.');
    return;
  }

  const [cliente] = muestra;
  await Cliente.deleteOne({ _id: cliente._id });
  console.log(`Eliminado aleatoriamente el cliente ${cliente.id} de la colección clientes.`);
}

async function crearIndices() {
  for (const [nombre, Model] of Object.entries(modelos)) {
    await Model.createIndexes();
    const indices = await Model.listIndexes();
    console.log(`${nombre}: ${indices.map(indice => indice.name).join(', ')}`);
  }
}

async function ejecutar() {
  const operacion = process.argv[2] || 'demo';
  const esDryRun = process.argv.includes('--dry-run');
  const operacionesValidas = new Set(['insertar', 'consultar', 'eliminar', 'indices', 'demo']);
  if (!operacionesValidas.has(operacion)) {
    throw new Error('Usa: insertar, consultar, eliminar, indices o demo.');
  }

  if (esDryRun) {
    console.log(`Dry run MongoDB: se ejecutaría la operación "${operacion}" sin insertar, eliminar ni crear índices.`);
    if (operacion === 'demo') {
      console.log('Orden: insertar cliente demo → consultar colecciones → eliminar un cliente con $sample → crear índices.');
    }
    return;
  }

  await conectarMongoDB();
  if (probarConexionMongo().estado !== 'ok') {
    throw new Error('MongoDB no está conectado. Configura MONGODB_URI o ejecuta el proyecto en desarrollo.');
  }
  await CatalogoRepository.sembrarCatalogos();
  await UsuarioRepository.asegurarAdministrador();

  if (operacion === 'insertar') await insertarClienteDemo();
  if (operacion === 'consultar') await consultarDatos();
  if (operacion === 'eliminar') await eliminarDocumentoAleatorio();
  if (operacion === 'indices') await crearIndices();
  if (operacion === 'demo') {
    await insertarClienteDemo();
    await consultarDatos();
    await eliminarDocumentoAleatorio();
    await crearIndices();
  }
}

ejecutar()
  .catch(error => {
    console.error('Error en operaciones MongoDB:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    await desconectarMongoDB().catch(() => {});
  });
