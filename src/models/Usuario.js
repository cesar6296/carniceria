const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, min: 1 },
  nombre: { type: String, required: true, trim: true },
  usuario: { type: String, required: true, trim: true, unique: true, index: true },
  password_hash: { type: String, required: true, select: false },
  rol: { type: String, required: true, enum: ['admin', 'cajero', 'supervisor'], default: 'admin' },
  activo: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'usuarios'
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
