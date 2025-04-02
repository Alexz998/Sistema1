import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from './hooks/useTheme';
import Layout from './components/Layout';
import Login from './pages/Login';
import DashboardCompleto from './pages/DashboardCompleto';
import Vendas from './pages/Vendas';
import Despesas from './pages/Despesas';
import Produtos from './pages/Produtos';
import Metas from './pages/Metas';
import Configuracoes from './pages/Configuracoes';

// Criar uma instância do QueryClient
const queryClient = new QueryClient();

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { darkMode } = useTheme();
  
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Router future={{ v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardCompleto />} />
            <Route path="vendas" element={<Vendas />} />
            <Route path="despesas" element={<Despesas />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="metas" element={<Metas />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CustomThemeProvider>
          <AppContent />
        </CustomThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 