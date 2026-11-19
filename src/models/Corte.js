const mongoose = require('mongoose');

const CorteSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, min: 1 },
  nombre: { type: String, required: true, trim: true, unique: true },
  tipo_carne: {
    type: String,
    required: true,
    enum: ['res', 'cerdo', 'pollo', 'cordero', 'embutido']
  },
  precio_kg: { type: Number, required: true, min: 0.01 },
  activo: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'cortes'
});

CorteSchema.index({ tipo_carne: 1, activo: 1 });

module.exports = mongoose.model('Corte', CorteSchema);
