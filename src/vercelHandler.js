const mongoose = require('mongoose');
const app = require('./app');
const { conectarMongoDB, obtenerUltimoErrorMongo } = require('./config/mongo');
const { ocultarCredenciales, pistaParaError, apuntaALocalhost } = require('./utils/mongoDiagnostico');

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

// Quita usuario y contraseña de cualquier URI que aparezca en un mensaje de error.
// Adaptador para Vercel Functions. Mantiene una sola conexión por instancia cálida.
module.exports = async function handler(req, res) {
  const esApi = Boolean(req.url) && req.url.startsWith('/api');

  if (esApi) {
    const mongoListo = await asegurarMongo();

    // /api/salud siempre responde para poder diagnosticar el despliegue.
    if (!mongoListo && !req.url.startsWith('/api/salud')) {
      const uri = process.env.MONGODB_URI || '';
      const detalle = ocultarCredenciales(obtenerUltimoErrorMongo());
      const cuerpo = JSON.stringify({
        ok: false,
        codigo: 'MONGODB_NO_DISPONIBLE',
        mensaje: `No se pudo conectar a MongoDB. ${pistaParaError(detalle, Boolean(uri), apuntaALocalhost(uri))}`,
        detalle: detalle || 'Sin detalle adicional'
      });
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(cuerpo);
      return;
    }
  }

  return app(req, res);
};
