// Utilidades para explicar en lenguaje claro por qué falló MongoDB en producción.

// Quita usuario y contraseña de cualquier URI que aparezca en un mensaje de error.
function ocultarCredenciales(texto) {
  if (!texto) return '';
  return texto
    .replace(/mongodb(\+srv)?:\/\/[^\s"']+/g, 'mongodb$1://***')
    .replace(/\s+/g, ' ')
    .slice(0, 240);
}

function apuntaALocalhost(uri) {
  return /^mongodb(\+srv)?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(uri || '');
}

// Traduce el error real de Mongoose a una pista accionable.
function pistaParaError(detalle, tieneUri, usaLocalhost = false) {
  const texto = (detalle || '').toLowerCase();

  if (!tieneUri || texto.includes('no está configurada')) {
    return 'Falta MONGODB_URI en Vercel. Agrégala en Settings > Environment Variables (Production, Preview y Development) y vuelve a desplegar.';
  }
  if (usaLocalhost) {
    return 'Tu MONGODB_URI apunta a localhost, y en Vercel no existe un MongoDB local. Usa la URI de MongoDB Atlas (mongodb+srv://...).';
  }
  if (texto.includes('<password>') || texto.includes('<usuario>') || texto.includes('<user>')) {
    return 'La URI todavía tiene los marcadores <password>/<usuario>. Reemplázalos por los datos reales de tu usuario de Atlas.';
  }
  if (texto.includes('bad auth') || texto.includes('authentication failed') || texto.includes('auth failed')) {
    return 'Usuario o contraseña de Atlas incorrectos. Si la contraseña tiene símbolos (@ : / # ? %), escríbelos codificados en la URI (por ejemplo @ = %40).';
  }
  if (texto.includes('enotfound') || texto.includes('querysrv') || texto.includes('getaddrinfo')) {
    return 'El host de la URI no existe o está mal escrito. Cópiala de nuevo desde Atlas > Connect > Drivers.';
  }
  if (
    texto.includes('econnrefused') ||
    texto.includes('etimedout') ||
    texto.includes('whitelist') ||
    texto.includes('could not connect')
  ) {
    return 'MongoDB Atlas está bloqueando la conexión. Ve a Network Access y agrega la IP 0.0.0.0/0 (permite todas).';
  }
  return 'Revisa MONGODB_URI y la lista de IP permitidas en MongoDB Atlas.';
}

module.exports = { ocultarCredenciales, pistaParaError, apuntaALocalhost };
