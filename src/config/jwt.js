require('dotenv').config();

const esProduccion = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

const JWT_SECRET = process.env.JWT_SECRET || (esProduccion ? null : 'carniceria_dev_secret_2026');

// Se valida al momento de usarlo (no al importar) para que el arranque y el
// endpoint /api/salud sigan funcionando y el error real se vea en el login.
function obtenerJwtSecret() {
  if (!JWT_SECRET) {
    const error = new Error(
      'Falta la variable de entorno JWT_SECRET. Agrégala en Vercel (Project Settings > Environment Variables) o en tu archivo .env.'
    );
    error.statusCode = 503;
    error.codigo = 'JWT_SECRET_FALTANTE';
    throw error;
  }
  return JWT_SECRET;
}

module.exports = { JWT_SECRET, obtenerJwtSecret, esProduccion };
