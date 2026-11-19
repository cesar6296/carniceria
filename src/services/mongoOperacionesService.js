const Region = require('../models/Region');
const Sucursal = require('../models/Sucursal');
const Cliente = require('../models/Cliente');
const Proveedor = require('../models/Proveedor');
const Corte = require('../models/Corte');
const Venta = require('../models/Venta');
const InventarioLote = require('../models/InventarioLote');
const Merma = require('../models/Merma');
const HistorialRegional = require('../models/HistorialRegional');
const LecturaRefrigeracion = require('../models/LecturaRefrigeracion');
const Usuario = require('../models/Usuario');

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

// La web no permite borrar regiones, sucursales ni usuarios para no dejar
// inutilizable el sistema. La evaluación puede usar estas colecciones seguras.
const coleccionesBorrables = [
  'clientes',
  'proveedores',
  'cortes',
  'ventas',
  'inventario_lotes',
  'mermas',
  'historial_regional',
  'lecturas_refrigeracion'
];

async function obtenerResumen() {
  const resumen = {};
  for (const [nombre, Model] of Object.entries(modelos)) {
    resumen[nombre] = await Model.countDocuments();
  }
  return resumen;
}

async function eliminarAleatorio(nombreColeccion) {
  if (!coleccionesBorrables.includes(nombreColeccion)) {
    const error = new Error(`La colección ${nombreColeccion} no se puede borrar desde la página`);
    error.statusCode = 400;
    throw error;
  }

  const Model = modelos[nombreColeccion];
  const documentos = await Model.aggregate([
    { $sample: { size: 1 } },
    { $project: { _id: 1, id: 1, nombre: 1, folio: 1, corte: 1 } }
  ]);

  if (!documentos.length) {
    const error = new Error(`La colección ${nombreColeccion} no tiene documentos para eliminar`);
    error.statusCode = 404;
    throw error;
  }

  const documento = documentos[0];
  const resultado = await Model.deleteOne({ _id: documento._id });
  if (!resultado.deletedCount) {
    const error = new Error('No se pudo eliminar el documento seleccionado');
    error.statusCode = 409;
    throw error;
  }

  return {
    coleccion: nombreColeccion,
    id: documento.id || documento.folio || documento._id,
    descripcion: documento.nombre || documento.corte || documento.folio || 'Documento MongoDB'
  };
}

async function crearIndices() {
  const indices = {};
  for (const [nombre, Model] of Object.entries(modelos)) {
    await Model.createIndexes();
    indices[nombre] = (await Model.listIndexes()).map(indice => indice.name);
  }
  return indices;
}

module.exports = {
  modelos,
  coleccionesBorrables,
  obtenerResumen,
  eliminarAleatorio,
  crearIndices
};
