const mongoose = require('mongoose');

const InventarioLoteSchema = new mongoose.Schema({
  corte_id: { type: Number, required: true },
  corte: { type: String, required: true },
  sucursal_id: { type: Number, required: true },
  proveedor_id: { type: Number, required: true },
  kg_iniciales: { type: Number, required: true, min: 0.1 },
  kg_disponibles: { type: Number, required: true, min: 0 },
  costo_kg: { type: Number, required: true, min: 0 },
  fecha_entrada: { type: Date, default: Date.now },
  fecha_caducidad: { type: Date, required: true },
  estatus: { 
    type: String, 
    required: true, 
    enum: ['activo', 'agotado', 'vencido'], 
    default: 'activo' 
  }
}, {
  timestamps: true,
  collection: 'inventario_lotes'
});

InventarioLoteSchema.index({ sucursal_id: 1, corte_id: 1, fecha_caducidad: 1 });
InventarioLoteSchema.index({ estatus: 1, fecha_caducidad: 1 });

module.exports = mongoose.model('InventarioLote', InventarioLoteSchema);
