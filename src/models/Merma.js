const mongoose = require('mongoose');

const MermaSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now, index: true },
  sucursal: {
    id: { type: Number, required: true },
    nombre: { type: String, required: true },
    region_id: { type: Number, required: true },
    region: { type: String, required: true }
  },
  corte_id: { type: Number, required: true, index: true },
  corte: { type: String, required: true },
  lote_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InventarioLote', required: true },
  kg: { type: Number, required: true, min: 0.01 },
  motivo: {
    type: String,
    required: true,
    enum: ['caducidad', 'mal_corte', 'descongelado', 'contaminacion', 'otro']
  },
  costo_perdido: { type: Number, required: true, min: 0 },
  notas: { type: String, trim: true }
}, {
  timestamps: true,
  collection: 'mermas'
});

MermaSchema.index({ 'sucursal.id': 1, fecha: -1 });
MermaSchema.index({ motivo: 1 });

module.exports = mongoose.model('Merma', MermaSchema);
