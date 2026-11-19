const mongoose = require('mongoose');

const RegionSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, min: 1 },
  nombre: { type: String, required: true, trim: true, unique: true }
}, {
  timestamps: true,
  collection: 'regiones'
});

module.exports = mongoose.model('Region', RegionSchema);
