import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  Card,
  CardContent,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  Checkbox
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import axios from 'axios';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:5001/api';

const Vendas = () => {
  const [vendas, setVendas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingVenda, setEditingVenda] = useState(null);
  const [selectedVendas, setSelectedVendas] = useState([]);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [novoStatus, setNovoStatus] = useState('');
  const [formData, setFormData] = useState({
    cliente: '',
    data: new Date().toISOString().split('T')[0],
    valor: '',
    formaPagamento: 'Dinheiro',
    status: 'Pendente',
    observacoes: ''
  });
  const [itensVenda, setItensVenda] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtros, setFiltros] = useState({
    entregador: '',
    formaPagamento: '',
    status: '',
    dataInicial: '',
    dataFinal: '',
    valorMinimo: '',
    valorMaximo: ''
  });

  useEffect(() => {
    fetchVendas();
    fetchProdutos();
  }, []);

  const fetchVendas = async () => {
    try {
      const response = await axios.get(`${API_URL}/vendas`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setVendas(response.data);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas');
    }
  };

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
    setEditingVenda(null);
    setFormData({
      cliente: '',
      data: new Date().toISOString().split('T')[0],
      valor: '',
      formaPagamento: 'Dinheiro',
      status: 'Pendente',
      observacoes: ''
    });
    setItensVenda([]);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingVenda(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddItem = () => {
    setItensVenda([...itensVenda, { produto: '', quantidade: 1, preco: 0 }]);
  };

  const handleRemoveItem = (index) => {
    const novosItens = itensVenda.filter((_, i) => i !== index);
    setItensVenda(novosItens);
  };

  const handleItemChange = (index, field, value) => {
    const novosItens = [...itensVenda];
    if (field === 'produto') {
      const produtoSelecionado = produtos.find(p => p._id === value);
      novosItens[index] = {
        ...novosItens[index],
        produto: value,
        preco: produtoSelecionado ? produtoSelecionado.preco : 0
      };
    } else {
      novosItens[index] = {
        ...novosItens[index],
        [field]: value
      };
    }
    setItensVenda(novosItens);
  };

  const calcularTotal = () => {
    return itensVenda.reduce((total, item) => {
      return total + (item.preco * item.quantidade);
    }, 0);
  };

  const handleEdit = (venda) => {
    setEditingVenda(venda);
    setFormData({
      cliente: venda.cliente,
      data: new Date(venda.data).toISOString().split('T')[0],
      formaPagamento: venda.formaPagamento,
      status: venda.status,
      observacoes: venda.observacoes || ''
    });
    setItensVenda(venda.itens?.map(item => ({
      produto: item.produto,
      quantidade: Number(item.quantidade),
      preco: Number(item.preco)
    })) || []);
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar se há itens na venda
    if (itensVenda.length === 0) {
      toast.error('Adicione pelo menos um item à venda');
      return;
    }

    // Validar se todos os itens têm produto e quantidade
    const itemInvalido = itensVenda.find(item => !item.produto || !item.quantidade);
    if (itemInvalido) {
      toast.error('Preencha o produto e a quantidade de todos os itens');
      return;
    }

    try {
      const vendaData = {
        ...formData,
        data: new Date(formData.data + 'T00:00:00'),
        itens: itensVenda.map(item => ({
          produto: item.produto,
          quantidade: Number(item.quantidade),
          preco: Number(item.preco)
        })),
        valor: calcularTotal()
      };

      if (editingVenda) {
        await axios.put(`${API_URL}/vendas/${editingVenda._id}`, vendaData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        toast.success('Venda atualizada com sucesso!');
      } else {
        await axios.post(`${API_URL}/vendas`, vendaData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        toast.success('Venda registrada com sucesso!');
      }
      handleClose();
      fetchVendas();
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      const mensagemErro = error.response?.data?.message || 'Erro ao salvar venda';
      toast.error(mensagemErro);
    }
  };

  const handleDelete = async (venda) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
      try {
        await axios.delete(`${API_URL}/vendas/${venda._id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        toast.success('Venda excluída com sucesso!');
        fetchVendas();
      } catch (error) {
        console.error('Erro ao excluir venda:', error);
        toast.error(error.response?.data?.message || 'Erro ao excluir venda');
      }
    }
  };

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu(true);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
    setOpenMenu(false);
  };

  const exportarVendasPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(16);
      doc.text('RELATÓRIO DE VENDAS', 14, 15);
      doc.setFontSize(10);
      
      // Data do relatório e filtros aplicados
      const dataRelatorio = new Date().toLocaleDateString('pt-BR');
      doc.text(`Data do relatório: ${dataRelatorio}`, 14, 25);
      
      // Adicionar informações dos filtros
      let yPos = 35;
      doc.setFontSize(12);
      doc.text('Filtros Aplicados:', 14, yPos);
      doc.setFontSize(10);
      yPos += 10;
      
      if (filtros.entregador) {
        doc.text(`Entregador: ${filtros.entregador}`, 20, yPos);
        yPos += 7;
      }
      if (filtros.formaPagamento) {
        doc.text(`Forma de Pagamento: ${filtros.formaPagamento}`, 20, yPos);
        yPos += 7;
      }
      if (filtros.status) {
        doc.text(`Status: ${filtros.status}`, 20, yPos);
        yPos += 7;
      }
      if (filtros.dataInicial) {
        doc.text(`Data Inicial: ${new Date(filtros.dataInicial).toLocaleDateString('pt-BR')}`, 20, yPos);
        yPos += 7;
      }
      if (filtros.dataFinal) {
        doc.text(`Data Final: ${new Date(filtros.dataFinal).toLocaleDateString('pt-BR')}`, 20, yPos);
        yPos += 7;
      }
      if (filtros.valorMinimo) {
        doc.text(`Valor Mínimo: R$ ${Number(filtros.valorMinimo).toFixed(2)}`, 20, yPos);
        yPos += 7;
      }
      if (filtros.valorMaximo) {
        doc.text(`Valor Máximo: R$ ${Number(filtros.valorMaximo).toFixed(2)}`, 20, yPos);
        yPos += 7;
      }
      
      // Preparar dados para a tabela
      const tableData = vendasFiltradas.map(venda => [
        new Date(venda.data).toLocaleDateString('pt-BR'),
        venda.cliente,
        `R$ ${Number(venda.valor).toFixed(2)}`,
        venda.formaPagamento,
        venda.status || 'Pendente',
        venda.observacoes || ''
      ]);
      
      // Adicionar tabela principal
      doc.autoTable({
        head: [['Data', 'Entregador', 'Valor', 'Forma de Pagamento', 'Status', 'Descrição']],
        body: tableData,
        startY: yPos + 5,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 },
          5: { cellWidth: 40 }
        }
      });
      
      // Adicionar totais
      const totalVendas = vendasFiltradas.reduce((total, venda) => total + Number(venda.valor), 0);
      doc.setFontSize(12);
      doc.text(`Total de Vendas: R$ ${totalVendas.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);
      
      // Salvar o PDF
      doc.save(`vendas_${new Date().toISOString().split('T')[0]}.pdf`);
      handleExportClose();
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const exportarVendasExcel = () => {
    try {
      // Preparar dados para o Excel
      const vendasData = vendasFiltradas.map(venda => ({
        'Data': new Date(venda.data).toLocaleDateString('pt-BR'),
        'Entregador': venda.cliente,
        'Valor': Number(venda.valor),
        'Forma de Pagamento': venda.formaPagamento,
        'Status': venda.status || 'Pendente',
        'Descrição': venda.observacoes || ''
      }));

      // Criar planilha de vendas
      const ws = XLSX.utils.json_to_sheet(vendasData);
      
      // Ajustar largura das colunas
      const wscols = [
        { wch: 15 }, // Data
        { wch: 20 }, // Entregador
        { wch: 15 }, // Valor
        { wch: 20 }, // Forma de Pagamento
        { wch: 15 }, // Status
        { wch: 30 }  // Descrição
      ];
      ws['!cols'] = wscols;
      
      // Formatar células de valor como moeda
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = 1; R <= range.e.r; ++R) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: 2 })]; // Coluna C (Valor)
        if (cell) {
          cell.z = '#,##0.00';
        }
      }
      
      // Criar planilha de itens
      const itensData = [];
      vendasFiltradas.forEach(venda => {
        if (venda.itens && venda.itens.length > 0) {
          venda.itens.forEach(item => {
            const produto = produtos.find(p => p._id === item.produto);
            if (produto) {
              itensData.push({
                'Data da Venda': new Date(venda.data).toLocaleDateString('pt-BR'),
                'Entregador': venda.cliente,
                'Produto': produto.nome,
                'Quantidade': item.quantidade,
                'Preço Unitário': Number(produto.preco),
                'Subtotal': Number(produto.preco * item.quantidade)
              });
            }
          });
        }
      });
      const wsItens = XLSX.utils.json_to_sheet(itensData);
      
      // Ajustar largura das colunas dos itens
      const wscolsItens = [
        { wch: 15 }, // Data da Venda
        { wch: 20 }, // Entregador
        { wch: 30 }, // Produto
        { wch: 15 }, // Quantidade
        { wch: 15 }, // Preço Unitário
        { wch: 15 }  // Subtotal
      ];
      wsItens['!cols'] = wscolsItens;
      
      // Formatar células de valor como moeda na planilha de itens
      const rangeItens = XLSX.utils.decode_range(wsItens['!ref']);
      for (let R = 1; R <= rangeItens.e.r; ++R) {
        const cellPreco = wsItens[XLSX.utils.encode_cell({ r: R, c: 4 })]; // Coluna E (Preço Unitário)
        const cellSubtotal = wsItens[XLSX.utils.encode_cell({ r: R, c: 5 })]; // Coluna F (Subtotal)
        if (cellPreco) cellPreco.z = '#,##0.00';
        if (cellSubtotal) cellSubtotal.z = '#,##0.00';
      }
      
      // Criar workbook e adicionar as planilhas
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vendas');
      XLSX.utils.book_append_sheet(wb, wsItens, 'Itens');
      
      // Salvar o arquivo
      XLSX.writeFile(wb, `vendas_${new Date().toISOString().split('T')[0]}.xlsx`);
      handleExportClose();
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar Excel');
    }
  };

  const exportarVendasTexto = () => {
    try {
      let conteudo = "RELATÓRIO DE VENDAS\n\n";
      
      // Adiciona cabeçalho
      conteudo += "Data\tEntregador\tValor\tForma de Pagamento\tStatus\tDescrição\n";
      
      // Adiciona informações dos filtros
      conteudo += "\nFiltros Aplicados:\n";
      if (filtros.entregador) conteudo += `Entregador: ${filtros.entregador}\n`;
      if (filtros.formaPagamento) conteudo += `Forma de Pagamento: ${filtros.formaPagamento}\n`;
      if (filtros.status) conteudo += `Status: ${filtros.status}\n`;
      if (filtros.dataInicial) conteudo += `Data Inicial: ${new Date(filtros.dataInicial).toLocaleDateString('pt-BR')}\n`;
      if (filtros.dataFinal) conteudo += `Data Final: ${new Date(filtros.dataFinal).toLocaleDateString('pt-BR')}\n`;
      if (filtros.valorMinimo) conteudo += `Valor Mínimo: R$ ${Number(filtros.valorMinimo).toFixed(2)}\n`;
      if (filtros.valorMaximo) conteudo += `Valor Máximo: R$ ${Number(filtros.valorMaximo).toFixed(2)}\n`;
      conteudo += "\n";
      
      // Adiciona dados das vendas
      vendasFiltradas.forEach(venda => {
        const data = new Date(venda.data).toLocaleDateString('pt-BR');
        const valor = `R$ ${venda.valor.toFixed(2)}`;
        
        conteudo += `${data}\t${venda.cliente}\t${valor}\t${venda.formaPagamento}\t${venda.status}\t${venda.observacoes || ''}\n`;
        
        // Adiciona itens da venda
        if (venda.itens && venda.itens.length > 0) {
          conteudo += "\nItens:\n";
          venda.itens.forEach(item => {
            const produto = produtos.find(p => p._id === item.produto);
            if (produto) {
              const subtotal = produto.preco * item.quantidade;
              conteudo += `- ${produto.nome}: ${item.quantidade} x R$ ${produto.preco.toFixed(2)} = R$ ${subtotal.toFixed(2)}\n`;
            }
          });
          conteudo += "\n";
        }
        
        conteudo += "----------------------------------------\n";
      });
      
      // Adiciona totais
      const totalVendas = vendasFiltradas.reduce((total, venda) => total + Number(venda.valor), 0);
      conteudo += `\nTotal de Vendas: R$ ${totalVendas.toFixed(2)}\n`;
      
      // Criar e baixar o arquivo
      const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vendas_${new Date().toISOString().split('T')[0]}.txt`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      handleExportClose();
    } catch (error) {
      console.error('Erro ao exportar texto:', error);
      toast.error('Erro ao exportar texto');
    }
  };

  const handleStatusChange = async () => {
    if (!novoStatus) {
      toast.error('Selecione um status');
      return;
    }

    try {
      const promises = selectedVendas.map(venda =>
        axios.put(`${API_URL}/vendas/${venda._id}`, 
          { ...venda, status: novoStatus },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )
      );

      await Promise.all(promises);
      toast.success('Status das vendas atualizado com sucesso!');
      setOpenStatusDialog(false);
      setNovoStatus('');
      setSelectedVendas([]);
      fetchVendas();
    } catch (error) {
      console.error('Erro ao atualizar status das vendas:', error);
      toast.error('Erro ao atualizar status das vendas');
    }
  };

  const columns = [
    {
      field: 'selection',
      headerName: '',
      width: 50,
      renderCell: (params) => (
        <Checkbox
          checked={selectedVendas.some(venda => venda._id === params.row._id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedVendas([...selectedVendas, params.row]);
            } else {
              setSelectedVendas(selectedVendas.filter(venda => venda._id !== params.row._id));
            }
          }}
        />
      ),
    },
    { 
      field: 'data', 
      headerName: 'Data', 
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const data = new Date(params.value);
        return data.toLocaleDateString('pt-BR');
      }
    },
    { field: 'cliente', headerName: 'Entregador', width: 200 },
    { 
      field: 'valor', 
      headerName: 'Valor', 
      width: 130,
      valueFormatter: (params) => {
        return `R$ ${params.value.toFixed(2)}`;
      }
    },
    { field: 'formaPagamento', headerName: 'Forma de Pagamento', width: 180 },
    { field: 'status', headerName: 'Status', width: 130 },
    { field: 'observacoes', headerName: 'Descrição', width: 200 },
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

  // Função para aplicar os filtros
  const vendasFiltradas = vendas.filter(venda => {
    // Filtro de entregador
    if (filtros.entregador && !venda.cliente.toLowerCase().includes(filtros.entregador.toLowerCase())) {
      return false;
    }

    // Filtro de forma de pagamento
    if (filtros.formaPagamento && venda.formaPagamento !== filtros.formaPagamento) {
      return false;
    }

    // Filtro de status
    if (filtros.status && venda.status !== filtros.status) {
      return false;
    }

    // Filtro de data
    if (filtros.dataInicial && new Date(venda.data) < new Date(filtros.dataInicial)) {
      return false;
    }
    if (filtros.dataFinal && new Date(venda.data) > new Date(filtros.dataFinal)) {
      return false;
    }

    // Filtro de valor
    if (filtros.valorMinimo && venda.valor < Number(filtros.valorMinimo)) {
      return false;
    }
    if (filtros.valorMaximo && venda.valor > Number(filtros.valorMaximo)) {
      return false;
    }

    return true;
  });

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      entregador: '',
      formaPagamento: '',
      status: '',
      dataInicial: '',
      dataFinal: '',
      valorMinimo: '',
      valorMaximo: ''
    });
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Vendas</Typography>
          <Box>
            {selectedVendas.length > 0 && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<EditIcon />}
                onClick={() => setOpenStatusDialog(true)}
                sx={{ mr: 2 }}
              >
                Alterar Status ({selectedVendas.length})
              </Button>
            )}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleExportClick}
              sx={{ mr: 2 }}
            >
              Exportar Vendas
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleExportClose}
            >
              <MenuItem onClick={exportarVendasPDF}>
                <PictureAsPdfIcon sx={{ mr: 1 }} />
                Exportar como PDF
              </MenuItem>
              <MenuItem onClick={exportarVendasExcel}>
                <TableViewIcon sx={{ mr: 1 }} />
                Exportar como Excel
              </MenuItem>
              <MenuItem onClick={exportarVendasTexto}>
                <TextSnippetIcon sx={{ mr: 1 }} />
                Exportar como Texto
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpen}
            >
              Nova Venda
            </Button>
          </Box>
        </Box>
      </Grid>

      {/* Seção de Filtros */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center">
                <FilterListIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Filtros</Typography>
              </Box>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={limparFiltros}
                  sx={{ mr: 1 }}
                >
                  Limpar Filtros
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setShowFiltros(!showFiltros)}
                >
                  {showFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </Button>
              </Box>
            </Box>

            <Collapse in={showFiltros}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Entregador"
                    value={filtros.entregador}
                    onChange={(e) => handleFiltroChange('entregador', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Forma de Pagamento</InputLabel>
                    <Select
                      value={filtros.formaPagamento}
                      label="Forma de Pagamento"
                      onChange={(e) => handleFiltroChange('formaPagamento', e.target.value)}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                      <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
                      <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
                      <MenuItem value="PIX">PIX</MenuItem>
                      <MenuItem value="Transferência">Transferência</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filtros.status}
                      label="Status"
                      onChange={(e) => handleFiltroChange('status', e.target.value)}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="Pendente">Pendente</MenuItem>
                      <MenuItem value="Entregue">Entregue</MenuItem>
                      <MenuItem value="Acertado">Acertado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data Inicial"
                    value={filtros.dataInicial}
                    onChange={(e) => handleFiltroChange('dataInicial', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data Final"
                    value={filtros.dataFinal}
                    onChange={(e) => handleFiltroChange('dataFinal', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Valor Mínimo"
                    value={filtros.valorMinimo}
                    onChange={(e) => handleFiltroChange('valorMinimo', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Valor Máximo"
                    value={filtros.valorMaximo}
                    onChange={(e) => handleFiltroChange('valorMaximo', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ height: 400 }}>
            <DataGrid
              rows={vendasFiltradas}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
              getRowId={(row) => row._id}
            />
          </Box>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider', gap: 3 }}>
            <Typography variant="h6" color="error">
              Subtotal (Pendente/Entregue): R$ {vendasFiltradas
                .filter(venda => venda.status === 'Pendente' || venda.status === 'Entregue')
                .reduce((total, venda) => total + Number(venda.valor), 0)
                .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="h6">
              Total: R$ {vendasFiltradas.reduce((total, venda) => total + Number(venda.valor), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingVenda ? 'Editar Venda' : 'Nova Venda'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Entregador"
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Data"
                name="data"
                type="date"
                value={formData.data}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Forma de Pagamento"
                name="formaPagamento"
                value={formData.formaPagamento}
                onChange={handleChange}
                required
              >
                <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
                <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
                <MenuItem value="PIX">PIX</MenuItem>
                <MenuItem value="Transferência">Transferência</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <MenuItem value="Pendente">Pendente</MenuItem>
                <MenuItem value="Entregue">Entregue</MenuItem>
                <MenuItem value="Acertado">Acertado</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Itens da Venda</Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                >
                  Adicionar Item
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell>Quantidade</TableCell>
                      <TableCell>Preço Unitário</TableCell>
                      <TableCell>Subtotal</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itensVenda.map((item, index) => {
                      const produto = produtos.find(p => p._id === item.produto);
                      const subtotal = item.preco * item.quantidade;
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              select
                              fullWidth
                              value={item.produto}
                              onChange={(e) => handleItemChange(index, 'produto', e.target.value)}
                              required
                            >
                              {produtos.map((produto) => (
                                <MenuItem key={produto._id} value={produto._id}>
                                  {produto.nome}
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.quantidade}
                              onChange={(e) => handleItemChange(index, 'quantidade', Number(e.target.value))}
                              required
                              inputProps={{ min: "1" }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.preco}
                              onChange={(e) => handleItemChange(index, 'preco', Number(e.target.value))}
                              required
                              inputProps={{ min: "0", step: "0.01" }}
                            />
                          </TableCell>
                          <TableCell>
                            R$ {subtotal.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <IconButton onClick={() => handleRemoveItem(index)}>
                              <RemoveIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Typography variant="h6">
                  Total: R$ {calcularTotal().toFixed(2)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="observacoes"
                multiline
                rows={2}
                value={formData.observacoes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingVenda ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)}>
        <DialogTitle>Alterar Status das Vendas</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Novo Status</InputLabel>
            <Select
              value={novoStatus}
              label="Novo Status"
              onChange={(e) => setNovoStatus(e.target.value)}
            >
              <MenuItem value="Pendente">Pendente</MenuItem>
              <MenuItem value="Entregue">Entregue</MenuItem>
              <MenuItem value="Acertado">Acertado</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Cancelar</Button>
          <Button onClick={handleStatusChange} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default Vendas; 