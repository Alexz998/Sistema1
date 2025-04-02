import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5001/api';

export function useDespesas(page = 1, limit = 10) {
  const queryClient = useQueryClient();

  // Buscar despesas
  const { data, isLoading, error } = useQuery({
    queryKey: ['despesas', page, limit],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/despesas`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
  });

  // Adicionar despesa
  const addDespesa = useMutation({
    mutationFn: async (novaDespesa) => {
      console.log('Iniciando criação de despesa:', novaDespesa);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const despesaComData = {
        ...novaDespesa,
        data: new Date(novaDespesa.data).toISOString()
      };
      
      console.log('Dados formatados para envio:', despesaComData);
      
      const response = await axios.post(`${API_URL}/despesas`, despesaComData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Resposta do servidor:', response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['despesas']);
      toast.success('Despesa registrada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro completo ao criar despesa:', error);
      toast.error(error.response?.data?.message || 'Erro ao registrar despesa');
    }
  });

  // Atualizar despesa
  const updateDespesa = useMutation({
    mutationFn: async ({ id, despesa }) => {
      const response = await axios.put(`${API_URL}/despesas/${id}`, despesa, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['despesas']);
      toast.success('Despesa atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar despesa');
    }
  });

  // Deletar despesa
  const deleteDespesa = useMutation({
    mutationFn: async (id) => {
      console.log('Iniciando exclusão da despesa:', id);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      console.log('Configuração da requisição:', {
        url: `${API_URL}/despesas/${id}`,
        headers: config.headers
      });

      const response = await axios.delete(`${API_URL}/despesas/${id}`, config);
      console.log('Resposta da exclusão:', response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['despesas']);
      toast.success('Despesa excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Erro completo:', error);
      const mensagemErro = error.response?.data?.message || error.message || 'Erro ao excluir despesa';
      toast.error(mensagemErro);
    }
  });

  return {
    despesas: data || [],
    isLoading,
    error,
    addDespesa: addDespesa.mutate,
    updateDespesa: updateDespesa.mutate,
    deleteDespesa: deleteDespesa.mutate
  };
} 