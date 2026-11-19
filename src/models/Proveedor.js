const mongoose = require('mongoose');

const ProveedorSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, min: 1 },
  nombre: { type: String, required: true, trim: true },
  contacto: { type: String, trim: true },
  telefono: { type: String, trim: true },
  activo: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'proveedores'
});

module.exports = mongoose.model('Proveedor', ProveedorSchema);
