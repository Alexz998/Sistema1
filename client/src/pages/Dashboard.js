import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import axios from 'axios';

const API_URL = 'http://localhost:5002/api';

function Dashboard() {
  const [data, setData] = useState({
    resumo: {
      totalVendas: 0,
      totalDespesas: 0,
      saldo: 0
    },
    ultimasVendas: [],
    ultimasDespesas: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Usuário não autenticado');
        }

        console.log('Buscando dados da dashboard...');
        const response = await axios.get(`${API_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Dados recebidos:', response.data);

        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        setError(err.response?.data?.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Cards de Resumo */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Total de Vendas
            </Typography>
            <Typography variant="h4">
              R$ {data.resumo.totalVendas.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Total de Despesas
            </Typography>
            <Typography variant="h4">
              R$ {data.resumo.totalDespesas.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Saldo
            </Typography>
            <Typography 
              variant="h4" 
              color={data.resumo.saldo >= 0 ? 'success.main' : 'error.main'}
            >
              R$ {data.resumo.saldo.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabelas */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Últimas Vendas</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell align="right">Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.ultimasVendas.map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell>{venda.data}</TableCell>
                      <TableCell>{venda.descricao}</TableCell>
                      <TableCell align="right">R$ {venda.valor.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {data.ultimasVendas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">Nenhuma venda encontrada</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Últimas Despesas</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell align="right">Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.ultimasDespesas.map((despesa) => (
                    <TableRow key={despesa.id}>
                      <TableCell>{despesa.data}</TableCell>
                      <TableCell>{despesa.descricao}</TableCell>
                      <TableCell align="right">R$ {despesa.valor.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {data.ultimasDespesas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">Nenhuma despesa encontrada</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 