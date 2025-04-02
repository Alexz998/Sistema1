import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

export function useDashboard() {
  // Buscar resumo financeiro
  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ['dashboard-resumo'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/dashboard/resumo`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
  });

  // Buscar gráfico de vendas por mês
  const { data: vendasPorMes, isLoading: loadingVendasPorMes } = useQuery({
    queryKey: ['dashboard-vendas-mes'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/dashboard/vendas-por-mes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Buscar gráfico de despesas por categoria
  const { data: despesasPorCategoria, isLoading: loadingDespesasPorCategoria } = useQuery({
    queryKey: ['dashboard-despesas-categoria'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/dashboard/despesas-por-categoria`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Buscar últimas transações
  const { data: ultimasTransacoes, isLoading: loadingUltimasTransacoes } = useQuery({
    queryKey: ['dashboard-ultimas-transacoes'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/dashboard/ultimas-transacoes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    refetchInterval: 60 * 1000, // Atualiza a cada 1 minuto
  });

  return {
    resumo: resumo || {
      totalVendas: 0,
      totalDespesas: 0,
      saldoAtual: 0,
      vendasHoje: 0,
      despesasHoje: 0,
    },
    vendasPorMes: vendasPorMes || [],
    despesasPorCategoria: despesasPorCategoria || [],
    ultimasTransacoes: ultimasTransacoes || [],
    isLoading:
      loadingResumo ||
      loadingVendasPorMes ||
      loadingDespesasPorCategoria ||
      loadingUltimasTransacoes,
  };
} 