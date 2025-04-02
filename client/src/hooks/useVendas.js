import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5001/api';

export function useVendas() {
  const queryClient = useQueryClient();

  const { data: vendas, isLoading, error } = useQuery({
    queryKey: ['vendas'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/vendas`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
  });

  const addVenda = useMutation({
    mutationFn: async (novaVenda) => {
      const response = await axios.post(`${API_URL}/vendas`, novaVenda, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendas']);
      toast.success('Venda registrada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao registrar venda');
    },
  });

  const updateVenda = useMutation({
    mutationFn: async ({ id, dados }) => {
      const response = await axios.put(`${API_URL}/vendas/${id}`, dados, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendas']);
      toast.success('Venda atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar venda');
    },
  });

  const deleteVenda = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_URL}/vendas/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendas']);
      toast.success('Venda excluída com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir venda');
    },
  });

  return {
    vendas,
    isLoading,
    error,
    addVenda: addVenda.mutate,
    updateVenda: updateVenda.mutate,
    deleteVenda: deleteVenda.mutate,
  };
} 