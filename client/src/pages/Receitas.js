import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5001/api';

const CATEGORIAS = [
  'Salário',
  'Investimentos',
  'Freelance',
  'Outros'
];

const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'PIX',
  'Transferência',
  'Cartão de Crédito',
  'Cartão de Débito'
];

function Receitas() {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    categoria: '',
    formaPagamento: '',
    data: new Date().toISOString().split('T')[0]
  });
  const [editingId, setEditingId] = useState(null);
  const queryClient = useQueryClient();

  // Buscar receitas
  const { data: receitas = [], isLoading } = useQuery({
    queryKey: ['receitas'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/receitas`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
  });

  // Adicionar/Editar receita
  const mutation = useMutation({
    mutationFn: async (receita) => {
      if (editingId) {
        return axios.put(`${API_URL}/receitas/${editingId}`, receita, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
      }
      return axios.post(`${API_URL}/receitas`, receita, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['receitas']);
      handleCloseDialog();
      toast.success(editingId ? 'Receita atualizada com sucesso!' : 'Receita adicionada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao salvar receita');
    },
  });

  // Excluir receita
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return axios.delete(`${API_URL}/receitas/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['receitas']);
      toast.success('Receita excluída com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir receita');
    },
  });

  const handleOpenDialog = (receita = null) => {
    if (receita) {
      setFormData({
        ...receita,
        data: new Date(receita.data).toISOString().split('T')[0]
      });
      setEditingId(receita._id);
    } else {
      setFormData({
        descricao: '',
        valor: '',
        categoria: '',
        formaPagamento: '',
        data: new Date().toISOString().split('T')[0]
      });
      setEditingId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      descricao: '',
      valor: '',
      categoria: '',
      formaPagamento: '',
      data: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calcularTotal = () => {
    return receitas.reduce((total, receita) => total + receita.valor, 0);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Receitas</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Receita
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Forma de Pagamento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receitas.map((receita) => (
                    <TableRow key={receita._id}>
                      <TableCell>{new Date(receita.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{receita.descricao}</TableCell>
                      <TableCell>{receita.categoria}</TableCell>
                      <TableCell>{receita.formaPagamento}</TableCell>
                      <TableCell align="right">
                        {receita.valor.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleOpenDialog(receita)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(receita._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" align="right">
              Total: {calcularTotal().toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingId ? 'Editar Receita' : 'Nova Receita'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor"
                  name="valor"
                  type="number"
                  value={formData.valor}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data"
                  name="data"
                  type="date"
                  value={formData.data}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                >
                  {CATEGORIAS.map((categoria) => (
                    <MenuItem key={categoria} value={categoria}>
                      {categoria}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Forma de Pagamento"
                  name="formaPagamento"
                  value={formData.formaPagamento}
                  onChange={handleChange}
                  required
                >
                  {FORMAS_PAGAMENTO.map((forma) => (
                    <MenuItem key={forma} value={forma}>
                      {forma}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default Receitas; 