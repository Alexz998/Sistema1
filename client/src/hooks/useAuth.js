import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5001/api';
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutos

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const interval = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, senha) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, senha });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao fazer login');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.info('Sessão encerrada');
  };

  const refreshToken = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/refresh-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const { token } = response.data;
      localStorage.setItem('token', token);
    } catch (error) {
      logout();
    }
  };

  const recuperarSenha = async (email) => {
    try {
      await axios.post(`${API_URL}/auth/recuperar-senha`, { email });
      return true;
    } catch (error) {
      throw new Error('Erro ao enviar email de recuperação');
    }
  };

  const alterarSenha = async (token, novaSenha) => {
    try {
      await axios.post(`${API_URL}/auth/alterar-senha`, { token, novaSenha });
      return true;
    } catch (error) {
      throw new Error('Erro ao alterar senha');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        recuperarSenha,
        alterarSenha
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
} 