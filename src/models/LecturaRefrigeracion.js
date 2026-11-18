const mongoose = require('mongoose');

const LecturaRefrigeracionSchema = new mongoose.Schema({
  fecha: { type: Date, required: true, default: Date.now },
  sucursal_id: { type: Number, required: true },
  camara: { type: String, required: true },
  temperatura_c: { type: Number, required: true },
  alerta: { type: Boolean, default: false }
}, {
  collection: 'lecturas_refrigeracion'
});

LecturaRefrigeracionSchema.index({ sucursal_id: 1, fecha: -1 });

module.exports = mongoose.model('LecturaRefrigeracion', LecturaRefrigeracionSchema);

