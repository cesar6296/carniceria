const mongoose = require('mongoose');
require('dotenv').config();

let mongoServerInstance = null;
let ultimoError = null;
let conexionEnCurso = null;

function esProduccion() {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

async function iniciarMongoEnMemoria() {
  // Solo se usa en desarrollo/local. En producción no se permite MongoDB en memoria.
  const { MongoMemoryServer } = require('mongodb-memory-server');
  if (!mongoServerInstance) {
    mongoServerInstance = await MongoMemoryServer.create();
  }
  await mongoose.connect(mongoServerInstance.getUri(), {
    autoIndex: true,
    bufferCommands: false
  });
  ultimoError = null;
  console.log('Motor MongoDB en memoria listo');
  return mongoose.connection;
}

async function conectarMongoDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return mongoose.connection;
  }
  if (conexionEnCurso) return conexionEnCurso;

  conexionEnCurso = (async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      if (esProduccion()) {
        throw new Error('MONGODB_URI no está configurada en las variables de entorno');
      }
      return iniciarMongoEnMemoria();
    }

    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        autoIndex: process.env.MONGO_AUTO_INDEX !== 'false' && !esProduccion(),
        bufferCommands: false,
        maxPoolSize: 10
      });
      ultimoError = null;
      console.log('Conectado a MongoDB');
      return mongoose.connection;
    } catch (error) {
      ultimoError = error;
      if (esProduccion()) {
        throw new Error(`No se pudo conectar a MongoDB: ${error.message}`);
      }
      console.warn('MongoDB no disponible, usando memoria local:', error.message);
      return iniciarMongoEnMemoria();
    }
  })();

  try {
    return await conexionEnCurso;
  } finally {
    conexionEnCurso = null;
  }
}

async function desconectarMongoDB() {
  await mongoose.disconnect();
  if (mongoServerInstance) {
    await mongoServerInstance.stop();
    mongoServerInstance = null;
  }
  ultimoError = null;
  conexionEnCurso = null;
}

function probarConexionMongo() {
  const estado = mongoose.connection.readyState;
  return {
    estado: estado === 1 ? 'ok' : 'desconectado',
    codigo: estado,
    tipo: mongoServerInstance ? 'mongodb-memory' : 'mongodb-cluster',
    ...(ultimoError ? { mensaje: ultimoError.message } : {})
  };
}

module.exports = {
  conectarMongoDB,
  desconectarMongoDB,
  probarConexionMongo
};
