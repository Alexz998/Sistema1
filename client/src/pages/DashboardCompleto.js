import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Button,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5002/api';

function DashboardCompleto() {
  // Estados da Dashboard
  const [vendas, setVendas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  // Estados das Metas
  const [meta, setMeta] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    metaVendas: 0,
    metaProdutos: 0
  });
  const [vendasMensais, setVendasMensais] = useState([]);
  const [produtosMensais, setProdutosMensais] = useState([]);
  const [despesasGrafico, setDespesasGrafico] = useState([]);

  useEffect(() => {
    fetchData();
    fetchMetaAtual();
    fetchDadosMensais();
  }, []);

  useEffect(() => {
    console.log('Data Inicial:', dataInicial);
    console.log('Data Final:', dataFinal);
    if (dataInicial && dataFinal) {
      fetchData();
    }
  }, [dataInicial, dataFinal]);

  // Funções da Dashboard
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [vendasRes, despesasRes] = await Promise.all([
        axios.get(`${API_URL}/vendas`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        axios.get(`${API_URL}/despesas`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);
      
      const vendasFormatadas = vendasRes.data.map(venda => ({
        ...venda,
        id: venda._id,
        descricao: venda.observacoes || '',
        itens: venda.itens.map(item => ({
          ...item,
          nomeProduto: item.produto?.nome || 'Produto não encontrado',
          quantidade: item.quantidade || 0
        }))
      }));
      
      const despesasFormatadas = despesasRes.data.map(despesa => ({
        ...despesa,
        id: despesa._id,
        descricao: despesa.descricao || '',
        categoria: despesa.categoria || 'Sem categoria'
      }));

      setVendas(vendasFormatadas);
      setDespesas(despesasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Funções das Metas
  const fetchMetaAtual = async () => {
    try {
      const hoje = new Date();
      const mes = hoje.getMonth() + 1;
      const ano = hoje.getFullYear();
      
      const response = await axios.get(`${API_URL}/metas/${mes}/${ano}`);
      setMeta(response.data);
      setFormData({
        metaVendas: response.data.metaVendas,
        metaProdutos: response.data.metaProdutos
      });
    } catch (error) {
      console.error('Erro ao buscar meta:', error);
    }
  };

  const fetchDadosMensais = async () => {
    try {
      const hoje = new Date();
      const mes = hoje.getMonth() + 1;
      const ano = hoje.getFullYear();
      
      const [responseVendas, responseProdutos, responseDespesas] = await Promise.all([
        axios.get(`${API_URL}/vendas/mensais/${mes}/${ano}`),
        axios.get(`${API_URL}/vendas/produtos/mensais/${mes}/${ano}`),
        axios.get(`${API_URL}/despesas`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      // Formatar dados de vendas mensais
      const vendasMensaisFormatadas = responseVendas.data.map(item => ({
        ...item,
        totalFormatado: `R$ ${item.total.toFixed(2)}`
      }));
      
      // Formatar dados de produtos mensais
      const produtosMensaisFormatados = responseProdutos.data.map(item => ({
        ...item,
        nome: 'Quantidade',
        totalFormatado: `${item.total} unidades`
      }));

      // Agrupar despesas por categoria
      const despesasPorCategoria = responseDespesas.data.reduce((acc, despesa) => {
        const categoria = despesa.categoria || 'Sem categoria';
        acc[categoria] = (acc[categoria] || 0) + Number(despesa.valor);
        return acc;
      }, {});

      // Formatar dados para o gráfico de pizza
      const despesasFormatadas = Object.entries(despesasPorCategoria).map(([categoria, valor]) => ({
        categoria,
        valor,
        valorFormatado: `R$ ${valor.toFixed(2)}`
      }));

      setVendasMensais(vendasMensaisFormatadas);
      setProdutosMensais(produtosMensaisFormatados);
      setDespesasGrafico(despesasFormatadas);
    } catch (error) {
      console.error('Erro ao buscar dados mensais:', error);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    try {
      const hoje = new Date();
      const mes = hoje.getMonth() + 1;
      const ano = hoje.getFullYear();

      await axios.post(`${API_URL}/metas`, {
        mes,
        ano,
        ...formData
      });

      toast.success('Meta atualizada com sucesso!');
      handleCloseDialog();
      fetchMetaAtual();
    } catch (error) {
      toast.error('Erro ao atualizar meta');
      console.error('Erro:', error);
    }
  };

  const calcularProgresso = (atual, meta) => {
    return meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
  };

  // Funções de filtro e cálculos da Dashboard
  const filtrarPorPeriodo = (items) => {
    if (!dataInicial || !dataFinal) return items;
    
    try {
      const dataInicialObj = new Date(dataInicial + 'T00:00:00');
      const dataFinalObj = new Date(dataFinal + 'T23:59:59');

      return items.filter(item => {
        try {
          const dataItem = new Date(item.data);
          console.log('Data do item:', dataItem);
          console.log('Data inicial:', dataInicialObj);
          console.log('Data final:', dataFinalObj);
          console.log('Está no intervalo:', dataItem >= dataInicialObj && dataItem <= dataFinalObj);
          
          return dataItem >= dataInicialObj && dataItem <= dataFinalObj;
        } catch (error) {
          console.error('Erro ao processar data do item:', error);
          return false;
        }
      });
    } catch (error) {
      console.error('Erro ao filtrar por período:', error);
      return items;
    }
  };

  const vendasFiltradas = filtrarPorPeriodo(vendas);
  const despesasFiltradas = filtrarPorPeriodo(despesas);

  const totalVendas = vendasFiltradas.reduce((acc, venda) => acc + Number(venda.valor), 0);
  const totalDespesas = despesasFiltradas.reduce((acc, despesa) => acc + Number(despesa.valor), 0);
  const saldo = totalVendas - totalDespesas;

  // Funções de exportação
  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  const exportarDashboardPDF = () => {
    const doc = new jsPDF();
    const data = new Date().toLocaleDateString('pt-BR');
    
    // Título
    doc.setFontSize(16);
    doc.text('Relatório do Dashboard', 14, 15);
    doc.setFontSize(12);
    doc.text(`Data: ${data}`, 14, 25);
    
    // Período
    if (dataInicial && dataFinal) {
      doc.text(`Período: ${format(new Date(dataInicial), 'dd/MM/yyyy')} a ${format(new Date(dataFinal), 'dd/MM/yyyy')}`, 14, 35);
    }

    // Resumo
    doc.setFontSize(14);
    doc.text('Resumo', 14, 50);
    doc.setFontSize(12);
    doc.text(`Total de Vendas: R$ ${totalVendas.toFixed(2)}`, 14, 60);
    doc.text(`Total de Despesas: R$ ${totalDespesas.toFixed(2)}`, 14, 70);
    doc.text(`Saldo: R$ ${saldo.toFixed(2)}`, 14, 80);

    // Metas
    doc.setFontSize(14);
    doc.text('Metas', 14, 100);
    doc.setFontSize(12);
    doc.text(`Meta de Vendas: R$ ${meta?.metaVendas.toFixed(2)}`, 14, 110);
    doc.text(`Meta de Produtos: ${meta?.metaProdutos}`, 14, 120);
    doc.text(`Progresso Vendas: ${calcularProgresso(vendasMensais[0]?.total || 0, meta?.metaVendas || 0).toFixed(1)}%`, 14, 130);
    doc.text(`Progresso Produtos: ${calcularProgresso(produtosMensais[0]?.total || 0, meta?.metaProdutos || 0).toFixed(1)}%`, 14, 140);

    // Vendas
    doc.setFontSize(14);
    doc.text('Últimas Vendas', 14, 160);
    const vendasData = vendasFiltradas.map(venda => [
      format(new Date(venda.data), 'dd/MM/yyyy'),
      venda.descricao,
      venda.itens.map(item => `${item.nomeProduto} (${item.quantidade})`).join(', '),
      `R$ ${Number(venda.valor).toFixed(2)}`
    ]);
    doc.autoTable({
      startY: 165,
      head: [['Data', 'Descrição', 'Produtos', 'Valor']],
      body: vendasData,
      theme: 'grid'
    });

    // Despesas
    doc.setFontSize(14);
    doc.text('Últimas Despesas', 14, doc.lastAutoTable.finalY + 20);
    const despesasData = despesasFiltradas.map(despesa => [
      format(new Date(despesa.data), 'dd/MM/yyyy'),
      despesa.descricao,
      despesa.itens.map(item => `${item.produto} (${item.quantidade})`).join(', '),
      `R$ ${Number(despesa.valor).toFixed(2)}`
    ]);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 25,
      head: [['Data', 'Descrição', 'Produtos', 'Valor']],
      body: despesasData,
      theme: 'grid'
    });

    doc.save(`dashboard_${data.replace(/\//g, '_')}.pdf`);
    handleExportClose();
  };

  const exportarDashboardExcel = () => {
    const data = new Date().toLocaleDateString('pt-BR');
    
    const wb = XLSX.utils.book_new();
    
    // Resumo
    const resumoData = [
      ['Resumo'],
      ['Total de Vendas', totalVendas],
      ['Total de Despesas', totalDespesas],
      ['Saldo', saldo],
      [],
      ['Metas'],
      ['Meta de Vendas', meta?.metaVendas],
      ['Meta de Produtos', meta?.metaProdutos],
      ['Progresso Vendas (%)', calcularProgresso(vendasMensais[0]?.total || 0, meta?.metaVendas || 0)],
      ['Progresso Produtos (%)', calcularProgresso(produtosMensais[0]?.total || 0, meta?.metaProdutos || 0)],
      [],
      ['Período'],
      ['Data Inicial', dataInicial ? format(new Date(dataInicial), 'dd/MM/yyyy') : ''],
      ['Data Final', dataFinal ? format(new Date(dataFinal), 'dd/MM/yyyy') : '']
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // Vendas
    const vendasData = vendasFiltradas.map(venda => [
      format(new Date(venda.data), 'dd/MM/yyyy'),
      venda.descricao,
      venda.itens.map(item => `${item.nomeProduto} (${item.quantidade})`).join(', '),
      Number(venda.valor)
    ]);
    const wsVendas = XLSX.utils.aoa_to_sheet([['Data', 'Descrição', 'Produtos', 'Valor'], ...vendasData]);
    XLSX.utils.book_append_sheet(wb, wsVendas, 'Vendas');

    // Despesas
    const despesasData = despesasFiltradas.map(despesa => [
      format(new Date(despesa.data), 'dd/MM/yyyy'),
      despesa.descricao,
      despesa.itens.map(item => `${item.produto} (${item.quantidade})`).join(', '),
      Number(despesa.valor)
    ]);
    const wsDespesas = XLSX.utils.aoa_to_sheet([['Data', 'Descrição', 'Produtos', 'Valor'], ...despesasData]);
    XLSX.utils.book_append_sheet(wb, wsDespesas, 'Despesas');

    XLSX.writeFile(wb, `dashboard_${data.replace(/\//g, '_')}.xlsx`);
    handleExportClose();
  };

  const exportarDashboardTexto = () => {
    const data = new Date().toLocaleDateString('pt-BR');
    let conteudo = 'RELATÓRIO DO DASHBOARD\n';
    conteudo += `Data: ${data}\n\n`;

    if (dataInicial && dataFinal) {
      conteudo += `Período: ${format(new Date(dataInicial), 'dd/MM/yyyy')} a ${format(new Date(dataFinal), 'dd/MM/yyyy')}\n\n`;
    }

    conteudo += 'RESUMO\n';
    conteudo += `Total de Vendas: R$ ${totalVendas.toFixed(2)}\n`;
    conteudo += `Total de Despesas: R$ ${totalDespesas.toFixed(2)}\n`;
    conteudo += `Saldo: R$ ${saldo.toFixed(2)}\n\n`;

    conteudo += 'METAS\n';
    conteudo += `Meta de Vendas: R$ ${meta?.metaVendas.toFixed(2)}\n`;
    conteudo += `Meta de Produtos: ${meta?.metaProdutos}\n`;
    conteudo += `Progresso Vendas: ${calcularProgresso(vendasMensais[0]?.total || 0, meta?.metaVendas || 0).toFixed(1)}%\n`;
    conteudo += `Progresso Produtos: ${calcularProgresso(produtosMensais[0]?.total || 0, meta?.metaProdutos || 0).toFixed(1)}%\n\n`;

    conteudo += 'ÚLTIMAS VENDAS\n';
    vendasFiltradas.forEach(venda => {
      conteudo += `${format(new Date(venda.data), 'dd/MM/yyyy')} - ${venda.descricao} - ${venda.itens.map(item => `${item.nomeProduto} (${item.quantidade})`).join(', ')} - R$ ${Number(venda.valor).toFixed(2)}\n`;
    });
    conteudo += '\n';

    conteudo += 'ÚLTIMAS DESPESAS\n';
    despesasFiltradas.forEach(despesa => {
      conteudo += `${format(new Date(despesa.data), 'dd/MM/yyyy')} - ${despesa.descricao} - ${despesa.itens.map(item => `${item.produto} (${item.quantidade})`).join(', ')} - R$ ${Number(despesa.valor).toFixed(2)}\n`;
    });

    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${data.replace(/\//g, '_')}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    handleExportClose();
  };

  const colunasDespesas = [
    {
      field: 'data',
      headerName: 'Data',
      width: 120,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString('pt-BR');
      }
    },
    { field: 'descricao', headerName: 'Descrição', width: 200 },
    { field: 'categoria', headerName: 'Categoria', width: 150 },
    {
      field: 'valor',
      headerName: 'Valor',
      width: 120,
      valueFormatter: (params) => {
        return `R$ ${Number(params.value).toFixed(2)}`;
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120
    }
  ];

  const colunasVendas = [
    {
      field: 'data',
      headerName: 'Data',
      width: 120,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString('pt-BR');
      }
    },
    { field: 'cliente', headerName: 'Entregador', width: 150 },
    {
      field: 'produtos',
      headerName: 'Produtos',
      width: 200,
      renderCell: (params) => {
        const itens = params.row.itens || [];
        
        if (!Array.isArray(itens) || itens.length === 0) {
          return <div>Sem produtos</div>;
        }

        return (
          <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {itens.map((item, index) => (
              <div key={index}>
                {item.nomeProduto}
                {index < itens.length - 1 ? ', ' : ''}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      field: 'quantidades',
      headerName: 'Quantidade',
      width: 120,
      renderCell: (params) => {
        const itens = params.row.itens || [];
        
        if (!Array.isArray(itens) || itens.length === 0) {
          return <div>-</div>;
        }

        return (
          <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {itens.map((item, index) => (
              <div key={index}>
                {item.quantidade}
                {index < itens.length - 1 ? ', ' : ''}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      field: 'valor',
      headerName: 'Valor',
      width: 120,
      valueFormatter: (params) => {
        return `R$ ${Number(params.value).toFixed(2)}`;
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120
    }
  ];

  // Cores para o gráfico de pizza
  const CORES_PIZZA = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography>Carregando dados...</Typography>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Seletor de Período */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ mr: 2 }}>
              Período:
            </Typography>
            <TextField
              type="date"
              label="Data Inicial"
              value={dataInicial}
              onChange={(e) => {
                setDataInicial(e.target.value);
                console.log('Nova data inicial:', e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="Data Final"
              value={dataFinal}
              onChange={(e) => {
                setDataFinal(e.target.value);
                console.log('Nova data final:', e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={() => {
              setDataInicial('');
              setDataFinal('');
            }}
            color="secondary"
            sx={{ mr: 2 }}
          >
            Limpar Filtro
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportClick}
            color="primary"
          >
            Exportar
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={exportarDashboardPDF}>Exportar como PDF</MenuItem>
            <MenuItem onClick={exportarDashboardExcel}>Exportar como Excel</MenuItem>
            <MenuItem onClick={exportarDashboardTexto}>Exportar como Texto</MenuItem>
          </Menu>
        </Paper>
      </Grid>

      {/* Cards de Resumo */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Total de Vendas
          </Typography>
          <Typography component="p" variant="h4">
            R$ {totalVendas.toFixed(2)}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
          <Typography component="h2" variant="h6" color="error" gutterBottom>
            Total de Despesas
          </Typography>
          <Typography component="p" variant="h4">
            R$ {totalDespesas.toFixed(2)}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
          <Typography component="h2" variant="h6" color={saldo >= 0 ? 'success.main' : 'error.main'} gutterBottom>
            Saldo
          </Typography>
          <Typography component="p" variant="h4">
            R$ {saldo.toFixed(2)}
          </Typography>
        </Paper>
      </Grid>

      {/* Cards de Metas */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Meta de Vendas</Typography>
            <Tooltip title="Editar meta">
              <IconButton onClick={handleOpenDialog}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Typography variant="h4" color="primary" gutterBottom>
            R$ {meta?.metaVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Atual: R$ {vendasMensais[0]?.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>

          <LinearProgress 
            variant="determinate" 
            value={calcularProgresso(vendasMensais[0]?.total || 0, meta?.metaVendas || 0)}
            sx={{ height: 10, borderRadius: 5, mt: 2 }}
          />
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Meta de Produtos</Typography>
            <Tooltip title="Editar meta">
              <IconButton onClick={handleOpenDialog}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Typography variant="h4" color="primary" gutterBottom>
            {meta?.metaProdutos.toLocaleString('pt-BR')}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Atual: {produtosMensais[0]?.total.toLocaleString('pt-BR')}
          </Typography>

          <LinearProgress 
            variant="determinate" 
            value={calcularProgresso(produtosMensais[0]?.total || 0, meta?.metaProdutos || 0)}
            sx={{ height: 10, borderRadius: 5, mt: 2 }}
          />
        </Paper>
      </Grid>

      {/* Gráficos */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Evolução de Vendas (R$)</Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vendasMensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <ChartTooltip 
                  formatter={(value) => [`R$ ${value.toFixed(2)}`, "Valor Total"]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#8884d8" 
                  name="Valor Total"
                  dot={{ r: 4 }}
                  label={{
                    position: 'top',
                    formatter: (value) => `R$ ${value.toFixed(0)}`,
                    fontSize: 12
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Resumo do Período
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Maior Venda:
                </Typography>
                <Typography variant="body1">
                  R$ {Math.max(...vendasMensais.map(v => v.total)).toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Menor Venda:
                </Typography>
                <Typography variant="body1">
                  R$ {Math.min(...vendasMensais.map(v => v.total)).toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Média Mensal:
                </Typography>
                <Typography variant="body1">
                  R$ {(vendasMensais.reduce((acc, v) => acc + v.total, 0) / (vendasMensais.length || 1)).toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Quantidade Vendida</Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={produtosMensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip 
                  formatter={(value) => [`${value} unidades`, "Quantidade"]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#82ca9d" 
                  name="Quantidade"
                  dot={{ r: 4 }}
                  label={{
                    position: 'top',
                    fontSize: 12
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Resumo do Período
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Maior Quantidade:
                </Typography>
                <Typography variant="body1">
                  {Math.max(...produtosMensais.map(p => p.total))} unidades
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Menor Quantidade:
                </Typography>
                <Typography variant="body1">
                  {Math.min(...produtosMensais.map(p => p.total))} unidades
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Média Mensal:
                </Typography>
                <Typography variant="body1">
                  {(produtosMensais.reduce((acc, p) => acc + p.total, 0) / (produtosMensais.length || 1)).toFixed(0)} unidades
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Despesas por Categoria</Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={despesasGrafico}
                  dataKey="valor"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    value,
                    name
                  }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = 25 + innerRadius + (outerRadius - innerRadius);
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#000"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        style={{ fontSize: '12px' }}
                      >
                        {`${name}: R$ ${value.toFixed(0)}`}
                      </text>
                    );
                  }}
                >
                  {despesasGrafico.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  formatter={(value) => `R$ ${value.toFixed(2)}`}
                  labelFormatter={(name) => `Categoria: ${name}`}
                />
                <Legend 
                  formatter={(value) => value.length > 20 ? value.substr(0, 20) + '...' : value}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Tabelas */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom component="div">
            Últimas Vendas
          </Typography>
          <DataGrid
            rows={vendasFiltradas}
            columns={colunasVendas}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disableSelectionOnClick
            autoHeight
            getRowId={(row) => row._id}
          />
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom component="div">
            Últimas Despesas
          </Typography>
          <DataGrid
            rows={despesasFiltradas}
            columns={colunasDespesas}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disableSelectionOnClick
            autoHeight
            getRowId={(row) => row._id}
          />
        </Paper>
      </Grid>

      {/* Dialog para editar metas */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Editar Metas</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Meta de Vendas"
            type="number"
            fullWidth
            value={formData.metaVendas}
            onChange={(e) => setFormData({ ...formData, metaVendas: Number(e.target.value) })}
          />
          <TextField
            margin="dense"
            label="Meta de Produtos"
            type="number"
            fullWidth
            value={formData.metaProdutos}
            onChange={(e) => setFormData({ ...formData, metaProdutos: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default DashboardCompleto; 