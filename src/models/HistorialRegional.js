const mongoose = require('mongoose');

const HistorialRegionalSchema = new mongoose.Schema({
  anio: { type: Number, required: true },
  mes: { type: Number, required: true, min: 1, max: 12 },
  region_id: { type: Number, required: true },
  region: { type: String, required: true },
  corte_id: { type: Number, required: true },
  corte: { type: String, required: true },
  tipo_carne: { 
    type: String, 
    required: true,
    enum: ['res', 'cerdo', 'pollo', 'cordero', 'embutido']
  },
  kg_vendidos: { type: Number, default: 0, min: 0 },
  ingresos: { type: Number, default: 0, min: 0 },
  num_ventas: { type: Number, default: 0, min: 0 },
  kg_merma: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true,
  collection: 'historial_regional'
});

HistorialRegionalSchema.index({ anio: 1, mes: 1, region_id: 1, corte_id: 1 }, { unique: true });
HistorialRegionalSchema.index({ region_id: 1, anio: 1, mes: 1 });
HistorialRegionalSchema.index({ tipo_carne: 1 });

module.exports = mongoose.model('HistorialRegional', HistorialRegionalSchema);
