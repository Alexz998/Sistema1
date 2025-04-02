const mongoose = require('mongoose');

const vendaSchema = new mongoose.Schema({
  data: {
    type: Date,
    default: Date.now
  },
  cliente: {
    type: String,
    required: true
  },
  valor: {
    type: Number,
    required: true
  },
  formaPagamento: {
    type: String,
    required: true,
    enum: ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Transferência']
  },
  status: {
    type: String,
    required: true,
    enum: ['Pendente', 'Entregue', 'Acertado'],
    default: 'Pendente'
  },
  observacoes: {
    type: String
  },
  itens: [{
    produto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Produto',
      required: true
    },
    quantidade: {
      type: Number,
      required: true,
      min: 1
    },
    preco: {
      type: Number,
      required: true,
      min: 0
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Venda', vendaSchema); 