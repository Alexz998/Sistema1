import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export function useErrorHandler() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleError = (error) => {
      console.error('Erro não tratado:', error);

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Erro desconhecido';

        switch (status) {
          case 401:
            toast.error('Sessão expirada. Por favor, faça login novamente.');
            logout();
            navigate('/login');
            break;
          case 403:
            toast.error('Você não tem permissão para realizar esta ação.');
            break;
          case 404:
            toast.error('Recurso não encontrado.');
            break;
          case 422:
            toast.error('Dados inválidos. Por favor, verifique os campos.');
            break;
          case 429:
            toast.error('Muitas requisições. Por favor, aguarde um momento.');
            break;
          case 500:
            toast.error('Erro interno do servidor. Tente novamente mais tarde.');
            break;
          default:
            toast.error(`Erro: ${message}`);
        }
      } else if (error.request) {
        toast.error('Erro de conexão. Verifique sua internet.');
      } else {
        toast.error('Erro inesperado. Tente novamente.');
      }
    };

    window.addEventListener('unhandledrejection', (event) => {
      handleError(event.reason);
    });

    window.addEventListener('error', (event) => {
      handleError(event.error);
    });

    return () => {
      window.removeEventListener('unhandledrejection', handleError);
      window.removeEventListener('error', handleError);
    };
  }, [navigate, logout]);
} 