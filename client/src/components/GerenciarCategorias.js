import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';

function GerenciarCategorias({ open, onClose, categorias, onSalvar }) {
  const [novaCategoria, setNovaCategoria] = useState('');
  const [categoriasLocais, setCategoriasLocais] = useState(categorias);
  const [editandoIndex, setEditandoIndex] = useState(-1);
  const [categoriaEditando, setCategoriaEditando] = useState('');

  const handleAdicionar = () => {
    if (!novaCategoria.trim()) {
      toast.error('Por favor, insira uma categoria');
      return;
    }

    if (categoriasLocais.includes(novaCategoria)) {
      toast.error('Esta categoria já existe');
      return;
    }

    setCategoriasLocais([...categoriasLocais, novaCategoria.trim()]);
    setNovaCategoria('');
  };

  const handleEditar = (index) => {
    setEditandoIndex(index);
    setCategoriaEditando(categoriasLocais[index]);
  };

  const handleSalvarEdicao = (index) => {
    if (!categoriaEditando.trim()) {
      toast.error('Por favor, insira uma categoria');
      return;
    }

    if (categoriasLocais.includes(categoriaEditando) && categoriasLocais[index] !== categoriaEditando) {
      toast.error('Esta categoria já existe');
      return;
    }

    const novasCategorias = [...categoriasLocais];
    novasCategorias[index] = categoriaEditando.trim();
    setCategoriasLocais(novasCategorias);
    setEditandoIndex(-1);
  };

  const handleDeletar = (index) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      const novasCategorias = categoriasLocais.filter((_, i) => i !== index);
      setCategoriasLocais(novasCategorias);
    }
  };

  const handleSalvar = () => {
    onSalvar(categoriasLocais);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Gerenciar Categorias</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Adicionar Nova Categoria
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              placeholder="Digite o nome da categoria"
            />
            <Button variant="contained" onClick={handleAdicionar}>
              Adicionar
            </Button>
          </Box>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Categorias Existentes
        </Typography>
        <List>
          {categoriasLocais.map((categoria, index) => (
            <ListItem key={index}>
              {editandoIndex === index ? (
                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={categoriaEditando}
                    onChange={(e) => setCategoriaEditando(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleSalvarEdicao(index)}
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setEditandoIndex(-1)}
                  >
                    Cancelar
                  </Button>
                </Box>
              ) : (
                <>
                  <ListItemText primary={categoria} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleEditar(index)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeletar(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </>
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSalvar} variant="contained" color="primary">
          Salvar Alterações
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GerenciarCategorias; 