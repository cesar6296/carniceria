const mongoose = require('mongoose');

const SucursalSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, min: 1 },
  nombre: { type: String, required: true, trim: true },
  ciudad: { type: String, required: true, trim: true },
  estado: { type: String, required: true, trim: true },
  region_id: { type: Number, required: true, min: 1, index: true },
  region_nombre: { type: String, required: true, trim: true },
  activa: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'sucursales'
});

SucursalSchema.index({ region_id: 1, activa: 1 });

module.exports = mongoose.model('Sucursal', SucursalSchema);
