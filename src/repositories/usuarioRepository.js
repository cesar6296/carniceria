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

async function obtenerPerfilPorId(id) {
  return Usuario.findOne({ id, activo: true })
    .select({ _id: 0, id: 1, nombre: 1, usuario: 1, rol: 1, correo: 1, telefono: 1, foto: 1, createdAt: 1, updatedAt: 1 })
    .lean();
}

async function actualizarPerfil(id, datos) {
  return Usuario.findOneAndUpdate(
    { id, activo: true },
    {
      $set: {
        nombre: datos.nombre,
        correo: datos.correo || undefined,
        telefono: datos.telefono || undefined,
        foto: datos.foto || undefined
      }
    },
    { new: true, runValidators: true }
  )
    .select({ _id: 0, id: 1, nombre: 1, usuario: 1, rol: 1, correo: 1, telefono: 1, foto: 1, createdAt: 1, updatedAt: 1 })
    .lean();
}

module.exports = {
  asegurarAdministrador,
  buscarPorUsuario,
  obtenerPerfilPorId,
  actualizarPerfil
};
