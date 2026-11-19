const Usuario = require('../models/Usuario');

async function asegurarAdministrador() {
  const usuario = process.env.ADMIN_USERNAME || 'uzielitoremix';
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash) return null;

  const ultimo = await Usuario.findOne().sort({ id: -1 }).select({ id: 1 }).lean();
  return Usuario.findOneAndUpdate(
    { usuario },
    {
      $setOnInsert: {
        id: (ultimo?.id || 0) + 1,
        nombre: process.env.ADMIN_DISPLAY_NAME || 'Administrador',
        usuario,
        password_hash: passwordHash,
        rol: 'admin',
        activo: true
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).select('+password_hash').lean();
}

async function buscarPorUsuario(usuario) {
  return Usuario.findOne({ usuario, activo: true }).select('+password_hash').lean();
}

module.exports = { asegurarAdministrador, buscarPorUsuario };
