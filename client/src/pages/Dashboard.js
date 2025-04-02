import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, TextField, Button, Menu, MenuItem } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DownloadIcon from '@mui/icons-material/Download';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:5001/api';

function Dashboard() {
  const [vendas, setVendas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [vendasRes, despesasRes] = await Promise.all([
          axios.get(`${API_URL}/vendas`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          axios.get(`${API_URL}/despesas`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);
        
        // Mapear _id para id nas vendas
        const vendasFormatadas = vendasRes.data.map(venda => ({
          ...venda,
          id: venda._id,
          descricao: venda.observacoes || ''
        }));
        
        // Mapear _id para id nas despesas
        const despesasFormatadas = despesasRes.data.map(despesa => ({
          ...despesa,
          id: despesa._id,
          descricao: despesa.descricao || ''
        }));

        setVendas(vendasFormatadas);
        setDespesas(despesasFormatadas);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtrarPorPeriodo = (items) => {
    if (!dataInicial || !dataFinal) return items;
    
    return items.filter(item => {
      const dataItem = parseISO(item.data);
      return isWithinInterval(dataItem, {
        start: parseISO(dataInicial),
        end: parseISO(dataFinal)
      });
    });
  };

  const vendasFiltradas = filtrarPorPeriodo(vendas);
  const despesasFiltradas = filtrarPorPeriodo(despesas);

  const totalVendas = vendasFiltradas.reduce((acc, venda) => acc + Number(venda.valor), 0);
  const totalDespesas = despesasFiltradas.reduce((acc, despesa) => acc + Number(despesa.valor), 0);
  const saldo = totalVendas - totalDespesas;

  const columns = [
    { 
      field: 'data', 
      headerName: 'Data', 
      width: 130,
      valueFormatter: (params) => format(new Date(params.value), 'dd/MM/yyyy', { locale: ptBR })
    },
    { field: 'descricao', headerName: 'Descrição', width: 200 },
    { 
      field: 'valor', 
      headerName: 'Valor', 
      width: 130,
      valueFormatter: (params) => `R$ ${Number(params.value).toFixed(2)}`
    },
  ];

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  const exportarDashboardPDF = () => {
    const doc = new jsPDF();
    const data = new Date().toLocaleDateString('pt-BR');
    
    // Título
    doc.setFontSize(16);
    doc.text('Relatório do Dashboard', 14, 15);
    doc.setFontSize(12);
    doc.text(`Data: ${data}`, 14, 25);
    
    // Período
    if (dataInicial && dataFinal) {
      doc.text(`Período: ${format(new Date(dataInicial), 'dd/MM/yyyy')} a ${format(new Date(dataFinal), 'dd/MM/yyyy')}`, 14, 35);
    }

    // Resumo
    doc.setFontSize(14);
    doc.text('Resumo', 14, 50);
    doc.setFontSize(12);
    doc.text(`Total de Vendas: R$ ${totalVendas.toFixed(2)}`, 14, 60);
    doc.text(`Total de Despesas: R$ ${totalDespesas.toFixed(2)}`, 14, 70);
    doc.text(`Saldo: R$ ${saldo.toFixed(2)}`, 14, 80);

    // Vendas
    doc.setFontSize(14);
    doc.text('Últimas Vendas', 14, 100);
    const vendasData = vendasFiltradas.map(venda => [
      format(new Date(venda.data), 'dd/MM/yyyy'),
      venda.descricao,
      `R$ ${Number(venda.valor).toFixed(2)}`
    ]);
    doc.autoTable({
      startY: 105,
      head: [['Data', 'Descrição', 'Valor']],
      body: vendasData,
      theme: 'grid'
    });

    // Despesas
    doc.setFontSize(14);
    doc.text('Últimas Despesas', 14, doc.lastAutoTable.finalY + 20);
    const despesasData = despesasFiltradas.map(despesa => [
      format(new Date(despesa.data), 'dd/MM/yyyy'),
      despesa.descricao,
      `R$ ${Number(despesa.valor).toFixed(2)}`
    ]);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 25,
      head: [['Data', 'Descrição', 'Valor']],
      body: despesasData,
      theme: 'grid'
    });

    doc.save(`dashboard_${data.replace(/\//g, '_')}.pdf`);
    handleExportClose();
  };

  const exportarDashboardExcel = () => {
    const data = new Date().toLocaleDateString('pt-BR');
    
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Resumo
    const resumoData = [
      ['Resumo'],
      ['Total de Vendas', totalVendas],
      ['Total de Despesas', totalDespesas],
      ['Saldo', saldo],
      [],
      ['Período'],
      ['Data Inicial', dataInicial ? format(new Date(dataInicial), 'dd/MM/yyyy') : ''],
      ['Data Final', dataFinal ? format(new Date(dataFinal), 'dd/MM/yyyy') : '']
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // Vendas
    const vendasData = vendasFiltradas.map(venda => [
      format(new Date(venda.data), 'dd/MM/yyyy'),
      venda.descricao,
      Number(venda.valor)
    ]);
    const wsVendas = XLSX.utils.aoa_to_sheet([['Data', 'Descrição', 'Valor'], ...vendasData]);
    XLSX.utils.book_append_sheet(wb, wsVendas, 'Vendas');

    // Despesas
    const despesasData = despesasFiltradas.map(despesa => [
      format(new Date(despesa.data), 'dd/MM/yyyy'),
      despesa.descricao,
      Number(despesa.valor)
    ]);
    const wsDespesas = XLSX.utils.aoa_to_sheet([['Data', 'Descrição', 'Valor'], ...despesasData]);
    XLSX.utils.book_append_sheet(wb, wsDespesas, 'Despesas');

    XLSX.writeFile(wb, `dashboard_${data.replace(/\//g, '_')}.xlsx`);
    handleExportClose();
  };

  const exportarDashboardTexto = () => {
    const data = new Date().toLocaleDateString('pt-BR');
    let conteudo = 'RELATÓRIO DO DASHBOARD\n';
    conteudo += `Data: ${data}\n\n`;

    if (dataInicial && dataFinal) {
      conteudo += `Período: ${format(new Date(dataInicial), 'dd/MM/yyyy')} a ${format(new Date(dataFinal), 'dd/MM/yyyy')}\n\n`;
    }

    conteudo += 'RESUMO\n';
    conteudo += `Total de Vendas: R$ ${totalVendas.toFixed(2)}\n`;
    conteudo += `Total de Despesas: R$ ${totalDespesas.toFixed(2)}\n`;
    conteudo += `Saldo: R$ ${saldo.toFixed(2)}\n\n`;

    conteudo += 'ÚLTIMAS VENDAS\n';
    vendasFiltradas.forEach(venda => {
      conteudo += `${format(new Date(venda.data), 'dd/MM/yyyy')} - ${venda.descricao} - R$ ${Number(venda.valor).toFixed(2)}\n`;
    });
    conteudo += '\n';

    conteudo += 'ÚLTIMAS DESPESAS\n';
    despesasFiltradas.forEach(despesa => {
      conteudo += `${format(new Date(despesa.data), 'dd/MM/yyyy')} - ${despesa.descricao} - R$ ${Number(despesa.valor).toFixed(2)}\n`;
    });

    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${data.replace(/\//g, '_')}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    handleExportClose();
  };

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography>Carregando dados...</Typography>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Seletor de Período */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ mr: 2 }}>
              Período:
            </Typography>
            <TextField
              type="date"
              label="Data Inicial"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="Data Final"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportClick}
            color="primary"
          >
            Exportar
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={exportarDashboardPDF}>Exportar como PDF</MenuItem>
            <MenuItem onClick={exportarDashboardExcel}>Exportar como Excel</MenuItem>
            <MenuItem onClick={exportarDashboardTexto}>Exportar como Texto</MenuItem>
          </Menu>
        </Paper>
      </Grid>

      {/* Cards de Resumo */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Total de Vendas
          </Typography>
          <Typography component="p" variant="h4">
            R$ {totalVendas.toFixed(2)}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
          <Typography component="h2" variant="h6" color="error" gutterBottom>
            Total de Despesas
          </Typography>
          <Typography component="p" variant="h4">
            R$ {totalDespesas.toFixed(2)}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
          <Typography component="h2" variant="h6" color={saldo >= 0 ? 'success.main' : 'error.main'} gutterBottom>
            Saldo
          </Typography>
          <Typography component="p" variant="h4">
            R$ {saldo.toFixed(2)}
          </Typography>
        </Paper>
      </Grid>

      {/* Tabelas */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Últimas Vendas
          </Typography>
          <DataGrid
            rows={vendasFiltradas}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disableSelectionOnClick
            autoHeight
          />
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
          <Typography component="h2" variant="h6" color="error" gutterBottom>
            Últimas Despesas
          </Typography>
          <DataGrid
            rows={despesasFiltradas}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disableSelectionOnClick
            autoHeight
          />
        </Paper>
      </Grid>
    </Grid>
  );
}

export default Dashboard; 