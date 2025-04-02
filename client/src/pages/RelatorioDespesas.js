import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  MenuItem,
  TextField,
  CircularProgress
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
  Tooltip,
  Legend 
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useDespesas } from '../hooks/useDespesas';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PERIODOS = [
  { value: 3, label: 'Últimos 3 meses' },
  { value: 6, label: 'Últimos 6 meses' },
  { value: 12, label: 'Último ano' }
];

function RelatorioDespesas() {
  const [periodo, setPeriodo] = useState(3);
  const { despesas, isLoading } = useDespesas();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Filtra despesas pelo período selecionado
  const dataInicial = startOfMonth(subMonths(new Date(), periodo));
  const dataFinal = endOfMonth(new Date());
  const despesasFiltradas = despesas?.filter(
    (despesa) => new Date(despesa.data) >= dataInicial && new Date(despesa.data) <= dataFinal
  ) || [];

  // Dados para o gráfico de pizza (Despesas por Categoria)
  const despesasPorCategoria = despesasFiltradas.reduce((acc, despesa) => {
    acc[despesa.categoria] = (acc[despesa.categoria] || 0) + Number(despesa.valor);
    return acc;
  }, {});

  const dadosGraficoPizza = {
    labels: Object.keys(despesasPorCategoria),
    datasets: [
      {
        data: Object.values(despesasPorCategoria),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384'
        ]
      }
    ]
  };

  // Dados para o gráfico de barras (Despesas por Mês)
  const despesasPorMes = despesasFiltradas.reduce((acc, despesa) => {
    const mes = format(new Date(despesa.data), 'MMM/yyyy', { locale: ptBR });
    acc[mes] = (acc[mes] || 0) + Number(despesa.valor);
    return acc;
  }, {});

  const dadosGraficoBarras = {
    labels: Object.keys(despesasPorMes),
    datasets: [
      {
        label: 'Total de Despesas',
        data: Object.values(despesasPorMes),
        backgroundColor: '#36A2EB'
      }
    ]
  };

  // Dados para o gráfico de linha (Evolução de Despesas)
  const evolucaoDespesas = [...despesasFiltradas]
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .reduce((acc, despesa) => {
      const data = format(new Date(despesa.data), 'dd/MM/yyyy');
      acc[data] = (acc[data] || 0) + Number(despesa.valor);
      return acc;
    }, {});

  const dadosGraficoLinha = {
    labels: Object.keys(evolucaoDespesas),
    datasets: [
      {
        label: 'Evolução das Despesas',
        data: Object.values(evolucaoDespesas),
        borderColor: '#FF6384',
        tension: 0.1
      }
    ]
  };

  // Cálculos estatísticos
  const totalDespesas = despesasFiltradas.reduce((total, despesa) => total + Number(despesa.valor), 0);
  const mediaMensal = totalDespesas / periodo;
  const maiorDespesa = Math.max(...despesasFiltradas.map(d => Number(d.valor)));
  const menorDespesa = Math.min(...despesasFiltradas.map(d => Number(d.valor)));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Relatório de Despesas</Typography>
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
      </Box>

      <Grid container spacing={3}>
        {/* Cards com estatísticas */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Total de Despesas</Typography>
            <Typography variant="h6">R$ {totalDespesas.toFixed(2)}</Typography>
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
            <Typography variant="subtitle1" gutterBottom>Maior Despesa</Typography>
            <Typography variant="h6">R$ {maiorDespesa.toFixed(2)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Menor Despesa</Typography>
            <Typography variant="h6">R$ {menorDespesa.toFixed(2)}</Typography>
          </Paper>
        </Grid>

        {/* Gráficos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Despesas por Categoria</Typography>
            <Pie data={dadosGraficoPizza} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Despesas por Mês</Typography>
            <Bar data={dadosGraficoBarras} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Evolução das Despesas</Typography>
            <Line data={dadosGraficoLinha} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default RelatorioDespesas; 