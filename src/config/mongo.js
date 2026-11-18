const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

let mongoServerInstance = null;

async function conectarMongoDB() {
  const URI_CONFIGURADA = process.env.MONGODB_URI;

  try {
    await mongoose.connect(URI_CONFIGURADA, {
      serverSelectionTimeoutMS: 2000,
      autoIndex: true
    });
    console.log('Conectado a MongoDB');
  } catch (error) {
    try {
      mongoServerInstance = await MongoMemoryServer.create();
      const mongoUriEnMemoria = mongoServerInstance.getUri();
      await mongoose.connect(mongoUriEnMemoria, { autoIndex: true });
      console.log('Motor MongoDB listo');
    } catch (memError) {
      console.error(memError.message);
    }
  }
}

async function desconectarMongoDB() {
  await mongoose.disconnect();
  if (mongoServerInstance) {
    await mongoServerInstance.stop();
  }
}

function probarConexionMongo() {
  const estado = mongoose.connection.readyState;
  return {
    estado: estado === 1 ? 'ok' : 'desconectado',
    codigo: estado,
    tipo: mongoServerInstance ? 'mongodb-memory' : 'mongodb-cluster'
  };
}

module.exports = {
  conectarMongoDB,
  desconectarMongoDB,
  probarConexionMongo
};
