const mongoose = require('mongoose');

const despesaSchema = new mongoose.Schema({
  data: {
    type: Date,
    required: [true, 'A data é obrigatória']
  },
  categoria: {
    type: String,
    required: [true, 'A categoria é obrigatória']
  },
  valor: {
    type: Number,
    required: [true, 'O valor é obrigatório'],
    min: [0, 'O valor não pode ser negativo']
  },
  formaPagamento: {
    type: String,
    required: [true, 'A forma de pagamento é obrigatória'],
    enum: {
      values: ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Transferência'],
      message: 'Forma de pagamento {VALUE} é inválida. Use: Dinheiro, Cartão de Crédito, Cartão de Débito, PIX ou Transferência'
    }
  },
  descricao: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Despesa', despesaSchema); 