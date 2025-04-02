import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Configuracoes = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Configurações
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Página de configurações em desenvolvimento.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Configuracoes; 