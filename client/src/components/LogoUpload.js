import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5001/api';

function LogoUpload() {
  const [logo, setLogo] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const response = await axios.get(`${API_URL}/config/logo`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.data.logo) {
        setLogo(response.data.logo);
      }
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setOpenDialog(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('logo', selectedFile);

    try {
      await axios.post(`${API_URL}/config/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      toast.success('Logo atualizada com sucesso!');
      setOpenDialog(false);
      fetchLogo();
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      toast.error('Erro ao fazer upload da logo');
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {logo ? (
        <Box sx={{ position: 'relative' }}>
          <img
            src={`data:image/jpeg;base64,${logo}`}
            alt="Logo da empresa"
            style={{ height: '60px', width: 'auto' }}
          />
        </Box>
      ) : (
        <Button
          variant="outlined"
          size="small"
          onClick={() => document.getElementById('logo-upload').click()}
        >
          Adicionar Logo
        </Button>
      )}
      <input
        id="logo-upload"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirmar Upload</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja fazer upload desta imagem como logo da empresa?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleUpload} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LogoUpload; 