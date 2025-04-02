import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5001/api';

export function useClientes() {
  const queryClient = useQueryClient();

  const { data: clientes, isLoading, error } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/clientes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
  });

  const addCliente = useMutation({
    mutationFn: async (novoCliente) => {
      const response = await axios.post(`${API_URL}/clientes`, novoCliente, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      toast.success('Cliente cadastrado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar cliente');
    },
  });

  const updateCliente = useMutation({
    mutationFn: async ({ id, dados }) => {
      const response = await axios.put(`${API_URL}/clientes/${id}`, dados, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar cliente');
    },
  });

  const deleteCliente = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_URL}/clientes/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      toast.success('Cliente removido com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao remover cliente');
    },
  });

  return {
    clientes,
    isLoading,
    error,
    addCliente,
    updateCliente,
    deleteCliente,
  };
} 