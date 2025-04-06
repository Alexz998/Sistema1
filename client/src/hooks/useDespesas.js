import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

export function useDespesas(page = 1, limit = 10) {
  const queryClient = useQueryClient();
  const API_URL = 'http://localhost:5002/api';

  // Buscar despesas
  const { data, isLoading, error } = useQuery({
    queryKey: ['despesas', page, limit],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/despesas`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        params: { page, limit }
      });
      return response.data;
    }
  });

  // Adicionar despesa
  const addDespesa = useMutation({
    mutationFn: async (despesa) => {
      console.log('Dados recebidos para adicionar:', despesa);
      
      // Formatação da data para garantir o dia correto
      const dataFormatada = despesa.data; // Usa a data exatamente como recebida
      
      const despesaFormatada = {
        ...despesa,
        data: dataFormatada,
        valor: Number(despesa.valor)
      };
      
      console.log('Dados formatados para envio:', despesaFormatada);
      
      const response = await axios({
        method: 'post',
        url: `${API_URL}/despesas`,
        data: despesaFormatada,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Resposta da API:', response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['despesas']);
      toast.success('Despesa adicionada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao adicionar despesa:', error);
      console.error('Detalhes do erro:', error.response?.data);
      toast.error(error.response?.data?.message || 'Erro ao adicionar despesa');
    }
  });

  // Atualizar despesa
  const updateDespesa = useMutation({
    mutationFn: async ({ id, despesa }) => {
      console.log('Iniciando atualização da despesa:', { id, despesa });
      const despesaId = String(id).trim();
      
      // Formatação da data para garantir o dia correto
      const dataFormatada = despesa.data; // Usa a data exatamente como recebida
      
      const despesaFormatada = {
        ...despesa,
        data: dataFormatada,
        valor: Number(despesa.valor)
      };
      
      console.log('Dados formatados para envio:', despesaFormatada);
      console.log('URL da requisição:', `/api/despesas/${despesaId}`);
      
      const response = await axios({
        method: 'put',
        url: `${API_URL}/despesas/${despesaId}`,
        data: despesaFormatada,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Resposta da API:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Atualização bem-sucedida:', data);
      // Atualiza o cache com os novos dados
      queryClient.setQueryData(['despesas'], (oldData) => {
        if (!oldData) return [data];
        return oldData.map(despesa => 
          despesa._id === data._id ? data : despesa
        );
      });
      toast.success('Despesa atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar despesa:', error);
      console.error('Detalhes do erro:', error.response?.data);
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