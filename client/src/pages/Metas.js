import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

const Metas = () => {
  const [meta, setMeta] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    metaVendas: 0,
    metaProdutos: 0
  });
  const [vendasMensais, setVendasMensais] = useState([]);
  const [produtosMensais, setProdutosMensais] = useState([]);

  useEffect(() => {
    fetchMetaAtual();
    fetchDadosMensais();
  }, []);

  const fetchMetaAtual = async () => {
    try {
      const hoje = new Date();
      const mes = hoje.getMonth() + 1;
      const ano = hoje.getFullYear();
      
      const response = await axios.get(`http://localhost:5001/api/metas/${mes}/${ano}`);
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
      
      // Buscar vendas dos últimos 6 meses
      const responseVendas = await axios.get(`http://localhost:5001/api/vendas/mensais/${mes}/${ano}`);
      setVendasMensais(responseVendas.data);

      // Buscar produtos dos últimos 6 meses
      const responseProdutos = await axios.get(`http://localhost:5001/api/vendas/produtos/mensais/${mes}/${ano}`);
      setProdutosMensais(responseProdutos.data);
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

      await axios.post('http://localhost:5001/api/metas', {
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard de Metas
      </Typography>

      <Grid container spacing={3}>
        {/* Card de Meta de Vendas */}
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

        {/* Card de Meta de Produtos */}
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

        {/* Gráfico de Vendas */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Evolução de Vendas</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vendasMensais}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <ChartTooltip />
                  <Line type="monotone" dataKey="total" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Gráfico de Produtos */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Evolução de Produtos</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={produtosMensais}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <ChartTooltip />
                  <Line type="monotone" dataKey="total" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog para edição de metas */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Editar Metas</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Meta de Vendas (R$)"
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
    </Box>
  );
};

export default Metas; 