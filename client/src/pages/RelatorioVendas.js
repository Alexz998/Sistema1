import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  MenuItem,
  TextField,
  CircularProgress,
  Button,
  Menu,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend 
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useVendas } from '../hooks/useVendas';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DownloadIcon from '@mui/icons-material/Download';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

const PERIODOS = [
  { value: 1, label: 'Hoje' },
  { value: 7, label: 'Últimos 7 dias' },
  { value: 30, label: 'Último mês' },
  { value: 90, label: 'Últimos 3 meses' },
  { value: 180, label: 'Últimos 6 meses' },
  { value: 365, label: 'Último ano' }
];

const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'PIX',
  'Transferência'
];

function RelatorioVendas() {
  const [periodo, setPeriodo] = useState(30);
  const [dataInicial, setDataInicial] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFinal, setDataFinal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tipoPeriodo, setTipoPeriodo] = useState('predefinido');
  const [anchorEl, setAnchorEl] = useState(null);
  const { vendas, isLoading } = useVendas();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Filtra vendas pelo período selecionado
  const vendasFiltradas = vendas?.filter((venda) => {
    const dataVenda = new Date(venda.data);
    if (tipoPeriodo === 'predefinido') {
      const dataInicialFiltro = startOfMonth(subMonths(new Date(), periodo));
      const dataFinalFiltro = endOfMonth(new Date());
      return dataVenda >= dataInicialFiltro && dataVenda <= dataFinalFiltro;
    } else {
      return dataVenda >= new Date(dataInicial) && dataVenda <= new Date(dataFinal);
    }
  }) || [];

  // Preparar dados para o gráfico de pizza (vendas por cliente)
  const vendasPorCliente = vendasFiltradas.reduce((acc, venda) => {
    const cliente = venda.cliente || 'Entregador não identificado';
    acc[cliente] = (acc[cliente] || 0) + venda.valor;
    return acc;
  }, {});

  const dadosGraficoPizza = {
    labels: Object.keys(vendasPorCliente),
    datasets: [
      {
        data: Object.values(vendasPorCliente),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0'
        ]
      }
    ]
  };

  // Dados para o gráfico de barras (Vendas por Mês)
  const vendasPorMes = vendasFiltradas.reduce((acc, venda) => {
    const mes = format(new Date(venda.data), 'MMM/yyyy', { locale: ptBR });
    acc[mes] = (acc[mes] || 0) + Number(venda.valor);
    return acc;
  }, {});

  const dadosGraficoBarras = {
    labels: Object.keys(vendasPorMes),
    datasets: [
      {
        label: 'Total de Vendas',
        data: Object.values(vendasPorMes),
        backgroundColor: '#36A2EB'
      }
    ]
  };

  // Dados para o gráfico de linha (Evolução de Vendas)
  const evolucaoVendas = [...vendasFiltradas]
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .reduce((acc, venda) => {
      const data = format(new Date(venda.data), 'dd/MM/yyyy');
      acc[data] = (acc[data] || 0) + Number(venda.valor);
      return acc;
    }, {});

  const dadosGraficoLinha = {
    labels: Object.keys(evolucaoVendas),
    datasets: [
      {
        label: 'Evolução das Vendas',
        data: Object.values(evolucaoVendas),
        borderColor: '#FF6384',
        tension: 0.1
      }
    ]
  };

  // Cálculos estatísticos
  const totalVendas = vendasFiltradas.reduce((total, venda) => total + Number(venda.valor), 0);
  const mediaMensal = totalVendas / periodo;
  const maiorVenda = Math.max(...vendasFiltradas.map(v => Number(v.valor)));
  const menorVenda = Math.min(...vendasFiltradas.map(v => Number(v.valor)));
  const totalVendasHoje = vendasFiltradas
    .filter(v => format(new Date(v.data), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
    .reduce((total, v) => total + Number(v.valor), 0);

  const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.text('RELATÓRIO DE VENDAS', 14, 15);
    doc.setFontSize(12);
    doc.text(`Período: ${tipoPeriodo === 'predefinido' 
      ? PERIODOS.find(p => p.value === periodo)?.label 
      : `${format(new Date(dataInicial), 'dd/MM/yyyy')} a ${format(new Date(dataFinal), 'dd/MM/yyyy')}`}`, 14, 25);
    doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 35);

    // Resumo
    doc.setFontSize(14);
    doc.text('RESUMO', 14, 45);
    doc.setFontSize(12);
    doc.text(`Total de Vendas: R$ ${totalVendas.toFixed(2)}`, 14, 55);
    doc.text(`Média Mensal: R$ ${mediaMensal.toFixed(2)}`, 14, 65);
    doc.text(`Vendas Hoje: R$ ${totalVendasHoje.toFixed(2)}`, 14, 75);
    doc.text(`Maior Venda: R$ ${maiorVenda.toFixed(2)}`, 14, 85);

    // Tabela de Vendas por Entregador
    doc.setFontSize(14);
    doc.text('VENDAS POR ENTREGADOR', 14, 100);
    doc.autoTable({
      startY: 105,
      head: [['Entregador', 'Valor']],
      body: Object.entries(vendasPorCliente).map(([entregador, valor]) => [
        entregador,
        `R$ ${valor.toFixed(2)}`
      ]),
      theme: 'grid'
    });

    // Tabela de Vendas por Mês
    doc.setFontSize(14);
    doc.text('VENDAS POR MÊS', 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Mês', 'Valor']],
      body: Object.entries(vendasPorMes).map(([mes, valor]) => [
        mes,
        `R$ ${valor.toFixed(2)}`
      ]),
      theme: 'grid'
    });

    doc.save(`relatorio_vendas_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Resumo
    const resumoData = [
      ['RELATÓRIO DE VENDAS'],
      [`Período: ${tipoPeriodo === 'predefinido' 
        ? PERIODOS.find(p => p.value === periodo)?.label 
        : `${format(new Date(dataInicial), 'dd/MM/yyyy')} a ${format(new Date(dataFinal), 'dd/MM/yyyy')}`}`],
      [`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`],
      [],
      ['RESUMO'],
      ['Total de Vendas', `R$ ${totalVendas.toFixed(2)}`],
      ['Média Mensal', `R$ ${mediaMensal.toFixed(2)}`],
      ['Vendas Hoje', `R$ ${totalVendasHoje.toFixed(2)}`],
      ['Maior Venda', `R$ ${maiorVenda.toFixed(2)}`]
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // Vendas por Entregador
    const entregadorData = [
      ['VENDAS POR ENTREGADOR'],
      ['Entregador', 'Valor'],
      ...Object.entries(vendasPorCliente).map(([entregador, valor]) => [
        entregador,
        `R$ ${valor.toFixed(2)}`
      ])
    ];
    const wsEntregador = XLSX.utils.aoa_to_sheet(entregadorData);
    XLSX.utils.book_append_sheet(wb, wsEntregador, 'Vendas por Entregador');

    // Vendas por Mês
    const mesData = [
      ['VENDAS POR MÊS'],
      ['Mês', 'Valor'],
      ...Object.entries(vendasPorMes).map(([mes, valor]) => [
        mes,
        `R$ ${valor.toFixed(2)}`
      ])
    ];
    const wsMes = XLSX.utils.aoa_to_sheet(mesData);
    XLSX.utils.book_append_sheet(wb, wsMes, 'Vendas por Mês');

    XLSX.writeFile(wb, `relatorio_vendas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportarRelatorio = () => {
    // Criar dados para exportação
    const dadosExportacao = {
      periodo: tipoPeriodo === 'predefinido' ? PERIODOS.find(p => p.value === periodo)?.label : `${format(new Date(dataInicial), 'dd/MM/yyyy')} a ${format(new Date(dataFinal), 'dd/MM/yyyy')}`,
      totalVendas: totalVendas.toFixed(2),
      mediaMensal: mediaMensal.toFixed(2),
      vendasHoje: totalVendasHoje.toFixed(2),
      maiorVenda: maiorVenda.toFixed(2),
      vendasPorEntregador: Object.entries(vendasPorCliente).map(([entregador, valor]) => ({
        entregador,
        valor: valor.toFixed(2)
      })),
      vendasPorMes: Object.entries(vendasPorMes).map(([mes, valor]) => ({
        mes,
        valor: valor.toFixed(2)
      }))
    };

    // Criar conteúdo do arquivo
    const conteudo = `
RELATÓRIO DE VENDAS
Período: ${dadosExportacao.periodo}
Data de geração: ${new Date().toLocaleDateString('pt-BR')}

RESUMO
Total de Vendas: R$ ${dadosExportacao.totalVendas}
Média Mensal: R$ ${dadosExportacao.mediaMensal}
Vendas Hoje: R$ ${dadosExportacao.vendasHoje}
Maior Venda: R$ ${dadosExportacao.maiorVenda}

VENDAS POR ENTREGADOR
${dadosExportacao.vendasPorEntregador.map(v => `${v.entregador}: R$ ${v.valor}`).join('\n')}

VENDAS POR MÊS
${dadosExportacao.vendasPorMes.map(v => `${v.mes}: R$ ${v.valor}`).join('\n')}
    `.trim();

    // Criar e fazer download do arquivo
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_vendas_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Relatório de Vendas</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            select
            label="Tipo de Período"
            value={tipoPeriodo}
            onChange={(e) => setTipoPeriodo(e.target.value)}
            sx={{ width: 200 }}
          >
            <MenuItem value="predefinido">Período Predefinido</MenuItem>
            <MenuItem value="personalizado">Período Personalizado</MenuItem>
          </TextField>

          {tipoPeriodo === 'predefinido' ? (
            <TextField
              select
              label="Período"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              sx={{ width: 200 }}
            >
              {PERIODOS.map((opcao) => (
                <MenuItem key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <>
              <TextField
                type="date"
                label="Data Inicial"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 200 }}
              />
              <TextField
                type="date"
                label="Data Final"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 200 }}
              />
            </>
          )}

          <Tooltip title="Opções de Exportação">
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { exportarPDF(); handleMenuClose(); }}>
              Exportar PDF
            </MenuItem>
            <MenuItem onClick={() => { exportarExcel(); handleMenuClose(); }}>
              Exportar Excel
            </MenuItem>
            <MenuItem onClick={() => { exportarRelatorio(); handleMenuClose(); }}>
              Exportar TXT
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Cards com estatísticas */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Total de Vendas</Typography>
            <Typography variant="h6">R$ {totalVendas.toFixed(2)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Média Mensal</Typography>
            <Typography variant="h6">R$ {mediaMensal.toFixed(2)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Vendas Hoje</Typography>
            <Typography variant="h6">R$ {totalVendasHoje.toFixed(2)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Maior Venda</Typography>
            <Typography variant="h6">R$ {maiorVenda.toFixed(2)}</Typography>
          </Paper>
        </Grid>

        {/* Gráficos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Vendas por Entregador
            </Typography>
            <Pie data={dadosGraficoPizza} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Vendas por Mês</Typography>
            <Bar data={dadosGraficoBarras} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Evolução das Vendas</Typography>
            <Line data={dadosGraficoLinha} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default RelatorioVendas; 