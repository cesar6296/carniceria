const mongoose = require('mongoose');

const ItemVentaSchema = new mongoose.Schema({
  corte_id: { type: Number, required: true },
  corte: { type: String, required: true },
  tipo_carne: { 
    type: String, 
    required: true,
    enum: ['res', 'cerdo', 'pollo', 'cordero', 'embutido']
  },
  kg: { type: Number, required: true, min: 0.01 },
  precio_kg: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const VentaSchema = new mongoose.Schema({
  folio: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    index: true 
  },
  fecha_venta: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  cliente: {
    id: { type: Number, required: true },
    nombre: { type: String, required: true },
    tipo: { 
      type: String, 
      required: true,
      enum: ['mostrador', 'restaurante', 'mayorista'] 
    },
    ciudad: { type: String, trim: true },
    pais: { type: String, trim: true },
    ubicacion: {
      ciudad: { type: String, trim: true },
      pais: { type: String, trim: true },
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
      precision: { type: String, enum: ['coordenadas_proporcionadas', 'ciudad', 'pais', 'sin_ubicacion'] }
    }
  },
  sucursal: {
    id: { type: Number, required: true },
    nombre: { type: String, required: true },
    region_id: { type: Number, required: true },
    region: { type: String, required: true }
  },
  items: { 
    type: [ItemVentaSchema], 
    validate: [v => v.length > 0, 'La venta debe contener al menos un producto'] 
  },
  pago: {
    metodo: { 
      type: String, 
      required: true, 
      enum: ['efectivo', 'tarjeta', 'transferencia'] 
    },
    total: { type: Number, required: true, min: 0 }
  },
  estatus: { 
    type: String, 
    required: true, 
    enum: ['completada', 'cancelada'], 
    default: 'completada' 
  }
}, {
  timestamps: true,
  collection: 'ventas'
});

VentaSchema.index({ fecha_venta: -1 });
VentaSchema.index({ 'sucursal.region_id': 1, fecha_venta: -1 });
VentaSchema.index({ 'items.corte_id': 1 });
VentaSchema.index({ estatus: 1, fecha_venta: -1 });
VentaSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Venta', VentaSchema);
