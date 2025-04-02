const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  logo: {
    type: String,
    required: false
  },
  empresa: {
    nome: {
      type: String,
      default: 'Sistema Financeiro'
    },
    cnpj: String,
    endereco: String,
    telefone: String,
    email: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Config', configSchema); 