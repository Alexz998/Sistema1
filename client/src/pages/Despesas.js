import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Grid,
  CircularProgress,
  MenuItem,
  Menu,
  Card,
  CardContent,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  ListItemIcon,
  ListItemText,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Download as DownloadIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableView as TableViewIcon,
  TextSnippet as TextSnippetIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useDespesas } from '../hooks/useDespesas';
import { useCategorias } from '../hooks/useCategorias';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import GerenciarCategorias from '../components/GerenciarCategorias';
import { formatarMoeda, formatarNumero, formatarQuantidade } from '../utils/formatadores';

const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'PIX',
  'Transferência'
];

function Despesas() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { despesas, isLoading, error, addDespesa, updateDespesa, deleteDespesa } = useDespesas(page, limit);
  const { categorias, atualizarCategorias } = useCategorias();
  const [open, setOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState(null);
  const [openCategorias, setOpenCategorias] = useState(false);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    categoria: '',
    valor: '',
    formaPagamento: '',
    descricao: ''
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtros, setFiltros] = useState({
    categoria: '',
    formaPagamento: '',
    dataInicial: '',
    dataFinal: '',
    valorMinimo: '',
    valorMaximo: ''
  });
  const queryClient = useQueryClient();

  const handleOpen = (despesa = null) => {
    console.log('Abrindo formulário com despesa:', despesa);
    if (despesa && despesa._id) {
      setEditingDespesa(despesa);
      const dataObj = new Date(despesa.data);
      dataObj.setHours(12, 0, 0, 0);
      setFormData({
        data: dataObj.toISOString().split('T')[0],
        categoria: despesa.categoria,
        valor: despesa.valor,
        formaPagamento: despesa.formaPagamento,
        descricao: despesa.descricao || ''
      });
    } else {
      setEditingDespesa(null);
      const hoje = new Date();
      hoje.setHours(12, 0, 0, 0);
      setFormData({
        data: hoje.toISOString().split('T')[0],
        categoria: '',
        valor: '',
        formaPagamento: '',
        descricao: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingDespesa(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Dados do formulário antes da formatação:', formData);
      console.log('Editando despesa:', editingDespesa);
      
      // Formatação da data para garantir o dia correto
      const dataObj = new Date(formData.data);
      // Adiciona um dia à data
      dataObj.setDate(dataObj.getDate() + 1);
      const dataFormatada = dataObj.toISOString().split('T')[0];
      
      const despesaFormatada = {
        ...formData,
        data: dataFormatada,
        valor: Number(formData.valor)
      };
      
      console.log('Dados formatados para envio:', despesaFormatada);

      if (editingDespesa && editingDespesa._id) {
        console.log('Modo: Atualização - ID:', editingDespesa._id);
        await updateDespesa({
          id: editingDespesa._id,
          despesa: despesaFormatada
        });
      } else {
        console.log('Modo: Criação');
        await addDespesa(despesaFormatada);
      }
      
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      console.error('Detalhes do erro:', error.response?.data);
      toast.error(error.response?.data?.message || 'Erro ao salvar despesa');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        console.log('Iniciando exclusão da despesa:', id);
        await deleteDespesa(id);
        console.log('Exclusão concluída com sucesso');
        toast.success('Despesa excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir despesa:', error);
        toast.error('Erro ao excluir despesa. Por favor, tente novamente.');
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

  const exportarDespesasPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(16);
      doc.text('RELATÓRIO DE DESPESAS', 14, 15);
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
      
      if (filtros.categoria) {
        doc.text(`Categoria: ${filtros.categoria}`, 20, yPos);
        yPos += 7;
      }
      if (filtros.formaPagamento) {
        doc.text(`Forma de Pagamento: ${filtros.formaPagamento}`, 20, yPos);
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
      const tableData = despesasFiltradas.map(despesa => [
        new Date(despesa.data).toLocaleDateString('pt-BR'),
        despesa.categoria,
        `R$ ${Number(despesa.valor).toFixed(2)}`,
        despesa.formaPagamento,
        despesa.descricao || ''
      ]);
      
      // Adicionar tabela principal
      doc.autoTable({
        head: [['Data', 'Categoria', 'Valor', 'Forma de Pagamento', 'Descrição']],
        body: tableData,
        startY: yPos + 5,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 40 }
        }
      });
      
      // Adicionar totais
      const totalDespesas = despesasFiltradas.reduce((total, despesa) => total + Number(despesa.valor), 0);
      doc.setFontSize(12);
      doc.text(`Total de Despesas: R$ ${totalDespesas.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);
      
      // Salvar o PDF
      doc.save(`despesas_${new Date().toISOString().split('T')[0]}.pdf`);
      handleExportClose();
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const exportarDespesasExcel = () => {
    try {
      // Preparar dados para o Excel
      const despesasData = despesasFiltradas.map(despesa => ({
        'Data': new Date(despesa.data).toLocaleDateString('pt-BR'),
        'Categoria': despesa.categoria,
        'Valor': Number(despesa.valor),
        'Forma de Pagamento': despesa.formaPagamento,
        'Descrição': despesa.descricao || ''
      }));

      // Criar planilha de despesas
      const ws = XLSX.utils.json_to_sheet(despesasData);
      
      // Ajustar largura das colunas
      const wscols = [
        { wch: 15 }, // Data
        { wch: 20 }, // Categoria
        { wch: 15 }, // Valor
        { wch: 20 }, // Forma de Pagamento
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
      
      // Criar workbook e adicionar a planilha
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Despesas');
      
      // Salvar o arquivo
      XLSX.writeFile(wb, `despesas_${new Date().toISOString().split('T')[0]}.xlsx`);
      handleExportClose();
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar Excel');
    }
  };

  const exportarDespesasTexto = () => {
    try {
      let conteudo = "RELATÓRIO DE DESPESAS\n\n";
      
      // Adiciona cabeçalho
      conteudo += "Data\tCategoria\tValor\tForma de Pagamento\tDescrição\n";
      
      // Adiciona informações dos filtros
      conteudo += "\nFiltros Aplicados:\n";
      if (filtros.categoria) conteudo += `Categoria: ${filtros.categoria}\n`;
      if (filtros.formaPagamento) conteudo += `Forma de Pagamento: ${filtros.formaPagamento}\n`;
      if (filtros.dataInicial) conteudo += `Data Inicial: ${new Date(filtros.dataInicial).toLocaleDateString('pt-BR')}\n`;
      if (filtros.dataFinal) conteudo += `Data Final: ${new Date(filtros.dataFinal).toLocaleDateString('pt-BR')}\n`;
      if (filtros.valorMinimo) conteudo += `Valor Mínimo: R$ ${Number(filtros.valorMinimo).toFixed(2)}\n`;
      if (filtros.valorMaximo) conteudo += `Valor Máximo: R$ ${Number(filtros.valorMaximo).toFixed(2)}\n`;
      conteudo += "\n";
      
      // Adiciona dados das despesas
      despesasFiltradas.forEach(despesa => {
        const data = new Date(despesa.data).toLocaleDateString('pt-BR');
        const valor = `R$ ${despesa.valor.toFixed(2)}`;
        
        conteudo += `${data}\t${despesa.categoria}\t${valor}\t${despesa.formaPagamento}\t${despesa.descricao || ''}\n`;
      });
      
      // Adiciona totais
      const totalDespesas = despesasFiltradas.reduce((total, despesa) => total + Number(despesa.valor), 0);
      conteudo += `\nTotal de Despesas: R$ ${totalDespesas.toFixed(2)}\n`;
      
      // Criar e baixar o arquivo
      const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `despesas_${new Date().toISOString().split('T')[0]}.txt`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      handleExportClose();
    } catch (error) {
      console.error('Erro ao exportar texto:', error);
      toast.error('Erro ao exportar texto');
    }
  };

  // Função para aplicar os filtros
  const despesasFiltradas = despesas?.filter(despesa => {
    // Filtro de categoria
    if (filtros.categoria && despesa.categoria !== filtros.categoria) {
      return false;
    }

    // Filtro de forma de pagamento
    if (filtros.formaPagamento && despesa.formaPagamento !== filtros.formaPagamento) {
      return false;
    }

    // Filtro de data
    if (filtros.dataInicial && new Date(despesa.data) < new Date(filtros.dataInicial)) {
      return false;
    }
    if (filtros.dataFinal && new Date(despesa.data) > new Date(filtros.dataFinal)) {
      return false;
    }

    // Filtro de valor
    if (filtros.valorMinimo && despesa.valor < Number(filtros.valorMinimo)) {
      return false;
    }
    if (filtros.valorMaximo && despesa.valor > Number(filtros.valorMaximo)) {
      return false;
    }

    return true;
  }) || [];

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      categoria: '',
      formaPagamento: '',
      dataInicial: '',
      dataFinal: '',
      valorMinimo: '',
      valorMaximo: ''
    });
  };

  const handleSalvarCategorias = (novasCategorias) => {
    atualizarCategorias(novasCategorias);
    toast.success('Categorias atualizadas com sucesso!');
  };

  // Adicionar useEffect para recarregar dados quando o modal é fechado
  useEffect(() => {
    if (!open) {
      queryClient.invalidateQueries(['despesas']);
    }
  }, [open, queryClient]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Despesas</Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SettingsIcon />}
            onClick={() => setOpenCategorias(true)}
            sx={{ mr: 2 }}
          >
            Gerenciar Categorias
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExportClick}
            sx={{ mr: 2 }}
          >
            Exportar Despesas
          </Button>
          <Menu
            id="export-menu"
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleExportClose}
            MenuListProps={{
              'aria-labelledby': 'export-button'
            }}
          >
            <MenuItem onClick={exportarDespesasPDF}>
              <ListItemIcon>
                <PictureAsPdfIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Exportar como PDF</ListItemText>
            </MenuItem>
            <MenuItem onClick={exportarDespesasExcel}>
              <ListItemIcon>
                <TableViewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Exportar como Excel</ListItemText>
            </MenuItem>
            <MenuItem onClick={exportarDespesasTexto}>
              <ListItemIcon>
                <TextSnippetIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Exportar como Texto</ListItemText>
            </MenuItem>
          </Menu>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Nova Despesa
          </Button>
        </Box>
      </Box>

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
                  <FormControl fullWidth>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      value={filtros.categoria}
                      label="Categoria"
                      onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {categorias.map((categoria) => (
                        <MenuItem key={categoria} value={categoria}>
                          {categoria}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Forma de Pagamento</InputLabel>
                    <Select
                      value={filtros.formaPagamento}
                      label="Forma de Pagamento"
                      onChange={(e) => handleFiltroChange('formaPagamento', e.target.value)}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {FORMAS_PAGAMENTO.map((forma) => (
                        <MenuItem key={forma} value={forma}>
                          {forma}
                        </MenuItem>
                      ))}
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Forma de Pagamento</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {despesasFiltradas.map((despesa) => (
              <TableRow key={despesa._id}>
                <TableCell>
                  {format(new Date(despesa.data), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell>{despesa.categoria}</TableCell>
                <TableCell>{formatarMoeda(despesa.valor)}</TableCell>
                <TableCell>{despesa.formaPagamento}</TableCell>
                <TableCell>{despesa.descricao}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpen(despesa)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(despesa._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totalizador de Despesas */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1" color="text.secondary">
              Total de Despesas:
            </Typography>
            <Typography variant="h6" color="error.main">
              {formatarMoeda(despesasFiltradas.reduce((total, despesa) => total + Number(despesa.valor), 0))}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1" color="text.secondary">
              Quantidade de Despesas:
            </Typography>
            <Typography variant="h6">
              {formatarQuantidade(despesasFiltradas.length)}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data"
                  name="data"
                  value={formData.data}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                >
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria} value={categoria}>
                      {categoria}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  inputProps={{
                    step: "0.01",
                    min: "0"
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
                  {FORMAS_PAGAMENTO.map((forma) => (
                    <MenuItem key={forma} value={forma}>
                      {forma}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  name="descricao"
                  multiline
                  rows={3}
                  value={formData.descricao}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingDespesa ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <GerenciarCategorias
        open={openCategorias}
        onClose={() => setOpenCategorias(false)}
        categorias={categorias}
        onSalvar={handleSalvarCategorias}
      />
    </Box>
  );
}

export default Despesas; 