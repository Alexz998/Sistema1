import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

function Login() {
  const navigate = useNavigate();
  const { login, recuperarSenha, alterarSenha } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [openRecuperacao, setOpenRecuperacao] = useState(false);
  const [openAlterarSenha, setOpenAlterarSenha] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [token, setToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.senha);
      navigate('/');
    } catch (error) {
      setErro('Email ou senha inválidos');
    }
  };

  const handleRecuperarSenha = async () => {
    try {
      await recuperarSenha(emailRecuperacao);
      toast.success('Email de recuperação enviado com sucesso!');
      setOpenRecuperacao(false);
    } catch (error) {
      toast.error('Erro ao enviar email de recuperação');
    }
  };

  const handleAlterarSenha = async () => {
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    try {
      await alterarSenha(token, novaSenha);
      toast.success('Senha alterada com sucesso!');
      setOpenAlterarSenha(false);
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao alterar senha');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Login
          </Typography>
          {erro && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {erro}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="senha"
              label="Senha"
              type="password"
              id="senha"
              autoComplete="current-password"
              value={formData.senha}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Entrar
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setOpenRecuperacao(true)}
              >
                Esqueceu a senha?
              </Link>
              <Link
                component="button"
                variant="body2"
                onClick={() => setOpenAlterarSenha(true)}
              >
                Alterar senha
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>

      {/* Dialog de Recuperação de Senha */}
      <Dialog open={openRecuperacao} onClose={() => setOpenRecuperacao(false)}>
        <DialogTitle>Recuperar Senha</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={emailRecuperacao}
            onChange={(e) => setEmailRecuperacao(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRecuperacao(false)}>Cancelar</Button>
          <Button onClick={handleRecuperarSenha} variant="contained">
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Alteração de Senha */}
      <Dialog open={openAlterarSenha} onClose={() => setOpenAlterarSenha(false)}>
        <DialogTitle>Alterar Senha</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Token de Recuperação"
            type="text"
            fullWidth
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Nova Senha"
            type="password"
            fullWidth
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Confirmar Nova Senha"
            type="password"
            fullWidth
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAlterarSenha(false)}>Cancelar</Button>
          <Button onClick={handleAlterarSenha} variant="contained">
            Alterar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Login; 