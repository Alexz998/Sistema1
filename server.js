const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const ptBR = require('date-fns/locale/pt-BR');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Conexão com o MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/sistema-financeiro', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Modelos
const Venda = require('./models/Venda');
const Despesa = require('./models/Despesa');
const Usuario = require('./models/Usuario');
const Cliente = require('./models/Cliente');
const Produto = require('./models/Produto');
const Config = require('./models/Config');
const Meta = require('./models/Meta');

// Middleware de autenticação
const auth = require('./middleware/auth');

// Configuração do nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Rotas de Autenticação
app.post('/api/auth/registro', async (req, res) => {
  try {
    const usuario = new Usuario(req.body);
    await usuario.save();
    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET);
    res.status(201).send({ token, user: usuario });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Criar usuário admin se não existir
app.post('/api/auth/criar-admin', async (req, res) => {
  try {
    const admin = await Usuario.findOne({ email: 'admin@admin.com' });
    if (!admin) {
      const novoAdmin = new Usuario({
        email: 'admin@admin.com',
        senha: 'admin123',
        nome: 'Administrador'
      });
      await novoAdmin.save();
      console.log('Usuário admin criado com sucesso');
      res.status(201).send({ message: 'Usuário admin criado com sucesso' });
    } else {
      console.log('Usuário admin já existe');
      res.status(200).send({ message: 'Usuário admin já existe' });
    }
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
    res.status(400).send(error);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    console.log('Tentativa de login:', { email }); // Log para debug
    
    const usuario = await Usuario.findOne({ email });
    
    if (!usuario) {
      console.log('Usuário não encontrado'); // Log para debug
      return res.status(401).send({ error: 'Credenciais inválidas' });
    }

    const isMatch = await usuario.compararSenha(senha);
    if (!isMatch) {
      console.log('Senha incorreta'); // Log para debug
      return res.status(401).send({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET);
    console.log('Login bem-sucedido'); // Log para debug
    res.send({ token, user: { id: usuario._id, email: usuario.email, nome: usuario.nome } });
  } catch (error) {
    console.error('Erro no login:', error); // Log para debug
    res.status(400).send(error);
  }
});

// Rota para verificar autenticação
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-senha');
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rotas para Clientes (protegidas)
app.post('/api/clientes', auth, async (req, res) => {
  try {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/clientes', auth, async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ nome: 1 });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/clientes/:id', auth, async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/clientes/:id', auth, async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/clientes/:id', auth, async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json({ message: 'Cliente removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rotas para Vendas (protegidas)
app.post('/api/vendas', auth, async (req, res) => {
  try {
    const vendaData = {
      ...req.body,
      data: req.body.data || new Date(),
      valor: req.body.valor || 0
    };

    // Validar se há itens na venda
    if (!vendaData.itens || vendaData.itens.length === 0) {
      return res.status(400).json({ message: 'A venda deve ter pelo menos um item' });
    }

    // Validar se todos os produtos existem
    for (const item of vendaData.itens) {
      const produto = await Produto.findById(item.produto);
      if (!produto) {
        return res.status(400).json({ message: `Produto não encontrado: ${item.produto}` });
      }
    }

    const venda = new Venda(vendaData);
    await venda.save();
    res.status(201).json(venda);
  } catch (error) {
    console.error('Erro ao salvar venda:', error);
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/vendas', auth, async (req, res) => {
  try {
    const vendas = await Venda.find()
      .populate('itens.produto', 'nome preco')
      .sort({ data: -1 });
    res.json(vendas);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/vendas/:id', auth, async (req, res) => {
  try {
    const vendaData = {
      ...req.body,
      data: req.body.data || new Date(),
      valor: req.body.valor || 0
    };

    // Validar se há itens na venda
    if (!vendaData.itens || vendaData.itens.length === 0) {
      return res.status(400).json({ message: 'A venda deve ter pelo menos um item' });
    }

    // Validar se todos os produtos existem
    for (const item of vendaData.itens) {
      const produto = await Produto.findById(item.produto);
      if (!produto) {
        return res.status(400).json({ message: `Produto não encontrado: ${item.produto}` });
      }
    }

    const venda = await Venda.findByIdAndUpdate(
      req.params.id,
      vendaData,
      { new: true }
    );

    if (!venda) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    res.json(venda);
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/vendas/:id', auth, async (req, res) => {
  try {
    const venda = await Venda.findByIdAndDelete(req.params.id);
    if (!venda) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }
    res.json({ message: 'Venda excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rotas para Despesas (protegidas)
app.post('/api/despesas', auth, async (req, res) => {
  try {
    console.log('=== INÍCIO DA REQUISIÇÃO POST /api/despesas ===');
    console.log('Dados recebidos:', JSON.stringify(req.body, null, 2));
    
    // Validar campos obrigatórios
    const { data, categoria, valor, formaPagamento } = req.body;
    console.log('Campos extraídos:', {
      data,
      categoria,
      valor,
      formaPagamento,
      descricao: req.body.descricao
    });

    if (!data || !categoria || !valor || !formaPagamento) {
      console.log('Campos obrigatórios faltando:', {
        temData: !!data,
        temCategoria: !!categoria,
        temValor: !!valor,
        temFormaPagamento: !!formaPagamento
      });
      return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    // Criar a despesa
    const despesa = new Despesa({
      data: new Date(data),
      categoria,
      valor: Number(valor),
      formaPagamento,
      descricao: req.body.descricao || ''
    });

    console.log('Despesa criada (antes de salvar):', despesa);
    console.log('Validando despesa...');
    
    // Validar manualmente
    const validationError = despesa.validateSync();
    if (validationError) {
      console.error('Erro de validação:', validationError);
      const mensagensErro = Object.values(validationError.errors).map(err => err.message);
      console.error('Mensagens de erro:', mensagensErro);
      return res.status(400).json({ 
        message: 'Erro de validação', 
        errors: mensagensErro
      });
    }

    // Tentar salvar
    await despesa.save();
    console.log('Despesa salva com sucesso:', despesa);
    console.log('=== FIM DA REQUISIÇÃO POST /api/despesas ===');
    
    res.status(201).json(despesa);
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    if (error.name === 'ValidationError') {
      const mensagensErro = Object.values(error.errors).map(err => err.message);
      console.error('Mensagens de erro de validação:', mensagensErro);
      return res.status(400).json({ 
        message: 'Erro de validação', 
        errors: mensagensErro
      });
    }
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/despesas', auth, async (req, res) => {
  try {
    const despesas = await Despesa.find();
    res.json(despesas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rota para excluir despesa
app.delete('/api/despesas/:id', auth, async (req, res) => {
  try {
    console.log('Recebendo requisição para excluir despesa');
    console.log('ID da despesa:', req.params.id);
    console.log('Headers:', req.headers);
    
    const despesa = await Despesa.findById(req.params.id);
    
    if (!despesa) {
      console.log('Despesa não encontrada');
      return res.status(404).json({ message: 'Despesa não encontrada' });
    }

    const resultado = await Despesa.findByIdAndDelete(req.params.id);
    console.log('Resultado da exclusão:', resultado);
    
    if (resultado) {
      console.log('Despesa excluída com sucesso');
      res.json({ message: 'Despesa excluída com sucesso' });
    } else {
      console.log('Erro ao excluir despesa - não encontrada após verificação inicial');
      res.status(404).json({ message: 'Despesa não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao excluir despesa:', error);
    res.status(500).json({ message: error.message });
  }
});

// Rotas para Produtos (protegidas)
app.post('/api/produtos', auth, async (req, res) => {
  try {
    const produto = new Produto(req.body);
    await produto.save();
    res.status(201).json(produto);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/produtos', auth, async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ nome: 1 });
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/produtos/:id', auth, async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/produtos/:id', auth, async (req, res) => {
  try {
    const produto = await Produto.findByIdAndDelete(req.params.id);
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rotas para Configurações (protegidas)
app.get('/api/config/logo', auth, async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
      await config.save();
    }
    res.json({ logo: config.logo });
  } catch (error) {
    console.error('Erro ao buscar logo:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/config/logo', auth, multer({ storage: multer.memoryStorage() }).single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    // Converter a imagem para base64
    const logoBase64 = req.file.buffer.toString('base64');

    let config = await Config.findOne();
    if (!config) {
      config = new Config();
    }

    config.logo = logoBase64;
    await config.save();

    res.json({ message: 'Logo atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar logo:', error);
    res.status(500).json({ message: error.message });
  }
});

// Rota para recuperar senha
app.post('/api/auth/recuperar-senha', async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Gerar token de recuperação
    const token = crypto.randomBytes(32).toString('hex');
    usuario.tokenRecuperacao = token;
    usuario.tokenRecuperacaoExpiracao = Date.now() + 3600000; // 1 hora
    await usuario.save();

    // Enviar email
    const resetUrl = `http://localhost:3000/reset-senha/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperação de Senha',
      html: `
        <h1>Recuperação de Senha</h1>
        <p>Você solicitou a recuperação de senha. Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
      `
    });

    res.json({ message: 'Email de recuperação enviado com sucesso' });
  } catch (error) {
    console.error('Erro ao recuperar senha:', error);
    res.status(500).json({ message: error.message });
  }
});

// Rota para alterar senha
app.post('/api/auth/alterar-senha', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    const usuario = await Usuario.findOne({
      tokenRecuperacao: token,
      tokenRecuperacaoExpiracao: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    usuario.senha = novaSenha;
    usuario.tokenRecuperacao = undefined;
    usuario.tokenRecuperacaoExpiracao = undefined;
    await usuario.save();

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: error.message });
  }
});

// Rotas de Metas
app.get('/api/metas/:mes/:ano', async (req, res) => {
  try {
    const { mes, ano } = req.params;
    let meta = await Meta.findOne({ mes: Number(mes), ano: Number(ano) });
    
    if (!meta) {
      // Se não existir meta, criar uma com valores padrão
      meta = await Meta.create({
        mes: Number(mes),
        ano: Number(ano),
        metaVendas: 0,
        metaProdutos: 0
      });
    }
    
    res.json(meta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/metas', async (req, res) => {
  try {
    const { mes, ano, metaVendas, metaProdutos } = req.body;
    
    const meta = await Meta.findOneAndUpdate(
      { mes: Number(mes), ano: Number(ano) },
      { metaVendas, metaProdutos },
      { new: true, upsert: true }
    );
    
    res.json(meta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rota para buscar vendas mensais
app.get('/api/vendas/mensais/:mes/:ano', async (req, res) => {
  try {
    const { mes, ano } = req.params;
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0);
    
    // Buscar vendas dos últimos 6 meses
    const vendas = await Venda.find({
      data: {
        $gte: new Date(ano, mes - 6, 1),
        $lte: dataFim
      }
    });

    // Agrupar por mês
    const vendasMensais = vendas.reduce((acc, venda) => {
      const mesVenda = venda.data.getMonth() + 1;
      const anoVenda = venda.data.getFullYear();
      const chave = `${mesVenda}/${anoVenda}`;
      
      if (!acc[chave]) {
        acc[chave] = {
          mes: mesVenda,
          ano: anoVenda,
          total: 0
        };
      }
      
      acc[chave].total += Number(venda.valor);
      return acc;
    }, {});

    res.json(Object.values(vendasMensais));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rota para buscar produtos vendidos mensais
app.get('/api/vendas/produtos/mensais/:mes/:ano', async (req, res) => {
  try {
    const { mes, ano } = req.params;
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0);
    
    // Buscar vendas dos últimos 6 meses
    const vendas = await Venda.find({
      data: {
        $gte: new Date(ano, mes - 6, 1),
        $lte: dataFim
      }
    });

    // Agrupar por mês
    const produtosMensais = vendas.reduce((acc, venda) => {
      const mesVenda = venda.data.getMonth() + 1;
      const anoVenda = venda.data.getFullYear();
      const chave = `${mesVenda}/${anoVenda}`;
      
      if (!acc[chave]) {
        acc[chave] = {
          mes: mesVenda,
          ano: anoVenda,
          total: 0
        };
      }
      
      // Somar quantidade de produtos
      acc[chave].total += venda.itens.reduce((total, item) => total + item.quantidade, 0);
      return acc;
    }, {});

    res.json(Object.values(produtosMensais));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rota para Dashboard
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    console.log('Iniciando busca de dados da dashboard...');

    // Buscar todas as vendas e despesas
    const vendas = await Venda.find()
      .sort({ data: -1 })
      .select('data cliente valor')
      .limit(10);

    const despesas = await Despesa.find()
      .sort({ data: -1 })
      .select('data descricao valor')
      .limit(10);

    console.log('Vendas encontradas:', vendas.length);
    console.log('Despesas encontradas:', despesas.length);

    // Calcular totais
    const totalVendas = vendas.reduce((acc, v) => acc + (v.valor || 0), 0);
    const totalDespesas = despesas.reduce((acc, d) => acc + (d.valor || 0), 0);

    // Formatar dados para resposta
    const response = {
      resumo: {
        totalVendas,
        totalDespesas,
        saldo: totalVendas - totalDespesas
      },
      ultimasVendas: vendas.map(v => ({
        id: v._id,
        data: format(v.data, 'dd/MM/yyyy', { locale: ptBR }),
        descricao: v.cliente || 'Cliente não informado',
        valor: v.valor || 0
      })),
      ultimasDespesas: despesas.map(d => ({
        id: d._id,
        data: format(d.data, 'dd/MM/yyyy', { locale: ptBR }),
        descricao: d.descricao || 'Descrição não informada',
        valor: d.valor || 0
      }))
    };

    console.log('Resposta formatada:', response);
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar dados da dashboard:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar dados da dashboard',
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 