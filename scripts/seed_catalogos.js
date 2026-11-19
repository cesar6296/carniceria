require('dotenv').config();

const mongoose = require('mongoose');
const { conectarMongoDB, desconectarMongoDB, probarConexionMongo } = require('../src/config/mongo');
const CatalogoRepository = require('../src/repositories/catalogoRepository');
const UsuarioRepository = require('../src/repositories/usuarioRepository');

async function ejecutar() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Configura MONGODB_URI apuntando a MongoDB Atlas antes de cargar los catálogos.');
  }

  await conectarMongoDB();
  if (probarConexionMongo().tipo === 'mongodb-memory') {
    throw new Error('Se conectó a MongoDB temporal. Revisa MONGODB_URI antes de continuar.');
  }

  const conteo = await CatalogoRepository.sembrarCatalogos();
  await UsuarioRepository.asegurarAdministrador();
  console.log('Catálogos cargados en MongoDB sin borrar datos operativos:');
  console.log(JSON.stringify(conteo, null, 2));
}

ejecutar()
  .catch(error => {
    console.error('No se pudieron cargar los catálogos:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    await desconectarMongoDB().catch(() => {});
  });
