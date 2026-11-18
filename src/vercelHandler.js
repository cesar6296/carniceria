const mongoose = require('mongoose');
const app = require('./app');
const { conectarMongoDB } = require('./config/mongo');

let intentoMongo = null;
let errorReportado = false;

async function asegurarMongo() {
  if (mongoose.connection.readyState === 1) return true;
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise().catch(() => {});
    return mongoose.connection.readyState === 1;
  }

  if (!intentoMongo) {
    intentoMongo = conectarMongoDB()
      .catch((error) => {
        if (!errorReportado) {
          errorReportado = true;
          console.error('MongoDB no disponible:', error.message);
        }
      })
      .finally(() => {
        intentoMongo = null;
      });
  }

  await intentoMongo;
  return mongoose.connection.readyState === 1;
}

// Adaptador para Vercel Functions. Mantiene una sola conexión por instancia cálida.
module.exports = async function handler(req, res) {
  const esApi = Boolean(req.url) && req.url.startsWith('/api');

  if (esApi) {
    const mongoListo = await asegurarMongo();
    // /api/salud siempre responde para poder diagnosticar el despliegue.
    if (!mongoListo && !req.url.startsWith('/api/salud')) {
      const cuerpo = JSON.stringify({
        ok: false,
        codigo: 'MONGODB_NO_DISPONIBLE',
        mensaje:
          'No se pudo conectar a MongoDB. Revisa la variable MONGODB_URI y la lista de IP permitidas en MongoDB Atlas.'
      });
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(cuerpo);
      return;
    }
  }

  return app(req, res);
};
