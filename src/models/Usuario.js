const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, min: 1 },
  nombre: { type: String, required: true, trim: true },
  usuario: { type: String, required: true, trim: true, unique: true, index: true },
  correo: { type: String, trim: true, lowercase: true },
  telefono: { type: String, trim: true, maxlength: 30 },
  foto: { type: String, trim: true, maxlength: 450000 },
  password_hash: { type: String, required: true, select: false },
  rol: { type: String, required: true, enum: ['admin', 'cajero', 'supervisor'], default: 'admin' },
  activo: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'usuarios'
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
