import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5002/api';

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    estoque: '',
    categoria: ''
  });

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const response = await axios.get(`${API_URL}/produtos`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const handleOpen = () => {
    setEditingProduto(null);
    setFormData({
      nome: '',
      descricao: '',
      preco: '',
      estoque: '',
      categoria: ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduto(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduto) {
        await axios.put(`${API_URL}/produtos/${editingProduto._id}`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        toast.success('Produto atualizado com sucesso!');
      } else {
        await axios.post(`${API_URL}/produtos`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        toast.success('Produto cadastrado com sucesso!');
      }
      handleClose();
      fetchProdutos();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar produto');
    }
  };

  const handleEdit = (produto) => {
    setEditingProduto(produto);
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco,
      estoque: produto.estoque,
      categoria: produto.categoria
    });
    setOpen(true);
  };

  const handleDelete = async (produto) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await axios.delete(`${API_URL}/produtos/${produto._id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        toast.success('Produto excluído com sucesso!');
        fetchProdutos();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        toast.error(error.response?.data?.message || 'Erro ao excluir produto');
      }
    }
  };

  const columns = [
    { field: 'nome', headerName: 'Nome', width: 200 },
    { field: 'descricao', headerName: 'Descrição', width: 300 },
    { field: 'preco', headerName: 'Preço', width: 130 },
    { field: 'estoque', headerName: 'Estoque', width: 130 },
    { field: 'categoria', headerName: 'Categoria', width: 150 },
    {
      field: 'acoes',
      headerName: 'Ações',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Editar">
            <IconButton onClick={() => handleEdit(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton onClick={() => handleDelete(params.row)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Produtos</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpen}
          >
            Novo Produto
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={produtos}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disableSelectionOnClick
            getRowId={(row) => row._id}
          />
        </Paper>
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingProduto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="descricao"
                multiline
                rows={2}
                value={formData.descricao}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Preço"
                name="preco"
                type="number"
                value={formData.preco}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Estoque"
                name="estoque"
                type="number"
                value={formData.estoque}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingProduto ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default Produtos; 