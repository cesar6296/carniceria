const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, min: 1 },
  nombre: { type: String, required: true, trim: true },
  tipo: {
    type: String,
    required: true,
    enum: ['mostrador', 'restaurante', 'mayorista'],
    default: 'mostrador'
  },
  telefono: { type: String, trim: true },
  correo: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
  ciudad: { type: String, trim: true },
  pais: { type: String, trim: true, default: 'México' },
  region_id: { type: Number, min: 1, index: true },
  region_nombre: { type: String, trim: true }
}, {
  timestamps: true,
  collection: 'clientes'
});

ClienteSchema.index({ tipo: 1 });

module.exports = mongoose.model('Cliente', ClienteSchema);
