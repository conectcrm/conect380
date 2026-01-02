import { useState } from 'react';

interface FornecedorDependencyDetails {
  totalContas: number;
  contasAbertas: number;
  contasPagas: number;
  valorEmAberto: number;
  valorPago: number;
  contasDetalhes?: Array<{
    descricao: string;
    valor: number;
    status: string;
    vencimento: Date;
  }>;
}

interface FornecedorRemovalError {
  message: string;
  details: FornecedorDependencyDetails;
  alternatives: Array<{
    action: string;
    description: string;
    endpoint: string;
  }>;
}

interface UseFornecedorRemovalResult {
  isLoading: boolean;
  error: FornecedorRemovalError | null;
  removeFornecedor: (id: number) => Promise<boolean>;
  desativarFornecedor: (id: number) => Promise<boolean>;
  clearError: () => void;
  retryRemoval: (id: number) => Promise<boolean>;
}

interface NotificationCallbacks {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onInfo?: (message: string) => void;
}

export const useFornecedorRemoval = (
  onSuccess?: () => void,
  onNavigateToContas?: (fornecedorId: number) => void,
  notifications?: NotificationCallbacks,
): UseFornecedorRemovalResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FornecedorRemovalError | null>(null);

  const clearError = () => {
    setError(null);
  };

  const handleApiError = (errorResponse: any): boolean => {
    if (errorResponse.statusCode === 400 && errorResponse.error === 'DEPENDENCY_CONFLICT') {
      setError({
        message: errorResponse.message,
        details: errorResponse.details,
        alternatives: errorResponse.alternatives || [],
      });
      return false;
    }

    // Outros tipos de erro
    notifications?.onError?.(errorResponse.message || 'Erro inesperado ao processar solicitação');
    return false;
  };

  const removeFornecedor = async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/fornecedores/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return handleApiError(errorData);
      }

      const result = await response.json();

      if (result.success) {
        notifications?.onSuccess?.('Fornecedor excluído com sucesso!');
        onSuccess?.();
        return true;
      } else {
        return handleApiError(result);
      }
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      notifications?.onError?.('Erro de conexão. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const desativarFornecedor = async (id: number): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/fornecedores/${id}/desativar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        notifications?.onError?.(errorData.message || 'Erro ao desativar fornecedor');
        return false;
      }

      const result = await response.json();

      if (result.success) {
        notifications?.onSuccess?.('Fornecedor desativado com sucesso!');
        setError(null);
        onSuccess?.();
        return true;
      } else {
        notifications?.onError?.(result.message || 'Erro ao desativar fornecedor');
        return false;
      }
    } catch (error) {
      console.error('Erro ao desativar fornecedor:', error);
      notifications?.onError?.('Erro de conexão. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const retryRemoval = async (id: number): Promise<boolean> => {
    // Limpa contas pagas/finalizadas e tenta novamente
    try {
      const response = await fetch(`/api/fornecedores/${id}/limpar-contas-pagas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        notifications?.onInfo?.(
          'Histórico de contas pagas removido. Tentando excluir novamente...',
        );
        return await removeFornecedor(id);
      } else {
        notifications?.onError?.('Não foi possível limpar o histórico');
        return false;
      }
    } catch (error) {
      console.error('Erro ao limpar contas:', error);
      notifications?.onError?.('Erro ao limpar histórico');
      return false;
    }
  };

  return {
    isLoading,
    error,
    removeFornecedor,
    desativarFornecedor,
    clearError,
    retryRemoval,
  };
};
