import React from 'react';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

function LoadingOverlay({ open, message = 'Carregando...' }) {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 2,
        flexDirection: 'column',
        gap: 2
      }}
      open={open}
    >
      <CircularProgress color="inherit" />
      <Typography variant="h6" component="div">
        {message}
      </Typography>
    </Backdrop>
  );
}

export function LoadingButton({ loading, children, ...props }) {
  return (
    <Box position="relative" display="inline-flex">
      <Button
        disabled={loading}
        {...props}
      >
        {children}
      </Button>
      {loading && (
        <CircularProgress
          size={24}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-12px',
            marginLeft: '-12px',
          }}
        />
      )}
    </Box>
  );
}

export default LoadingOverlay; 