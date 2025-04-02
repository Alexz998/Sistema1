const mongoose = require('mongoose');

const metaSchema = new mongoose.Schema({
  mes: {
    type: Number,
    required: true
  },
  ano: {
    type: Number,
    required: true
  },
  metaVendas: {
    type: Number,
    required: true,
    default: 0
  },
  metaProdutos: {
    type: Number,
    required: true,
    default: 0
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  }
});

// Índice composto para garantir uma meta única por mês/ano
metaSchema.index({ mes: 1, ano: 1 }, { unique: true });

module.exports = mongoose.model('Meta', metaSchema); 